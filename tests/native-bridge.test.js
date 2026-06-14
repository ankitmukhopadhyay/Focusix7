/** @jest-environment jsdom */
// Load the bridge in a fresh jsdom window; it should be no-op safe when
// Capacitor isn't present.

beforeEach(() => {
  jest.resetModules();
  delete window.Capacitor;
  delete window.NativeBridge;
  // Re-evaluate the script
  const fs = require("fs");
  const path = require("path");
  const src = fs.readFileSync(path.resolve(__dirname, "../www/native-bridge.js"), "utf8");
  // eslint-disable-next-line no-new-func
  new Function(src).call(window);
});

describe("NativeBridge without Capacitor", () => {
  test("exposes NativeBridge on window", () => {
    expect(typeof window.NativeBridge).toBe("object");
  });
  test("isNative() returns false", () => {
    expect(window.NativeBridge.isNative()).toBe(false);
  });
  test("platform() returns 'web'", () => {
    expect(window.NativeBridge.platform()).toBe("web");
  });
  test("requestFocusLock resolves with native:false, no throw", async () => {
    const res = await window.NativeBridge.requestFocusLock(25, "test");
    expect(res.native).toBe(false);
    expect(res.lockRequested).toBe(false);
  });
  test("releaseFocusLock resolves ok:true, native:false", async () => {
    const res = await window.NativeBridge.releaseFocusLock();
    expect(res.ok).toBe(true);
    expect(res.native).toBe(false);
  });
  test("getState resolves with safe defaults", async () => {
    const res = await window.NativeBridge.getState();
    expect(res.inLockTaskMode).toBe(false);
    expect(res.supported).toBe(false);
  });
});

describe("NativeBridge with stubbed Capacitor", () => {
  beforeEach(() => {
    let lockState = false;
    window.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "android",
      Plugins: {
        FocusLock: {
          isSupported: () => Promise.resolve({ supported: true, sdk: 34 }),
          start: ({ minutes, label }) => {
            lockState = true;
            return Promise.resolve({ lockRequested: true, inLockTaskMode: true, minutes, label });
          },
          stop: () => {
            lockState = false;
            return Promise.resolve({ ok: true });
          },
          getState: () => Promise.resolve({ inLockTaskMode: lockState, supported: true }),
        },
      },
    };
    // Re-load the bridge so it picks up the new Capacitor stub
    const fs = require("fs");
    const path = require("path");
    const src = fs.readFileSync(path.resolve(__dirname, "../www/native-bridge.js"), "utf8");
    // eslint-disable-next-line no-new-func
    new Function(src).call(window);
  });

  test("isNative() returns true", () => {
    expect(window.NativeBridge.isNative()).toBe(true);
  });
  test("requestFocusLock forwards minutes/label and reports native:true", async () => {
    const res = await window.NativeBridge.requestFocusLock(45, "FocusSession");
    expect(res.native).toBe(true);
    expect(res.lockRequested).toBe(true);
    expect(res.minutes).toBe(45);
    expect(res.label).toBe("FocusSession");
  });
  test("requestFocusLock falls back to a sensible default when minutes is 0", async () => {
    const res = await window.NativeBridge.requestFocusLock(0, "weird");
    // Bridge replaces falsy minutes with the 25-min default, then floors+clamps.
    expect(res.minutes).toBeGreaterThanOrEqual(1);
    expect(res.minutes).toBe(25);
  });
  test("requestFocusLock floors fractional minutes", async () => {
    const res = await window.NativeBridge.requestFocusLock(7.9, "x");
    expect(res.minutes).toBe(7);
  });
  test("releaseFocusLock toggles inLockTaskMode in getState", async () => {
    await window.NativeBridge.requestFocusLock(5, "x");
    let s = await window.NativeBridge.getState();
    expect(s.inLockTaskMode).toBe(true);
    await window.NativeBridge.releaseFocusLock();
    s = await window.NativeBridge.getState();
    expect(s.inLockTaskMode).toBe(false);
  });
});
