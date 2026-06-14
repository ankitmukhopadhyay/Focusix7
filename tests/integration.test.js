/** @jest-environment jsdom */
// End-to-end style integration: load the full SPA into jsdom, simulate a
// focus session by short-circuiting the wall-clock timer, assert the meter
// + banishment flow runs end-to-end.

const fs = require("fs");
const path = require("path");

function loadAppIntoDom() {
  const indexHtml = fs.readFileSync(path.resolve(__dirname, "../www/index.html"), "utf8");
  const bodyMatch = indexHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : indexHtml;
  document.body.innerHTML = bodyContent;
  document.querySelectorAll("script").forEach(s => s.remove());

  window.localStorage.clear();
  delete window.Capacitor;

  for (const file of ["state-helpers.js", "native-bridge.js", "app.js"]) {
    const src = fs.readFileSync(path.resolve(__dirname, "../www/", file), "utf8");
    // eslint-disable-next-line no-new-func
    new Function(src).call(window);
  }
}

describe("integration — full SPA boot + focus session math", () => {
  beforeEach(() => {
    // jsdom does not support backdrop-filter or some CSS; that's fine, we only test JS.
    loadAppIntoDom();
  });

  test("boots without throwing and renders meter at 50", () => {
    const fill = document.getElementById("meterFill");
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe("50%");
  });

  test("wallet starts at 0 / 0", () => {
    expect(document.getElementById("brainCellsCount").textContent).toBe("0");
    expect(document.getElementById("auraCount").textContent).toBe("0");
  });

  test("starting a focus session and short-circuiting timer awards brain cells", async () => {
    const beginBtn = document.getElementById("beginBtn");
    expect(beginBtn).not.toBeNull();

    // The chip for 5 min
    const chip5 = document.querySelector('#durationPicker .chip[data-min="5"]');
    chip5.click();

    // Suppress the explainer modal — set the seen flag first (also it only
    // shows on native), then click Begin.
    window.localStorage.setItem("focusix7.lockExplainerSeen", "1");
    beginBtn.click();

    // wait a tick for the async startFocus chain
    await Promise.resolve();
    await Promise.resolve();

    // Force the timer to expire immediately
    window.focusState.endTime = Date.now() - 1;
    window.tick();

    expect(window.state.brainCells).toBe(5);
    expect(window.state.totalFocusMinutes).toBe(5);
    expect(window.state.sessionsCompleted).toBe(1);
    // World focus delta = floor(5/2) = 2, so 50 + 2 = 52.
    expect(window.state.worldFocus).toBe(52);
  });

  test("hitting worldFocus 100 triggers banishment bonus", async () => {
    // Pre-seed near victory. With the new floor(min/2) world-focus math,
    // a 5-min session grants +2 — so we need to seed at 98 to cross 100.
    window.state.worldFocus = 98;

    const chip5 = document.querySelector('#durationPicker .chip[data-min="5"]');
    chip5.click();
    window.localStorage.setItem("focusix7.lockExplainerSeen", "1");
    document.getElementById("beginBtn").click();
    await Promise.resolve(); await Promise.resolve();

    window.focusState.endTime = Date.now() - 1;
    window.tick();

    // After endFocus, banishment math: +5 brain (session) + 50 bonus, +1 aura, meter reset to 50
    expect(window.state.brainCells).toBe(5 + 50);
    expect(window.state.aura).toBe(1);
    expect(window.state.worldFocus).toBe(50);
  });

  test("give-up subtracts 10 from world focus", async () => {
    window.state.worldFocus = 50;
    const chip5 = document.querySelector('#durationPicker .chip[data-min="5"]');
    chip5.click();
    window.localStorage.setItem("focusix7.lockExplainerSeen", "1");
    document.getElementById("beginBtn").click();
    await Promise.resolve(); await Promise.resolve();

    // Call endFocus directly with failure (the give-up modal is interactive)
    window.endFocus(false);
    expect(window.state.worldFocus).toBe(40);
  });

  test("body gets focus-active class while a session is running and loses it after", async () => {
    window.localStorage.setItem("focusix7.lockExplainerSeen", "1");
    document.querySelector('#durationPicker .chip[data-min="5"]').click();
    document.getElementById("beginBtn").click();
    await Promise.resolve(); await Promise.resolve();

    expect(document.body.classList.contains("focus-active")).toBe(true);

    window.focusState.endTime = Date.now() - 1;
    window.tick();

    expect(document.body.classList.contains("focus-active")).toBe(false);
  });

  test("showScreen() is a no-op for non-focus screens while focus is running", async () => {
    // First navigate to the focus screen explicitly (Begin can only be tapped from there).
    window.showScreen("focus");
    expect(document.getElementById("screen-focus").classList.contains("active")).toBe(true);

    window.localStorage.setItem("focusix7.lockExplainerSeen", "1");
    document.querySelector('#durationPicker .chip[data-min="5"]').click();
    document.getElementById("beginBtn").click();
    await Promise.resolve(); await Promise.resolve();

    expect(window.focusState.running).toBe(true);

    // Try to switch to the shop screen — should be ignored.
    window.showScreen("shop");
    expect(document.getElementById("screen-shop").classList.contains("active")).toBe(false);
    expect(document.getElementById("screen-focus").classList.contains("active")).toBe(true);
  });

  test("styles.css defines the full-screen-lock rules", () => {
    const fs = require("fs");
    const path = require("path");
    const css = fs.readFileSync(path.resolve(__dirname, "../www/styles.css"), "utf8");
    // jsdom does not implement full CSS cascade for !important + complex selectors,
    // so we assert at the source level: the rule must exist and target the right elements.
    expect(css).toMatch(/body\.focus-active[\s\S]*?\.bottom-nav[\s\S]*?display:\s*none\s*!important/);
    expect(css).toMatch(/body\.focus-active[\s\S]*?\.topbar[\s\S]*?display:\s*none\s*!important/);
    expect(css).toMatch(/body\.focus-active\s+#screen-focus[\s\S]*?position:\s*absolute/);
    expect(css).toMatch(/body\.focus-active\s+#backFromFocus[\s\S]*?display:\s*none/);
  });

  test("focus-screen energize field exists and is only visible during focus", () => {
    const fs = require("fs");
    const path = require("path");
    const html = fs.readFileSync(path.resolve(__dirname, "../www/index.html"), "utf8");
    const css  = fs.readFileSync(path.resolve(__dirname, "../www/styles.css"), "utf8");
    // The energy field DOM is in the focus stage.
    expect(html).toMatch(/focus-energy-field/);
    expect(html).toMatch(/energy-aura/);
    expect(html).toMatch(/energy-ring/);
    expect(html).toMatch(/energy-particle/);
    // CSS hides it by default but shows it under body.focus-active.
    expect(css).toMatch(/\.focus-energy-field[\s\S]*?display:\s*none/);
    expect(css).toMatch(/body\.focus-active\s+\.focus-energy-field[\s\S]*?display:\s*block/);
    // Aura + ring + particle keyframes exist.
    expect(css).toMatch(/@keyframes\s+focusAuraPulse/);
    expect(css).toMatch(/@keyframes\s+focusRingSpin/);
    expect(css).toMatch(/@keyframes\s+focusParticleFloat/);
  });

  test("victory-attack animation triggers on successful focus completion", async () => {
    // The hero / villain / POW! keyframes must exist in CSS.
    const fs = require("fs");
    const path = require("path");
    const css = fs.readFileSync(path.resolve(__dirname, "../www/styles.css"), "utf8");
    expect(css).toMatch(/@keyframes\s+heroVictoryDash/);
    expect(css).toMatch(/@keyframes\s+heroPunchArm/);
    expect(css).toMatch(/@keyframes\s+villainTakeHit/);
    expect(css).toMatch(/@keyframes\s+powBurstPop/);
    expect(css).toMatch(/\.room\.victory-attack\s+#hero/);
    expect(css).toMatch(/\.room\.victory-attack\s+#mr67/);

    // Run a focus session to completion and confirm the room briefly enters
    // the victory-attack state before settling back. The state change
    // happens synchronously inside playVictoryAttack(), before its setTimeouts.
    window.localStorage.setItem("focusix7.lockExplainerSeen", "1");
    document.querySelector('#durationPicker .chip[data-min="5"]').click();
    document.getElementById("beginBtn").click();
    await Promise.resolve(); await Promise.resolve();
    window.focusState.endTime = Date.now() - 1;
    window.tick();

    const room = document.getElementById("room");
    expect(room.classList.contains("victory-attack")).toBe(true);
  });

  test("6-7 gesture animation swings each arm outwards (positive deg for left, negative for right)", () => {
    const fs = require("fs");
    const path = require("path");
    const css = fs.readFileSync(path.resolve(__dirname, "../www/styles.css"), "utf8");

    // Slice out the gesture67Left @keyframes block by finding the next
    // @keyframes (or a generous chunk if it's the last one).
    function sliceKeyframes(name) {
      const start = css.indexOf("@keyframes " + name);
      if (start < 0) return "";
      const next = css.indexOf("@keyframes", start + 1);
      return css.slice(start, next > 0 ? next : start + 800);
    }
    const leftBlock = sliceKeyframes("gesture67Left");
    const rightBlock = sliceKeyframes("gesture67Right");

    // Left shoulder pivot — outward swing must be POSITIVE rotation (CW).
    expect(leftBlock).toMatch(/rotate\(\d{2,}deg\)/);
    expect(leftBlock).not.toMatch(/rotate\(-\d+deg\)/);

    // Right shoulder pivot — outward swing must be NEGATIVE rotation (CCW).
    expect(rightBlock).toMatch(/rotate\(-\d{2,}deg\)/);
    // Also reject "inward" positive 2+ digit rotation on the right arm.
    expect(rightBlock).not.toMatch(/rotate\(\d{2,}deg\)/);
  });
});
