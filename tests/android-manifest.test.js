/** @jest-environment node */
// Static checks on the Android manifest and the focus-lock plugin source.
// These don't run on a device; they only ensure the source declarations stay
// in sync with the features the app advertises.

const fs = require("fs");
const path = require("path");

const ANDROID_ROOT = path.resolve(__dirname, "../android");
const MANIFEST     = path.join(ANDROID_ROOT, "app/src/main/AndroidManifest.xml");
const PLUGIN       = path.join(ANDROID_ROOT, "app/src/main/java/io/focusix7/app/FocusLockPlugin.java");
const SERVICE      = path.join(ANDROID_ROOT, "app/src/main/java/io/focusix7/app/FocusForegroundService.java");
const MAIN_ACT     = path.join(ANDROID_ROOT, "app/src/main/java/io/focusix7/app/MainActivity.java");
const BLOCKER      = path.join(ANDROID_ROOT, "app/src/main/java/io/focusix7/app/FocusBlockerService.java");
const OVERLAY      = path.join(ANDROID_ROOT, "app/src/main/java/io/focusix7/app/FocusOverlay.java");
const BLOCKER_XML  = path.join(ANDROID_ROOT, "app/src/main/res/xml/focus_blocker_service.xml");

function read(p) { return fs.readFileSync(p, "utf8"); }

describe("AndroidManifest — required permissions for focus-lock", () => {
  const xml = read(MANIFEST);
  test("declares INTERNET", () => {
    expect(xml).toMatch(/android\.permission\.INTERNET/);
  });
  test("declares WAKE_LOCK (timer survives screen off)", () => {
    expect(xml).toMatch(/android\.permission\.WAKE_LOCK/);
  });
  test("declares FOREGROUND_SERVICE", () => {
    expect(xml).toMatch(/android\.permission\.FOREGROUND_SERVICE\b/);
  });
  test("declares FOREGROUND_SERVICE_SPECIAL_USE (API 34+ requirement)", () => {
    expect(xml).toMatch(/android\.permission\.FOREGROUND_SERVICE_SPECIAL_USE/);
  });
  test("declares POST_NOTIFICATIONS (Android 13+)", () => {
    expect(xml).toMatch(/android\.permission\.POST_NOTIFICATIONS/);
  });
});

