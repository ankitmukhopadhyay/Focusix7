/* Mr. Interesting vs Mr. 67 — application logic */

// ==================== SHOP ITEMS ====================
const SHOP_ITEMS = [
  // POWERUPS
  { id: "coffee",    name: "Brain Coffee",      icon: "ico-coffee",    price: 60,  cat: "powerup",  pos: "floor" },
  { id: "tonic",     name: "Wisdom Tonic",      icon: "ico-tonic",     price: 90,  cat: "powerup",  pos: "floor" },
  { id: "scroll",    name: "Focus Scroll",      icon: "ico-scroll",    price: 75,  cat: "powerup",  pos: "wall"  },
  { id: "crystal",   name: "Focus Crystal",     icon: "ico-crystal",   price: 140, cat: "powerup",  pos: "floor" },
  { id: "hourglass", name: "Time Hourglass",    icon: "ico-hourglass", price: 110, cat: "powerup",  pos: "floor" },
  { id: "star",      name: "Lucky Star",        icon: "ico-star",      price: 50,  cat: "powerup",  pos: "wall"  },

  // SIDEKICKS
  { id: "owl",       name: "Wise Owl",          icon: "ico-owl",       price: 220, cat: "sidekick", pos: "floor" },
  { id: "dog",       name: "Loyal Doggo",       icon: "ico-dog",       price: 200, cat: "sidekick", pos: "floor" },
  { id: "cat",       name: "Study Cat",         icon: "ico-cat",       price: 180, cat: "sidekick", pos: "floor" },
  { id: "robot",     name: "Helper Bot",        icon: "ico-robot",     price: 320, cat: "sidekick", pos: "floor" },
  { id: "worm",      name: "Book Worm",         icon: "ico-worm",      price: 90,  cat: "sidekick", pos: "floor" },

  // RELICS
  { id: "tome",      name: "Tome of Knowledge", icon: "ico-tome",      price: 240, cat: "relic",    pos: "floor" },
  { id: "shield",    name: "Anti-Scroll Shield",icon: "ico-shield",    price: 320, cat: "relic",    pos: "wall"  },
  { id: "compass",   name: "Truth Compass",     icon: "ico-compass",   price: 180, cat: "relic",    pos: "floor" },
  { id: "sigil",     name: "Sigil of Focus",    icon: "ico-sigil",     price: 260, cat: "relic",    pos: "wall"  },
  { id: "banner",    name: "Banner of Wisdom",  icon: "ico-banner",    price: 150, cat: "relic",    pos: "wall"  },

  // DECORATIONS
  { id: "bulb",      name: "Idea Bulb",         icon: "ico-bulb",      price: 100, cat: "decor",    pos: "wall"  },
  { id: "window",    name: "Window of Calm",    icon: "ico-window",    price: 200, cat: "decor",    pos: "wall"  },
  { id: "trophy",    name: "Trophy",            icon: "ico-trophy",    price: 80,  cat: "decor",    pos: "floor" },
  { id: "plant",     name: "Wisdom Plant",      icon: "ico-plant",     price: 70,  cat: "decor",    pos: "floor" },
  { id: "lamp",      name: "Cozy Lamp",         icon: "ico-lamp",      price: 110, cat: "decor",    pos: "floor" },
  { id: "clock",     name: "Timekeeper",        icon: "ico-clock",     price: 130, cat: "decor",    pos: "wall"  },

  // OUTFITS
  { id: "skin_classic",   name: "Classic",    price: 0,    cat: "skin", skin: "classic"   },
  { id: "skin_detective", name: "Detective",  price: 200,  cat: "skin", skin: "detective" },
  { id: "skin_scholar",   name: "Scholar",    price: 250,  cat: "skin", skin: "scholar"   },
  { id: "skin_wizard",    name: "Wizard",     price: 300,  cat: "skin", skin: "wizard"    },
  { id: "skin_astronaut", name: "Astronaut",  price: 500,  cat: "skin", skin: "astronaut" },
  { id: "skin_sigma",     name: "Sigma Suit", price: 800,  cat: "skin", skin: "sigma"     },
  { id: "skin_knight",    name: "Knight",     price: 1500, cat: "skin", skin: "knight"    },
];

