// ==================== SHOP ITEMS ====================
// Each placeable item may carry a `buff` object that modifies focus-session
// math when the item is PLACED in the room. The buff system stacks across
// every placed item (multiplicative for *Mult, additive for *Bonus).
//
// Buff schema:
//   brainCellMult: 1.X       — multiplier on brain cells earned per session
//   auraBonus: integer       — flat aura added on every successful session
//   worldFocusBonus: integer — flat extra world-focus points per session
//   giveUpPenaltyMult: 0.X   — reduces the give-up world-focus penalty
//   doubleChance: 0..1       — chance to double the brain-cell reward
//
// Items priced with `priceAura` cost aura instead of brain cells.
const SHOP_ITEMS = [
  // POWERUPS — escalating cost = escalating buff value.
  //   Star 50  → 10% double chance (effective ≈ +5%)
  //   Coffee 80 → +12% cells
  //   Scroll 100 → +2 worldFocus
  //   Tonic 140 → +15% cells, +1 aura
  //   Hourglass 170 → +18% cells, +1 worldFocus
  //   Crystal 200 → +25% cells (best raw cell mult in powerups)
  { id: "star",      name: "Lucky Star",        icon: "ico-star",      price: 50,  cat: "powerup",  pos: "wall",
    buff: { doubleChance: 0.10 } },
  { id: "coffee",    name: "Brain Coffee",      icon: "ico-coffee",    price: 80,  cat: "powerup",  pos: "floor",
    buff: { brainCellMult: 1.12 } },
  { id: "scroll",    name: "Focus Scroll",      icon: "ico-scroll",    price: 100, cat: "powerup",  pos: "wall",
    buff: { worldFocusBonus: 2 } },
  { id: "tonic",     name: "Wisdom Tonic",      icon: "ico-tonic",     price: 140, cat: "powerup",  pos: "floor",
    buff: { brainCellMult: 1.15, auraBonus: 1 } },
  { id: "hourglass", name: "Time Hourglass",    icon: "ico-hourglass", price: 170, cat: "powerup",  pos: "floor",
    buff: { brainCellMult: 1.18, worldFocusBonus: 1 } },
  { id: "crystal",   name: "Focus Crystal",     icon: "ico-crystal",   price: 200, cat: "powerup",  pos: "floor",
    buff: { brainCellMult: 1.25 } },

  // SIDEKICKS — pets and helpers. Each row strictly better-or-equal than the one above.
  //   Worm 110 → +10% cells
  //   Cat 170 → +15% cells, +1 worldFocus
  //   Dog 220 → -50% give-up penalty
  //   Owl 260 → +25% cells
  //   Robot 340 → +20% cells, +2 aura, -25% give-up
  { id: "worm",      name: "Book Worm",         icon: "ico-worm",      price: 110, cat: "sidekick", pos: "floor",
    buff: { brainCellMult: 1.10 } },
  { id: "cat",       name: "Study Cat",         icon: "ico-cat",       price: 170, cat: "sidekick", pos: "floor",
    buff: { brainCellMult: 1.15, worldFocusBonus: 1 } },
  { id: "dog",       name: "Loyal Doggo",       icon: "ico-dog",       price: 220, cat: "sidekick", pos: "floor",
    buff: { brainCellMult: 1.12, giveUpPenaltyMult: 0.5 } },
  { id: "owl",       name: "Wise Owl",          icon: "ico-owl",       price: 260, cat: "sidekick", pos: "floor",
    buff: { brainCellMult: 1.25 } },
  { id: "robot",     name: "Helper Bot",        icon: "ico-robot",     price: 340, cat: "sidekick", pos: "floor",
    buff: { brainCellMult: 1.20, auraBonus: 2, giveUpPenaltyMult: 0.75 } },

  // RELICS — high-end. Strict value escalation by price.
  //   Banner 180 → +2 aura
  //   Compass 220 → +3 worldFocus
  //   Tome 280 → +25% cells, +1 worldFocus
  //   Sigil 320 → +20% cells, 15% double chance
  //   Shield 400 → -70% give-up penalty, +5% cells
  { id: "banner",    name: "Banner of Wisdom",  icon: "ico-banner",    price: 180, cat: "relic",    pos: "wall",
    buff: { auraBonus: 2 } },
  { id: "compass",   name: "Truth Compass",     icon: "ico-compass",   price: 220, cat: "relic",    pos: "floor",
    buff: { brainCellMult: 1.12, worldFocusBonus: 3 } },
  { id: "tome",      name: "Tome of Knowledge", icon: "ico-tome",      price: 280, cat: "relic",    pos: "floor",
    buff: { brainCellMult: 1.25, worldFocusBonus: 1 } },
  { id: "sigil",     name: "Sigil of Focus",    icon: "ico-sigil",     price: 320, cat: "relic",    pos: "wall",
    buff: { brainCellMult: 1.20, doubleChance: 0.15 } },
  { id: "shield",    name: "Anti-Scroll Shield",icon: "ico-shield",    price: 400, cat: "relic",    pos: "wall",
    buff: { brainCellMult: 1.20, giveUpPenaltyMult: 0.3 } },

  // DECOR — cheapest tier. Tiny per-item buff so heavy stacking doesn't break math.
  //   Plant 50 → +3% cells
  //   Trophy 60 → +3% cells
  //   Bulb 80 → +5% cells
  //   Lamp 100 → +6% cells
  //   Clock 130 → +2 worldFocus
  //   Window 160 → +8% cells, +1 worldFocus
  { id: "plant",     name: "Wisdom Plant",      icon: "ico-plant",     price: 50,  cat: "decor",    pos: "floor",
    buff: { brainCellMult: 1.03 } },
  { id: "trophy",    name: "Trophy",            icon: "ico-trophy",    price: 60,  cat: "decor",    pos: "floor",
    buff: { brainCellMult: 1.03 } },
  { id: "bulb",      name: "Idea Bulb",         icon: "ico-bulb",      price: 80,  cat: "decor",    pos: "wall",
    buff: { brainCellMult: 1.05 } },
  { id: "lamp",      name: "Cozy Lamp",         icon: "ico-lamp",      price: 100, cat: "decor",    pos: "floor",
    buff: { brainCellMult: 1.06 } },
  { id: "clock",     name: "Timekeeper",        icon: "ico-clock",     price: 130, cat: "decor",    pos: "wall",
    buff: { worldFocusBonus: 2 } },
  { id: "window",    name: "Window of Calm",    icon: "ico-window",    price: 160, cat: "decor",    pos: "wall",
    buff: { brainCellMult: 1.08, worldFocusBonus: 1 } },

  // PREMIUM (aura-priced) — endgame, very strong. Aura is hard-earned.
  //   Quantum Tonic 3 aura → +40% cells
  //   Aura Sigil 5 aura → +30% cells, +2 aura/session
  //   Neural Bot 8 aura → +40% cells, +3 worldFocus, -70% give-up
  { id: "premium_tonic",  name: "Quantum Tonic",  icon: "ico-tonic",   priceAura: 3, cat: "powerup",  pos: "floor",
    buff: { brainCellMult: 1.40 } },
  { id: "premium_sigil",  name: "Aura Sigil",     icon: "ico-sigil",   priceAura: 5, cat: "relic",    pos: "wall",
    buff: { brainCellMult: 1.30, auraBonus: 2 } },
  { id: "premium_robot",  name: "Neural Bot",     icon: "ico-robot",   priceAura: 8, cat: "sidekick", pos: "floor",
    buff: { brainCellMult: 1.40, giveUpPenaltyMult: 0.3, worldFocusBonus: 3 } },

  // OUTFITS
  { id: "skin_classic",   name: "Classic",       price: 0,    cat: "skin", skin: "classic"   },
  { id: "skin_detective", name: "Detective",     price: 200,  cat: "skin", skin: "detective" },
  { id: "skin_scholar",   name: "Scholar",       price: 250,  cat: "skin", skin: "scholar"   },
  { id: "skin_wizard",    name: "Wizard",        price: 300,  cat: "skin", skin: "wizard"    },
  { id: "skin_astronaut", name: "Astronaut",     price: 500,  cat: "skin", skin: "astronaut" },
  { id: "skin_sigma",     name: "Sigma Suit",    price: 800,  cat: "skin", skin: "sigma"     },
  { id: "skin_knight",    name: "Knight",        priceAura: 1, cat: "skin", skin: "knight"    },
  // New skins — MJ-inspired Pop Star, Bruce-Lee-inspired Martial Artist, neon DJ.
  { id: "skin_popstar",   name: "Pop Star",      priceAura: 2, cat: "skin", skin: "popstar"   },
  { id: "skin_martial",   name: "Martial Artist",priceAura: 2, cat: "skin", skin: "martial"   },
  { id: "skin_dj",        name: "Neon DJ",       priceAura: 4, cat: "skin", skin: "dj"       },
  // ===== EXTENDED HERO OUTFITS (auto-generated) =====
  { id: "skin_pirate", name: "Pirate", price: 350, cat: "skin", skin: "pirate" },
  { id: "skin_chef", name: "Chef", price: 200, cat: "skin", skin: "chef" },
  { id: "skin_police", name: "Police", price: 450, cat: "skin", skin: "police" },
  { id: "skin_soldier", name: "Soldier", price: 550, cat: "skin", skin: "soldier" },
  { id: "skin_skater", name: "Stunt Man", price: 400, cat: "skin", skin: "skater" },
  { id: "skin_cyclist", name: "Glider", price: 300, cat: "skin", skin: "cyclist" },
  { id: "skin_musician", name: "Musician", price: 400, cat: "skin", skin: "musician" },
  { id: "skin_hacker", name: "Hacker", price: 300, cat: "skin", skin: "hacker" },
  { id: "skin_vampire", name: "Vampire", price: 650, cat: "skin", skin: "vampire" },
  { id: "skin_ghost", name: "Ghost", price: 550, cat: "skin", skin: "ghost" },
  { id: "skin_robot", name: "Robot", price: 600, cat: "skin", skin: "robot" },
  { id: "skin_timetraveler", name: "Time Traveler", price: 700, cat: "skin", skin: "timetraveler" },
  { id: "skin_disco", name: "Disco Dancer", price: 400, cat: "skin", skin: "disco" },
  { id: "skin_punk", name: "Punk Rocker", price: 450, cat: "skin", skin: "punk" },
  { id: "skin_jobsstyle", name: "Magic Boy", priceAura: 2, cat: "skin", skin: "jobsstyle" },
  { id: "skin_ironstyle", name: "Iron Tycoon", priceAura: 3, cat: "skin", skin: "ironstyle" },
  { id: "skin_batstyle", name: "Night Vigilante", priceAura: 3, cat: "skin", skin: "batstyle" },
  { id: "skin_manofsteel", name: "Man of Steel", priceAura: 3, cat: "skin", skin: "manofsteel" },
  { id: "skin_spiderstyle", name: "Web Slinger", priceAura: 2, cat: "skin", skin: "spiderstyle" },
  { id: "skin_capstyle", name: "Star Captain", priceAura: 3, cat: "skin", skin: "capstyle" },
  { id: "skin_gokustyle", name: "Super Surge", priceAura: 6, cat: "skin", skin: "gokustyle" },
];

const ITEM_BY_ID = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]));
const VALID_ITEM_IDS = new Set(Object.keys(ITEM_BY_ID));

const _H = (typeof window !== "undefined" && window.Focusix7Helpers) || {};
const BANISH_BONUS_CELLS = _H.BANISH_BONUS_CELLS != null ? _H.BANISH_BONUS_CELLS : 50;
const BANISH_BONUS_AURA  = _H.BANISH_BONUS_AURA  != null ? _H.BANISH_BONUS_AURA  : 1;

