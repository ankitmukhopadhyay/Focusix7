package io.focusix7.app;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.ActivityManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Base64;
import android.view.accessibility.AccessibilityManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "FocusLock")
public class FocusLockPlugin extends Plugin {

    @PluginMethod
    public void isSupported(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
        ret.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    /** Begin a focus session: arms the AccessibilityService, requests screen pinning,
     *  starts the foreground service. */
    @PluginMethod
    public void start(PluginCall call) {
        int minutes = call.getInt("minutes", 25);
        String label = call.getString("label", "Focus session");

        MainActivity activity = (MainActivity) getActivity();
        if (activity == null) {
            call.reject("Activity is not available");
            return;
        }

        activity.enableKeepScreenOn(true);

        // Arm the AccessibilityService so any package switch will redirect back.
        FocusBlockerService.focusActive = true;

        // Lock-task / screen-pinning is intentionally disabled. The phone
        // stays unlocked; the user can press home, browse the launcher, even
        // open whitelisted apps. The AccessibilityService + SYSTEM_ALERT_WINDOW
        // overlay are what keep Focusix7 "on top" — not OS-level pinning.
        boolean lockRequested = false;

        // Start the foreground service so the timer survives screen-off.
        Context ctx = getContext();
        Intent svc = new Intent(ctx, FocusForegroundService.class);
        svc.setAction(FocusForegroundService.ACTION_START);
        svc.putExtra(FocusForegroundService.EXTRA_MINUTES, minutes);
        svc.putExtra(FocusForegroundService.EXTRA_LABEL, label);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(svc);
            else ctx.startService(svc);
        } catch (Throwable ignored) {}

        JSObject ret = new JSObject();
        ret.put("lockRequested", lockRequested);
        ret.put("inLockTaskMode", inLockTaskMode());
        ret.put("blockerActive", isAccessibilityServiceEnabled(ctx));
        ret.put("overlayGranted", FocusOverlay.canDraw(ctx));
        call.resolve(ret);
    }

    @PluginMethod
    public void stop(PluginCall call) {
        FocusBlockerService.focusActive = false;
        FocusOverlay.hide(getContext());

        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            activity.enableKeepScreenOn(false);
            // No lock-task to release — see comment in start(). Calling
            // stopLockTask() unconditionally would crash on devices that were
            // never pinned, so we just skip it cleanly.
        }
        Context ctx = getContext();
        Intent svc = new Intent(ctx, FocusForegroundService.class);
        svc.setAction(FocusForegroundService.ACTION_STOP);
        try { ctx.startService(svc); } catch (Throwable ignored) {}

        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getState(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        ret.put("inLockTaskMode", inLockTaskMode());
        ret.put("supported", Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP);
        ret.put("focusActive", FocusBlockerService.focusActive);
        ret.put("blockerActive", isAccessibilityServiceEnabled(ctx));
        ret.put("overlayGranted", FocusOverlay.canDraw(ctx));
        ret.put("notificationsAllowed", areNotificationsAllowed(ctx));
        call.resolve(ret);
    }

    // ---------------- Permission helpers --------------------------------------

