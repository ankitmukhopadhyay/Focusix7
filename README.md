# Focusix7 — Mr. Interesting vs Mr. 67

A gamified focus timer for Android. Every minute you focus, the hero **Mr.
Interesting** weakens the brainrot villain **Mr. 67**; giving up makes him
stronger. Earn brain cells and aura, buy outfits and passive buffs, and push
the World Focus meter to 100 to banish Mr. 67 — then do it again.

**Closed testing is live - _Test out the app following these steps_:**
> 1. Join this [Google Group approved for closed testing](https://groups.google.com/g/focusix7).
> 2. Click on the button below, now you will have access to the app.

[![Get it on Google Play](https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png)](https://play.google.com/store/apps/details?id=io.focusix7.app)

> This repository contains the full source for reference and portfolio
> purposes. The version published on the Play Store (`io.focusix7.app`) is
> the official, signed, supported build. A build produced from this source
> will be unsigned/debug and is **not** an official release of Focusix7 —
> use the Play Store link above to install the real app.

## What's inside

A zero-framework vanilla HTML/CSS/JS web app (`www/`), wrapped in a
Capacitor 6 Android shell (`android/`), plus a native focus-blocker built on
Android's Accessibility Service.

```
Focusix7/
├── www/                       # The whole game: HTML/CSS/JS, zero build step
│   ├── index.html             # Shell + 87-symbol SVG sprite + 6 screens
│   ├── app.js                 # Game logic: shop, outfits, focus timer, dialogue
│   ├── styles.css             # Neon cyan/magenta design system + SVG joint-rig animation
│   ├── state-helpers.js        # Pure state/migration/reward-math (shared with Jest)
│   └── native-bridge.js        # Safe wrapper around the native FocusLock plugin
├── android/                    # Capacitor-generated Gradle project
│   └── app/src/main/java/io/focusix7/app/
│       ├── MainActivity.java          # Registers the FocusLock plugin
│       ├── FocusLockPlugin.java       # @CapacitorPlugin — start/stop/getState/permissions
│       ├── FocusBlockerService.java   # AccessibilityService — detects forbidden apps
│       ├── FocusOverlay.java          # Full-screen "get back to Focusix7" overlay
│       └── FocusForegroundService.java # Wake lock + ongoing notification
├── tests/                      # Jest suites — 283 tests across 5 files
├── capacitor.config.json
└── package.json
```

## Build & test from source

Requires Node 18+, JDK 21, Android SDK **35** (`platforms;android-35`,
`build-tools;35.0.0`, `platform-tools`).

```sh
npm install
npm test                 # 283 tests, 5 suites, ~3s
npm run build:android    # debug APK -> android/app/build/outputs/apk/debug/app-debug.apk
npm run verify           # test + debug build
```

A debug build is unsigned and self-signs with Android's default debug key —
it can be sideloaded for local testing but cannot receive updates as
"Focusix7" and is not the Play Store app. Producing a release build requires
a signing keystore, which is **not included** in this repo (see
`android/keystore.properties.example`).

## How focus-blocking works

While a session is running, an `AccessibilityService`
(`FocusBlockerService`) watches foreground-app changes. Opening a
non-allowlisted app shows a full-screen "Mr. 67 wants you distracted!"
overlay (`FocusOverlay`) with a single button back to Focusix7. Launchers,
dialer, system UI, keyboards, and any apps the user explicitly allows in
**Settings → Allowed apps** are exempt. A foreground service
(`FocusForegroundService`) holds a wake lock + ongoing notification so the
timer keeps running with the screen off.

## Permissions declared

| Permission | Why |
|---|---|
| `INTERNET` | Google Fonts on first paint (cached after) |
| `WAKE_LOCK` | Keep the timer counting through screen-off |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_SPECIAL_USE` | Required for the focus-session foreground service (Android 14+ typed FGS) |
| `POST_NOTIFICATIONS` | Show the ongoing focus notification on Android 13+ |
| `SYSTEM_ALERT_WINDOW` | Draw the "back to Focusix7" overlay over other apps |
| `BIND_ACCESSIBILITY_SERVICE` (own service) | Detect foreground-app changes during focus |
| `QUERY_ALL_PACKAGES` | Populate the "allowed apps" picker in Settings |
| `VIBRATE` | UI feedback |

No analytics, no accounts, no data leaves the device — see the
[privacy policy](https://ankitmukhopadhyay.github.io/focusix7-privacy/privacy.html).

## Test suite

| File | What it covers |
|---|---|
| `tests/state-helpers.test.js` | Pure migration + reward math (legacy saves, focus/banish/give-up math, buffs, timer formatter) |
| `tests/native-bridge.test.js` | `NativeBridge` behaves safely without Capacitor and forwards correctly when stubbed |
| `tests/integration.test.js` | Boots the whole SPA in jsdom — banishment, give-up, focus-lock UI, 6-7 gesture animation |
| `tests/android-manifest.test.js` | Manifest permissions/services, plugin method exports, `MainActivity` lifecycle |
| `tests/focus-blocker-simulation.test.js` | Behavioral mirror of the Accessibility-service guard chain across OEM home-gesture sequences (Samsung/MIUI/OnePlus/ColorOS/Pixel) |

```
Test Suites: 5 passed, 5 total
Tests:       283 passed, 283 total
```

## Why Capacitor (not Cordova / Trusted Web Activity / native)

- Keeps the zero-dependency web app intact — no React/Vite refactor.
- The web layer is bundled into the APK's assets, so the UI runs fully offline.
- Native plugins are first-class — `FocusLockPlugin` gives full access to
  Accessibility Services, overlays, foreground services, and wake locks,
  none of which a TWA or bare WebView can do.

## License

All rights reserved — see [LICENSE](LICENSE). Source is provided for viewing
and portfolio/review purposes; the official app is distributed for closed testing as of now, on Google Play
(link above).
