package io.focusix7.app;

import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Full-screen overlay window shown over OTHER apps / the launcher when the
 * user tries to leave Focusix7 during an active focus session. Tapping the
 * button brings them back to the app. Requires SYSTEM_ALERT_WINDOW.
 */
public final class FocusOverlay {

    private static View overlayView;
    private static final Object LOCK = new Object();
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private FocusOverlay() {}

    public static boolean canDraw(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return Settings.canDrawOverlays(ctx);
    }

    public static void show(Context ctx) {
        if (!canDraw(ctx)) return;
        MAIN.post(() -> showInternal(ctx.getApplicationContext()));
    }

    public static void hide(Context ctx) {
        MAIN.post(() -> hideInternal(ctx.getApplicationContext()));
    }

    private static void showInternal(Context ctx) {
        synchronized (LOCK) {
            if (overlayView != null) return;
            WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
            if (wm == null) return;

            int type;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                type = WindowManager.LayoutParams.TYPE_PHONE;
            }

            WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                  | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                  | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                  | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                PixelFormat.TRANSLUCENT
            );
            lp.gravity = Gravity.CENTER;

            View v = buildOverlay(ctx);
            try {
                wm.addView(v, lp);
                overlayView = v;
            } catch (Throwable ignored) {}
        }
    }

    private static void hideInternal(Context ctx) {
        synchronized (LOCK) {
            if (overlayView == null) return;
            WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
            if (wm == null) { overlayView = null; return; }
            try { wm.removeView(overlayView); } catch (Throwable ignored) {}
            overlayView = null;
        }
    }

    private static View buildOverlay(Context ctx) {
        float density = ctx.getResources().getDisplayMetrics().density;

        FrameLayout root = new FrameLayout(ctx);
        root.setBackgroundColor(0xEE2E1F12); // warm dark with alpha
        root.setClickable(true);
        root.setFocusable(true);

        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        int padding = dp(28, density);
        card.setPadding(padding, padding, padding, padding);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xFFFFFAEF);
        bg.setCornerRadius(dp(22, density));
        card.setBackground(bg);

        FrameLayout.LayoutParams cardLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        cardLp.gravity = Gravity.CENTER;
        cardLp.leftMargin = cardLp.rightMargin = dp(28, density);

        TextView title = new TextView(ctx);
        title.setText("Focus mode is on");
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(0xFF2E1F12);
        title.setGravity(Gravity.CENTER);

        TextView body = new TextView(ctx);
        body.setText("Mr. 67 wants you scrolling — but the timer's still running. " +
                     "Return to Focusix7 to finish the battle.");
        body.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        body.setTextColor(0xFF5A4332);
        body.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bodyLp.topMargin = dp(12, density);
        body.setLayoutParams(bodyLp);

        Button btn = new Button(ctx);
        btn.setText("Back to Focusix7");
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        btn.setAllCaps(false);
        btn.setTextColor(Color.WHITE);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(0xFFD97A4A);
        btnBg.setCornerRadius(dp(18, density));
        btn.setBackground(btnBg);
        LinearLayout.LayoutParams btnLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dp(52, density));
        btnLp.topMargin = dp(22, density);
        btn.setLayoutParams(btnLp);
        btn.setOnClickListener(view -> {
            try {
                Intent intent = new Intent(ctx, MainActivity.class);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                              | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                              | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                ctx.startActivity(intent);
            } catch (Throwable ignored) {}
            hide(ctx);
        });

        card.addView(title);
        card.addView(body);
        card.addView(btn);
        root.addView(card, cardLp);
        return root;
    }

    private static int dp(int v, float density) { return Math.round(v * density); }
}
