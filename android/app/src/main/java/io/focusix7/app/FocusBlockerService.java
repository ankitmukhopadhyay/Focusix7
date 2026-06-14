package io.focusix7.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ResolveInfo;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityEvent;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Watches foreground-app transitions while a focus session is active and
 * redirects the user back to Focusix7 whenever they try to switch away.
 *
 * Allowed (never blocked):
 *   - System UI / dialer / keyboards / settings (so the phone stays usable)
 *   - Any launcher / home screen (the user may pull up the home screen freely)
 *   - Any package on the user-defined "unblock list" set from in-app Settings
 */
public class FocusBlockerService extends AccessibilityService {

    /** Set true while a focus session is running. */
    public static volatile boolean focusActive = false;
    private static volatile FocusBlockerService instance;

    public static final String PREFS_NAME = "focusix7_prefs";
    public static final String UNBLOCK_KEY = "unblock_packages";
    /** SharedPrefs key MainActivity writes on every onUserLeaveHint(). The
     *  blocker grants a short grace period after this timestamp so legitimate
     *  Home/Recents gestures don't get reverted by OEM-specific transition
     *  packages that briefly own the foreground window. */
    public static final String USER_LEAVE_KEY = "last_user_leave_ms";

    /** Time after the user explicitly pressed Home/Recents during which we
     *  treat every package as transition-allowed. 2.5 s comfortably covers
     *  even the slowest Samsung One UI / MIUI animation chains. */
    private static final long USER_LEAVE_GRACE_MS = 2500L;

    /** Minimum gap between two forced redirects. Anything tighter caused
     *  the previous "happens twice in a row" symptom on phones whose home
     *  transition fires multiple window-state events. */
    private static final long REDIRECT_THROTTLE_MS = 1200L;

    /** Hard ceiling: don't fire more than this many redirects in a 10-second
     *  window. If we somehow trip more often than this, we back off entirely
     *  for a few seconds — protects against runaway loops on phones with
     *  unusual window-state behaviour. */
    private static final int  MAX_REDIRECTS_PER_WINDOW = 2;
    private static final long REDIRECT_WINDOW_MS = 10000L;