const ITEM_BY_ID = Object.fromEntries(SHOP_ITEMS.map(i => [i.id, i]));
const VALID_ITEM_IDS = new Set(Object.keys(ITEM_BY_ID));

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
  // Currency rename
  if (typeof s.socks === "number")   { s.brainCells = (s.brainCells || 0) + s.socks;   delete s.socks; }
  if (typeof s.scarves === "number") { s.aura       = (s.aura || 0)       + s.scarves; delete s.scarves; }
  // Name rename
  if (typeof s.beanName === "string" && (!s.heroName || s.heroName === "Mr. Interesting")) {
    s.heroName = s.beanName;
  }
  delete s.beanName;
  // Skin id rename
  const legacySkin = { default: "classic", coffee: "detective", edamame: "scholar",
                       pinto: "wizard", kitty: "astronaut", jelly: "sigma", space: "knight" };
  if (legacySkin[s.skin]) s.skin = legacySkin[s.skin];

  // Owned-item id rename + drop unknown
  if (Array.isArray(s.ownedItems)) {
    const skinIdMap = {
      skin_default:  "skin_classic",
      skin_coffee:   "skin_detective",
      skin_edamame:  "skin_scholar",
      skin_pinto:    "skin_wizard",
      skin_kitty:    "skin_astronaut",
      skin_jelly:    "skin_sigma",
      skin_space:    "skin_knight",
    };
    s.ownedItems = s.ownedItems
      .map(id => skinIdMap[id] || id)
      .filter(id => VALID_ITEM_IDS.has(id));
    if (!s.ownedItems.includes("skin_classic")) s.ownedItems.unshift("skin_classic");
    s.ownedItems = [...new Set(s.ownedItems)];
  }
  // Drop placed items that no longer exist
  if (s.placed && typeof s.placed === "object") {
    const next = {};
    for (const [k, v] of Object.entries(s.placed)) {
      if (VALID_ITEM_IDS.has(k)) next[k] = v;
    }
    s.placed = next;
  }
  if (typeof s.worldFocus !== "number") s.worldFocus = 50;
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

function buildHeroSvg(skin) {
  const layers = [`<use href="#hero-base"/>`];

  // hair vs hat
  const hatOnly = ["wizard", "astronaut", "knight"];
  const hatPlusHair = ["detective", "scholar"];
  const noHat = ["classic", "sigma"];

  if (noHat.includes(skin) || hatPlusHair.includes(skin)) {
    layers.push(`<use href="#hair-classic"/>`);
  }
  if (skin === "detective") layers.push(`<use href="#hat-fedora"/>`);
  if (skin === "scholar")   layers.push(`<use href="#hat-mortarboard"/>`);
  if (skin === "wizard")    layers.push(`<use href="#hat-wizard"/>`);
  if (skin === "astronaut") layers.push(`<use href="#helmet-astronaut"/>`);
  if (skin === "knight")    layers.push(`<use href="#helmet-knight"/>`);

  // eyewear
  if (skin === "sigma") layers.push(`<use href="#glasses-sunglasses"/>`);
  else if (skin === "classic" || skin === "scholar") layers.push(`<use href="#glasses-default"/>`);

  // bowtie
  if (!["wizard", "astronaut", "knight"].includes(skin)) layers.push(`<use href="#bowtie"/>`);

  return `<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet">${layers.join("")}</svg>`;
}

function buildVillainSvg() {
  return `<svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet"><use href="#villain-base"/></svg>`;
}

// ==================== UI: NAV & SCREENS ====================
let currentScreen = "room";

function showScreen(name) {
  currentScreen = name;
  $$(".screen").forEach(s => s.classList.remove("active"));
  $("#screen-" + name).classList.add("active");
  $$(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.screen === name));

  if (name === "shop") renderShop("all");
  if (name === "inventory") renderInventory();
  if (name === "edit") renderSkinPicker();
  if (name === "focus") syncFocusUI();
}

