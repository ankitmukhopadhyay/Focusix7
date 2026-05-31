package io.focusix7.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

import androidx.core.app.NotificationCompat;

public class FocusForegroundService extends Service {

    public static final String ACTION_START = "io.focusix7.app.FOCUS_START";
    public static final String ACTION_STOP  = "io.focusix7.app.FOCUS_STOP";
    public static final String EXTRA_MINUTES = "minutes";
    public static final String EXTRA_LABEL   = "label";

    private static final String CHANNEL_ID = "focusix7_focus";
    private static final int NOTIFICATION_ID = 4242;

    private PowerManager.WakeLock wakeLock;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_STOP.equals(action)) {
            releaseWakeLock();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        int minutes = intent != null ? intent.getIntExtra(EXTRA_MINUTES, 25) : 25;
        String label = intent != null ? intent.getStringExtra(EXTRA_LABEL) : "Focus session";
        if (label == null) label = "Focus session";

        ensureChannel();
        Notification n = buildNotification(minutes, label);
        startForeground(NOTIFICATION_ID, n);
        acquireWakeLock(minutes);
        return START_STICKY;
    }

    private Notification buildNotification(int minutes, String label) {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentIntent = PendingIntent.getActivity(this, 0, open, piFlags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
                .setContentTitle("Focus active — " + minutes + " min")
                .setContentText(label + " — Mr. 67 is shaking 📚")
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(contentIntent)
                .setCategory(NotificationCompat.CATEGORY_PROGRESS);
        return b.build();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager mgr = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (mgr == null) return;
        NotificationChannel ch = mgr.getNotificationChannel(CHANNEL_ID);
        if (ch == null) {
            ch = new NotificationChannel(CHANNEL_ID, "Focus sessions", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Shown while a focus session is active");
            ch.setShowBadge(false);
            mgr.createNotificationChannel(ch);
        }
    }

    private void acquireWakeLock(int minutes) {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm == null) return;
        if (wakeLock != null && wakeLock.isHeld()) return;
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "focusix7:focus");
        wakeLock.setReferenceCounted(false);
        long timeoutMs = (long) (minutes + 5) * 60_000L;
        try {
            wakeLock.acquire(timeoutMs);
        } catch (Throwable ignored) {}
    }

    private void releaseWakeLock() {
        if (wakeLock != null) {
            try { if (wakeLock.isHeld()) wakeLock.release(); } catch (Throwable ignored) {}
            wakeLock = null;
        }
    }

    @Override
    public void onDestroy() {
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
