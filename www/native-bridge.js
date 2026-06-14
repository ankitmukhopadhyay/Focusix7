/* Native bridge to the FocusLock Capacitor plugin.
   Safe to load in plain browsers — every method no-ops when Capacitor is absent. */
(function (global) {
  const NativeBridge = {
    isNative() {
      try { return !!(global.Capacitor && global.Capacitor.isNativePlatform && global.Capacitor.isNativePlatform()); }
      catch (_) { return false; }
    },

    platform() {
      try { return (global.Capacitor && global.Capacitor.getPlatform && global.Capacitor.getPlatform()) || "web"; }
      catch (_) { return "web"; }
    },

    _plugin() {
      if (!this.isNative()) return null;
      const p = global.Capacitor && global.Capacitor.Plugins;
      return (p && p.FocusLock) || null;
    },

    async isSupported() {
      const pl = this._plugin();
      if (!pl) return { supported: false, sdk: 0 };
      try { return await pl.isSupported(); }
      catch (_) { return { supported: false, sdk: 0 }; }
    },

    async getPermissions() {
      const pl = this._plugin();
      if (!pl) return { overlay: true, accessibility: true, notifications: true, sdk: 0, native: false };
      try { return Object.assign({ native: true }, await pl.getPermissions()); }
      catch (_) { return { overlay: false, accessibility: false, notifications: false, native: true }; }
    },

    async requestOverlayPermission() {
      const pl = this._plugin();
      if (!pl) return { granted: true, native: false };
      try { return Object.assign({ native: true }, await pl.requestOverlayPermission()); }
      catch (_) { return { granted: false, native: true }; }
    },

    async openAccessibilitySettings() {
      const pl = this._plugin();
      if (!pl) return { opened: false, native: false };
      try { return Object.assign({ native: true }, await pl.openAccessibilitySettings()); }
      catch (_) { return { opened: false, native: true }; }
    },

    async openNotificationSettings() {
      const pl = this._plugin();
      if (!pl) return { opened: false, native: false };
      try { return Object.assign({ native: true }, await pl.openNotificationSettings()); }
      catch (_) { return { opened: false, native: true }; }
    },

    async requestFocusLock(minutes, label) {
      const pl = this._plugin();
      if (!pl) return { lockRequested: false, inLockTaskMode: false, native: false };
      try {
        const res = await pl.start({ minutes: Math.max(1, Math.floor(minutes || 25)), label: String(label || "Focus session") });
        return Object.assign({ native: true }, res);
      } catch (e) {
        console.warn("FocusLock.start failed:", e);
        return { lockRequested: false, inLockTaskMode: false, native: true, error: String(e) };
      }
    },

    async releaseFocusLock() {
      const pl = this._plugin();
      if (!pl) return { ok: true, native: false };
      try {
        const res = await pl.stop();
        return Object.assign({ native: true }, res);
      } catch (e) {
        console.warn("FocusLock.stop failed:", e);
        return { ok: false, native: true, error: String(e) };
      }
    },

    async getState() {
      const pl = this._plugin();
      if (!pl) return { inLockTaskMode: false, supported: false, native: false };
      try { return Object.assign({ native: true }, await pl.getState()); }
      catch (_) { return { inLockTaskMode: false, supported: false, native: true }; }
    },

    async setUnblockList(packages) {
      const arr = Array.isArray(packages) ? packages.map(String) : [];
      const pl = this._plugin();
      if (!pl) return { ok: true, native: false, count: arr.length };
      try { return Object.assign({ native: true }, await pl.setUnblockList({ packages: arr })); }
      catch (e) { return { ok: false, native: true, error: String(e) }; }
    },

    async getUnblockList() {
      const pl = this._plugin();
      if (!pl) return { packages: [], native: false };
      try { return Object.assign({ native: true }, await pl.getUnblockList()); }
      catch (_) { return { packages: [], native: true }; }
    },

    async listInstalledApps() {
      const pl = this._plugin();
      if (!pl) return { apps: [], native: false };
      try { return Object.assign({ native: true }, await pl.listInstalledApps()); }
      catch (e) { return { apps: [], native: true, error: String(e) }; }
    },
  };

  global.NativeBridge = NativeBridge;
})(window);