$$(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showScreen(btn.dataset.screen));
});

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
  $("#heroNameDisplay").textContent = state.heroName;
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
  const layer = $("#placedItems");
  layer.innerHTML = "";
  Object.entries(state.placed).forEach(([id, pos]) => {
    const item = ITEM_BY_ID[id];
    if (!item) return;
    const el = document.createElement("div");
    el.className = "placed-item " + (item.pos === "wall" ? "wall" : "floor");
    el.innerHTML = svgUse(item.icon);
    el.style.left = pos.x + "%";
    el.style.top = pos.y + "%";
    el.style.transform = "translate(-50%, -50%)";
    el.title = item.name + " — tap to remove";
    el.addEventListener("click", () => {
      modal({
        title: "Remove " + item.name + "?",
        text: "It will go back to your bag.",
        confirm: "Remove",
        onConfirm: () => {
          delete state.placed[id];
          saveState();
          renderRoom();
          toast("Removed " + item.name);
        }
      });
    });
    layer.appendChild(el);
  });
}

function startPlacing(itemId) {
  const item = ITEM_BY_ID[itemId];
  if (!item) return;
  showScreen("room");

  const room = $("#room");
  room.querySelector(".placement-overlay")?.remove();
  room.querySelector(".placing-item")?.remove();

  let pos = item.pos === "wall" ? { x: 50, y: 30 } : { x: 50, y: 75 };

  const ghost = document.createElement("div");
  ghost.className = "placing-item";
  ghost.innerHTML = svgUse(item.icon);
  ghost.style.left = pos.x + "%";
  ghost.style.top = pos.y + "%";
  ghost.style.transform = "translate(-50%, -50%)";
  room.appendChild(ghost);

  const overlay = document.createElement("div");
  overlay.className = "placement-overlay";
  overlay.innerHTML = `
    <div class="placement-toolbar">
      <button data-act="left"><svg><use href="#ico-arrow-left"/></svg></button>
      <button data-act="up"><svg><use href="#ico-arrow-up"/></svg></button>
      <button data-act="down"><svg><use href="#ico-arrow-down"/></svg></button>
      <button data-act="right"><svg><use href="#ico-arrow-right"/></svg></button>
      <button data-act="cancel" class="cancel-btn"><svg><use href="#ico-x"/></svg></button>
      <button data-act="confirm" class="confirm-btn"><svg><use href="#ico-check"/></svg></button>
    </div>
  `;
  room.appendChild(overlay);

  function update() {
    pos.x = Math.max(8, Math.min(92, pos.x));
    pos.y = Math.max(8, Math.min(92, pos.y));
    ghost.style.left = pos.x + "%";
    ghost.style.top = pos.y + "%";
  }

  overlay.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) {
      if (e.target.classList.contains("placement-overlay")) {
        const rect = room.getBoundingClientRect();
        pos.x = ((e.clientX - rect.left) / rect.width) * 100;
        pos.y = ((e.clientY - rect.top) / rect.height) * 100;
        update();
      }
      return;
    }
    const act = btn.dataset.act;
    if (act === "left")  pos.x -= 5;
    if (act === "right") pos.x += 5;
    if (act === "up")    pos.y -= 5;
    if (act === "down")  pos.y += 5;
    if (act === "cancel") { overlay.remove(); ghost.remove(); return; }
    if (act === "confirm") {
      state.placed[item.id] = { x: pos.x, y: pos.y };
      saveState();
      overlay.remove();
      ghost.remove();
      renderRoom();
      toast("Placed " + item.name + "!");
      return;
    }
    update();
  });

  toast("Tap arrows or the room to position", 2400);
}

// ==================== UI: SHOP ====================
function renderShop(category) {
  $$(".shop-tabs .tab").forEach(t => t.classList.toggle("selected", t.dataset.cat === category));
  const grid = $("#shopGrid");
  grid.innerHTML = "";
  const items = SHOP_ITEMS.filter(i => category === "all" || i.cat === category);
  items.forEach(item => grid.appendChild(buildShopCard(item)));
}

