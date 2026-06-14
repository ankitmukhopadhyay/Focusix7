/**
 * Event-sequence simulation of FocusBlockerService.
 *
 * The Java service decides "redirect or allow" via a chain of guards on each
 * TYPE_WINDOW_STATE_CHANGED event. This JS shim replicates that exact chain
 * so we can verify that the OEM-specific event sequences seen on Samsung One
 * UI, Xiaomi MIUI/HyperOS, OnePlus OxygenOS, Oppo/Realme ColorOS, Vivo,
 * Huawei, Honor, Motorola, etc. are handled correctly.
 *
 * The Java source is the canonical implementation. This shim is a behavioural
 * mirror used for regression testing — if the Java guard order or thresholds
 * change, update the shim AND the Java side together.
 */

// ---- Constants (must mirror FocusBlockerService.java) ----
const USER_LEAVE_GRACE_MS    = 2500;
const REDIRECT_THROTTLE_MS   = 1200;
const REDIRECT_WINDOW_MS     = 10000;
const MAX_REDIRECTS_PER_WIN  = 2;
const SELF_PKG               = "io.focusix7.app";

const ALWAYS_ALLOWED = new Set([
  "com.android.systemui", "android",
  "com.android.phone", "com.android.server.telecom",
  "com.google.android.dialer", "com.android.dialer",
  "com.android.settings", "com.android.incallui",
  "com.android.permissioncontroller",
  "com.android.launcher", "com.android.launcher3",
  "com.google.android.apps.nexuslauncher", "com.google.android.launcher",
  "com.sec.android.app.launcher", "com.samsung.android.app.cocktailbarservice",
  "com.samsung.android.bixby.agent", "com.samsung.android.app.homestar",
  "com.miui.home", "com.mi.android.globallauncher",
  "com.miui.securitycenter", "com.miui.system", "com.miui.systemAdSolution",
  "net.oneplus.launcher", "com.oneplus.launcher",
  "com.oppo.launcher", "com.coloros.launcher",
  "com.realme.launcher", "com.heytap.launcher",
  "com.bbk.launcher2", "com.vivo.launcher",
  "com.huawei.android.launcher", "com.hihonor.android.launcher",
  "com.motorola.launcher3", "com.motorola.personalize",
  "com.asus.launcher", "com.nothing.launcher",
  "com.transsion.XOSLauncher", "com.transsion.hilauncher", "com.transsion.itel.launcher",
  "com.teslacoilsw.launcher", "com.actionlauncher.playstore",
  "ginlemon.flowerfree", "ginlemon.flowerpro",
  "com.microsoft.launcher", "org.lineageos.trebuchet",
  "com.google.android.inputmethod.latin", "com.samsung.android.honeyboard",
  "com.android.inputmethod.latin", "com.touchtype.swiftkey", "com.touchtype.swiftkey.beta",
  "com.sohu.inputmethod.sogou", "com.baidu.input", "com.iflytek.inputmethod",
  "com.qwerty.iqqi", "com.android.keyguard",
]);

const ALLOWED_PATTERNS = [
  ".launcher", ".launcher2", ".launcher3", ".home", "homescreen",
  ".systemui", "systemui.", ".recents", "recentsactivity",
  ".inputmethod", "keyboard", ".ime.",
  "lockscreen", "keyguard", "screenoff",
];
function matchesAllowedPattern(pkg) {
  if (!pkg) return false;
  const lower = pkg.toLowerCase();
  return ALLOWED_PATTERNS.some(p => lower.includes(p));
}

/**
 * State of the simulated service. Each event mutates this and decides one
 * of three actions: { action: 'redirect' | 'allow' | 'pass-through' }.
 */
function newService(opts = {}) {
  return {
    focusActive:        opts.focusActive ?? true,
    launcherPackages:   opts.launcherPackages ?? new Set(["com.google.android.apps.nexuslauncher"]),
    userUnblockList:    opts.userUnblockList ?? new Set(),
    userLeaveAtMs:      opts.userLeaveAtMs ?? 0,
    // Initialise to -Infinity so the throttle check on the FIRST event is
    // never spuriously triggered. (In real Java the values are epoch ms in
    // the billions, so 0 vs 1100 doesn't come up — this is a test artifact.)
    lastRedirectMs:     -Infinity,
    redirectHistory:    [],
    redirectCount:      0,
    log:                [],
  };
}