const VILLAIN_TAUNTS = [
  "6-7 🤡",
  "skibidi?",
  "rizz check",
  "open the feed",
  "just one scroll",
  "low aura...",
  "you're cooked",
  "67 67 67",
  "doomscroll w me",
];

// ==================== STATE ====================
const DEFAULT_STATE = {
  brainCells: 0,
  aura: 0,
  heroName: "Mr. Interesting",
  skin: "classic",
  ownedItems: ["skin_classic"],
  placed: {},
  totalFocusMinutes: 0,
  sessionsCompleted: 0,
  worldFocus: 50,
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem("focusBean.v1");
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
    const saved = JSON.parse(raw);
    return migrateState({ ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...saved });
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

function migrateState(s) {
  if (_H.migrateState) {
    return _H.migrateState(s, { validItemIds: VALID_ITEM_IDS, defaultState: DEFAULT_STATE });
  }
  return s;
}

function saveState() {
  try { localStorage.setItem("focusBean.v1", JSON.stringify(state)); } catch (e) {}
}

// ==================== UTILS ====================
function $(sel)  { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

function toast(msg, ms = 1900) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add("hidden"), ms);
}

function modal({ title, text, input, confirm = "OK", cancel = "Cancel", onConfirm, onCancel }) {
  $("#modalTitle").textContent = title;
  $("#modalText").textContent = text || "";
  $("#modalConfirm").textContent = confirm;
  $("#modalCancel").textContent = cancel;
  const inp = $("#modalInput");
  if (input !== undefined) {
    inp.classList.remove("hidden");
    inp.value = input;
    inp.placeholder = "Enter a name";
    setTimeout(() => inp.focus(), 60);
  } else {
    inp.classList.add("hidden");
  }
  $("#modal").classList.remove("hidden");
  $("#modalConfirm").onclick = () => {
    $("#modal").classList.add("hidden");
    onConfirm && onConfirm(inp.value);
  };
  $("#modalCancel").onclick = () => {
    $("#modal").classList.add("hidden");
    onCancel && onCancel();
  };
}

// ==================== SVG BUILDERS ====================
function svgUse(id) {
  return `<svg viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet"><use href="#${id}"/></svg>`;
}

// Inline hero eyes — wrapped in a class="h-eyes" group so the blink
// animation scales ONLY the eyes (not the whole mask or face).
// Regular eyes (visible for non-masked skins).
const HERO_EYES = `<g class="h-eyes">
  <ellipse cx="86" cy="44" rx="2.5" ry="3" fill="#1a0a08"/>
  <ellipse cx="114" cy="44" rx="2.5" ry="3" fill="#1a0a08"/>
  <circle cx="87" cy="43" r="0.8" fill="white" opacity="0.9"/>
  <circle cx="115" cy="43" r="0.8" fill="white" opacity="0.9"/>
</g>`;

// Masked eye slits (used for the classic superhero — bigger white slits
// over the dark mask cloth, with the iris drawn inside each slit).
const HERO_MASK_EYES = `<g class="h-eyes h-mask-eyes">
  <ellipse cx="86" cy="44" rx="5.5" ry="3.5" fill="white" stroke="#0a0510" stroke-width="1.5"/>
  <ellipse cx="114" cy="44" rx="5.5" ry="3.5" fill="white" stroke="#0a0510" stroke-width="1.5"/>
  <ellipse cx="86" cy="44" rx="2.5" ry="2.8" fill="#1a0a08"/>
  <ellipse cx="114" cy="44" rx="2.5" ry="2.8" fill="#1a0a08"/>
  <circle cx="87" cy="43" r="0.8" fill="white" opacity="0.95"/>
  <circle cx="115" cy="43" r="0.8" fill="white" opacity="0.95"/>
</g>`;

// Inline hero arms — split into UPPER ARM (pivots at shoulder) + FOREARM
// (pivots at elbow). This lets each emote bend the elbow naturally rather
// than just rotating the whole arm at the shoulder.
//
// Shoulder anchors:  left (55, 92)   right (145, 92)
// Elbow anchors:     left (49, 130)  right (151, 130)
const HERO_ARM_L = `<g class="h-arm h-arm-l">
  <!-- upper arm: shoulder → elbow -->
  <path d="M55 92 Q42 96 38 112 L41 130 L60 130 L57 112 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
  <path d="M48 115 Q43 122 41 130" stroke="#0a0510" stroke-width="1.5" fill="none" opacity="0.55"/>
  <!-- forearm + fist pivot at the elbow -->
  <g class="h-forearm h-forearm-l">
    <path d="M41 130 L35 148 Q35 162 44 165 L56 165 Q62 158 60 148 L60 130 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M48 134 Q40 145 39 158" stroke="#0a0510" stroke-width="1.5" fill="none" opacity="0.55"/>
    <path d="M60 162 L32 162 Q28 168 30 175 Q34 180 42 180 L52 180 Q60 180 62 175 Z" fill="var(--bowtie-color, #c84a3a)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M60 162 L60 156 L32 156 L32 162" fill="var(--bowtie-color, #c84a3a)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M38 168 L52 168 M38 174 L52 174" stroke="#0a0510" stroke-width="1" opacity="0.5"/>
  </g>
</g>`;

const HERO_ARM_R = `<g class="h-arm h-arm-r">
  <!-- upper arm: shoulder → elbow -->
  <path d="M145 92 Q158 96 162 112 L159 130 L140 130 L143 112 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
  <path d="M152 115 Q157 122 159 130" stroke="#0a0510" stroke-width="1.5" fill="none" opacity="0.55"/>
  <!-- forearm + fist pivot at the elbow -->
  <g class="h-forearm h-forearm-r">
    <path d="M159 130 L165 148 Q165 162 156 165 L144 165 Q138 158 140 148 L140 130 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M152 134 Q160 145 161 158" stroke="#0a0510" stroke-width="1.5" fill="none" opacity="0.55"/>
    <path d="M140 162 L168 162 Q172 168 170 175 Q166 180 158 180 L148 180 Q140 180 138 175 Z" fill="var(--bowtie-color, #c84a3a)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M140 162 L140 156 L168 156 L168 162" fill="var(--bowtie-color, #c84a3a)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M148 168 L162 168 M148 174 L162 174" stroke="#0a0510" stroke-width="1" opacity="0.5"/>
  </g>
</g>`;

// Inline hero legs — split into THIGH (pivots at hip) + SHIN (pivots at knee).
//
// Hip anchors:   left (91, 178)  right (109, 178)
// Knee anchors:  left (92, 222)  right (108, 222)
const HERO_LEG_L = `<g class="h-leg h-leg-l">
  <!-- thigh: hip → knee -->
  <path d="M95 178 Q87 178 84 182 L86 222 L100 222 L99 178 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
  <path d="M88 188 Q86 205 86 222" stroke="var(--sweater-shadow, #1a4070)" stroke-width="1.5" fill="none" opacity="0.55"/>
  <!-- shin + boot pivot at the knee -->
  <g class="h-shin h-shin-l">
    <path d="M86 222 L78 268 Q78 273 83 273 L93 273 Q97 273 97 268 L100 222 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M85 232 Q82 250 81 265" stroke="var(--sweater-shadow, #1a4070)" stroke-width="1.5" fill="none" opacity="0.55"/>
    <path d="M99 248 L78 248 L72 270 Q72 274 76 274 L98 274 Q102 274 102 270 Z" fill="var(--bowtie-color, #c84a3a)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M99 254 L80 252" stroke="#0a0510" stroke-width="1.2" fill="none" opacity="0.5"/>
  </g>
</g>`;

const HERO_LEG_R = `<g class="h-leg h-leg-r">
  <!-- thigh: hip → knee -->
  <path d="M105 178 Q113 178 116 182 L114 222 L100 222 L101 178 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
  <path d="M112 188 Q114 205 114 222" stroke="var(--sweater-shadow, #1a4070)" stroke-width="1.5" fill="none" opacity="0.55"/>
  <!-- shin + boot pivot at the knee -->
  <g class="h-shin h-shin-r">
    <path d="M114 222 L122 268 Q122 273 117 273 L107 273 Q103 273 103 268 L100 222 Z" fill="var(--sweater, #2862a8)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M115 232 Q118 250 119 265" stroke="var(--sweater-shadow, #1a4070)" stroke-width="1.5" fill="none" opacity="0.55"/>
    <path d="M101 248 L122 248 L128 270 Q128 274 124 274 L102 274 Q98 274 98 270 Z" fill="var(--bowtie-color, #c84a3a)" stroke="#0a0510" stroke-width="2" stroke-linejoin="round"/>
    <path d="M101 254 L120 252" stroke="#0a0510" stroke-width="1.2" fill="none" opacity="0.5"/>
  </g>
</g>`;

const VILLAIN_ARM_L = `<g class="v-arm v-arm-l">
  <path d="M53 92 Q40 96 36 112 L32 148 Q32 162 42 165 L56 165 Q60 158 58 148 L55 112 Z" fill="#2a0640" stroke="#08041a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M48 116 Q40 130 38 145" stroke="#bf00ff" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M60 162 L32 162 Q28 168 30 175 Q34 180 42 180 L52 180 Q60 180 62 175 Z" fill="#100020" stroke="#08041a" stroke-width="2"/>
  <path d="M38 168 L52 168 M38 174 L52 174" stroke="#08041a" stroke-width="1" opacity="0.6"/>
</g>`;

const VILLAIN_ARM_R = `<g class="v-arm v-arm-r">
  <path d="M147 92 Q160 96 164 112 L168 148 Q168 162 158 165 L144 165 Q140 158 142 148 L145 112 Z" fill="#2a0640" stroke="#08041a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M152 116 Q160 130 162 145" stroke="#bf00ff" stroke-width="1" fill="none" opacity="0.5"/>
  <path d="M140 162 L168 162 Q172 168 170 175 Q166 180 158 180 L148 180 Q140 180 138 175 Z" fill="#100020" stroke="#08041a" stroke-width="2"/>
  <path d="M148 168 L162 168 M148 174 L162 174" stroke="#08041a" stroke-width="1" opacity="0.6"/>
</g>`;

