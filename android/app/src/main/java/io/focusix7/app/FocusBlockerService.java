package io.focusix7.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
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
 * Enabled by the user from Settings → Accessibility → Focusix7 Focus Blocker.
 * Reads {@link #focusActive} (set by FocusLockPlugin) to know whether to
 * intervene; otherwise stays silent so it doesn't affect normal phone use.
 */
public class FocusBlockerService extends AccessibilityService {

    /** Set true while a focus session is running. Volatile because two threads touch it. */
    public static volatile boolean focusActive = false;

    /** Optional reference so other components can check at runtime that the service is bound. */
    private static volatile FocusBlockerService instance;

    private static final Set<String> ALWAYS_ALLOWED = new HashSet<>();
    static {
        // System UI / input methods / phone dialers are never blocked, otherwise
        // the device becomes unusable. Emergency dialer in particular must work.
        ALWAYS_ALLOWED.add("com.android.systemui");
        ALWAYS_ALLOWED.add("android");
        ALWAYS_ALLOWED.add("com.android.phone");
        ALWAYS_ALLOWED.add("com.android.server.telecom");
        ALWAYS_ALLOWED.add("com.google.android.dialer");
        ALWAYS_ALLOWED.add("com.android.dialer");
        ALWAYS_ALLOWED.add("com.android.settings");  // so the user can disable us if needed
        // Common keyboards
        ALWAYS_ALLOWED.add("com.google.android.inputmethod.latin");
        ALWAYS_ALLOWED.add("com.samsung.android.honeyboard");
        ALWAYS_ALLOWED.add("com.android.inputmethod.latin");
    }

    private long lastRedirectMs = 0L;
    private Set<String> launcherPackages = new HashSet<>();
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
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            List<ResolveInfo> list = getPackageManager().queryIntentActivities(intent, 0);
            for (ResolveInfo info : list) {
                if (info != null && info.activityInfo != null && info.activityInfo.packageName != null) {
                    next.add(info.activityInfo.packageName);
                }
            }
        } catch (Throwable ignored) {}
        launcherPackages = next;
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

        // Our own activity is fine.
        if (pkg.equals(getPackageName())) {
            FocusOverlay.hide(getApplicationContext());
            return;
        }
        // System UI, dialers, input methods, settings: pass through.
        if (ALWAYS_ALLOWED.contains(pkg)) return;
        // Heuristic: input method packages always end in ".inputmethod.*" or contain "keyboard"
        if (pkg.endsWith(".inputmethod") || pkg.contains("keyboard") || pkg.contains("ime")) return;

        boolean isLauncher = launcherPackages.contains(pkg);
        Context appCtx = getApplicationContext();

        // Show the overlay immediately for instant feedback (and to cover whatever the user landed on).
        FocusOverlay.show(appCtx);

        // Debounce so we don't spam Activity launches.
        long now = System.currentTimeMillis();
        if (now - lastRedirectMs < 400L) return;
        lastRedirectMs = now;

        // Bring our activity back to the foreground.
        main.post(() -> {
            try {
                Intent intent = new Intent(appCtx, MainActivity.class);
                intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                  | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                  | Intent.FLAG_ACTIVITY_SINGLE_TOP
                );
                appCtx.startActivity(intent);
            } catch (Throwable ignored) {}
        });

        // If the user is on the launcher, also try the system home -> back trick.
        if (isLauncher) {
            try { performGlobalAction(GLOBAL_ACTION_BACK); } catch (Throwable ignored) {}
        }
    }

    @Override
    public void onInterrupt() { /* no-op */ }
}
