# Stage 3 RESULT: core-screens

Status: **done** (2026-11-21) — owner checked the game inside VK: all OK.

## Done

- Screens (`src/ui/screens/`), from the approved mockups: first run, menu,
  Test (question, "correct → study / skip", done with counts), Learn (choice,
  typed, review mark, step marks, empty state), My words (status cycle, save /
  cancel), Settings (variant, level, two-tap reset).
- Styles (`src/ui/styles.css`): mockup tokens as CSS variables, light + dark
  (`data-theme` from the platform), content max width 480 px, buttons ≥56 px.
- Templates (`src/ui/template.ts`): static markup + `data-ref`; all data via
  `textContent` (tested: `<img>` in data is not created).
- Save format (`src/app/codec.ts`): two VK keys `iv1_p` (settings + words as
  short codes) and `iv1_s` (Test / Learn sessions); untrusted-data decoding.
- Saver (`src/app/saver.ts`): only changed keys, ≤1 flush per 10 s, soon
  (2 s) on back to menu, at once on `visibilitychange` → hidden; failures
  retried with a toast.
- Controller (`src/app/game.ts`): screens + actions as in the TRD.
- Platform: `onTheme` (VK `VKWebAppUpdateConfig`: `appearance` / `scheme`;
  local: `prefers-color-scheme`).
- Removed the stage 1 check (`opens.ts`, start screen).

## How it was checked

- `make build`: 222 tests pass; coverage 94% statements / 90% branches;
  ESLint + `tsc` clean.
- Size: worst case (133 words, full Test queue) fits each VK value — tested.
- Bundle: JS 18.7 KB + CSS 2.3 KB + HTML 0.3 KB gzip (budget 60 KB).
- Code review of the stage diff: struct literals moved out of call
  arguments, two-parameter helpers turned into one struct parameter
  (owner's style rules); one wrong edit (`fillOptions`) caught by the build.

## Checked by the owner inside VK (2026-11-21)

- [x] `make deploy` (or the dev environment) and play every PRD story on a
      phone (VK app) and on desktop, in light and dark VK theme.
- [x] Progress continues on a second device; reload in the middle of a Test.
- [x] Phone keyboard: no autocorrect / capital letter, Enter checks, the
      screen does not jump (iOS and Android if possible).
- [ ] `vk-tunnel`: not confirmed separately; README keeps the general steps.
      Optional, not blocking.

## Deviations from the TRD

- The game always starts on the menu (or onboarding). Restoring an open Learn
  round after a reload is not done: Learn from the menu starts a new session
  anyway; a saved Test is still resumed via «Продолжить».
- The Test done and Learn empty screens are simple screens in the mockup
  style (they are not on the canvas).
- My words: changed rows are not outlined (the mockup showed it); the status
  chip already shows the new status, and the save bar shows the count.
- The save bar in My words is shown only when there are changes.

## Known issues / debt

- `visibilitychange` → hidden saves at once, outside the 10 s throttle;
  switching tabs very often could add calls (still small next to 1000/hour).
- Not checked in a real browser by me — only jsdom tests and the build.
- `git rm` of the stage 1 check files is staged (not committed).

## For the next stage (4: game layer)

- Menu: add the XP / streak chips and the Progress button (mockup 2).
- The streak needs "answered today": the Test and Learn actions in
  `game.ts` are the place to record it; it goes into `iv1_p` (keep the worst
  case under 4096 — add a test).