// Per-skin accessory map for the EXTENDED 60 outfits. Each value lists which
// extra SVG symbol IDs to layer on top of the head + which existing
// glasses/hair/cape to reuse. The renderer reads this map AFTER the legacy
// hand-rolled rules above. Keys not listed get a sensible default (hair-classic
// + chest emblem) so any future skin doesn't look bald.
// Schema: hair, head[], glasses, emblem, fullmask, faceOverlay, hideEyes
//   hair        → optional hair symbol id; null = bald
//   head        → array of head accessory ids (rendered BEFORE eyes/glasses)
//   glasses     → optional glasses sprite id
//   emblem      → whether to add the chest shield
//   fullmask    → optional symbol id rendered AFTER eyes/glasses to fully cover the face
//   faceOverlay → optional symbol id that REPAINTS the face area (e.g. vampire white face)
//   hideEyes    → set true to skip the default eye sprite (disco's hair hides them anyway)
const SKIN_LAYERS = {
  chef:         { hair: "hair-classic", head: ["hat-chef"],        emblem: true },
  police:       { hair: "hair-classic", head: ["hat-police"],      emblem: true },
  soldier:      { hair: "hair-classic", head: ["hat-soldier"],     emblem: true },
  skater:       { hair: "hair-classic", head: ["hat-bandana"],     emblem: true },
  cyclist:      { hair: "hair-classic", head: ["hat-pilot"],       emblem: true },
  musician:     { hair: "hair-afro-up", head: [],                  glasses: "glasses-sunglasses", emblem: true },
  hacker:       { hair: "hair-mohawk",  head: [],                  glasses: "glasses-sunglasses", emblem: true },

  // Pirate gets a new hair (no front-of-face strands) + the tricorn + eyepatch.
  pirate:       { hair: "hair-pirate",  head: ["hat-pirate", "acc-eyepatch"], emblem: true },
  vampire:      { hair: "hair-classic", head: [],                  emblem: true,  faceOverlay: "face-vampire" },
  ghost:        { hair: null,           head: [],                  emblem: false, faceOverlay: "face-ghost", hideEyes: true },

  robot:        { hair: null,           head: ["helmet-robot"],    emblem: false },
  timetraveler: { hair: "hair-classic", head: ["acc-visor"],       emblem: true },

  // Disco's hair covers the face — no eyes / no glasses sprite per user request.
  disco:        { hair: "hair-afro",    head: [],                  emblem: true, hideEyes: true },
  punk:         { hair: "hair-mohawk",  head: [],                  glasses: "glasses-sunglasses", emblem: true },

  jobsstyle:    { hair: "hair-classic", head: [],                  glasses: "glasses-default", emblem: true },
  // Iron Tycoon and Web Slinger: FULL-FACE masks (rendered after eyes).
  ironstyle:    { hair: null,           head: [],                  emblem: true, fullmask: "mask-iron-full" },
  batstyle:     { hair: null,           head: ["mask-bat"],        emblem: true },
  manofsteel:   { hair: "hair-classic", head: [],                  emblem: true },
  spiderstyle:  { hair: null,           head: [],                  emblem: true, fullmask: "mask-spider-full" },
  // capstyle (Star Captain) is handled in the LEGACY branch with the full
  // hero mask — its visual was swapped with classic per user spec.
  gokustyle:    { hair: "hair-classic", head: [],                  emblem: false },
};

function buildHeroSvg(skin) {
  const layers = [];

  // Cape (drawn first so it sits behind the body). Every skin now wears one.
  layers.push(`<use href="#hero-cape" class="hero-cape-layer"/>`);

  // Legs — rendered BEFORE the body so the briefs / belt on hero-base hide
  // the top of the thighs. Each leg has separate thigh + shin groups so
  // hip and knee can rotate independently for emotes.
  layers.push(HERO_LEG_L);
  layers.push(HERO_LEG_R);

  // Body (without arms or legs)
  layers.push(`<use href="#hero-base"/>`);

  // Hair / Hat / Mask / Glasses / Emblem — head + chest accessories
  // ----- Legacy hand-rolled rules (original 10 skins) -----
  const showHair = ["detective", "scholar", "sigma", "popstar", "martial", "dj"];
  const legacyHandled = new Set([
    "classic", "detective", "scholar", "wizard", "astronaut",
    "sigma", "knight", "popstar", "martial", "dj",
    // Star Captain now uses the (former) classic look — full hero mask.
    "capstyle",
  ]);

  if (legacyHandled.has(skin)) {
    // Star Captain now appears as the OLD classic look: full hero mask cloth +
    // masked eye-slits + chest emblem. Classic appears as the OLD Star Captain
    // look: hair + small eye mask + chest emblem. (Visuals swapped per spec;
    // each skin keeps its OWN animation signature.)
    if (showHair.includes(skin) || skin === "classic") {
      const hairId = skin === "popstar" ? "hair-mjpop" : "hair-classic";
      layers.push(`<use href="#${hairId}"/>`);
    }
    if (skin === "detective") layers.push(`<use href="#hat-fedora"/>`);
    if (skin === "scholar")   layers.push(`<use href="#hat-mortarboard"/>`);
    if (skin === "wizard")    layers.push(`<use href="#hat-wizard"/>`);
    if (skin === "astronaut") layers.push(`<use href="#helmet-astronaut"/>`);
    if (skin === "knight")    layers.push(`<use href="#helmet-knight"/>`);
    if (skin === "capstyle") {
      // Full hero mask cloth (the former classic look).
      layers.push(`<use href="#hero-mask"/>`);
      layers.push(HERO_MASK_EYES);
    } else if (skin === "classic") {
      // Hair + regular eyes + the small superhero eye mask.
      layers.push(HERO_EYES);
      layers.push(`<use href="#mask-eye"/>`);
    } else {
      layers.push(HERO_EYES);
    }
    if (skin === "sigma" || skin === "popstar") layers.push(`<use href="#glasses-aviator"/>`);
    else if (skin === "dj")      layers.push(`<use href="#glasses-sunglasses"/>`);
    else if (skin === "scholar") layers.push(`<use href="#glasses-default"/>`);
    const skinsWithEmblem = ["classic", "detective", "scholar", "sigma", "astronaut", "popstar", "martial", "dj", "capstyle"];
    if (skinsWithEmblem.includes(skin)) layers.push(`<use href="#bowtie"/>`);
  } else {
    // ----- Extended outfits: drive everything from SKIN_LAYERS -----
    const cfg = SKIN_LAYERS[skin] || { hair: "hair-classic", head: [], emblem: true };
    // Face overlay (vampire white, ghost white) sits BEFORE the head/hair/eyes
    // so it repaints the face but doesn't obscure other accessories.
    if (cfg.faceOverlay) layers.push(`<use href="#${cfg.faceOverlay}"/>`);
    if (cfg.hair) layers.push(`<use href="#${cfg.hair}"/>`);
    (cfg.head || []).forEach(id => layers.push(`<use href="#${id}"/>`));
    if (!cfg.hideEyes) layers.push(HERO_EYES);
    if (cfg.glasses) layers.push(`<use href="#${cfg.glasses}"/>`);
    if (cfg.emblem) layers.push(`<use href="#bowtie"/>`);
    // Full-face mask LAST (after eyes/glasses) so it fully covers them.
    if (cfg.fullmask) layers.push(`<use href="#${cfg.fullmask}"/>`);
  }

  // Arms LAST — so when they rotate up during an emote they pass IN FRONT of
  // the mask / hat / helmet rather than behind them.
  layers.push(HERO_ARM_L);
  layers.push(HERO_ARM_R);

  return `<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet">${layers.join("")}</svg>`;
}

function buildVillainSvg() {
  // Arms rendered AFTER body so the raised 6-7 gesture passes in front of
  // the hair / chest panel / face.
  return `<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet">` +
    `<use href="#villain-base"/>` +
    VILLAIN_ARM_L +
    VILLAIN_ARM_R +
    `</svg>`;
}

// ==================== UI: NAV & SCREENS ====================
let currentScreen = "room";

function showScreen(name) {
  if (focusState && focusState.running && name !== "focus") {
    // Lock to the focus screen for the duration of the session.
    return;
  }
  currentScreen = name;
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#screen-" + name).classList.add("active");
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.screen === name));

  if (name === "shop") renderShop("all");
  if (name === "inventory") renderInventory();
  if (name === "edit") renderSkinPicker();
  if (name === "focus") syncFocusUI();
  if (name === "settings") renderSettings();
  // Outfit previews live in the Shop + Hero screens. Start the auto-emote
  // rotation when entering either, stop it everywhere else.
  if (typeof startOutfitPreviewEmoteLoop === "function") {
    if (name === "shop" || name === "edit") startOutfitPreviewEmoteLoop();
    else                                     stopOutfitPreviewEmoteLoop();
  }
}

