/** @jest-environment node */
const H = require("../www/state-helpers.js");

const VALID = new Set([
  "skin_classic", "skin_detective", "skin_scholar", "skin_wizard",
  "skin_astronaut", "skin_sigma", "skin_knight",
  "owl", "cat", "dog", "coffee", "trophy", "plant",
]);

const DEFAULT_STATE = {
  brainCells: 0, aura: 0, heroName: "Mr. Interesting",
  skin: "classic", ownedItems: ["skin_classic"],
  placed: {}, totalFocusMinutes: 0,
  sessionsCompleted: 0, worldFocus: 50,
};

function freshState(overrides) {
  return Object.assign(H.clone(DEFAULT_STATE), overrides || {});
}

describe("migrateState — legacy currency keys", () => {
  test("socks → brainCells (added, key removed)", () => {
    const s = H.migrateState({ socks: 7, brainCells: 3 }, { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.brainCells).toBe(10);
    expect(s.socks).toBeUndefined();
  });
  test("scarves → aura (added, key removed)", () => {
    const s = H.migrateState({ scarves: 2 }, { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.aura).toBe(2);
    expect(s.scarves).toBeUndefined();
  });
});

describe("migrateState — name and skin renames", () => {
  test("beanName → heroName (only when heroName unset)", () => {
    const s = H.migrateState({ beanName: "Sprout" }, { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.heroName).toBe("Sprout");
    expect(s.beanName).toBeUndefined();
  });
  test("legacy skin id 'default' → 'classic'", () => {
    const s = H.migrateState({ skin: "default" }, { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.skin).toBe("classic");
  });
  test("legacy skin 'space' → 'knight'", () => {
    const s = H.migrateState({ skin: "space" }, { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.skin).toBe("knight");
  });
});

describe("migrateState — owned items", () => {
  test("renames legacy skin item ids", () => {
    const s = H.migrateState({ ownedItems: ["skin_default", "skin_coffee"] },
      { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.ownedItems).toEqual(expect.arrayContaining(["skin_classic", "skin_detective"]));
  });
  test("drops unknown item ids", () => {
    const s = H.migrateState({ ownedItems: ["owl", "GHOST_ITEM", "skin_classic"] },
      { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.ownedItems).not.toContain("GHOST_ITEM");
  });
  test("guarantees skin_classic is owned", () => {
    const s = H.migrateState({ ownedItems: ["owl"] },
      { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.ownedItems).toContain("skin_classic");
  });
  test("dedupes after migration", () => {
    const s = H.migrateState({ ownedItems: ["skin_classic", "skin_default"] },
      { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.ownedItems.filter(x => x === "skin_classic").length).toBe(1);
  });
});

describe("migrateState — placed map cleanup", () => {
  test("drops placed entries for unknown items", () => {
    const s = H.migrateState({ placed: { owl: { x: 10, y: 20 }, ghost: { x: 0, y: 0 } } },
      { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(Object.keys(s.placed)).toEqual(["owl"]);
  });
  test("defaults worldFocus to 50 when missing", () => {
    const s = H.migrateState({}, { validItemIds: VALID, defaultState: DEFAULT_STATE });
    expect(s.worldFocus).toBe(50);
  });
});

describe("applyFocusReward — math + side-effects on state", () => {
  test("awards 1 brain cell per minute", () => {
    const s = freshState();
    H.applyFocusReward(s, 15);
    expect(s.brainCells).toBe(15);
    expect(s.totalFocusMinutes).toBe(15);
    expect(s.sessionsCompleted).toBe(1);
  });
  test("adds +5 to worldFocus, clamped at 100", () => {
    const s = freshState({ worldFocus: 98 });
    H.applyFocusReward(s, 10);
    expect(s.worldFocus).toBe(100);
  });
  test("awards +1 aura only when minutes >= 60", () => {
    const s = freshState();
    H.applyFocusReward(s, 59);
    expect(s.aura).toBe(0);
    H.applyFocusReward(s, 60);
    expect(s.aura).toBe(1);
  });
  test("returns banished=true on the crossing-to-100 session only", () => {
    const s = freshState({ worldFocus: 95 });
    const r1 = H.applyFocusReward(s, 10);
    expect(r1.banished).toBe(true);
    expect(s.worldFocus).toBe(100);
    const r2 = H.applyFocusReward(s, 10);
    expect(r2.banished).toBe(false);
  });
});

describe("applyGiveUp — penalty", () => {
  test("subtracts 10 from worldFocus, floored at 0", () => {
    const s = freshState({ worldFocus: 5 });
    expect(H.applyGiveUp(s)).toBe(0);
  });
  test("does not touch brainCells or aura", () => {
    const s = freshState({ worldFocus: 80, brainCells: 50, aura: 1 });
    H.applyGiveUp(s);
    expect(s.brainCells).toBe(50);
    expect(s.aura).toBe(1);
  });
});

describe("applyBanishReward — bonus + reset", () => {
  test("adds +50 brain cells, +1 aura, resets meter to 50", () => {
    const s = freshState({ brainCells: 200, aura: 3, worldFocus: 100 });
    H.applyBanishReward(s);
    expect(s.brainCells).toBe(200 + H.BANISH_BONUS_CELLS);
    expect(s.aura).toBe(3 + H.BANISH_BONUS_AURA);
    expect(s.worldFocus).toBe(50);
  });
});

describe("formatTimer — display formatting", () => {
  test("25:00 for 25 minutes exactly", () => {
    expect(H.formatTimer(25 * 60 * 1000)).toBe("25:00");
  });
  test("01:01 for 61 seconds", () => {
    expect(H.formatTimer(61 * 1000)).toBe("01:01");
  });
  test("00:00 for 0", () => {
    expect(H.formatTimer(0)).toBe("00:00");
  });
  test("never returns negative for negative inputs", () => {
    expect(H.formatTimer(-500)).toBe("00:00");
  });
});