function processEvent(svc, evt) {
  if (!svc.focusActive) {
    return record(svc, evt, "no-op");
  }
  const { pkg, cls, nowMs } = evt;
  if (!pkg) return record(svc, evt, "ignored");

  // Self-package
  if (pkg === SELF_PKG) {
    if (cls && (cls.endsWith("MainActivity") || cls === SELF_PKG + ".MainActivity")) {
      return record(svc, evt, "hide-overlay");
    }
    return record(svc, evt, "pass-through-self");
  }
  // Explicit allow list
  if (ALWAYS_ALLOWED.has(pkg)) {
    return record(svc, evt, "allow-explicit");
  }
  // Pattern matching fallback
  if (matchesAllowedPattern(pkg)) {
    return record(svc, evt, "allow-pattern");
  }
  // Launcher list (dynamic)
  if (svc.launcherPackages.has(pkg)) {
    return record(svc, evt, "allow-launcher");
  }
  // User whitelist
  if (svc.userUnblockList.has(pkg)) {
    return record(svc, evt, "allow-user");
  }
  // User-leave grace
  if (svc.userLeaveAtMs > 0 && (nowMs - svc.userLeaveAtMs) < USER_LEAVE_GRACE_MS) {
    return record(svc, evt, "allow-grace");
  }
  // Rolling redirect cap
  const recent = svc.redirectHistory.filter(t => (nowMs - t) < REDIRECT_WINDOW_MS).length;
  if (recent >= MAX_REDIRECTS_PER_WIN) {
    return record(svc, evt, "cap-backoff");
  }
  // Throttle
  if (nowMs - svc.lastRedirectMs < REDIRECT_THROTTLE_MS) {
    return record(svc, evt, "throttled");
  }
  svc.lastRedirectMs = nowMs;
  svc.redirectHistory.push(nowMs);
  svc.redirectCount++;
  return record(svc, evt, "redirect");
}

function record(svc, evt, action) {
  svc.log.push({ pkg: evt.pkg, cls: evt.cls, t: evt.nowMs, action });
  return action;
}

// ---- The tests ----

describe("OEM-specific home-button event sequences (the reported bug)", () => {
  // The reported symptom: "when I minimize the screen during a focus session,
  // it forcefully brings back the app, and happens twice." This was caused by
  // the OEM intermediate transition packages being misclassified as forbidden.
  // We replay the EXACT event sequence each OEM emits for the home gesture.

  function run(events, opts) {
    const svc = newService(opts);
    let outcomes = [];
    for (const e of events) outcomes.push(processEvent(svc, e));
    return { svc, outcomes };
  }

  test("Samsung One UI: home gesture during focus does NOT redirect", () => {
    // Real-world event chain when pressing Home on a Samsung Galaxy:
    //   1. com.android.systemui                         (recents anim)
    //   2. com.sec.android.app.launcher                 (the launcher)
    //   3. com.sec.android.app.launcher.recents         (transition activity)
    const events = [
      { pkg: "com.android.systemui",                t: 0,   nowMs: 1000 },
      { pkg: "com.sec.android.app.launcher",        t: 50,  nowMs: 1050 },
      { pkg: "com.sec.android.app.launcher.recents",t: 100, nowMs: 1100 },
    ];
    const { svc } = run(events, { userLeaveAtMs: 900 });  // user pressed home just before
    expect(svc.redirectCount).toBe(0);
  });

  test("Xiaomi MIUI: home gesture during focus does NOT redirect", () => {
    const events = [
      { pkg: "com.android.systemui",            nowMs: 1000 },
      { pkg: "com.miui.home",                   nowMs: 1100 },
      { pkg: "com.miui.home.recents.RecentsActivity", nowMs: 1150 },
    ];
    const { svc } = run(events, { userLeaveAtMs: 900 });
    expect(svc.redirectCount).toBe(0);
  });

  test("OnePlus OxygenOS: home gesture during focus does NOT redirect", () => {
    const events = [
      { pkg: "com.android.systemui", nowMs: 1000 },
      { pkg: "net.oneplus.launcher", nowMs: 1100 },
      { pkg: "net.oneplus.launcher.recents.RecentsActivity", nowMs: 1150 },
    ];
    const { svc } = run(events, { userLeaveAtMs: 900 });
    expect(svc.redirectCount).toBe(0);
  });

  test("ColorOS (Oppo/Realme): home gesture during focus does NOT redirect", () => {
    const events = [
      { pkg: "com.android.systemui", nowMs: 1000 },
      { pkg: "com.realme.launcher",  nowMs: 1100 },
      { pkg: "com.oppo.launcher.recents.RecentsActivity", nowMs: 1150 },
    ];
    const { svc } = run(events, { userLeaveAtMs: 900 });
    expect(svc.redirectCount).toBe(0);
  });

  test("Pixel (stock Android): home gesture during focus does NOT redirect", () => {
    const events = [
      { pkg: "com.android.systemui",                     nowMs: 1000 },
      { pkg: "com.google.android.apps.nexuslauncher",    nowMs: 1100 },
    ];
    const { svc } = run(events, { userLeaveAtMs: 900 });
    expect(svc.redirectCount).toBe(0);
  });
});