$$(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

// Settings gear → open settings screen
const _settingsBtn = $("#settingsBtn");
if (_settingsBtn) {
  _settingsBtn.addEventListener("click", () => showScreen("settings"));
}

// ==================== UI: WALLET / STATS ====================
function renderWallet() {
  $("#brainCellsCount").textContent = state.brainCells;
  $("#auraCount").textContent = state.aura;
}

function renderStats() {
  $("#statSessions").textContent = state.sessionsCompleted;
  $("#statMinutes").textContent  = state.totalFocusMinutes;
  $("#statItems").textContent    = state.ownedItems.filter(id => {
    const it = ITEM_BY_ID[id];
    return it && it.cat !== "skin";
  }).length;
}

// ==================== UI: HERO ====================
function renderHero() {
  const heroEl = $("#hero");
  if (heroEl) {
    heroEl.setAttribute("data-skin", state.skin);
    heroEl.innerHTML = buildHeroSvg(state.skin);
  }
  const focusEl = $("#focusCharacter");
  if (focusEl) {
    focusEl.setAttribute("data-skin", state.skin);
    focusEl.innerHTML = buildHeroSvg(state.skin);
  }
  // Reflect the user's chosen hero name everywhere it appears: the room
  // panel label, the topbar brand title, and the world-focus meter pole.
  const name = state.heroName || "Mr. Interesting";
  const nm = $("#heroNameDisplay");
  if (nm) nm.textContent = name;
  const brand = $("#brandTitle");
  if (brand) brand.textContent = name;
  const meterPole = $("#meterHeroPole");
  if (meterPole) meterPole.textContent = name;
}

function renderVillain() {
  const v = $("#mr67");
  if (v) v.innerHTML = buildVillainSvg();
  const fv = $("#focusVillain");
  if (fv) fv.innerHTML = buildVillainSvg();
}

// ==================== UI: WORLD METER ====================
function renderMeter() {
  const v = Math.max(0, Math.min(100, state.worldFocus));
  $("#meterFill").style.width = v + "%";
  $("#meterValueText").textContent = `${v} / 100`;

  const meter = $("#worldMeter");
  meter.classList.remove("good", "neutral", "bad");
  const room = $("#room");
  room.classList.remove("corrupted", "meter-good", "meter-bad");

  if (v >= 70)      { meter.classList.add("good"); room.classList.add("meter-good"); }
  else if (v < 30)  { meter.classList.add("bad");  room.classList.add("meter-bad", "corrupted"); }
  else              { meter.classList.add("neutral"); }
}

// ==================== UI: ROOM ====================
function renderRoom() {
  // Items no longer render in the room — they're purely powerups that
  // activate on OWNERSHIP. We keep the #placedItems element for layout
  // stability but never populate it.
  const layer = $("#placedItems");
  if (layer) layer.innerHTML = "";
}

// Placement was removed — owning an item already activates its buff. This
// function is kept as a safe no-op so any stray legacy reference doesn't
// throw at runtime.
function startPlacing(itemId) {
  return;
}
// ==================== UI: SHOP ====================
function renderShop(category) {
  $$(".shop-tabs .tab").forEach(t => t.classList.toggle("selected", t.dataset.cat === category));
  const grid = $("#shopGrid");
  grid.innerHTML = "";
  // Skins are no longer browsable from the shop tab — they live exclusively
  // in the Hero outfit picker. So skins are filtered out everywhere here.
  // After filtering we sort so brain-cell items come first (in ascending
  // price order), followed by aura-priced items (also ascending).
  const items = SHOP_ITEMS
    .filter(i => i.cat !== "skin")
    .filter(i => category === "all" || i.cat === category)
    .sort(compareByCurrencyThenPrice);
  items.forEach(item => grid.appendChild(buildShopCard(item)));
  // The grid was just rebuilt — restart the outfit-preview emote rotation
  // so it picks up the freshly-rendered .outfit-preview elements.
  if (currentScreen === "shop" && typeof startOutfitPreviewEmoteLoop === "function") {
    startOutfitPreviewEmoteLoop();
  }
}

// Helper: which currency does this item cost in?
function itemCostCurrency(item) {
  if (item.priceAura != null) return { kind: "aura", amount: item.priceAura };
  return { kind: "brain", amount: item.price || 0 };
}

// Sort comparator: brain-cell items first (sorted by ascending price), then
// aura items (sorted by ascending aura price). Used by the shop AND the hero
// outfit picker so both screens follow the same ordering rule.
function compareByCurrencyThenPrice(a, b) {
  const aIsAura = a.priceAura != null ? 1 : 0;
  const bIsAura = b.priceAura != null ? 1 : 0;
  if (aIsAura !== bIsAura) return aIsAura - bIsAura;
  const aPrice = aIsAura ? a.priceAura : (a.price || 0);
  const bPrice = bIsAura ? b.priceAura : (b.price || 0);
  return aPrice - bPrice;
}

function canAfford(item) {
  const c = itemCostCurrency(item);
  return c.kind === "aura" ? state.aura >= c.amount : state.brainCells >= c.amount;
}

// Super Surge (gokustyle) is the ultimate flex outfit — only unlockable
// AFTER every other hero outfit has been owned. Returns null when the gate
// is satisfied or the item isn't gated; otherwise returns a string explaining
// what's still needed.
function unlockGateReason(item) {
  if (!item || item.skin !== "gokustyle") return null;
  // Count how many OTHER outfits the user still needs to own.
  const allSkins = SHOP_ITEMS.filter(i => i.cat === "skin" && i.skin !== "gokustyle");
  const missing = allSkins.filter(i => !state.ownedItems.includes(i.id));
  if (missing.length === 0) return null;
  return `Unlock after owning all ${allSkins.length} other outfits (${missing.length} still to go).`;
}

function buildShopCard(item) {
  const owned       = state.ownedItems.includes(item.id);
  const isSkin      = item.cat === "skin";
  const isCurrent   = isSkin && state.skin === item.skin;
  const lockReason  = !owned ? unlockGateReason(item) : null;
  const unaffordable = !owned && !canAfford(item);

  const el = document.createElement("div");
  el.className = "shop-item";
  if (isSkin) {
    if (isCurrent) el.classList.add("equipped");
    else if (owned) el.classList.add("owned");
  } else if (owned) {
    el.classList.add("owned");
  }
  if (lockReason) el.classList.add("locked");
  if (unaffordable && !lockReason) el.classList.add("unaffordable");
  if (item.buff) el.classList.add("has-buff");

  const iconHtml = isSkin
    ? `<div class="outfit-preview"><div class="character" data-skin="${item.skin}">${buildHeroSvg(item.skin)}</div></div>`
    : `<div class="item-icon-wrap">${svgUse(item.icon)}</div>`;

  let priceHtml;
  if (owned && isSkin) {
    priceHtml = isCurrent ? `<span>current</span>` : `<span>tap to equip</span>`;
  } else if (owned) {
    // Non-skin items only need ownership — their buff is live.
    priceHtml = `<span>buff active</span>`;
  } else if (lockReason) {
    // Hide the price entirely while the item is gated.
    priceHtml = `<span>🔒 locked</span>`;
  } else {
    const c = itemCostCurrency(item);
    const iconId = c.kind === "aura" ? "ico-bolt" : "ico-brain";
    priceHtml = `<svg class="price-icon"><use href="#${iconId}"/></svg><span>${c.amount}</span>`;
  }

  // Buff badge (if any) — a small chip showing what the item does.
  const buffBadge = item.buff ? `<div class="item-buff-chip">${formatBuff(item.buff)}</div>` : "";

  el.innerHTML = `
    ${iconHtml}
    <div class="item-name">${item.name}</div>
    ${buffBadge}
    <div class="item-price">${priceHtml}</div>
  `;

  el.addEventListener("click", () => onShopItemClick(item));
  return el;
}

// Render a buff object as a compact label.
function formatBuff(b) {
  const parts = [];
  if (b.brainCellMult && b.brainCellMult !== 1) {
    const pct = Math.round((b.brainCellMult - 1) * 100);
    parts.push(`+${pct}% 🧠`);
  }
  if (b.auraBonus)       parts.push(`+${b.auraBonus} ⚡`);
  if (b.worldFocusBonus) parts.push(`+${b.worldFocusBonus} ◆`);
  if (b.giveUpPenaltyMult && b.giveUpPenaltyMult < 1) {
    const pct = Math.round((1 - b.giveUpPenaltyMult) * 100);
    parts.push(`-${pct}% give-up`);
  }
  if (b.doubleChance) parts.push(`${Math.round(b.doubleChance * 100)}% ×2`);
  return parts.join(" • ") || "buff";
}

function onShopItemClick(item) {
  const owned = state.ownedItems.includes(item.id);

  if (owned) {
    if (item.cat === "skin") {
      state.skin = item.skin;
      saveState();
      renderHero();
      renderShop(currentShopCategory());
      renderSkinPicker();
      toast("Equipped " + item.name);
    } else {
      // Non-skin items only need to be OWNED to apply their buff. No
      // placement, no removal — tapping a purchased card just confirms
      // the buff is live.
      toast(item.name + " — buff active");
    }
    return;
  }

  // Locked outfit (e.g. Super Surge before the other 31 are owned).
  const lockReason = unlockGateReason(item);
  if (lockReason) {
    toast(lockReason, 3200);
    return;
  }

  if (!canAfford(item)) {
    const c = itemCostCurrency(item);
    toast(c.kind === "aura" ? "Not enough aura. Earn it from long sessions." : "Not enough brain cells! Focus more.");
    return;
  }

  const cost = itemCostCurrency(item);
  const costEmoji = cost.kind === "aura" ? "⚡" : "🧠";
  const haveAmt   = cost.kind === "aura" ? state.aura : state.brainCells;

  modal({
    title: "Buy " + item.name + "?",
    text: `Costs ${costEmoji} ${cost.amount}. You have ${costEmoji} ${haveAmt}.`,
    confirm: "Buy",
    onConfirm: () => {
      if (cost.kind === "aura") state.aura -= cost.amount;
      else                       state.brainCells -= cost.amount;
      state.ownedItems.push(item.id);
      saveState();
      renderWallet();
      renderStats();
      renderShop(currentShopCategory());
      toast("Got " + item.name + "!");
      if (item.cat === "skin") {
        state.skin = item.skin;
        saveState();
        renderHero();
        renderShop(currentShopCategory());
      } else {
        // Buff already live as of `state.ownedItems.push` above; no place-
        // ment prompt needed.
      }
    }
  });
}

function currentShopCategory() {
  const sel = $(".shop-tabs .tab.selected");
  return sel ? sel.dataset.cat : "all";
}

$$(".shop-tabs .tab").forEach(t => {
  t.addEventListener("click", () => renderShop(t.dataset.cat));
});

// ==================== UI: INVENTORY ====================
// Owned items act as PASSIVE powerups — owning them is enough to apply
// their buffs. The inventory is now a "loadout" view that shows each one
// and the buff it contributes. No place/remove actions any more.
function renderInventory() {
  const grid = $("#inventoryGrid");
  grid.innerHTML = "";
  const items = state.ownedItems
    .map(id => ITEM_BY_ID[id])
    .filter(i => i && i.cat !== "skin");
  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:40px 20px; color: var(--muted);">
        <svg style="width:56px;height:56px;opacity:0.6"><use href="#ico-box"/></svg>
        <p style="margin-top:10px;">No powerups yet — visit the shop!</p>
      </div>
    `;
    return;
  }
  items.forEach(item => {
    const el = document.createElement("div");
    el.className = "shop-item owned";
    if (item.buff) el.classList.add("has-buff");
    const buffBadge = item.buff ? `<div class="item-buff-chip">${formatBuff(item.buff)}</div>` : "";
    el.innerHTML = `
      <div class="item-icon-wrap">${svgUse(item.icon)}</div>
      <div class="item-name">${item.name}</div>
      ${buffBadge}
      <div class="item-price"><span>buff active</span></div>
    `;
    el.addEventListener("click", () => toast(item.name + " — buff active"));
    grid.appendChild(el);
  });
}

// ==================== UI: OUTFIT PICKER ====================
let _currentSkinTab = "all";  // "all" | "owned" | "buy"

function renderSkinPicker() {
  const grid = $("#skinGrid");
  grid.innerHTML = "";
  let skins = SHOP_ITEMS.filter(i => i.cat === "skin");
  if (_currentSkinTab === "owned") {
    skins = skins.filter(i => state.ownedItems.includes(i.id));
  } else if (_currentSkinTab === "buy") {
    skins = skins.filter(i => !state.ownedItems.includes(i.id));
  }
  // Brain-cell outfits first, ascending by price; then aura-priced outfits
  // ascending by aura cost. Same ordering rule as the shop tab.
  skins = skins.sort(compareByCurrencyThenPrice);
  if (skins.length === 0) {
    const msg = _currentSkinTab === "owned"
      ? "No outfits owned yet. Browse the Buy tab to find one."
      : _currentSkinTab === "buy"
        ? "You own every outfit. Master of fashion!"
        : "No outfits available.";
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${msg}</div>`;
    return;
  }
  skins.forEach(item => grid.appendChild(buildShopCard(item)));
  // Restart the outfit auto-emote loop now that the grid is fresh.
  if (currentScreen === "edit" && typeof startOutfitPreviewEmoteLoop === "function") {
    startOutfitPreviewEmoteLoop();
  }
}

// Wire the new sub-tab buttons (Owned / Buy / All) in the Hero screen.
$$("#skinTabs .tab").forEach(t => {
  t.addEventListener("click", () => {
    _currentSkinTab = t.dataset.skintab;
    $$("#skinTabs .tab").forEach(b => b.classList.toggle("selected", b === t));
    renderSkinPicker();
  });
});

// ==================== FOCUS TIMER ====================
let focusState = {
  durationMin: 25,
  running: false,
  remainingMs: 25 * 60 * 1000,
  endTime: 0,
  intervalId: null,
};

function syncFocusUI() {
  $$("#durationPicker .chip").forEach(c =>
    c.classList.toggle("selected", parseInt(c.dataset.min) === focusState.durationMin)
  );
  // Keep slider + readout in sync with whatever set focusState.durationMin.
  const slider = $("#durationSlider");
  if (slider && parseInt(slider.value) !== focusState.durationMin) {
    slider.value = String(focusState.durationMin);
  }
  const readout = $("#durationValue");
  if (readout) readout.textContent = String(focusState.durationMin);
  const focusEl = $("#focusCharacter");
  if (focusEl && !focusEl.innerHTML) focusEl.innerHTML = buildHeroSvg(state.skin);
  updateTimerDisplay();
  const slEl = $("#durationSlider");
  if (focusState.running) {
    $("#beginBtn").classList.add("hidden");
    $("#cancelBtn").classList.remove("hidden");
    $("#durationPicker").style.opacity = "0.4";
    $("#durationPicker").style.pointerEvents = "none";
    if (slEl) slEl.disabled = true;
  } else {
    $("#beginBtn").classList.remove("hidden");
    $("#cancelBtn").classList.add("hidden");
    $("#durationPicker").style.opacity = "1";
    $("#durationPicker").style.pointerEvents = "auto";
    if (slEl) slEl.disabled = false;
  }
}

