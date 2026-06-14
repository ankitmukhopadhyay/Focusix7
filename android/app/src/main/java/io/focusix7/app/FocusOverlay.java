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
        root.setBackgroundColor(0xF0100620); // dark purple matches --bg-soft
        root.setClickable(true);
        root.setLongClickable(true);
        root.setFocusable(true);
        root.setFocusableInTouchMode(true);
        // Consume EVERY touch event on the backdrop so no tap can slip through
        // to the underlying app. Only the button's own click listener will run.
        root.setOnTouchListener((v, ev) -> true);
        // Block the back button from dismissing — only the CTA may close us.
        root.setOnKeyListener((v, keyCode, ev) -> {
            return keyCode == android.view.KeyEvent.KEYCODE_BACK;
        });

        LinearLayout card = new LinearLayout(ctx);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER);
        int padding = dp(28, density);
        card.setPadding(padding, padding, padding, padding);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xFF15082A); // dark purple panel
        bg.setCornerRadius(dp(14, density));
        bg.setStroke(dp(3, density), 0xFF000000); // comic-style thick black border
        card.setBackground(bg);

        FrameLayout.LayoutParams cardLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        cardLp.gravity = Gravity.CENTER;
        cardLp.leftMargin = cardLp.rightMargin = dp(28, density);

        TextView title = new TextView(ctx);
        title.setText("MR. 67 WANTS YOU DISTRACTED!");
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextColor(0xFFFF00AA); // neon magenta — villain colour
        title.setGravity(Gravity.CENTER);
        title.setLetterSpacing(0.06f);

        TextView body = new TextView(ctx);
        body.setText("Don't let him win. Tap below to crush the distraction and " +
                     "return to your focus session.");
        body.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        body.setTextColor(0xFFC5C9E0);
        body.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bodyLp = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        bodyLp.topMargin = dp(12, density);
        body.setLayoutParams(bodyLp);

        Button btn = new Button(ctx);
        btn.setText("Back to Focusix7");
        btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        btn.setAllCaps(true); // displayed UPPERCASE for comic-book punch
        btn.setTextColor(Color.WHITE);
        btn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(0xFF00D4FF); // solid neon cyan — comic button
        btnBg.setCornerRadius(dp(999, density));
        btnBg.setStroke(dp(3, density), 0xFF000000); // bold black border
        btn.setBackground(btnBg);
        btn.setTextColor(0xFF000000); // black on cyan for comic punch
        btn.setLetterSpacing(0.06f);
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