    @PluginMethod
    public void getPermissions(PluginCall call) {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        ret.put("overlay", FocusOverlay.canDraw(ctx));
        ret.put("accessibility", isAccessibilityServiceEnabled(ctx));
        ret.put("notifications", areNotificationsAllowed(ctx));
        ret.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(ctx)) {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + ctx.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { ctx.startActivity(i); } catch (Throwable ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("granted", FocusOverlay.canDraw(ctx));
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent i = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
        } catch (Throwable ignored) {}
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        Context ctx = getContext();
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName());
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Throwable ignored) {}
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    // ---------------- Unblock-list management ---------------------------------

    /** Persist the list of package names that the FocusBlockerService should
     *  allow through even while a focus session is active. */
    @PluginMethod
    public void setUnblockList(PluginCall call) {
        JSArray arr = call.getArray("packages");
        StringBuilder sb = new StringBuilder();
        int count = 0;
        if (arr != null) {
            for (int i = 0; i < arr.length(); i++) {
                try {
                    String p = arr.getString(i);
                    if (p == null) continue;
                    p = p.trim();
                    if (p.isEmpty()) continue;
                    if (count > 0) sb.append(',');
                    sb.append(p);
                    count++;
                } catch (JSONException ignored) {}
            }
        }
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(
            FocusBlockerService.PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(FocusBlockerService.UNBLOCK_KEY, sb.toString()).apply();

        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("count", count);
        call.resolve(ret);
    }

    @PluginMethod
    public void getUnblockList(PluginCall call) {
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences(
            FocusBlockerService.PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(FocusBlockerService.UNBLOCK_KEY, "");
        JSArray arr = new JSArray();
        if (!TextUtils.isEmpty(raw)) {
            for (String s : raw.split(",")) {
                String t = s.trim();
                if (!t.isEmpty()) arr.put(t);
            }
        }
        JSObject ret = new JSObject();
        ret.put("packages", arr);
        call.resolve(ret);
    }

    // ---------------- Installed-apps picker -----------------------------------

    /** Return every launcher-visible installed app — package name, display
     *  label and icon (base64 PNG data URL). Used by the in-app settings
     *  picker so users can choose which apps to keep accessible during focus. */
    @PluginMethod
    public void listInstalledApps(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        String ourPkg = ctx.getPackageName();

        Intent intent = new Intent(Intent.ACTION_MAIN, null);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> resolved;
        try {
            resolved = pm.queryIntentActivities(intent, 0);
        } catch (Throwable t) {
            resolved = Collections.emptyList();
        }

        Set<String> seen = new HashSet<>();
        List<JSObject> rows = new ArrayList<>();
        for (ResolveInfo ri : resolved) {
            try {
                if (ri == null || ri.activityInfo == null) continue;
                String pkg = ri.activityInfo.packageName;
                if (TextUtils.isEmpty(pkg)) continue;
                if (pkg.equals(ourPkg)) continue;      // hide ourselves
                if (seen.contains(pkg)) continue;
                seen.add(pkg);

                CharSequence labelCs = ri.loadLabel(pm);
                String label = labelCs != null ? labelCs.toString() : pkg;

                String iconDataUrl = "";
                try {
                    Drawable d = ri.loadIcon(pm);
                    if (d != null) iconDataUrl = drawableToBase64Png(d, 64);
                } catch (Throwable ignored) {}

                JSObject row = new JSObject();
                row.put("packageName", pkg);
                row.put("name", label);
                row.put("icon", iconDataUrl);
                rows.add(row);
            } catch (Throwable ignored) {}
        }

        // Sort by display name, case-insensitive
        Collections.sort(rows, (a, b) -> {
            String an, bn;
            try { an = a.getString("name"); } catch (Throwable t) { an = ""; }
            try { bn = b.getString("name"); } catch (Throwable t) { bn = ""; }
            if (an == null) an = "";
            if (bn == null) bn = "";
            return an.compareToIgnoreCase(bn);
        });

        JSArray arr = new JSArray();
        for (JSObject o : rows) arr.put(o);

        JSObject ret = new JSObject();
        ret.put("apps", arr);
        call.resolve(ret);
    }

    private String drawableToBase64Png(Drawable d, int sizePx) {
        try {
            Bitmap bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bmp);
            d.setBounds(0, 0, sizePx, sizePx);
            d.draw(canvas);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bmp.compress(Bitmap.CompressFormat.PNG, 90, baos);
            String b64 = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP);
            bmp.recycle();
            return "data:image/png;base64," + b64;
        } catch (Throwable t) {
            return "";
        }
    }

    // ---------------- Private detectors ---------------------------------------

    private boolean inLockTaskMode() {
        try {
            ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
            if (am == null) return false;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                return am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE;
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                return am.isInLockTaskMode();
            }
        } catch (Throwable ignored) {}
        return false;
    }

    /** True if the user has enabled our FocusBlockerService in Accessibility settings. */
    private boolean isAccessibilityServiceEnabled(Context ctx) {
        try {
            AccessibilityManager am = (AccessibilityManager) ctx.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am == null || !am.isEnabled()) return false;
            List<AccessibilityServiceInfo> list = am.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
            if (list == null) return false;
            String myService = new ComponentName(ctx, FocusBlockerService.class).flattenToString();
            for (AccessibilityServiceInfo info : list) {
                if (info == null) continue;
                String id = info.getId();
                if (id == null) continue;
                if (id.contains("FocusBlockerService") || id.equals(myService)) return true;
            }
            // Fallback: read the settings string directly.
            String setting = Settings.Secure.getString(ctx.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
            if (TextUtils.isEmpty(setting)) return false;
            return setting.contains(ctx.getPackageName() + "/" + FocusBlockerService.class.getName());
        } catch (Throwable ignored) {
            return false;
        }
    }

    private boolean areNotificationsAllowed(Context ctx) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.app.NotificationManager nm =
                    (android.app.NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                return nm != null && nm.areNotificationsEnabled();
            }
        } catch (Throwable ignored) {}
        return true;
    }
}