describe("Opening an allowed app during focus — no false-redirect", () => {
  test("WhatsApp on user-unblock list: opens cleanly with NO redirect/overlay", () => {
    const events = [
      { pkg: "com.android.systemui",   nowMs: 1000 },   // brief transition
      { pkg: "com.whatsapp",           nowMs: 1100 },   // actual app
    ];
    const svc = newService({ userUnblockList: new Set(["com.whatsapp"]), userLeaveAtMs: 900 });
    for (const e of events) processEvent(svc, e);
    expect(svc.redirectCount).toBe(0);
    // The whatsapp event should resolve as "allow-user", NOT "redirect" or "grace".
    const whatsappLog = svc.log.find(l => l.pkg === "com.whatsapp");
    expect(whatsappLog.action).toBe("allow-user");
  });

  test("Opening allowed app even WITHOUT user-leave grace still works", () => {
    // If the user opens an allowed app from a notification (no home press),
    // there's no grace window — but the whitelist must still let it through.
    const events = [{ pkg: "com.whatsapp", nowMs: 5000 }];
    const svc = newService({ userUnblockList: new Set(["com.whatsapp"]) });
    processEvent(svc, events[0]);
    expect(svc.redirectCount).toBe(0);
    expect(svc.log[0].action).toBe("allow-user");
  });
});

