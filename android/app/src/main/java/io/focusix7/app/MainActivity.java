package io.focusix7.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FocusLockPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void onUserLeaveHint() {
        // Fires only when the USER explicitly leaves the activity (Home or
        // Recents button / gesture). NOT fired on incoming-call interrupts,
        // notification-shade pulldowns, or programmatic startActivity. The
        // FocusBlocker reads this timestamp to grant a short grace period
        // so legitimate minimize / app-switch flows don't get reverted by
        // OEM-specific window-state transition packages (Samsung recents,
        // MIUI launcher transitions, etc.) being misclassified as forbidden.
        try {
            SharedPreferences prefs = getApplicationContext()
                .getSharedPreferences(FocusBlockerService.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putLong(FocusBlockerService.USER_LEAVE_KEY, System.currentTimeMillis())
                .apply();
        } catch (Throwable ignored) {}
        super.onUserLeaveHint();
    }

    public void enableKeepScreenOn(boolean enable) {
        runOnUiThread(() -> {
            if (enable) {
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            } else {
                getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            }
        });
    }
}
