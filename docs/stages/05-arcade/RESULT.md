# Stage 5 RESULT: arcade

Status: **done** (2026-11-22) — owner checked inside VK: all OK. PRD + TRD written and implemented in one go on the
owner's "давай сразу следующий этап сделаем".

## Done

- `src/domain/arcade.ts`: 60 s round (`roundMs`), −3 s per wrong answer,
  +10 × `multiplierFor(run)` (x2 from the 5th in a row, x3 from the 10th),
  pause / resume, words from the cumulative level with a 5-word cooldown,
  tasks from stage 4 `roundTasks` / `pickTask` (no own-answer questions, no
  repeat of the word's last task), `arcadeOptions` (correct variants + wrong
  words up to 4 buttons), `arcadeLadder` (background training rules of the
  PRD).
- `GameStats.arcadeBest` saved in `"g"` as `"b"`; old saves → 0; reset
  clears it.
- Controller: `openArcade`, `arcadeAnswer`, `arcadeQuit`, 250 ms timer that
  redraws only the time, end → result with «Новый рекорд!», `onVisibility`
  pause / resume (wired in `main.ts`); Arcade answers count for the day
  streak (and streak achievements), never for XP.
- UI: round screen (mockup 5) with «+N» / «−3 с» after each answer, result
  screen (mockup 5b without the board button), Arcade tile next to Test in
  the menu with «Рекорд N».

## Leaderboard

Not in v1. VK docs (dev.vk.ru, 2026-11-22): `VKWebAppShowLeaderBoardBox`
`user_result` is display only; scores are recorded only by the server method
`secure.addAppEvent` (service key), only for games published in the catalog.
Per project PRD §3.4 fallback → personal best only; a VK board needs a small
server — a later stage.

## How it was checked

- `make build`: 293 tests pass (33 new); coverage 96% statements / 90.6%
  branches; ESLint + `tsc` clean.
- Every verb × every target kind: 3–4 buttons, at least one correct and one
  wrong — tested on the real data.
- Timer, penalty and pause tested with fake time; the round end, record and
  quit tested through the controller.
- Bundle: JS 23.5 KB + CSS 2.9 KB + HTML 0.3 KB gzip (budget 60 KB).
- Code review of the stage diff: the multiplier rule kept in one place
  (`multiplierFor`, used by the domain and the screen), a two-parameter
  helper turned into a struct, the new-word case of `arcadeLadder` written
  directly; one wrong test of mine (it answered wrong 20 times, so the penalty
  used up the round) fixed to answer correctly.

## Checked by the owner inside VK (2026-11-22)

- [x] `make deploy`; play a round on phone and desktop: timer, x2 / x3,
      «−3 с», result, record in the menu tile.
- [x] Hide the game (switch app / tab) during a round — time stops.
- [x] Record is the same on a second device.

## Deviations

- The flash after an answer is a «+N» / «−3 с» pill, not a colored button
  (the next question replaces the buttons at once).
- A Arcade round is not saved: closing the game ends it without a record.