describe("Opening a forbidden app during focus — overlay + redirect (the desired enforcement)", () => {
  test("Forbidden app opened from home → exactly ONE redirect (no double-redirect)", () => {
    const events = [
      { pkg: "com.google.android.apps.nexuslauncher", nowMs: 1000 },
      { pkg: "com.instagram.android",                 nowMs: 1100 },  // forbidden
    ];
    const svc = newService();
    for (const e of events) processEvent(svc, e);
    expect(svc.redirectCount).toBe(1);
    expect(svc.log[svc.log.length - 1].action).toBe("redirect");
  });

  test("Forbidden app re-opened within throttle window → throttled (no second redirect)", () => {
    const events = [
      { pkg: "com.instagram.android", nowMs: 1000 },   // → redirect
      { pkg: "com.instagram.android", nowMs: 1500 },   // 500ms later → throttled
    ];
    const svc = newService();
    for (const e of events) processEvent(svc, e);
    expect(svc.redirectCount).toBe(1);
    expect(svc.log[1].action).toBe("throttled");
  });

  test("Repeated forbidden-app launches eventually hit the rolling cap and stop redirecting", () => {
    // User stubbornly opens 5 forbidden apps in 10 seconds. After 2 redirects,
    // we back off so they don't get trapped in a launch loop. (They'll still
    // see the overlay, but the force-redirect stops.)
    const svc = newService();
    [1000, 2300, 3600, 4900, 6200].forEach(nowMs => {
      processEvent(svc, { pkg: "com.instagram.android", nowMs });
    });
    expect(svc.redirectCount).toBe(2);  // capped at MAX_REDIRECTS_PER_WIN
    expect(svc.log.filter(l => l.action === "cap-backoff").length).toBeGreaterThanOrEqual(1);
  });

  test("After cap window expires, redirects resume", () => {
    const svc = newService();
    processEvent(svc, { pkg: "com.x.app", nowMs: 1000 });   // redirect
    processEvent(svc, { pkg: "com.x.app", nowMs: 2300 });   // redirect
    processEvent(svc, { pkg: "com.x.app", nowMs: 3500 });   // cap-backoff (within 10s)
    processEvent(svc, { pkg: "com.x.app", nowMs: 13000 });  // past window → redirect
    expect(svc.redirectCount).toBe(3);
  });

  test("Inside grace window after Home press, even a forbidden app gets PASSED through", () => {
    // This is the trade-off: for ~2.5 s after the user explicitly presses Home,
    // we trust them. If they immediately open a forbidden app during that
    // window, we let it pass (otherwise we'd redirect on the normal home flow).
    // After the grace window expires, normal enforcement resumes.
    const svc = newService({ userLeaveAtMs: 1000 });
    processEvent(svc, { pkg: "com.instagram.android", nowMs: 2000 });  // 1s in → grace
    expect(svc.redirectCount).toBe(0);
    expect(svc.log[0].action).toBe("allow-grace");
    processEvent(svc, { pkg: "com.instagram.android", nowMs: 4000 });  // 3s in → past grace
    expect(svc.redirectCount).toBe(1);
  });
});

describe("Notification shade / lock screen / keyboard never triggers redirect", () => {
  test.each([
    ["com.android.systemui",                  "notification shade"],
    ["com.android.keyguard",                  "lock screen"],
    ["com.google.android.inputmethod.latin",  "Gboard"],
    ["com.samsung.android.honeyboard",        "Samsung keyboard"],
    ["com.touchtype.swiftkey",                "SwiftKey"],
    ["com.android.dialer",                    "stock dialer"],
    ["com.android.incallui",                  "incoming call UI"],
    ["com.android.permissioncontroller",      "permission prompts"],
  ])("%s (%s) is silently allowed even without grace", (pkg, _label) => {
    const svc = newService();
    processEvent(svc, { pkg, nowMs: 5000 });
    expect(svc.redirectCount).toBe(0);
  });
});

describe("Pattern matching catches OEM packages we never explicitly listed", () => {
  test.each([
    "com.brandnew.launcher",      // hypothetical new OEM launcher
    "com.brandnew.launcher3",
    "com.foo.systemui",
    "com.bar.recents",
    "com.brand.RecentsActivity",
    "com.example.home",
    "com.example.inputmethod.korean",
  ])("'%s' is allowed by pattern fallback", (pkg) => {
    const svc = newService();
    processEvent(svc, { pkg, nowMs: 5000 });
    expect(svc.redirectCount).toBe(0);
  });
});

describe("Existing functionality preserved", () => {
  test("Focus inactive: NEVER redirects, even for forbidden apps", () => {
    const svc = newService({ focusActive: false });
    processEvent(svc, { pkg: "com.instagram.android", nowMs: 1000 });
    expect(svc.redirectCount).toBe(0);
  });
  test("MainActivity event hides overlay (the original bug fix is preserved)", () => {
    const svc = newService();
    const action = processEvent(svc, { pkg: SELF_PKG, cls: "io.focusix7.app.MainActivity", nowMs: 1000 });
    expect(action).toBe("hide-overlay");
  });
  test("Non-MainActivity event from our own process is a pass-through (overlay window stays)", () => {
    const svc = newService();
    const action = processEvent(svc, { pkg: SELF_PKG, cls: "io.focusix7.app.SomeOtherWindow", nowMs: 1000 });
    expect(action).toBe("pass-through-self");
  });
});