describe("AndroidManifest — service registration", () => {
  const xml = read(MANIFEST);
  test("FocusForegroundService is registered with the right name", () => {
    expect(xml).toMatch(/<service[\s\S]*?android:name=\"\.FocusForegroundService\"[\s\S]*?>/);
  });
  test("service is foregroundServiceType=specialUse", () => {
    expect(xml).toMatch(/foregroundServiceType=\"specialUse\"/);
  });
  test("service is not exported (security best practice)", () => {
    expect(xml).toMatch(/<service[\s\S]*?android:exported=\"false\"[\s\S]*?>/);
  });
  test("special-use subtype property is present (Play policy compliance)", () => {
    expect(xml).toMatch(/PROPERTY_SPECIAL_USE_FGS_SUBTYPE/);
  });
});

describe("MainActivity — plugin registration", () => {
  const src = read(MAIN_ACT);
  test("registers FocusLockPlugin in onCreate", () => {
    expect(src).toMatch(/registerPlugin\(FocusLockPlugin\.class\)/);
  });
  test("exposes enableKeepScreenOn helper for the plugin", () => {
    expect(src).toMatch(/enableKeepScreenOn/);
    expect(src).toMatch(/FLAG_KEEP_SCREEN_ON/);
  });
});

describe("FocusLockPlugin — surface area JS will call into", () => {
  const src = read(PLUGIN);
  test("plugin name is FocusLock", () => {
    expect(src).toMatch(/@CapacitorPlugin\(name = \"FocusLock\"\)/);
  });
  test("exposes start/stop/getState/isSupported methods", () => {
    expect(src).toMatch(/public void start\(PluginCall/);
    expect(src).toMatch(/public void stop\(PluginCall/);
    expect(src).toMatch(/public void getState\(PluginCall/);
    expect(src).toMatch(/public void isSupported\(PluginCall/);
  });
  test("exposes setUnblockList / getUnblockList methods", () => {
    expect(src).toMatch(/public void setUnblockList\(PluginCall/);
    expect(src).toMatch(/public void getUnblockList\(PluginCall/);
  });
  test("exposes listInstalledApps method (powers the in-app picker)", () => {
    expect(src).toMatch(/public void listInstalledApps\(PluginCall/);
    expect(src).toMatch(/Intent\.ACTION_MAIN/);
    expect(src).toMatch(/Intent\.CATEGORY_LAUNCHER/);
  });
  test("does NOT call Activity.startLockTask() — phone stays unlocked", () => {
    // The plugin used to invoke screen pinning. Per product policy the phone
    // is no longer locked; the AccessibilityService + overlay keep focus.
    expect(src).not.toMatch(/activity\.startLockTask\(\)/);
  });
  test("does NOT call Activity.stopLockTask()", () => {
    expect(src).not.toMatch(/activity\.stopLockTask\(\)/);
  });
  test("guards SDK version when querying lock-task state", () => {
    expect(src).toMatch(/Build\.VERSION\.SDK_INT/);
    expect(src).toMatch(/getLockTaskModeState\(\)/);
  });
});

describe("FocusForegroundService — notification + wake lock plumbing", () => {
  const src = read(SERVICE);
  test("declares a notification channel", () => {
    expect(src).toMatch(/NotificationChannel/);
  });
  test("acquires a PARTIAL_WAKE_LOCK", () => {
    expect(src).toMatch(/PARTIAL_WAKE_LOCK/);
  });
  test("releases the wake lock on destroy/stop", () => {
    expect(src).toMatch(/releaseWakeLock\(\)/);
    expect(src).toMatch(/wakeLock\.release/);
  });
  test("starts itself as a foreground service with an ongoing notification", () => {
    expect(src).toMatch(/startForeground\(/);
    expect(src).toMatch(/setOngoing\(true\)/);
  });
  test("does not exceed the wake-lock timeout (safety bound)", () => {
    // We add 5 minutes of headroom, then cap on wake-lock timeout
    expect(src).toMatch(/wakeLock\.acquire\(timeoutMs\)/);
  });
});

describe("AndroidManifest — accessibility blocker permissions + queries", () => {
  const xml = read(MANIFEST);
  test("declares SYSTEM_ALERT_WINDOW (overlay)", () => {
    expect(xml).toMatch(/android\.permission\.SYSTEM_ALERT_WINDOW/);
  });
  test("declares QUERY_ALL_PACKAGES (so we can see other apps)", () => {
    expect(xml).toMatch(/android\.permission\.QUERY_ALL_PACKAGES/);
  });
  test("declares a <queries> block for ACTION_MAIN / CATEGORY_HOME (launcher detection)", () => {
    expect(xml).toMatch(/<queries>[\s\S]*?<intent>[\s\S]*?android\.intent\.action\.MAIN[\s\S]*?android\.intent\.category\.HOME/);
  });
  test("tools namespace is present for QUERY_ALL_PACKAGES tools:ignore", () => {
    expect(xml).toMatch(/xmlns:tools="http:\/\/schemas\.android\.com\/tools"/);
  });
});

describe("AndroidManifest — FocusBlockerService registration", () => {
  const xml = read(MANIFEST);
  test("service is registered with the right name", () => {
    expect(xml).toMatch(/<service[\s\S]*?android:name=\"\.FocusBlockerService\"/);
  });
  test("service is bound by BIND_ACCESSIBILITY_SERVICE", () => {
    expect(xml).toMatch(/<service[\s\S]*?android:name=\"\.FocusBlockerService\"[\s\S]*?android:permission=\"android\.permission\.BIND_ACCESSIBILITY_SERVICE\"/);
  });
  test("service is exported (required for AccessibilityService)", () => {
    expect(xml).toMatch(/<service[\s\S]*?android:name=\"\.FocusBlockerService\"[\s\S]*?android:exported=\"true\"/);
  });
  test("service has an AccessibilityService intent filter", () => {
    expect(xml).toMatch(/<action android:name=\"android\.accessibilityservice\.AccessibilityService\"/);
  });
  test("service points to focus_blocker_service xml meta-data", () => {
    expect(xml).toMatch(/android:resource=\"@xml\/focus_blocker_service\"/);
  });
});

describe("focus_blocker_service.xml — accessibility config", () => {
  const xml = read(BLOCKER_XML);
  test("listens for window-state-changed events", () => {
    expect(xml).toMatch(/typeWindowStateChanged/);
  });
  test("uses feedbackGeneric (we don't speak / vibrate)", () => {
    expect(xml).toMatch(/feedbackGeneric/);
  });
  test("includes a human-readable description", () => {
    expect(xml).toMatch(/android:description=\"@string\/accessibility_description\"/);
  });
});

describe("FocusBlockerService — runtime behaviour", () => {
  const src = read(BLOCKER);
  test("public focusActive flag exists and is volatile", () => {
    expect(src).toMatch(/public static volatile boolean focusActive/);
  });
  test("extends AccessibilityService", () => {
    expect(src).toMatch(/extends AccessibilityService/);
  });
  test("shows the comic overlay AND force-redirects MainActivity when a non-allowed package comes foreground", () => {
    // The overlay is the visible "wall"; the redirect kicks the offending
    // app off the top of the stack so it can't even start running. Both
    // enforcement actions must be present.
    expect(src).toMatch(/FocusOverlay\.show\(/);
    expect(src).toMatch(/new Intent\(appCtx, MainActivity\.class\)/);
    expect(src).toMatch(/FLAG_ACTIVITY_NEW_TASK/);
    expect(src).toMatch(/FLAG_ACTIVITY_REORDER_TO_FRONT/);
  });
  test("only hides the overlay when MainActivity is foregrounded — not on every internal window event", () => {
    // The bug was: every window event from our own process (including the
    // overlay window itself being added) was triggering FocusOverlay.hide(),
    // which is why the wall vanished within a frame. The service must
    // gate the hide on a className check against MainActivity.
    expect(src).toMatch(/event\.getClassName\(\)/);
    expect(src).toMatch(/MainActivity/);
  });
  test("debounces re-showing the overlay to avoid event spam", () => {
    expect(src).toMatch(/lastRedirectMs/);
  });
  test("allow-list includes system UI and dialers", () => {
    expect(src).toMatch(/com\.android\.systemui/);
    expect(src).toMatch(/com\.android\.settings/);
  });
  test("hides the overlay whenever focus is not active", () => {
    expect(src).toMatch(/FocusOverlay\.hide\(/);
  });
  test("user-leave grace window prevents misclassified-transition redirects", () => {
    // After onUserLeaveHint() fires (user pressed Home/Recents), the blocker
    // must skip redirects for a short window so OEM transition packages
    // (Samsung One UI, MIUI, OnePlus, etc.) don't get treated as forbidden.
    expect(src).toMatch(/USER_LEAVE_GRACE_MS/);
    expect(src).toMatch(/inUserLeaveGrace/);
    expect(src).toMatch(/USER_LEAVE_KEY/);
  });
  test("redirect throttle is at least 1 second between consecutive redirects", () => {
    // Previously 400ms was too tight and let the home-transition fire two
    // back-to-back redirects on slower phones. We now require ≥ 1000ms.
    const m = src.match(/REDIRECT_THROTTLE_MS\s*=\s*(\d+)L/);
    expect(m).not.toBeNull();
    expect(parseInt(m[1], 10)).toBeGreaterThanOrEqual(1000);
  });
  test("rolling redirect-cap window stops runaway loops", () => {
    // No more than N redirects in a 10s window. Anything tighter and the
    // user can get trapped in a re-launch loop.
    expect(src).toMatch(/MAX_REDIRECTS_PER_WINDOW/);
    expect(src).toMatch(/REDIRECT_WINDOW_MS/);
    expect(src).toMatch(/overRedirectCap/);
  });
  test("allow-list explicitly covers Samsung / MIUI / OnePlus launchers", () => {
    // These are the OEM packages most likely to host the home/recents
    // transition. They MUST be in ALWAYS_ALLOWED or pattern-matched.
    expect(src).toMatch(/com\.sec\.android\.app\.launcher/);
    expect(src).toMatch(/com\.miui\.home/);
    expect(src).toMatch(/net\.oneplus\.launcher|com\.oneplus\.launcher/);
  });
  test("pattern-matching fallback catches '.launcher' / '.home' / '.systemui' packages", () => {
    // For brand-new OEM ROMs we don't have explicitly listed.
    expect(src).toMatch(/matchesAllowedPattern/);
    expect(src).toMatch(/".launcher"|".launcher2"|".launcher3"/);
    expect(src).toMatch(/".systemui"|"systemui\."/);
  });
  test("launcher list is periodically re-queried (handles user switching default launcher)", () => {
    expect(src).toMatch(/lastLauncherRefreshMs/);
  });
});

describe("MainActivity — onUserLeaveHint timestamp signal", () => {
  const src = read(MAIN_ACT);
  test("override onUserLeaveHint() to record the timestamp", () => {
    expect(src).toMatch(/onUserLeaveHint/);
    expect(src).toMatch(/USER_LEAVE_KEY/);
    expect(src).toMatch(/System\.currentTimeMillis\(\)/);
  });
});

describe("FocusOverlay — SYSTEM_ALERT_WINDOW lifecycle", () => {
  const src = read(OVERLAY);
  test("uses TYPE_APPLICATION_OVERLAY on Android O+", () => {
    expect(src).toMatch(/TYPE_APPLICATION_OVERLAY/);
  });
  test("falls back to TYPE_PHONE on older Android", () => {
    expect(src).toMatch(/TYPE_PHONE/);
  });
  test("checks Settings.canDrawOverlays before showing", () => {
    expect(src).toMatch(/Settings\.canDrawOverlays/);
  });
  test("provides a 'Back to Focusix7' CTA that relaunches MainActivity", () => {
    expect(src).toMatch(/Back to Focusix7/);
    expect(src).toMatch(/MainActivity\.class/);
  });
  test("the overlay backdrop consumes every touch event (no taps reach the app underneath)", () => {
    // Without setOnTouchListener returning true, taps outside the button
    // would fall through to whatever app was open before the overlay appeared.
    expect(src).toMatch(/setOnTouchListener/);
  });
  test("the overlay backdrop is clickable+focusable (so it owns the input layer)", () => {
    expect(src).toMatch(/setClickable\(true\)/);
    expect(src).toMatch(/setFocusable\(true\)/);
  });
  test("the back key is blocked from dismissing the overlay", () => {
    expect(src).toMatch(/setOnKeyListener/);
    expect(src).toMatch(/KEYCODE_BACK/);
  });
});

describe("FocusLockPlugin — permission surface for the blocker", () => {
  const src = read(PLUGIN);
  test("exposes getPermissions / requestOverlayPermission / openAccessibilitySettings", () => {
    expect(src).toMatch(/public void getPermissions\(/);
    expect(src).toMatch(/public void requestOverlayPermission\(/);
    expect(src).toMatch(/public void openAccessibilitySettings\(/);
  });
  test("toggles FocusBlockerService.focusActive on start/stop", () => {
    expect(src).toMatch(/FocusBlockerService\.focusActive = true/);
    expect(src).toMatch(/FocusBlockerService\.focusActive = false/);
  });
  test("uses ACTION_MANAGE_OVERLAY_PERMISSION to open settings", () => {
    expect(src).toMatch(/ACTION_MANAGE_OVERLAY_PERMISSION/);
  });
});

describe("Capacitor config — app identity", () => {
  const cap = JSON.parse(read(path.resolve(__dirname, "../capacitor.config.json")));
  test("appId is io.focusix7.app", () => {
    expect(cap.appId).toBe("io.focusix7.app");
  });
  test("webDir is www", () => {
    expect(cap.webDir).toBe("www");
  });
  test("appName matches branding", () => {
    expect(cap.appName).toBe("Focusix7");
  });
});
