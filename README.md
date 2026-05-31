# Focusix7 — Android wrapper

Capacitor-based Android shell around the `Focusix7/` vanilla-web focus app, plus a native focus-lock plugin that pins the phone to the app for the duration of a focus session.

## What's inside

```
Focusix7-android/
├── www/                       # Web app (copy of Focusix7/, plus native-bridge.js + state-helpers.js)
├── android/                   # Capacitor-generated Gradle project
│   └── app/src/main/java/io/focusix7/app/
│       ├── MainActivity.java         # Registers the FocusLock plugin
│       ├── FocusLockPlugin.java      # @CapacitorPlugin — start/stop/getState/isSupported
│       └── FocusForegroundService.java   # Wake lock + ongoing notification
├── tests/                     # Jest suites (run against www/ and android/ source)
├── capacitor.config.json
└── package.json
```

## Build & run

Requires Node 18+, JDK 21, Android SDK 34 (`platforms;android-34`, `build-tools;34.0.0`, `platform-tools`).

```sh
# Install deps once
npm install

# Run the test suite (62 tests, ~3s)
npm test

# Build a debug APK (output in android/app/build/outputs/apk/debug/app-debug.apk)
npm run build:android

# Install on a connected device or emulator
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The combined task runs both:
```sh
npm run verify
```

## Focus-lock behavior

When the user taps **Begin the Battle**:

1. On first run, the app shows an explainer modal: *"Focusix7 will pin itself to the screen so other apps stay out of the way. Confirm screen pinning when prompted. To exit early, press and hold Back + Recents."*
2. `FocusLockPlugin.start({ minutes, label })` is invoked via the JS bridge.
3. The plugin calls `Activity.startLockTask()` — Android shows its built-in pinning prompt the first time on a non-device-owner install. Once confirmed, the home/recents buttons are blocked.
4. A foreground service is started, owning:
   - A `PARTIAL_WAKE_LOCK` for `(minutes + 5)` minutes so the CPU stays awake even if the screen times out.
   - An ongoing notification ("Focus active — N min — Mr. 67 is shaking 📚") so Android knows we're a foreground process and won't kill us.
5. The activity sets `FLAG_KEEP_SCREEN_ON` while focus is active.

When focus ends (success **or** give-up):

- `FocusLockPlugin.stop()` calls `Activity.stopLockTask()` (releases pinning), removes `FLAG_KEEP_SCREEN_ON`, and stops the foreground service / releases the wake lock.

The plugin no-ops safely on plain browsers — `NativeBridge.isNative()` returns false and the web app works exactly as before.

## Permissions declared

| Permission | Why |
|---|---|
| `INTERNET` | Google Fonts on first paint (cached after) |
| `WAKE_LOCK` | Keep the timer counting through screen-off |
| `FOREGROUND_SERVICE` | Required to start `FocusForegroundService` |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Android 14+ requires a typed FGS permission |
| `POST_NOTIFICATIONS` | Show the ongoing focus notification on Android 13+ |
| `VIBRATE` | Reserved for victory/banishment cue (future) |

No internet usage beyond the initial font load; no analytics; no background data.

## Test suite layout

| File | What it covers |
|---|---|
| `tests/state-helpers.test.js` | Pure migration + reward math (legacy keys, skin renames, focus/banish/give-up math, timer formatter) |
| `tests/native-bridge.test.js` | `NativeBridge` behaves safely when Capacitor is absent and forwards correctly when stubbed |
| `tests/integration.test.js` | Boots the whole SPA in jsdom, short-circuits the wall-clock timer, asserts banishment & give-up flows |
| `tests/android-manifest.test.js` | Static checks: manifest declares the right permissions/service; plugin exports start/stop/getState; foreground service uses `PARTIAL_WAKE_LOCK` |

Running `npm test`:

```
Test Suites: 4 passed, 4 total
Tests:       62 passed, 62 total
```

## Why Capacitor (not Cordova / Trusted Web Activity / native)

- Keeps the zero-dependency web app intact — no React/Vite refactor.
- The web layer is loaded from the APK's assets (no network needed for the UI shell), so the app runs fully offline.
- Native plugins are first-class — `FocusLockPlugin.java` is ~110 lines and gives us full access to `startLockTask()`, foreground services, and wake locks.
- TWA can't request screen pinning. A bare WebView lacks Capacitor's bridge ergonomics.