    /** Packages that NEVER trigger a redirect. Includes the SystemUI surface
     *  (notification shade, recents, system bars), the dialer, phone, lock-
     *  screen helpers, IMEs, and Settings. Also includes a generous set of
     *  OEM launcher / recents-transition packages so the window-transition
     *  windows seen on Samsung, Xiaomi, OnePlus, Oppo, Vivo, Realme, Huawei,
     *  Honor, Motorola, Nothing, Asus, etc. don't get misclassified. */
    private static final Set<String> ALWAYS_ALLOWED = new HashSet<>();
    static {
        // Core Android system surfaces
        ALWAYS_ALLOWED.add("com.android.systemui");
        ALWAYS_ALLOWED.add("android");
        ALWAYS_ALLOWED.add("com.android.phone");
        ALWAYS_ALLOWED.add("com.android.server.telecom");
        ALWAYS_ALLOWED.add("com.google.android.dialer");
        ALWAYS_ALLOWED.add("com.android.dialer");
        ALWAYS_ALLOWED.add("com.android.settings");
        ALWAYS_ALLOWED.add("com.android.incallui");
        ALWAYS_ALLOWED.add("com.android.permissioncontroller");
        // Stock launchers (cover most AOSP-based ROMs)
        ALWAYS_ALLOWED.add("com.android.launcher");
        ALWAYS_ALLOWED.add("com.android.launcher3");
        ALWAYS_ALLOWED.add("com.google.android.apps.nexuslauncher");
        ALWAYS_ALLOWED.add("com.google.android.launcher");
        // Samsung One UI
        ALWAYS_ALLOWED.add("com.sec.android.app.launcher");
        ALWAYS_ALLOWED.add("com.samsung.android.app.cocktailbarservice");
        ALWAYS_ALLOWED.add("com.samsung.android.bixby.agent");
        ALWAYS_ALLOWED.add("com.samsung.android.app.homestar");
        // Xiaomi / MIUI / HyperOS
        ALWAYS_ALLOWED.add("com.miui.home");
        ALWAYS_ALLOWED.add("com.mi.android.globallauncher");
        ALWAYS_ALLOWED.add("com.miui.securitycenter");
        ALWAYS_ALLOWED.add("com.miui.system");
        ALWAYS_ALLOWED.add("com.miui.systemAdSolution");
        // OnePlus / Oxygen
        ALWAYS_ALLOWED.add("net.oneplus.launcher");
        ALWAYS_ALLOWED.add("com.oneplus.launcher");
        // Oppo / Realme / ColorOS
        ALWAYS_ALLOWED.add("com.oppo.launcher");
        ALWAYS_ALLOWED.add("com.coloros.launcher");
        ALWAYS_ALLOWED.add("com.realme.launcher");
        ALWAYS_ALLOWED.add("com.heytap.launcher");
        // Vivo / Funtouch
        ALWAYS_ALLOWED.add("com.bbk.launcher2");
        ALWAYS_ALLOWED.add("com.vivo.launcher");
        // Huawei / Honor / EMUI / MagicOS
        ALWAYS_ALLOWED.add("com.huawei.android.launcher");
        ALWAYS_ALLOWED.add("com.hihonor.android.launcher");
        // Motorola
        ALWAYS_ALLOWED.add("com.motorola.launcher3");
        ALWAYS_ALLOWED.add("com.motorola.personalize");
        // Asus
        ALWAYS_ALLOWED.add("com.asus.launcher");
        // Nothing OS
        ALWAYS_ALLOWED.add("com.nothing.launcher");
        // Transsion (Tecno / Infinix / Itel)
        ALWAYS_ALLOWED.add("com.transsion.XOSLauncher");
        ALWAYS_ALLOWED.add("com.transsion.hilauncher");
        ALWAYS_ALLOWED.add("com.transsion.itel.launcher");
        // Popular third-party launchers — users often stay on these
        ALWAYS_ALLOWED.add("com.teslacoilsw.launcher");        // Nova
        ALWAYS_ALLOWED.add("com.actionlauncher.playstore");
        ALWAYS_ALLOWED.add("ginlemon.flowerfree");
        ALWAYS_ALLOWED.add("ginlemon.flowerpro");
        ALWAYS_ALLOWED.add("com.microsoft.launcher");
        ALWAYS_ALLOWED.add("org.lineageos.trebuchet");
        // Common IMEs (keyboards) across brands
        ALWAYS_ALLOWED.add("com.google.android.inputmethod.latin");
        ALWAYS_ALLOWED.add("com.samsung.android.honeyboard");
        ALWAYS_ALLOWED.add("com.android.inputmethod.latin");
        ALWAYS_ALLOWED.add("com.touchtype.swiftkey");
        ALWAYS_ALLOWED.add("com.touchtype.swiftkey.beta");
        ALWAYS_ALLOWED.add("com.sohu.inputmethod.sogou");
        ALWAYS_ALLOWED.add("com.baidu.input");
        ALWAYS_ALLOWED.add("com.iflytek.inputmethod");
        ALWAYS_ALLOWED.add("com.qwerty.iqqi");
        // Lockscreen / keyguard fragments
        ALWAYS_ALLOWED.add("com.android.keyguard");
    }

    /** Substring patterns: if the package contains any of these tokens, it's
     *  treated as a launcher / system transition window. Catches OEM packages
     *  we may not have explicitly listed above. */
    private static final String[] ALLOWED_PATTERNS = new String[] {
        ".launcher", ".launcher2", ".launcher3", ".home", "homescreen",
        ".systemui", "systemui.", ".recents", "recentsactivity",
        ".inputmethod", "keyboard", ".ime.",
        "lockscreen", "keyguard", "screenoff",
    };

