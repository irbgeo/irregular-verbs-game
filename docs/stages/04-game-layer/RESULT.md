# Stage 4 RESULT: game-layer

Status: **done** (2026-11-22) — owner checked inside VK: all OK. PRD approved; TRD written and implemented on the
owner's "do everything" — the owner reviews both with this result.

## Done

- Domain `src/domain/game-layer.ts`: `xpFor` (5 / 10 / +20 / Test 10),
  `touchStreak`, `currentStreak`, `weekMarks`, `unlocked` (8 achievements),
  `addDays` / `localDay`, `achievementIds`; `Catalog.basesOf(level)`.
- `Progress.game` = XP, streak (`days`, `last` local date), achievements;
  saved in `iv1_p` as `"g"`; stage 3 saves load with zero stats; broken
  stats → zero; unknown achievement ids dropped.
- Controller: XP / streak / achievements after Test answer or hint and after
  a real Learn answer (choose / type / reveal with feedback); toast
  «Достижение: …»; `openProgress()`; reset clears the stats.
- UI: menu streak + XP pills and the Progress button (mockup 2); Progress
  screen (mockup 7) with the 7-day row, level bars, achievements; «+N XP»
  chip in Learn and on the Test "correct" screen.

## How it was checked

- `make build`: 260 tests pass (38 new); coverage 95.8% statements / 91%
  branches; ESLint + `tsc` clean.
- Dates: month and year boundaries, leap day, a missed day, "yesterday still
  counts" — tested with fixed dates; controller tests use a fixed system time.
- Worst-case `iv1_p` with all words learned and all stats ≤4096 — tested.
- Bundle: JS 21.0 KB + CSS 2.6 KB + HTML 0.3 KB gzip (budget 60 KB).
- Code review of the stage diff: one shared achievement list instead of two,
  the `LearnBefore` struct moved to `types.ts`, `weekMarks` computes the run
  start once, no call nested in another call's arguments.

## Checked by the owner inside VK (2026-11-22)

- [x] `make deploy`; answer in Test and Learn; see XP and «+N XP», the
      streak in the menu, the Progress screen in light and dark theme.
- [x] Learn a word to "learned" → toast «Достижение: Первое слово».
- [x] Progress (XP, streak, achievements) is the same on a second device.

## Deviations / decisions not in the PRD

- A Test hint counts for the streak (it is an answer) but gives no XP; a
  Test skip and «keep / drop» count for nothing.
- Learn answers ignored by the flow (typing in choice mode, a bad button
  index) do not count for the streak.
- The 7-day row shows the last 7 days ending today (weekday names under
  each), not a fixed Monday–Sunday week.

## Fixes after the owner's check in VK (2026-11-22)

- **Learn repeated the same task for a word** (owner: "understood → infinitive"
  three times). Root cause, from a 1000-round simulation: rounds picked form
  KINDS, not words — for the 83 of 133 verbs with two equal forms
  (understood = past = participle) one task came twice as often (33%), a third
  of tasks showed their own answer ("understood → past"), and 23% of
  appearances repeated the previous task. The bot has the same behaviour.
  Fix: `src/domain/tasks.ts` — tasks by distinct words (`roundTasks`), answer
  never equals the shown word (except cut / put / set …, all forms equal);
  `pickTask` never repeats the word's last task; the last task is saved per
  word as one more digit in `iv1_p` (`go=s142`; old codes still load).
  After the fix: 34 / 34 / 32%, 0 repeats in a row.
- **Progress screen cut at the bottom inside VK desktop**: `#app` is now the
  scroll container (the VK iframe has a fixed height), bottom padding 32 px +
  safe-area inset; section titles («Выучено по уровням», «Достижения») were
  unstyled (huge) — `.small-title` added (15 px, as the mockup).

## For the next stage (5: Arcade)

- Reuse `formOptions` (cut to 4 buttons) and `applyLadder`; Arcade score is
  separate from XP (project PRD §3.4) — keep it out of `game.xp`.
- Menu has room for the Arcade card next to Test (mockup 2: two tiles).