function updateTimerDisplay() {
  const ms = focusState.running
    ? Math.max(0, focusState.endTime - Date.now())
    : focusState.durationMin * 60 * 1000;
  $("#timerText").textContent = _H.formatTimer ? _H.formatTimer(ms)
    : `${String(Math.floor(Math.ceil(ms/1000)/60)).padStart(2,"0")}:${String(Math.ceil(ms/1000)%60).padStart(2,"0")}`;
  if (focusState.running) {
    $("#timerSub").textContent = "stay focused — every minute weakens Mr. 67";
  } else {
    const bonus = focusState.durationMin >= 60 ? " + 1 Aura" : "";
    $("#timerSub").textContent = `pick a duration — earn ${focusState.durationMin} brain cells${bonus}`;
  }
}

$$("#durationPicker .chip").forEach(c => {
  c.addEventListener("click", () => {
    if (focusState.running) return;
    focusState.durationMin = parseInt(c.dataset.min);
    syncFocusUI();
  });
});

// Slider drives the same focusState.durationMin. We listen on `input` so the
// readout updates while dragging, plus `change` for a final settle.
const _durationSlider = $("#durationSlider");
if (_durationSlider) {
  function applySliderValue() {
    if (focusState.running) return;
    let v = parseInt(_durationSlider.value, 10);
    if (isNaN(v)) v = 25;
    // Snap to 5-minute increments and clamp to [5, 120].
    v = Math.round(v / 5) * 5;
    v = Math.max(5, Math.min(120, v));
    focusState.durationMin = v;
    const readout = $("#durationValue");
    if (readout) readout.textContent = String(v);
    // Update the CSS fill percentage so the cyan track grows with the value.
    const pct = ((v - 5) / (120 - 5)) * 100;
    _durationSlider.style.setProperty("--slider-progress", pct + "%");
    updateTimerDisplay();
  }
  _durationSlider.addEventListener("input", applySliderValue);
  _durationSlider.addEventListener("change", applySliderValue);
  // Set initial fill so the track reflects the default 25-min position.
  applySliderValue();
}


$("#beginBtn").addEventListener("click", startFocus);
$("#cancelBtn").addEventListener("click", () => {
  modal({
    title: "Surrender to Mr. 67?",
    text: "Mr. 67 will gain ground. You'll get no brain cells for this battle.",
    confirm: "Surrender",
    cancel: "Keep fighting",
    onConfirm: () => endFocus(false),
  });
});
$("#startFocusBtn").addEventListener("click", () => showScreen("focus"));
$("#backFromFocus").addEventListener("click", () => {
  if (focusState.running) {
    toast("Finish the battle first!");
    return;
  }
  showScreen("room");
});

function promptModal(opts) {
  return new Promise(resolve => {
    modal(Object.assign({}, opts, {
      onConfirm: (val) => resolve({ ok: true, value: val }),
      onCancel:  ()    => resolve({ ok: false }),
    }));
  });
}

async function ensureFocusPermissions() {
  const bridge = window.NativeBridge;
  if (!bridge || !bridge.isNative || !bridge.isNative()) return { ok: true, native: false };

  const seenExplainer = localStorage.getItem("focusix7.lockExplainerSeen") === "1";
  if (!seenExplainer) {
    const r = await promptModal({
      title: "How Focus Lock works",
      text:
        "When a focus session is running, Focusix7 hides every other screen of the app and blocks other apps " +
        "from opening. If you try to leave, we redirect you back. This needs two one-time grants — " +
        "we'll walk you through them now.",
      confirm: "Continue",
      cancel: "Not now",
    });
    if (!r.ok) return { ok: false };
    localStorage.setItem("focusix7.lockExplainerSeen", "1");
  }

  // 1) Display-over-other-apps (SYSTEM_ALERT_WINDOW)
  let perms = await bridge.getPermissions();
  if (!perms.overlay) {
    const r = await promptModal({
      title: "Allow display over other apps",
      text:
        "Focusix7 needs to draw an overlay on top of other apps so it can redirect you back. " +
        "We'll open Settings — toggle 'Allow display over other apps' on, then come back here.",
      confirm: "Open Settings",
      cancel: "Skip for now",
    });
    if (r.ok) {
      await bridge.requestOverlayPermission();
      perms = await bridge.getPermissions();
    }
  }

  // 2) Accessibility service (the actual blocker)
  if (!perms.accessibility) {
    const r = await promptModal({
      title: "Enable the Focus Blocker",
      text:
        "Find 'Focusix7 Focus Blocker' in the Accessibility list and turn it on. " +
        "It only reads the package name of the foreground app — no screen content, no keystrokes. " +
        "It does nothing when no focus session is running.",
      confirm: "Open Accessibility",
      cancel: "Skip for now",
    });
    if (r.ok) {
      await bridge.openAccessibilitySettings();
      // The user is now in Settings; they'll come back manually. We re-check below.
      perms = await bridge.getPermissions();
    }
  }

  // 3) Notifications (optional but improves the experience)
  if (!perms.notifications) {
    const r = await promptModal({
      title: "Allow focus notifications?",
      text:
        "An ongoing notification shows the timer and keeps the OS from killing the session in the background. " +
        "Optional — focus still works without it.",
      confirm: "Open Settings",
      cancel: "Skip",
    });
    if (r.ok) {
      await bridge.openNotificationSettings();
      perms = await bridge.getPermissions();
    }
  }

  // If overlay or accessibility is still missing, warn that lock will be partial.
  if (!perms.overlay || !perms.accessibility) {
    const r = await promptModal({
      title: "Start without full lock?",
      text:
        "Focusix7 will still hide its own screens and start the timer, but other apps won't be blocked. " +
        "You can grant the missing permissions any time from this screen.",
      confirm: "Start anyway",
      cancel: "Not yet",
    });
    if (!r.ok) return { ok: false };
  }

  return { ok: true, native: true, perms };
}

async function startFocus() {
  if (focusState.running) return;

  const gate = await ensureFocusPermissions();
  if (!gate.ok) return;

  focusState.running = true;
  focusState.remainingMs = focusState.durationMin * 60 * 1000;
  focusState.endTime = Date.now() + focusState.remainingMs;
  document.body.classList.add("focus-active");
  syncFocusUI();
  tick();
  focusState.intervalId = setInterval(tick, 250);
  showHeroSpeech("Books out! Mr. 67 is shaking 📚");

  const bridge = window.NativeBridge;
  if (bridge && bridge.isNative && bridge.isNative()) {
    try {
      const res = await bridge.requestFocusLock(focusState.durationMin, "Focus battle vs Mr. 67");
      updateLockBadge(!!(res && (res.blockerActive || res.inLockTaskMode || res.lockRequested)));
    } catch (_) { updateLockBadge(false); }
  }
}

function updateLockBadge(locked) {
  const badge = document.getElementById("lockBadge");
  if (!badge) return;
  badge.classList.toggle("hidden", !locked);
}

function tick() {
  if (!focusState.running) return;
  const remaining = focusState.endTime - Date.now();
  if (remaining <= 0) {
    finishSuccess();
    return;
  }
  updateTimerDisplay();
}

function finishSuccess() {
  awardBrainCells(focusState.durationMin);
  endFocus(true);
}

/**
 * Plays the victory-attack sequence: Mr. Interesting dashes from the left,
 * lands a punch on Mr. 67, the POW! burst pops, then both characters settle.
 * Once finished, `onDone` is called so the success modal can pop on top.
 *
 * Defensive: if anything goes wrong or the room element isn't around (e.g.
 * during a jsdom integration test that never paints), we still invoke
 * `onDone` so the modal pipeline keeps moving and no test gets stuck.
 */
function playVictoryAttack(onDone) {
  // Switch to the room so both characters are visible.
  showScreen("room");

  const room = $("#room");
  const pow = $("#powBurst");

  // No room element (only happens in extreme cases / tests) — just finish.
  if (!room) {
    try { onDone && onDone(); } catch (_) {}
    return;
  }

  // Reset any prior animation state in case the attack was running already.
  room.classList.remove("victory-attack");
  if (pow) {
    pow.classList.remove("playing");
    pow.classList.add("hidden");
  }

  // Reflow to make sure the animation restarts cleanly when we re-add.
  void room.offsetWidth;

  room.classList.add("victory-attack");

  // POW! burst at ~350ms in (right after the hero finishes his dash).
  setTimeout(() => {
    if (pow) {
      pow.classList.remove("hidden");
      pow.classList.add("playing");
    }
  }, 350);

  // Hide the POW burst once the keyframe pop is finished.
  setTimeout(() => {
    if (pow) {
      pow.classList.remove("playing");
      pow.classList.add("hidden");
    }
  }, 1100);

  // Full sequence ends a hair past 1.45s; call onDone so the modal can show.
  setTimeout(() => {
    room.classList.remove("victory-attack");
    try { onDone && onDone(); } catch (_) {}
  }, 1500);
}

function getActiveBuffs() {
  if (_H.computeBuffs) return _H.computeBuffs(state, ITEM_BY_ID);
  return { brainCellMult: 1, auraBonus: 0, worldFocusBonus: 0, giveUpPenaltyMult: 1, doubleChance: 0 };
}

function awardBrainCells(minutes) {
  const buffs = getActiveBuffs();
  const res = _H.applyFocusReward
    ? _H.applyFocusReward(state, minutes, buffs)
    : { banished: false };
  if (res.banished) focusState.banishedThisSession = true;
  // Surface the boost in the hero's victory speech if buffs were active.
  if (res.awardedCells && res.awardedCells > minutes) {
    focusState.lastBoostedCells = res.awardedCells;
  }
  saveState();
  renderWallet();
  renderStats();
}

function endFocus(success) {
  focusState.running = false;
  clearInterval(focusState.intervalId);
  focusState.intervalId = null;
  document.body.classList.remove("focus-active");
  syncFocusUI();

  if (window.NativeBridge && window.NativeBridge.isNative && window.NativeBridge.isNative()) {
    window.NativeBridge.releaseFocusLock().catch(() => {});
    updateLockBadge(false);
  }

  if (success) {
    if (focusState.banishedThisSession) {
      focusState.banishedThisSession = false;
      if (_H.applyBanishReward) _H.applyBanishReward(state);
      else { state.brainCells += BANISH_BONUS_CELLS; state.aura += BANISH_BONUS_AURA; state.worldFocus = 50; }
      saveState();
      renderWallet();
      renderStats();
      renderMeter();

      // First the punch lands, then Mr. 67's banishment fades him out, then
      // the celebration modal pops. Order: attack → banishment → modal.
      playVictoryAttack(() => {
        const villainEl = $("#mr67");
        if (villainEl) {
          villainEl.classList.add("banished");
          setTimeout(() => villainEl.classList.remove("banished"), 1500);
        }
        showHeroSpeech("Mr. 67 banished! ✨");
        modal({
          title: "Mr. 67 banished! 🎉",
          text: `The world is saved — for now. You earned a bonus ${BANISH_BONUS_CELLS} 🧠 brain cells and ${BANISH_BONUS_AURA} ⚡ aura. The meter resets — a new battle begins.`,
          confirm: "Onward",
          cancel: "Spend reward",
          onConfirm: () => showScreen("room"),
          onCancel: () => showScreen("shop"),
        });
      });
    } else {
      renderMeter();
      // Standard victory: hero dashes in, lands the blow on Mr. 67, then
      // the modal appears with the rewards summary.
      playVictoryAttack(() => {
        showHeroSpeech("Brilliant! 🎉");
        const longBonus = focusState.durationMin >= 60 ? " and 1 Aura" : "";
        modal({
          title: "Victory!",
          text: `Mr. 67 retreats. You earned ${focusState.durationMin} brain cells${longBonus}. The world grows brighter.`,
          confirm: "Onward",
          cancel: "Spend",
          onConfirm: () => showScreen("room"),
          onCancel: () => showScreen("shop"),
        });
      });
    }
  } else {
    if (_H.applyGiveUp) _H.applyGiveUp(state, getActiveBuffs());
    else state.worldFocus = Math.max(0, state.worldFocus - 10);
    saveState();
    const heroEl = $("#hero");
    if (heroEl) {
      heroEl.classList.add("sad");
      setTimeout(() => heroEl.classList.remove("sad"), 4000);
    }
    const villainEl = $("#mr67");
    if (villainEl) {
      villainEl.classList.add("laughing");
      setTimeout(() => villainEl.classList.remove("laughing"), 2400);
    }
    showHeroSpeech("Aww... 😢");
    showVillainSpeech("6-7 😈", 2800);
    showScreen("room");
    renderMeter();
    toast("Mr. 67 grew stronger. Next time!", 2800);
  }
}