    private long lastRedirectMs = 0L;
    private final long[] redirectHistory = new long[MAX_REDIRECTS_PER_WINDOW];
    private int redirectHistoryIdx = 0;
    private Set<String> launcherPackages = new HashSet<>();
    private Set<String> userUnblockList = new HashSet<>();
    private long lastPrefsReadMs = 0L;
    private long lastLauncherRefreshMs = 0L;
    private final Handler main = new Handler(Looper.getMainLooper());

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.notificationTimeout = 60;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
                  | AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS;
        try { setServiceInfo(info); } catch (Throwable ignored) {}

        refreshLauncherPackages();
        refreshUserUnblockList();
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        FocusOverlay.hide(getApplicationContext());
        super.onDestroy();
    }

    public static boolean isRunning() { return instance != null; }

    private void refreshLauncherPackages() {
        Set<String> next = new HashSet<>();
        try {
            // 1) Primary query: every app that registers as a HOME activity.
            Intent home = new Intent(Intent.ACTION_MAIN);
            home.addCategory(Intent.CATEGORY_HOME);
            List<ResolveInfo> list = getPackageManager().queryIntentActivities(home, 0);
            for (ResolveInfo info : list) {
                if (info != null && info.activityInfo != null && info.activityInfo.packageName != null) {
                    next.add(info.activityInfo.packageName);
                }
            }
            // 2) Also try the DEFAULT launcher resolver (some custom ROMs only
            //    report the default here, not on a plain CATEGORY_HOME query).
            try {
                Intent def = new Intent(Intent.ACTION_MAIN);
                def.addCategory(Intent.CATEGORY_HOME);
                ResolveInfo resolved = getPackageManager().resolveActivity(def, 0);
                if (resolved != null && resolved.activityInfo != null && resolved.activityInfo.packageName != null) {
                    next.add(resolved.activityInfo.packageName);
                }
            } catch (Throwable ignored) {}
        } catch (Throwable ignored) {}
        launcherPackages = next;
        lastLauncherRefreshMs = System.currentTimeMillis();
    }

    /** Pattern-matching fallback so OEM packages we don't explicitly know about
     *  (recent-apps overlays, launcher transition activities, etc.) are still
     *  treated as system transition windows and don't trigger a redirect. */
    private static boolean matchesAllowedPattern(String pkg) {
        if (pkg == null) return false;
        String lower = pkg.toLowerCase();
        for (String pat : ALLOWED_PATTERNS) {
            if (lower.contains(pat)) return true;
        }
        return false;
    }

    /** Read the timestamp written by MainActivity.onUserLeaveHint(). Returns
     *  true if the user explicitly pressed Home / Recents within the grace
     *  window — during which we shouldn't redirect for ANY non-forbidden flow. */
    private boolean inUserLeaveGrace() {
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long t = prefs.getLong(USER_LEAVE_KEY, 0L);
            if (t <= 0L) return false;
            return (System.currentTimeMillis() - t) < USER_LEAVE_GRACE_MS;
        } catch (Throwable ignored) {
            return false;
        }
    }

    /** Records a redirect timestamp in the rolling window. Returns true if
     *  we've ALREADY hit the cap inside the current window — caller should
     *  back off rather than redirect again. */
    private boolean overRedirectCap(long now) {
        // Count entries within the last REDIRECT_WINDOW_MS.
        int recent = 0;
        for (long t : redirectHistory) {
            if (t > 0L && (now - t) < REDIRECT_WINDOW_MS) recent++;
        }
        return recent >= MAX_REDIRECTS_PER_WINDOW;
    }
    private void recordRedirect(long now) {
        redirectHistory[redirectHistoryIdx] = now;
        redirectHistoryIdx = (redirectHistoryIdx + 1) % redirectHistory.length;
    }

    /** Re-read user's unblock list from prefs. Called sparingly (5s throttle) on
     *  each accessibility event so the user can edit the list and see effect
     *  without bouncing the service. */
    private void refreshUserUnblockList() {
        Set<String> next = new HashSet<>();
        try {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(UNBLOCK_KEY, "");
            if (!TextUtils.isEmpty(raw)) {
                for (String s : raw.split(",")) {
                    String t = s.trim();
                    if (!t.isEmpty()) next.add(t);
                }
            }
        } catch (Throwable ignored) {}
        userUnblockList = next;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!focusActive) {
            FocusOverlay.hide(getApplicationContext());
            return;
        }
        if (event == null) return;
        if (event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return;

        CharSequence pkgCs = event.getPackageName();
        if (pkgCs == null) return;
        String pkg = pkgCs.toString();
        if (TextUtils.isEmpty(pkg)) return;

        long now = System.currentTimeMillis();
        // Throttle prefs reads to ~once per 5s so unblock-list changes take
        // effect quickly without rereading SharedPreferences on every event.
        if (now - lastPrefsReadMs > 5000L) {
            refreshUserUnblockList();
            lastPrefsReadMs = now;
        }
        // Re-query launcher packages every 30s. The user may switch their
        // default launcher mid-session, and brand-new launchers can appear if
        // they install one. We cap re-query frequency so it's cheap.
        if (now - lastLauncherRefreshMs > 30000L) {
            refreshLauncherPackages();
        }

        Context appCtx = getApplicationContext();

        // Our own package: ONLY hide the overlay when the foreground window
        // is actually MainActivity. If it's the overlay window or any other
        // internal window, leave the overlay up — it must remain a firm wall.
        if (pkg.equals(getPackageName())) {
            CharSequence clsCs = event.getClassName();
            String cls = clsCs == null ? "" : clsCs.toString();
            if (cls.endsWith("MainActivity") || cls.equals("io.focusix7.app.MainActivity")) {
                FocusOverlay.hide(appCtx);
            }
            return;
        }

        // System UI / dialers / IMEs / settings / known launchers: pass through.
        if (ALWAYS_ALLOWED.contains(pkg)) {
            FocusOverlay.hide(appCtx);
            return;
        }
        // Pattern-matching fallback for OEM launcher / recents / IME packages
        // we don't have explicitly listed — keyword-based so a brand-new ROM's
        // `com.brandnew.launcher` or `com.foo.systemui` still passes through.
        if (matchesAllowedPattern(pkg)) {
            FocusOverlay.hide(appCtx);
            return;
        }
        // Home screen / launcher: the user is ALLOWED to be here.
        if (launcherPackages.contains(pkg)) {
            FocusOverlay.hide(appCtx);
            return;
        }
        // User's whitelist — apps explicitly allowed during focus.
        if (userUnblockList.contains(pkg)) {
            FocusOverlay.hide(appCtx);
            return;
        }

        // ----- USER-LEAVE GRACE PERIOD -----
        // If the user JUST pressed Home or Recents (within ~2.5s), every
        // subsequent transition is treated as a legitimate minimize / app-
        // switch flow. This blocks the "force-redirect during the home
        // animation" symptom that happened on some Samsung / MIUI / OnePlus
        // phones where an OEM-specific transition package owned the foreground
        // window for a frame and got misclassified as a forbidden app.
        if (inUserLeaveGrace()) {
            FocusOverlay.hide(appCtx);
            return;
        }

        // ----- REDIRECT CAP -----
        // If we've already fired the maximum redirects inside a rolling 10s
        // window, back off entirely. Protects against runaway-loop behaviour
        // on phones with unusual window-state event patterns. Once the cap
        // window expires we resume normal enforcement.
        if (overRedirectCap(now)) {
            return;
        }

        // FORBIDDEN: any other package opened during focus. Show the overlay
        // (touch-blocking wall + "back to Focusix7" button) and force-redirect
        // MainActivity to the front so the offending app is bumped off the
        // top of the activity stack.
        FocusOverlay.show(appCtx);

        if (now - lastRedirectMs < REDIRECT_THROTTLE_MS) return;
        lastRedirectMs = now;
        recordRedirect(now);
        main.post(() -> {
            try {
                Intent intent = new Intent(appCtx, MainActivity.class);
                intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                  | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                  | Intent.FLAG_ACTIVITY_SINGLE_TOP
                  | Intent.FLAG_ACTIVITY_CLEAR_TOP
                );
                appCtx.startActivity(intent);
            } catch (Throwable ignored) {}
        });
    }

    @Override
    public void onInterrupt() { /* no-op */ }
}
