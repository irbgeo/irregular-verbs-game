# Stage 3 TRD: core-screens

Status: **approved by the owner** (2026-11-21).
Stage PRD: [PRD.md](PRD.md). Mockups: https://claude.ai/artifact/PLvTXW5AwVz69wJC4wGtdn.

## 1. Layers

```
src/main.ts           wiring only (platform → load → game → render, visibility flush)
src/app/              game controller, save codec, saver (no DOM)
src/ui/               screens (DOM), styles, template helpers
src/domain/           rules from stage 2 (unchanged)
src/platform/         port + VK / local (gains theme)
```

`src/app/opens.ts` (stage 1 check) and its test are removed; the start
screen of stage 1 is replaced by the real screens.

## 2. Save format (VK Storage)

Measured on the real data: `Progress` as plain JSON with all 133 words =
7 101 chars, over the 4 096-char VK value limit. So `Progress` is saved in
**two keys**, both small JSON strings:

| Key | Content | Worst case |
|---|---|---|
| `iv1_p` | `{"v":1,"s":["gb","elementary"],"w":"be=l00;go=s14;..."}` — settings + words; a word = `base=` + status letter (`s` study, `l` learned, `k` skipped) + mode digit + box digit | ~2 100 chars (133 words, longest bases) |
| `iv1_s` | `{"t":<TestSession>,"l":<LearnSession>}` as JSON, `null` when none | ~1 300 chars (full Test queue) |

A unit test builds the worst case (all 133 words, longest queue) and checks
each value ≤ 4 096. Key names fit VK's `[a-zA-Z_\-0-9]`, `1` = format version.

**Decode (`src/app/codec.ts`)** treats saved data as untrusted:
- not JSON / wrong version → fresh `Progress` (player onboards again);
- settings invalid (`isVariant` / `isLevel`) → both set to null (onboarding);
- a word entry with an unknown base or a bad code → that entry dropped;
- a session with an unknown base, bad shape or bad numbers → that session
  null.

## 3. Saving (`src/app/saver.ts`)

- The game marks the keys it changed (`p`, `s`) as dirty after each step.
- **Throttle: at most one flush per 10 s** (trailing); a flush writes only
  dirty keys. Worst case 2 keys × 360 flushes = 720 calls/hour < 1 000.
- Flush at once on `visibilitychange` → hidden and when the player goes back
  to the menu (still not more often than once per 2 s).
- A failed write keeps the key dirty, shows a toast «Не удалось сохранить —
  попробуем ещё раз», and is retried on the next flush. Nothing is dropped.
- Risk accepted: if the VK app is killed without a `hidden` event, the last
  ≤10 s of answers may be lost.

## 4. Platform port additions

```ts
type Theme = 'light' | 'dark'
interface Platform {
  ...                                  // init, load, save (stage 1)
  onTheme(listener: (theme: Theme) => void): void
}
```

- VK: `bridge.subscribe` → `VKWebAppUpdateConfig`; dark when `appearance ===
  'dark'` or `scheme` is `vkcom_dark` / `space_gray`; light otherwise.
- Local: `matchMedia('(prefers-color-scheme: dark)')` and its changes.
- The UI sets `data-theme` on `<html>`; CSS tokens switch with it.

## 5. Game controller (`src/app/game.ts`)

`newGame(catalog, progress, platform, saver, rng)` keeps `Progress`, builds
the stage 2 flows, holds the current screen and renders it into `#app`.

```ts
type Screen =
  | 'onboarding' | 'menu' | 'test' | 'test-done'
  | 'learn' | 'learn-empty' | 'my-words' | 'settings'
```

Actions (called by screens): `finishOnboarding(settings)`, `openTest()`,
`testAnswer(text)`, `testHint()`, `testSkip()`, `testKeep()`, `testDrop()`,
`openLearn()`, `learnChoose(i)`, `learnType(text)`, `learnReveal()`,
`openMyWords()`, `myWordsToggle(base)`, `myWordsSave()`, `myWordsCancel()`,
`openSettings()`, `setSettings(settings)`, `resetProgress()`, `toMenu()`.

Rules:
- Start: not onboarded → onboarding; else menu.
- Test from menu: resume the saved Test (`current()`), else `start()`.
  The menu card says «Продолжить · слово N из M» for a saved Test.
- Learn from menu: always `start()` (stage 2 RESULT note); a saved round is
  shown only when the game is reopened while on Learn (`current()`).
- The My words draft lives in the controller while the screen is open.
- Changing variant or level in Settings clears the saved Test and Learn
  sessions (their words / options were built for the old settings).
- Reset: a two-step button («Сбросить прогресс» → «Точно сбросить? Да»);
  no `window.confirm` (blocked in some VK web views). Then `newProgress()`
  → onboarding.

## 6. UI (`src/ui/`)

- No framework (project decision). Each screen is a static HTML string with
  `data-ref` marks, turned into DOM by `fromTemplate(html)`; `refs(root)`
  returns the marked elements. **All player-visible data goes in through
  `textContent`** (no `innerHTML` with data — no injection).
- Files: `template.ts`, `styles.css`, `screens/onboarding.ts`, `menu.ts`,
  `test.ts`, `test-done.ts`, `learn.ts` (with the empty state),
  `my-words.ts`, `settings.ts`, shared `feedback.ts`, `toast.ts`.
- `styles.css`: the mockup tokens as CSS variables (`docs/PRD.md` §3.7),
  light on `:root`, dark on `[data-theme="dark"]`; system font; buttons
  ≥56 px, targets ≥44 px; layout from 320 px wide to desktop (content max
  width 480 px, centered).
- Answer fields: `autocomplete="off" autocapitalize="off" autocorrect="off"
  spellcheck="false" enterkeyhint="done"`; Enter submits; on focus the field
  is scrolled into view; no fixed bottom bars on screens with a field.
- Focus: after each render the screen's main control (field, first option or
  heading) gets focus, so Tab / Enter work on desktop.
- Test done and Learn empty are small screens in the mockup style (not drawn
  in the canvas): counts + «В меню»; «Пока нечего учить» + «Пройти тест».

## 7. Tests (written first)

| Test | Checks |
|---|---|
| `codec.test.ts` | round trip; worst case ≤4 096 per key; each broken-input rule of §2 |
| `saver.test.ts` (fake timers, fake platform) | throttle 10 s; only dirty keys; flush on hidden; failed write kept dirty + error reported; retry |
| `game.test.ts` (fake platform, scripted rng, jsdom) | start screen by onboarding state; Test resume vs start; Learn always start; settings change clears sessions; reset flow; dirty keys after actions |
| `screens/*.test.ts` (jsdom) | each screen shows the given state (texts from the mockups) and calls the right action on click / Enter; data shown via `textContent` |
| `vk.test.ts`, `local.test.ts` | `onTheme` mapping (appearance / scheme / media query) |

Coverage ≥70% (`src/main.ts` excluded as wiring).

## 8. Budget and checks

- Bundle: JS + CSS ≤ **60 KB gzip** (now 8.4 KB).
- `make build` passes.
- Inside VK (owner + me via vk-tunnel): every PRD story on phone and
  desktop, light and dark; progress continues on a second device.
- `vk-tunnel`: run `npx @vkontakte/vk-tunnel` next to `make dev`; README gets
  the exact steps found during the stage.

## 9. Risks

- VK web views may differ in keyboard behaviour (iOS vs Android): checked by
  hand on a real phone; fixes noted in RESULT.
- `VKWebAppUpdateConfig` fields on desktop web vs mobile may differ; both
  `appearance` and `scheme` are read, light is the fallback.
