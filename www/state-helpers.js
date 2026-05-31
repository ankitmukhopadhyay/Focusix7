/* Pure state helpers — shared by the running app and the test suite.
   No DOM access, no localStorage, no side effects beyond mutating the
   `state` argument that is passed in. UMD-style export so it works in both
   the browser (attaches to window) and Node.js (CommonJS for Jest). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module && module.exports) {
    module.exports = api;
  }
  if (typeof window !== "undefined") {
    window.Focusix7Helpers = api;
  } else if (typeof globalThis !== "undefined") {
    globalThis.Focusix7Helpers = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const BANISH_BONUS_CELLS = 50;
  const BANISH_BONUS_AURA  = 1;
  const FOCUS_WORLD_DELTA  = 5;
  const GIVEUP_WORLD_DELTA = -10;
  const AURA_THRESHOLD_MIN = 60;
  const WORLD_MIN = 0;
  const WORLD_MAX = 100;

  const LEGACY_SKIN = {
    default: "classic",
    coffee:  "detective",
    edamame: "scholar",
    pinto:   "wizard",
    kitty:   "astronaut",
    jelly:   "sigma",
    space:   "knight",
  };

  const LEGACY_OWNED_ITEM = {
    skin_default:   "skin_classic",
    skin_coffee:    "skin_detective",
    skin_edamame:   "skin_scholar",
    skin_pinto:     "skin_wizard",
    skin_kitty:     "skin_astronaut",
    skin_jelly:     "skin_sigma",
    skin_space:     "skin_knight",
  };

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /**
   * Migrate a saved state forward. Pure: mutates the passed object and returns it.
   * `opts.validItemIds` (Set) — drop items not in this set.
   * `opts.defaultState`        — defaults filled in for missing keys.
   */
  function migrateState(s, opts) {
    opts = opts || {};
    const validItemIds = opts.validItemIds || new Set();
    const defaults = opts.defaultState || {};

    if (typeof s.socks === "number") {
      s.brainCells = (s.brainCells || 0) + s.socks;
      delete s.socks;
    }
    if (typeof s.scarves === "number") {
      s.aura = (s.aura || 0) + s.scarves;
      delete s.scarves;
    }

    if (typeof s.beanName === "string" && (!s.heroName || s.heroName === "Mr. Interesting")) {
      s.heroName = s.beanName;
    }
    delete s.beanName;

    if (LEGACY_SKIN[s.skin]) s.skin = LEGACY_SKIN[s.skin];

    if (Array.isArray(s.ownedItems)) {
      s.ownedItems = s.ownedItems
        .map(id => LEGACY_OWNED_ITEM[id] || id)
        .filter(id => validItemIds.size === 0 || validItemIds.has(id));
      if (!s.ownedItems.includes("skin_classic")) s.ownedItems.unshift("skin_classic");
      s.ownedItems = [...new Set(s.ownedItems)];
    }

    if (s.placed && typeof s.placed === "object") {
      const next = {};
      for (const [k, v] of Object.entries(s.placed)) {
        if (validItemIds.size === 0 || validItemIds.has(k)) next[k] = v;
      }
      s.placed = next;
    }

    if (typeof s.worldFocus !== "number") s.worldFocus = defaults.worldFocus != null ? defaults.worldFocus : 50;

    return s;
  }

  /**
   * Apply the reward for a successful focus session. Mutates state and returns
   * { banished } — `banished` is true if this session pushed the meter to 100.
   */
  function applyFocusReward(state, minutes) {
    const min = Math.max(0, Math.floor(minutes || 0));
    state.brainCells = (state.brainCells || 0) + min;
    state.totalFocusMinutes = (state.totalFocusMinutes || 0) + min;
    if (min >= AURA_THRESHOLD_MIN) state.aura = (state.aura || 0) + 1;
    state.sessionsCompleted = (state.sessionsCompleted || 0) + 1;
    const prev = state.worldFocus != null ? state.worldFocus : 50;
    state.worldFocus = clamp(prev + FOCUS_WORLD_DELTA, WORLD_MIN, WORLD_MAX);
    return { banished: state.worldFocus >= WORLD_MAX && prev < WORLD_MAX };
  }

  /** Apply give-up penalty. Mutates and returns the new worldFocus value. */
  function applyGiveUp(state) {
    const prev = state.worldFocus != null ? state.worldFocus : 50;
    state.worldFocus = clamp(prev + GIVEUP_WORLD_DELTA, WORLD_MIN, WORLD_MAX);
    return state.worldFocus;
  }

  /** Apply Mr. 67 banishment bonus and reset the meter. Mutates and returns the state. */
  function applyBanishReward(state) {
    state.brainCells = (state.brainCells || 0) + BANISH_BONUS_CELLS;
    state.aura       = (state.aura || 0)       + BANISH_BONUS_AURA;
    state.worldFocus = 50;
    return state;
  }

  /** Pure timer-display formatter for "MM:SS" given a remaining-ms input. */
  function formatTimer(remainingMs) {
    const ms = Math.max(0, Math.floor(remainingMs || 0));
    const totalSec = Math.ceil(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  return {
    BANISH_BONUS_CELLS,
    BANISH_BONUS_AURA,
    FOCUS_WORLD_DELTA,
    GIVEUP_WORLD_DELTA,
    AURA_THRESHOLD_MIN,
    WORLD_MIN,
    WORLD_MAX,
    LEGACY_SKIN,
    LEGACY_OWNED_ITEM,
    migrateState,
    applyFocusReward,
    applyGiveUp,
    applyBanishReward,
    formatTimer,
    clone,
    clamp,
  };
});