// ==================== SPEECH BUBBLES ====================
function showHeroSpeech(text, ms = 2500) {
  const b = $("#heroSpeech");
  b.textContent = text;
  b.classList.remove("hidden");
  clearTimeout(showHeroSpeech._t);
  showHeroSpeech._t = setTimeout(() => b.classList.add("hidden"), ms);
}

function showVillainSpeech(text, ms = 2600) {
  const b = $("#villainSpeech");
  b.textContent = text;
  b.classList.remove("hidden");
  clearTimeout(showVillainSpeech._t);
  showVillainSpeech._t = setTimeout(() => b.classList.add("hidden"), ms);
}

function scheduleVillainTaunt() {
  const delayMs = 30000 + Math.random() * 30000;
  setTimeout(() => {
    if (currentScreen === "room" && state.worldFocus < 70 && !focusState.running) {
      const phrase = VILLAIN_TAUNTS[Math.floor(Math.random() * VILLAIN_TAUNTS.length)];
      showVillainSpeech(phrase, 2400);
    }
    scheduleVillainTaunt();
  }, delayMs);
}

// ==================== EMOTES & GESTURES ====================
const HERO_EMOTES = ["wave", "flex", "power"];
// Per-skin signature emotes — picked whenever the user taps the hero and
// also driven in shop/hero outfit previews so each costume gets to show off.
// Each emote uses a unique combination of shoulders, elbows, hips, knees +
// body motion — see styles.css "CREATIVE PER-SKIN EMOTES" for the keyframes.
const SKIN_SIGNATURE_EMOTE = {
  classic:   "classic-pose",
  detective: "detective-point",
  scholar:   "scholar-eureka",
  wizard:    "wizard-cast",
  astronaut: "astro-float",
  sigma:     "sigma-crossed",
  knight:    "knight-strike",
  popstar:   "popstar-heel",
  martial:   "martial-kick",
  dj:        "dj-roll",
  pirate: "sig-pirate",
  chef: "sig-chef",
  police: "sig-police",
  soldier: "sig-soldier",
  skater: "sig-skater",
  cyclist: "sig-cyclist",
  musician: "sig-musician",
  hacker: "sig-hacker",
  vampire: "sig-vampire",
  ghost: "sig-ghost",
  robot: "sig-robot",
  timetraveler: "sig-timetraveler",
  disco: "sig-disco",
  punk: "sig-punk",
  jobsstyle: "sig-jobsstyle",
  ironstyle: "sig-ironstyle",
  batstyle: "sig-batstyle",
  manofsteel: "sig-manofsteel",
  spiderstyle: "sig-spiderstyle",
  capstyle: "sig-capstyle",
  gokustyle: "sig-gokustyle",



};
// Every emote class we know about — used when clearing prior emote state
// from a character element before triggering the next one.
const ALL_EMOTE_CLASSES = [
  "emote-wave", "emote-flex", "emote-power",
  "emote-classic-pose", "emote-detective-point", "emote-scholar-eureka",
  "emote-wizard-cast", "emote-astro-float", "emote-sigma-crossed",
  "emote-knight-strike", "emote-popstar-heel", "emote-martial-kick",
  "emote-dj-roll",
  "emote-sig-pirate",
  "emote-sig-chef",
  "emote-sig-police",
  "emote-sig-soldier",
  "emote-sig-skater",
  "emote-sig-cyclist",
  "emote-sig-musician",
  "emote-sig-hacker",
  "emote-sig-vampire",
  "emote-sig-ghost",
  "emote-sig-robot",
  "emote-sig-timetraveler",
  "emote-sig-disco",
  "emote-sig-punk",
  "emote-sig-jobsstyle",
  "emote-sig-ironstyle",
  "emote-sig-batstyle",
  "emote-sig-manofsteel",
  "emote-sig-spiderstyle",
  "emote-sig-capstyle",
  "emote-sig-gokustyle",
];
function clearAllEmoteClasses(el) {
  if (!el || !el.classList) return;
  for (const c of ALL_EMOTE_CLASSES) el.classList.remove(c);
}
const HERO_EMOTE_QUIPS = {
  wave:               ["Stay focused! 👋", "Got this!", "Hey there!", "Onwards!"],
  flex:               ["Brain gains! 💪", "Look at these stats!", "Pure focus energy!"],
  power:              ["Mr. 67 has no chance.", "Focus mode: armed.", "I am the firewall."],
  "classic-pose":     ["Justice prevails!", "I am the firewall.", "Up, up, and focused!"],
  "detective-point":  ["Elementary.", "Case closed.", "Aha — a clue!"],
  "scholar-eureka":   ["Eureka!", "I've got it!", "Knowledge is power."],
  "wizard-cast":      ["By the focus arcane!", "Abracadabra-cells!", "Magic time."],
  "astro-float":      ["Houston, we have focus.", "Weightless.", "One small focus..."],
  "sigma-crossed":    ["Mediocrity loathes me.", "Grindset.", "Stay sharp."],
  "knight-strike":    ["For the realm!", "Vanquish distraction!", "Sharp as steel."],
  "popstar-heel":     ["Hee hee!", "Smooth criminal.", "Annie, are you okay?"],
  "martial-kick":     ["WACHAAA!", "Be water.", "Hi-yah!"],
  "dj-roll":          ["Drop the beat!", "Wikki wikki.", "Let it rip."],
  // ===== Extended outfits (sig-<skin> matches SKIN_SIGNATURE_EMOTE) =====
  // Common (brain-cell priced)
  "sig-pirate":       ["Arrr, mateys!", "Hoist the focus flag!", "Yarr, no distractions!", "X marks the brain."],
  "sig-chef":         ["Bon appétit!", "Mama mia!", "Cooked to perfection.", "Order up — fresh focus!"],
  "sig-police":       ["Stop right there!", "Focus license, please.", "Hands where I can see 'em.", "By the badge!"],
  "sig-soldier":      ["Attention!", "Reporting for duty.", "Sir, yes sir!", "Mission: focus."],
  "sig-skater":       ["Sick trick!", "Eat my dust!", "Risk it for the biscuit!", "No fear, all focus."],
  "sig-cyclist":      ["Lift off!", "Catch the breeze!", "Wings of focus.", "Gliding above the noise."],
  "sig-musician":     ["Hit it!", "Feel the rhythm!", "Music to my cells.", "Let's jam!"],
  "sig-hacker":       ["I'm in.", "Bypassing distraction.exe", "Root access: focus.", "Hack the planet."],
  "sig-vampire":      ["I vant to focus.", "Eternally awake.", "Sun? Who needs it.", "Bleh-bleh-bleh!"],
  "sig-ghost":        ["Boo!", "Spooky focus hours.", "I see dead distractions.", "Haunting your study."],
  "sig-robot":        ["BEEP. BOOP. FOCUS.", "Running focus.exe", "All systems nominal.", "01100110 01101111 01100011 01110101 01110011"],
  "sig-timetraveler": ["Great Scott!", "Time bends to focus.", "I've seen tomorrow.", "Where we're going — we don't need distractions."],
  "sig-disco":        ["Saturday night focus!", "Boogie down!", "Feel the funk!", "Stayin' alive, stayin' focused."],
  "sig-punk":         ["Anarchy in the focus!", "No future for distractions!", "Smash the algorithm!", "Loud and proud."],
  // Persona / aura-priced
  "sig-jobsstyle":    ["One more thing...", "Insanely focused.", "Stay hungry, stay focused.", "Think different."],
  "sig-ironstyle":    ["I am Iron-Focused.", "Building a suit of armour.", "Genius. Billionaire. Focused.", "Power up."],
  "sig-batstyle":     ["I am the shadows.", "I am vengeance.", "The night belongs to focus.", "I'm always watching."],
  "sig-manofsteel":   ["Up, up, and focused!", "Truth, justice, and the focus way.", "I can fly.", "Hope is the focus."],
  "sig-spiderstyle":  ["Friendly neighborhood focuser.", "With great focus comes great results.", "My spider-sense is tingling!", "Web-slingin' through the to-do list."],
  "sig-capstyle":     ["I can do this all day.", "On your left.", "I'm with you till the end of the focus.", "Avengers, focus up!"],
  "sig-gokustyle":    ["KAAA-MEHHH-HA!", "Surging beyond limits!", "Power level: rising.", "It's over 9000!"],
};
const VILLAIN_GESTURE_QUIPS = [
  "Six… seven!", "6-7! 6-7!", "Six seven 🤡",
  "67! 67!", "Six… SEVEN!", "67 67 67!",
  "Six seven six seven!", "SIX… SEVEN!"
];

function triggerHeroEmote(forced) {
  const heroEl = $("#hero");
  if (!heroEl) return;
  // Don't interrupt focus mode or focus screen interactions
  if (focusState && focusState.running) return;
  // Mix the universal emotes with the current skin's signature emote so the
  // wave/flex/power rotation isn't repetitive once the user is in a costume.
  let emote;
  if (forced) {
    emote = forced;
  } else {
    const skinSig = SKIN_SIGNATURE_EMOTE[state.skin];
    const choices = skinSig ? HERO_EMOTES.concat([skinSig]) : HERO_EMOTES.slice();
    emote = choices[Math.floor(Math.random() * choices.length)];
  }
  // Reset any prior animation classes
  clearAllEmoteClasses(heroEl);
  // Force reflow so the animation actually restarts
  void heroEl.offsetWidth;
  heroEl.classList.add("emote-" + emote, "tapped");
  setTimeout(() => heroEl.classList.remove("tapped"), 620);
  setTimeout(() => heroEl.classList.remove("emote-" + emote), 2400);
  // Optional speech
  const quips = HERO_EMOTE_QUIPS[emote] || [];
  if (quips.length) {
    showHeroSpeech(quips[Math.floor(Math.random() * quips.length)], 1800);
  }
}

function triggerVillain67Gesture(quiet) {
  const v = $("#mr67");
  if (!v) return;
  if (focusState && focusState.running) return;
  v.classList.remove("gesture-67");
  void v.offsetWidth;
  v.classList.add("gesture-67", "tapped");
  setTimeout(() => v.classList.remove("tapped"), 620);
  setTimeout(() => v.classList.remove("gesture-67"), 3100);
  if (!quiet) {
    const quip = VILLAIN_GESTURE_QUIPS[Math.floor(Math.random() * VILLAIN_GESTURE_QUIPS.length)];
    showVillainSpeech(quip, 2200);
  }
}

