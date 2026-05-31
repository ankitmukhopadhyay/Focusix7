package io.focusix7.app;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.ActivityManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.accessibility.AccessibilityManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

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

        // Try Lock Task Mode (screen pinning).
        boolean lockRequested = false;
        try {
            activity.runOnUiThread(() -> {
                try { activity.startLockTask(); } catch (Throwable ignored) {}
            });
            lockRequested = true;
        } catch (Throwable t) { lockRequested = false; }

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
            activity.runOnUiThread(() -> {
                try { activity.stopLockTask(); } catch (Throwable ignored) {}
            });
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
