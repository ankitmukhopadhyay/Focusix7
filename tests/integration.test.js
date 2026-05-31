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
    expect(window.state.worldFocus).toBe(55);
  });

  test("hitting worldFocus 100 triggers banishment bonus", async () => {
    // Pre-seed near victory
    window.state.worldFocus = 95;

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
});