// Tap handlers on the room characters
(function setupCharacterTaps() {
  const hero = $("#hero");
  const villain = $("#mr67");
  if (hero) {
    hero.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerHeroEmote();
    });
  }
  if (villain) {
    villain.addEventListener("click", (e) => {
      e.stopPropagation();
      triggerVillain67Gesture();
    });
  }
  // The focus-screen character also gets tap → wave
  const focusHero = $("#focusCharacter");
  if (focusHero) {
    focusHero.addEventListener("click", (e) => {
      e.stopPropagation();
      // Don't show speech on focus screen — just animate
      focusHero.classList.remove("emote-wave");
      void focusHero.offsetWidth;
      focusHero.classList.add("emote-wave");
      setTimeout(() => focusHero.classList.remove("emote-wave"), 2400);
    });
  }
})();

// Auto-loop: Mr. 67 does the "6 7" gesture frequently on the room screen.
function scheduleVillain67Gesture() {
  const delayMs = 12000 + Math.random() * 14000; // every 12–26 seconds
  setTimeout(() => {
    if (currentScreen === "room" && !focusState.running) {
      triggerVillain67Gesture(Math.random() < 0.3); // ~30% silent (no speech)
    }
    scheduleVillain67Gesture();
  }, delayMs);
}

// ---- OUTFIT-PREVIEW AUTO-EMOTE LOOP ----
// In the Shop + Hero outfit pickers, every mini-character should be alive at
// the SAME time — each performing its own unique signature emote, all
// playing simultaneously so the cards bounce together like a choreographed
// dance floor. We loop the whole batch on a fixed cycle.
let _outfitEmoteTimer = null;
const OUTFIT_EMOTE_HOLD_MS = 2900;   // longest emote (martial jump kick) is 2.4s
const OUTFIT_EMOTE_GAP_MS  = 900;    // brief rest so the loop feels natural
function stopOutfitPreviewEmoteLoop() {
  if (_outfitEmoteTimer) { clearTimeout(_outfitEmoteTimer); _outfitEmoteTimer = null; }
  $$(".outfit-preview .character").forEach(el => {
    clearAllEmoteClasses(el);
    el.classList.remove("in-emote");
  });
}
function startOutfitPreviewEmoteLoop() {
  stopOutfitPreviewEmoteLoop();
  function tickAll() {
    const previews = $$(".outfit-preview .character");
    if (previews.length === 0) {
      _outfitEmoteTimer = setTimeout(tickAll, 800);
      return;
    }
    // Fire every preview's signature emote AT THE SAME TIME.
    previews.forEach(el => {
      const skin = el.dataset.skin || "classic";
      const emote = SKIN_SIGNATURE_EMOTE[skin] || "wave";
      clearAllEmoteClasses(el);
      el.classList.remove("in-emote");
      // Reflow so the CSS animation restarts cleanly each cycle.
      void el.offsetWidth;
      el.classList.add("emote-" + emote, "in-emote");
    });
    // Drop the classes after the emote keyframes finish so the next cycle
    // can re-add them and restart the animation.
    setTimeout(() => {
      previews.forEach(el => {
        clearAllEmoteClasses(el);
        el.classList.remove("in-emote");
      });
    }, OUTFIT_EMOTE_HOLD_MS);
    _outfitEmoteTimer = setTimeout(tickAll, OUTFIT_EMOTE_HOLD_MS + OUTFIT_EMOTE_GAP_MS);
  }
  tickAll();
}

// Auto-loop: Mr. Interesting does occasional emotes too (less frequent).
function scheduleHeroEmote() {
  const delayMs = 25000 + Math.random() * 25000; // every 25–50 seconds
  setTimeout(() => {
    if (currentScreen === "room" && !focusState.running) {
      triggerHeroEmote();
    }
    scheduleHeroEmote();
  }, delayMs);
}

// ==================== SETTINGS / UNBLOCK LIST ====================
// Storage shape: { allowedPackages: ["com.whatsapp", "com.spotify.music", ...] }
// The user picks apps directly from the on-device installed list (via the
// native plugin), so we no longer carry a hard-coded preset table.
const SETTINGS_KEY = "focusix7.settings.v1";

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { allowedPackages: [] };
    const parsed = JSON.parse(raw);
    let allowedPackages = Array.isArray(parsed.allowedPackages)
      ? parsed.allowedPackages.slice() : [];
    // Migration: bring forward any v0 customPackages users had saved.
    if (Array.isArray(parsed.customPackages)) {
      for (const p of parsed.customPackages) {
        if (typeof p === "string" && p && !allowedPackages.includes(p)) {
          allowedPackages.push(p);
        }
      }
    }
    return { allowedPackages };
  } catch (_) {
    return { allowedPackages: [] };
  }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({
    allowedPackages: Array.isArray(s.allowedPackages) ? s.allowedPackages : []
  })); } catch (_) {}
}

/** Send the user's current allowed-packages list to native SharedPreferences
 *  so the AccessibilityService reads the up-to-date list. */
async function pushUnblockListToNative() {
  const s = loadSettings();
  const arr = (s.allowedPackages || []).slice();
  try {
    if (window.NativeBridge && NativeBridge.setUnblockList) {
      await NativeBridge.setUnblockList(arr);
    }
  } catch (e) { console.warn("setUnblockList failed:", e); }
  return arr;
}

// Cache the installed-apps list so we don't query native every time the
// settings screen / picker re-renders.
let _installedAppsCache = null;
async function loadInstalledApps(forceRefresh) {
  if (_installedAppsCache && !forceRefresh) return _installedAppsCache;
  try {
    if (window.NativeBridge && NativeBridge.listInstalledApps) {
      const res = await NativeBridge.listInstalledApps();
      _installedAppsCache = Array.isArray(res.apps) ? res.apps : [];
      return _installedAppsCache;
    }
  } catch (e) { console.warn("listInstalledApps failed:", e); }
  _installedAppsCache = [];
  return _installedAppsCache;
}

/** Render the "Allowed apps" list on the Settings screen. Each row is a
 *  chip with the real app icon + name + a remove button. */
async function renderSettings() {
  // Theme picker re-renders every time Settings opens so the right preset
  // shows as selected and the colour inputs reflect the saved theme.
  try { renderThemePicker(); } catch (_) {}

  const listEl = $("#allowedAppsList");
  if (!listEl) return;

  const s = loadSettings();
  const allowed = (s.allowedPackages || []).slice();

  if (allowed.length === 0) {
    listEl.innerHTML = `<div class="empty-state">No apps allowed yet. Tap <strong>+ Add an app</strong> below to pick from your installed apps.</div>`;
    return;
  }

  // Show a placeholder while installed-apps load (for the icon + display name).
  listEl.innerHTML = `<div class="empty-state">Loading…</div>`;

  const apps = await loadInstalledApps();
  const byPkg = new Map();
  for (const a of apps) byPkg.set(a.packageName, a);

  listEl.innerHTML = "";
  for (const pkg of allowed) {
    const info = byPkg.get(pkg);
    const name = info ? info.name : pkg;
    const icon = info ? info.icon : "";
    const chip = document.createElement("div");
    chip.className = "allowed-app-chip";
    chip.innerHTML = `
      <div class="allowed-app-icon-wrap"></div>
      <div class="allowed-app-info">
        <div class="allowed-app-name"></div>
        <div class="allowed-app-pkg"></div>
      </div>
      <button class="allowed-app-remove" aria-label="Remove">×</button>
    `;
    const iconWrap = chip.querySelector(".allowed-app-icon-wrap");
    if (icon) {
      const img = document.createElement("img");
      img.className = "allowed-app-icon";
      img.alt = "";
      img.src = icon;
      iconWrap.appendChild(img);
    } else {
      iconWrap.textContent = (name || pkg).charAt(0).toUpperCase();
      iconWrap.classList.add("allowed-app-icon-fallback");
    }
    chip.querySelector(".allowed-app-name").textContent = name;
    chip.querySelector(".allowed-app-pkg").textContent = pkg;
    chip.querySelector(".allowed-app-remove").addEventListener("click", async (ev) => {
      ev.stopPropagation();
      const cur = loadSettings();
      cur.allowedPackages = (cur.allowedPackages || []).filter(p => p !== pkg);
      saveSettings(cur);
      await pushUnblockListToNative();
      renderSettings();
    });
    listEl.appendChild(chip);
  }
}

/** Open the installed-apps picker modal. Lets the user toggle apps on/off;
 *  changes are saved + synced to native immediately. */
async function openAppPicker() {
  const modal = $("#appPickerModal");
  const listEl = $("#appPickerList");
  const searchInp = $("#appPickerSearch");
  if (!modal || !listEl || !searchInp) return;

  modal.classList.remove("hidden");
  listEl.innerHTML = `<div class="empty-state">Loading installed apps…</div>`;
  searchInp.value = "";

  const apps = await loadInstalledApps();
  if (apps.length === 0) {
    listEl.innerHTML = `<div class="empty-state">
      Could not list installed apps. This feature is only available on Android.
    </div>`;
    return;
  }

  function renderPicker(filter) {
    const f = (filter || "").trim().toLowerCase();
    const s = loadSettings();
    const allowedSet = new Set(s.allowedPackages || []);
    const frag = document.createDocumentFragment();
    let shown = 0;
    for (const app of apps) {
      if (f) {
        const hay = (app.name + " " + app.packageName).toLowerCase();
        if (!hay.includes(f)) continue;
      }
      shown++;
      const isOn = allowedSet.has(app.packageName);
      const row = document.createElement("div");
      row.className = "picker-row" + (isOn ? " on" : "");
      row.dataset.pkg = app.packageName;
      row.innerHTML = `
        <div class="picker-icon-wrap"></div>
        <div class="picker-app-info">
          <div class="picker-app-name"></div>
          <div class="picker-app-pkg"></div>
        </div>
        <span class="picker-check"></span>
      `;
      const iconWrap = row.querySelector(".picker-icon-wrap");
      if (app.icon) {
        const img = document.createElement("img");
        img.className = "picker-app-icon";
        img.alt = "";
        img.src = app.icon;
        iconWrap.appendChild(img);
      } else {
        iconWrap.textContent = app.name.charAt(0).toUpperCase();
        iconWrap.classList.add("picker-icon-fallback");
      }
      row.querySelector(".picker-app-name").textContent = app.name;
      row.querySelector(".picker-app-pkg").textContent = app.packageName;
      if (isOn) row.querySelector(".picker-check").textContent = "✓";
      row.addEventListener("click", async () => {
        const cur = loadSettings();
        cur.allowedPackages = Array.isArray(cur.allowedPackages) ? cur.allowedPackages : [];
        const idx = cur.allowedPackages.indexOf(app.packageName);
        if (idx >= 0) cur.allowedPackages.splice(idx, 1);
        else cur.allowedPackages.push(app.packageName);
        saveSettings(cur);
        await pushUnblockListToNative();
        // Toggle just this row's visual state — no need to rebuild the whole list
        const nowOn = idx < 0;
        row.classList.toggle("on", nowOn);
        row.querySelector(".picker-check").textContent = nowOn ? "✓" : "";
      });
      frag.appendChild(row);
    }
    listEl.innerHTML = "";
    if (shown === 0) {
      listEl.innerHTML = `<div class="empty-state">No apps matched "${(filter || "").trim()}"</div>`;
    } else {
      listEl.appendChild(frag);
    }
  }

  renderPicker("");
  searchInp.oninput = () => renderPicker(searchInp.value);
}

function closeAppPicker() {
  const modal = $("#appPickerModal");
  if (modal) modal.classList.add("hidden");
  // Re-render the settings list now that the user may have toggled apps.
  renderSettings();
}