function buildShopCard(item) {
  const owned       = state.ownedItems.includes(item.id);
  const placed      = state.placed[item.id];
  const isSkin      = item.cat === "skin";
  const isCurrent   = isSkin && state.skin === item.skin;
  const unaffordable = !owned && state.brainCells < item.price;

  const el = document.createElement("div");
  el.className = "shop-item";
  if (isSkin) {
    if (isCurrent) el.classList.add("equipped");
    else if (owned) el.classList.add("owned");
  } else {
    if (owned && placed) el.classList.add("placed");
    else if (owned) el.classList.add("owned");
  }
  if (unaffordable) el.classList.add("unaffordable");

  const iconHtml = isSkin
    ? `<div class="outfit-preview"><div class="character" data-skin="${item.skin}">${buildHeroSvg(item.skin)}</div></div>`
    : `<div class="item-icon-wrap">${svgUse(item.icon)}</div>`;

  let priceHtml;
  if (owned && isSkin) {
    priceHtml = isCurrent ? `<span>current</span>` : `<span>tap to equip</span>`;
  } else if (owned) {
    priceHtml = `<span>${placed ? "tap to remove" : "tap to place"}</span>`;
  } else {
    priceHtml = `<svg class="price-icon"><use href="#ico-brain"/></svg><span>${item.price}</span>`;
  }

  el.innerHTML = `
    ${iconHtml}
    <div class="item-name">${item.name}</div>
    <div class="item-price">${priceHtml}</div>
  `;

  el.addEventListener("click", () => onShopItemClick(item));
  return el;
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
    } else if (state.placed[item.id]) {
      modal({
        title: "Remove " + item.name + "?",
        text: "It will go back to your bag.",
        confirm: "Remove",
        onConfirm: () => {
          delete state.placed[item.id];
          saveState();
          renderRoom();
          renderInventory();
          renderShop(currentShopCategory());
          toast("Removed " + item.name);
        }
      });
    } else {
      startPlacing(item.id);
    }
    return;
  }

  if (state.brainCells < item.price) {
    toast("Not enough brain cells! Focus more.");
    return;
  }

  modal({
    title: "Buy " + item.name + "?",
    text: `Costs 🧠 ${item.price}. You have 🧠 ${state.brainCells}.`,
    confirm: "Buy",
    onConfirm: () => {
      state.brainCells -= item.price;
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
        setTimeout(() => {
          modal({
            title: "Place it in your room?",
            text: "You can always place items later from the Items tab.",
            confirm: "Place",
            cancel: "Later",
            onConfirm: () => startPlacing(item.id),
          });
        }, 350);
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
        <p style="margin-top:10px;">No items yet — visit the shop!</p>
      </div>
    `;
    return;
  }
  items.forEach(item => {
    const placed = state.placed[item.id];
    const el = document.createElement("div");
    el.className = "shop-item" + (placed ? " placed" : "");
    el.innerHTML = `
      <div class="item-icon-wrap">${svgUse(item.icon)}</div>
      <div class="item-name">${item.name}</div>
      <div class="item-price"><span>${placed ? "tap to remove" : "tap to place"}</span></div>
    `;
    el.addEventListener("click", () => {
      if (state.placed[item.id]) {
        delete state.placed[item.id];
        saveState();
        renderInventory();
        renderRoom();
        toast("Returned " + item.name + " to bag");
      } else {
        startPlacing(item.id);
      }
    });
    grid.appendChild(el);
  });
}

// ==================== UI: OUTFIT PICKER ====================
function renderSkinPicker() {
  const grid = $("#skinGrid");
  grid.innerHTML = "";
  const skins = SHOP_ITEMS.filter(i => i.cat === "skin");
  skins.forEach(item => grid.appendChild(buildShopCard(item)));
}

// ==================== FOCUS TIMER ====================
let focusState = {
  durationMin: 25,
  pomodoro: false,
  running: false,
  remainingMs: 25 * 60 * 1000,
  endTime: 0,
  intervalId: null,
  onBreak: false,
};

function syncFocusUI() {
  $$("#durationPicker .chip").forEach(c =>
    c.classList.toggle("selected", parseInt(c.dataset.min) === focusState.durationMin)
  );
  $("#pomodoroToggle").checked = focusState.pomodoro;
  const focusEl = $("#focusCharacter");
  if (focusEl && !focusEl.innerHTML) focusEl.innerHTML = buildHeroSvg(state.skin);
  updateTimerDisplay();
  if (focusState.running) {
    $("#beginBtn").classList.add("hidden");
    $("#cancelBtn").classList.remove("hidden");
    $("#durationPicker").style.opacity = "0.4";
    $("#durationPicker").style.pointerEvents = "none";
  } else {
    $("#beginBtn").classList.remove("hidden");
    $("#cancelBtn").classList.add("hidden");
    $("#durationPicker").style.opacity = "1";
    $("#durationPicker").style.pointerEvents = "auto";
  }
}

function updateTimerDisplay() {
  const ms = focusState.running
    ? Math.max(0, focusState.endTime - Date.now())
    : focusState.durationMin * 60 * 1000;
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  $("#timerText").textContent = `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  if (focusState.running) {
    $("#timerSub").textContent = focusState.onBreak
      ? "rest a moment — keep your edge"
      : "stay focused — every minute weakens Mr. 67";
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

$("#pomodoroToggle").addEventListener("change", (e) => {
  focusState.pomodoro = e.target.checked;
});

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

function startFocus() {
  focusState.running = true;
  focusState.onBreak = false;
  focusState.remainingMs = focusState.durationMin * 60 * 1000;
  focusState.endTime = Date.now() + focusState.remainingMs;
  document.body.classList.add("focus-active");
  syncFocusUI();
  tick();
  focusState.intervalId = setInterval(tick, 250);
  showHeroSpeech("Books out! Mr. 67 is shaking 📚");
}

function tick() {
  if (!focusState.running) return;
  const remaining = focusState.endTime - Date.now();
  if (remaining <= 0) {
    if (focusState.onBreak) {
      focusState.onBreak = false;
      finishSuccess();
    } else if (focusState.pomodoro) {
      awardBrainCells(focusState.durationMin);
      startBreak();
    } else {
      finishSuccess();
    }
    return;
  }
  updateTimerDisplay();
}

function startBreak() {
  focusState.onBreak = true;
  focusState.endTime = Date.now() + 5 * 60 * 1000;
  toast("Battle won! 5 min rest.", 2600);
  updateTimerDisplay();
}

function finishSuccess() {
  if (!focusState.onBreak) awardBrainCells(focusState.durationMin);
  endFocus(true);
}

function awardBrainCells(minutes) {
  state.brainCells += minutes;
  state.totalFocusMinutes += minutes;
  if (minutes >= 60) state.aura += 1;
  state.sessionsCompleted += 1;
  state.worldFocus = Math.min(100, state.worldFocus + 5);
  saveState();
  renderWallet();
  renderStats();
}

function endFocus(success) {
  focusState.running = false;
  focusState.onBreak = false;
  clearInterval(focusState.intervalId);
  focusState.intervalId = null;
  document.body.classList.remove("focus-active");
  syncFocusUI();

  if (success) {
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
    renderMeter();
  } else {
    state.worldFocus = Math.max(0, state.worldFocus - 10);
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

// ==================== RENAME / RESET ====================
$("#renameBtn").addEventListener("click", () => {
  modal({
    title: "Name your hero",
    text: "Pick a name worthy of fighting brainrot.",
    input: state.heroName,
    confirm: "Save",
    onConfirm: (val) => {
      const name = (val || "").trim().slice(0, 24);
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
          const name = (val || "").trim().slice(0, 24) || "Mr. Interesting";
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

window.addEventListener("beforeunload", (e) => {
  if (focusState.running) {
    e.preventDefault();
    e.returnValue = "";
  }
});
