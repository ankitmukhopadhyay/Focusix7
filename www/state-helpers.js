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

    // Skin curation: if the user's equipped skin was REMOVED in this update,
    // fall back to the classic look so their hero doesn't render blank.
    // (Their owned-items list is preserved untouched — any phantom IDs are
    //  ignored by the rest of the app because ITEM_BY_ID lookup returns
    //  undefined for them.)
    if (validItemIds.size > 0 && typeof s.skin === "string" &&
        !validItemIds.has("skin_" + s.skin)) {
      s.skin = "classic";
    }

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
   * Identity buffs — represents "no items placed". Used as the default for
   * applyFocusReward / applyGiveUp so existing callers (and the test suite)
   * see the original 1:1 reward math.
   */
  const IDENTITY_BUFFS = Object.freeze({
    brainCellMult: 1,
    auraBonus: 0,
    worldFocusBonus: 0,
    giveUpPenaltyMult: 1,
    doubleChance: 0,
  });

  /**
   * Compute the active buffs from a state's OWNED items + an item catalog.
   *   - brainCellMult     : ADDITIVE (each item contributes +X%; total = 1 + sum).
   *                          Prevents runaway compounding from many items.
   *   - auraBonus / worldFocusBonus : ADDITIVE.
   *   - giveUpPenaltyMult : MULTIPLICATIVE (each item keeps X% of remaining penalty).
   *   - doubleChance      : MAX (one strongest item wins).
   *
   * `catalog` is a map of itemId → item (each item may carry a `buff` object).
   * Buffs activate the moment a user OWNS the item (not when placed). Placement
   * is purely cosmetic. Pure function: never mutates state or catalog.
   */
  function computeBuffs(state, catalog) {
    const out = {
      brainCellMult: 1,
      auraBonus: 0,
      worldFocusBonus: 0,
      giveUpPenaltyMult: 1,
      doubleChance: 0,
    };
    if (!state || !catalog) return out;
    // Prefer ownedItems (canonical). Fall back to placed for legacy callers.
    let ids = [];
    if (Array.isArray(state.ownedItems)) ids = state.ownedItems;
    else if (state.placed && typeof state.placed === "object") ids = Object.keys(state.placed);
    let cellAdd = 0; // accumulated +% (additive)
    for (const id of ids) {
      const item = catalog[id];
      if (!item || !item.buff) continue;
      const b = item.buff;
      if (typeof b.brainCellMult === "number" && b.brainCellMult > 0) {
        cellAdd += (b.brainCellMult - 1);
      }
      if (typeof b.auraBonus === "number")         out.auraBonus         += b.auraBonus;
      if (typeof b.worldFocusBonus === "number")   out.worldFocusBonus   += b.worldFocusBonus;
      if (typeof b.giveUpPenaltyMult === "number") out.giveUpPenaltyMult *= b.giveUpPenaltyMult;
      if (typeof b.doubleChance === "number")      out.doubleChance       = Math.max(out.doubleChance, b.doubleChance);
    }
    out.brainCellMult = 1 + Math.max(0, cellAdd);
    return out;
  }

  /**
   * Apply the reward for a successful focus session. Mutates state and returns
   * { banished, awardedCells, awardedAura } — `banished` is true if this
   * session pushed the meter to 100.
   * `buffs` is optional and defaults to identity, preserving the original 1:1
   * math for existing callers / tests that don't pass any buffs.
   */
  function applyFocusReward(state, minutes, buffs) {
    const b = buffs || IDENTITY_BUFFS;
    const min = Math.max(0, Math.floor(minutes || 0));
    // Base cells = minutes × brainCellMult, rounded down. Identity mult keeps the
    // pre-existing math (5 min → 5 cells) so existing tests stay green.
    let cells = Math.floor(min * (b.brainCellMult || 1));
    if (b.doubleChance && Math.random() < b.doubleChance) cells *= 2;
    state.brainCells = (state.brainCells || 0) + cells;
    state.totalFocusMinutes = (state.totalFocusMinutes || 0) + min;
    let auraGain = 0;
    // Aura only flows on sessions that hit the threshold (the base game's
    // 60-min rule). When the session qualifies, item buffs ADD on top.
    if (min >= AURA_THRESHOLD_MIN) {
      auraGain += 1;
      if (b.auraBonus) auraGain += Math.max(0, Math.floor(b.auraBonus));
    }
    if (auraGain > 0) state.aura = (state.aura || 0) + auraGain;
    state.sessionsCompleted = (state.sessionsCompleted || 0) + 1;
    const prev = state.worldFocus != null ? state.worldFocus : 50;
    // World-focus delta scales with the focus duration: floor(minutes / 2).
    // So 5 min → 2, 10 min → 5, 60 min → 30, 120 min → 60.
    // Any worldFocusBonus from owned powerups still stacks ADDITIVELY on top.
    const baseDelta = Math.floor(min / 2);
    const delta = baseDelta + Math.max(0, Math.floor(b.worldFocusBonus || 0));
    state.worldFocus = clamp(prev + delta, WORLD_MIN, WORLD_MAX);
    return {
      banished: state.worldFocus >= WORLD_MAX && prev < WORLD_MAX,
      awardedCells: cells,
      awardedAura: auraGain,
    };
  }

  /**
   * Apply give-up penalty. Mutates and returns the new worldFocus value.
   * `buffs` optional — `giveUpPenaltyMult: 0.5` means only half the penalty.
   */
  function applyGiveUp(state, buffs) {
    const b = buffs || IDENTITY_BUFFS;
    const prev = state.worldFocus != null ? state.worldFocus : 50;
    const mult = b.giveUpPenaltyMult != null ? b.giveUpPenaltyMult : 1;
    const delta = Math.floor(GIVEUP_WORLD_DELTA * mult);
    state.worldFocus = clamp(prev + delta, WORLD_MIN, WORLD_MAX);
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
    IDENTITY_BUFFS,
    migrateState,
    applyFocusReward,
    applyGiveUp,
    applyBanishReward,
    computeBuffs,
    formatTimer,
    clone,
    clamp,
  };
});