// Wire the Settings buttons
const _addAppBtn = $("#addAppBtn");
if (_addAppBtn) _addAppBtn.addEventListener("click", openAppPicker);
const _appPickerCloseBtn = $("#appPickerCloseBtn");
if (_appPickerCloseBtn) _appPickerCloseBtn.addEventListener("click", closeAppPicker);
const _appPickerModalEl = $("#appPickerModal");
if (_appPickerModalEl) {
  _appPickerModalEl.addEventListener("click", (e) => {
    // Tap on the dim backdrop (outside the modal-content card) closes too.
    if (e.target === _appPickerModalEl) closeAppPicker();
  });
}

// On boot, sync the saved allowed-packages list to native so the blocker
// has the latest set even before the user opens Settings.
(function syncSettingsAtBoot() {
  setTimeout(() => { pushUnblockListToNative().catch(()=>{}); }, 800);
})();

// ==================== THEME PICKER ====================
// Stores the user's chosen colour palette (primary accent + secondary accent
// + background) and applies them to the :root CSS vars. Default theme
// matches the original look — pre-existing users see no visual change.
const THEME_KEY = "focusix7.theme.v1";
const DEFAULT_BG = "#100620";
const THEME_PRESETS = [
  { id: "cyan-magenta",  name: "Cyber Cyan",   primary: "#00d4ff", accent: "#ff00aa", background: "#100620" },
  { id: "lime-pink",     name: "Lime Pop",     primary: "#00ff88", accent: "#ff006e", background: "#0a1408" },
  { id: "orange-purple", name: "Sunset",       primary: "#ff7700", accent: "#bf00ff", background: "#1a0810" },
  { id: "red-yellow",    name: "Fire",         primary: "#ff006e", accent: "#ffcc00", background: "#1a0408" },
  { id: "mint-coral",    name: "Mint Coral",   primary: "#00ffcc", accent: "#ff6680", background: "#08161a" },
  { id: "ice-violet",    name: "Ice Violet",   primary: "#66eaff", accent: "#9966ff", background: "#0c0820" },
  { id: "dark-jungle",   name: "Dark Jungle",  primary: "#00ff88", accent: "#ffcc00", background: "#02100a" },
  { id: "midnight",      name: "Midnight",     primary: "#5599ff", accent: "#ff5599", background: "#06080f" },
];
const DEFAULT_THEME = THEME_PRESETS[0];

function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return Object.assign({}, DEFAULT_THEME, { presetId: DEFAULT_THEME.id });
    const parsed = JSON.parse(raw);
    return {
      presetId: typeof parsed.presetId === "string" ? parsed.presetId : "custom",
      primary:    parsed.primary    || DEFAULT_THEME.primary,
      accent:     parsed.accent     || DEFAULT_THEME.accent,
      background: parsed.background || DEFAULT_THEME.background,
    };
  } catch (_) {
    return Object.assign({}, DEFAULT_THEME, { presetId: DEFAULT_THEME.id });
  }
}
function saveTheme(t) {
  try { localStorage.setItem(THEME_KEY, JSON.stringify(t)); } catch (_) {}
}

/** Parse "#rrggbb" or "#rgb" to "r, g, b" RGB-triplet string for use inside
 *  rgba() calls. Returns null on malformed input. */
function hexToRgbTriplet(hex) {
  if (typeof hex !== "string") return null;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  const n = parseInt(h, 16);
  return ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255);
}

/** Tint helper — produce a slightly darker shade of a hex colour for
 *  background gradient stops. Keeps the contrast against neon accents. */
function darkenHex(hex, amount) {
  const t = hexToRgbTriplet(hex);
  if (!t) return hex;
  const [r, g, b] = t.split(", ").map(Number);
  const f = Math.max(0, Math.min(1, 1 - amount));
  const dr = Math.round(r * f), dg = Math.round(g * f), db = Math.round(b * f);
  return "#" + [dr, dg, db].map(v => v.toString(16).padStart(2, "0")).join("");
}

/** Validate the colour format and apply all three colours to the root CSS
 *  variables. Sets both #rrggbb form (for solid colours) and the "r, g, b"
 *  triplet form (so rgba() calls in the stylesheet can use it). No-op for
 *  malformed input — never breaks the UI. */
function applyTheme(theme) {
  const root = document.documentElement;
  if (!root) return;
  const valid = /^#([0-9a-fA-F]{3}){1,2}$/;
  const primary    = valid.test(theme.primary)    ? theme.primary    : DEFAULT_THEME.primary;
  const accent     = valid.test(theme.accent)     ? theme.accent     : DEFAULT_THEME.accent;
  const background = valid.test(theme.background) ? theme.background : DEFAULT_THEME.background;

  // Solid accents
  root.style.setProperty("--primary",        primary);
  root.style.setProperty("--neon-cyan",      primary);
  root.style.setProperty("--primary-light",  primary);
  root.style.setProperty("--neon-magenta",   accent);
  root.style.setProperty("--villain",        accent);
  root.style.setProperty("--villain-glow",   accent);

  // RGB triplets so rgba(var(--primary-rgb), 0.4) works in the energy field
  const pRgb = hexToRgbTriplet(primary);
  const aRgb = hexToRgbTriplet(accent);
  if (pRgb) root.style.setProperty("--primary-rgb", pRgb);
  if (aRgb) root.style.setProperty("--accent-rgb",  aRgb);

  // App background — also adjust the secondary bg variables so the room
  // and gradients stay tonally coherent with the chosen dark shade.
  root.style.setProperty("--bg-soft", background);
  root.style.setProperty("--bg-warm", darkenHex(background, -0.2)); // slightly lighter
  root.style.setProperty("--bg-cream", darkenHex(background, 0.2)); // slightly darker
}

function renderThemePicker() {
  const grid = $("#themePresetGrid");
  if (!grid) return;
  const cur = loadTheme();
  grid.innerHTML = "";
  for (const preset of THEME_PRESETS) {
    const sw = document.createElement("button");
    sw.className = "theme-swatch" + (cur.presetId === preset.id ? " selected" : "");
    sw.type = "button";
    sw.title = preset.name;
    sw.innerHTML = `
      <div class="theme-swatch-colors">
        <span class="theme-swatch-half" style="background:${preset.primary}"></span>
        <span class="theme-swatch-half" style="background:${preset.accent}"></span>
      </div>
      <div class="theme-swatch-name">${preset.name}</div>
    `;
    sw.addEventListener("click", () => {
      const next = {
        presetId: preset.id,
        primary: preset.primary,
        accent: preset.accent,
        background: preset.background,
      };
      saveTheme(next);
      applyTheme(next);
      renderThemePicker();
      const primaryInput = $("#themePrimaryInput");
      const accentInput  = $("#themeAccentInput");
      const bgInput      = $("#themeBgInput");
      if (primaryInput) primaryInput.value = preset.primary;
      if (accentInput)  accentInput.value  = preset.accent;
      if (bgInput)      bgInput.value      = preset.background;
      toast("Theme: " + preset.name);
    });
    grid.appendChild(sw);
  }
  // Sync the colour inputs with the current state.
  const primaryInput = $("#themePrimaryInput");
  const accentInput  = $("#themeAccentInput");
  const bgInput      = $("#themeBgInput");
  if (primaryInput) primaryInput.value = cur.primary;
  if (accentInput)  accentInput.value  = cur.accent;
  if (bgInput)      bgInput.value      = cur.background;
}

// Live update from the colour picker inputs (primary / accent / background)
const _themePrimaryInput = $("#themePrimaryInput");
const _themeAccentInput  = $("#themeAccentInput");
const _themeBgInput      = $("#themeBgInput");
function handleCustomChange() {
  const primary    = ($("#themePrimaryInput") || {}).value || DEFAULT_THEME.primary;
  const accent     = ($("#themeAccentInput")  || {}).value || DEFAULT_THEME.accent;
  const background = ($("#themeBgInput")      || {}).value || DEFAULT_THEME.background;
  const next = { presetId: "custom", primary, accent, background };
  saveTheme(next);
  applyTheme(next);
  $$(".theme-swatch").forEach(b => b.classList.remove("selected"));
}
if (_themePrimaryInput) _themePrimaryInput.addEventListener("input", handleCustomChange);
if (_themeAccentInput)  _themeAccentInput.addEventListener("input",  handleCustomChange);
if (_themeBgInput)      _themeBgInput.addEventListener("input",      handleCustomChange);

const _themeResetBtn = $("#themeResetBtn");
if (_themeResetBtn) {
  _themeResetBtn.addEventListener("click", () => {
    const next = {
      presetId: DEFAULT_THEME.id,
      primary: DEFAULT_THEME.primary,
      accent: DEFAULT_THEME.accent,
      background: DEFAULT_THEME.background,
    };
    saveTheme(next);
    applyTheme(next);
    renderThemePicker();
    toast("Theme reset");
  });
}

// Apply the persisted theme as early as possible on boot.
(function applyThemeAtBoot() { try { applyTheme(loadTheme()); } catch (_) {} })();

// ==================== RENAME / RESET ====================
$("#renameBtn").addEventListener("click", () => {
  modal({
    title: "Name your hero",
    text: "Pick a name worthy of fighting brainrot — up to 15 characters.",
    input: state.heroName,
    confirm: "Save",
    onConfirm: (val) => {
      const name = (val || "").trim().slice(0, 15);
      if (!name) { toast("Please enter a name"); return; }
      state.heroName = name;
      saveState();
      renderHero();
      showHeroSpeech("I am " + name + "! 💪");
    }
  });
});

$("#resetBtn").addEventListener("click", () => {
  modal({
    title: "Reset everything?",
    text: "This will erase all your brain cells, items, and progress. This cannot be undone.",
    confirm: "Reset",
    onConfirm: () => {
      state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      saveState();
      renderAll();
      showScreen("room");
      toast("Fresh start!");
    }
  });
});

// ==================== FIRST RUN ====================
function firstRunIfNeeded() {
  if (state.heroName === "Mr. Interesting" && state.totalFocusMinutes === 0 && state.ownedItems.length <= 1) {
    setTimeout(() => {
      modal({
        title: "Welcome!",
        text: "I'm Mr. Interesting. The world is being hypnotized by Mr. 67 — every minute you focus pushes him back. What should I be called?",
        input: "Mr. Interesting",
        confirm: "That's me",
        cancel: "Later",
        onConfirm: (val) => {
          const name = (val || "").trim().slice(0, 15) || "Mr. Interesting";
          state.heroName = name;
          saveState();
          renderHero();
          showHeroSpeech("Together we'll stop the brainrot.");
        }
      });
    }, 500);
  }
}

// ==================== RENDER ALL ====================
function renderAll() {
  renderWallet();
  renderHero();
  renderVillain();
  renderRoom();
  renderMeter();
  renderStats();
  syncFocusUI();
}

// ==================== INIT ====================
renderAll();
firstRunIfNeeded();
scheduleVillainTaunt();
scheduleVillain67Gesture();
scheduleHeroEmote();

window.addEventListener("beforeunload", (e) => {
  if (focusState.running) {
    e.preventDefault();
    e.returnValue = "";
  }
});

// ==================== TEST HOOKS ====================
// Expose internals so the Jest integration tests can drive the SPA
// without re-creating the DOM-event chain. No-op in production usage.
if (typeof window !== "undefined") {
  Object.defineProperty(window, "state", { get: () => state, configurable: true });
  window.focusState  = focusState;
  window.tick        = tick;
  window.startFocus  = startFocus;
  window.endFocus    = endFocus;
  window.renderAll   = renderAll;
  window.renderMeter = renderMeter;
  window.showScreen  = showScreen;
  window.SHOP_ITEMS  = SHOP_ITEMS;
}

