# Stage 4 TRD: game-layer

Status: **written and implemented on the owner's "do everything"**
(2026-11-22) — owner reviews it together with the result.
Stage PRD: [PRD.md](PRD.md).

## 1. Data

```ts
interface Streak {
  days: number          // length of the current run
  last: string | null   // last active day, "YYYY-MM-DD" (device local date)
}
type AchievementId =
  | 'first-word' | 'words-10' | 'words-50' | 'words-100'
  | 'level-done' | 'streak-3' | 'streak-7' | 'streak-30'
interface GameStats {
  xp: number
  streak: Streak
  achievements: AchievementId[]   // unlock order
}
interface Progress { ...; game: GameStats }   // newProgress(): xp 0, no streak, none
```

Saved inside `iv1_p` as `"g":{"x":1240,"s":[7,"2026-11-22"],"a":["first-word",…]}`
(≤ ~200 chars; worst-case size test updated). Missing / broken `g` (stage 3
saves) → zero stats; unknown achievement ids are dropped.

## 2. Domain (`src/domain/game-layer.ts`, pure, no clock)

The caller passes `today` ("YYYY-MM-DD"); the controller gets it from
`new Date()` (local date). Tests use fixed strings, controller tests use
`vi.setSystemTime`.

- `xpFor(event)`: `AnswerEvent { kind: 'test' | 'choice' | 'input'; correct;
  becameLearned }` → 10 / 5 / 10, +20 when `becameLearned`, 0 when wrong.
- `touchStreak({ streak, today })`: same day → unchanged; `last` = yesterday
  → `days + 1`; else → 1.
- `currentStreak({ streak, today })`: `days` when `last` is today or
  yesterday, else 0.
- `weekMarks({ streak, today })`: 7 booleans, 6 days ago … today, true for
  days inside the current run.
- `unlocked({ stats, words, catalog, today })`: achievement ids newly earned
  (learned count ≥1 / 10 / 50 / 100; any level fully learned; current streak
  ≥3 / 7 / 30), not already in `stats.achievements`.
- `addDays(day, n)` / `localDay(date)`: date helpers (UTC arithmetic on the
  date string, so no time-zone drift).

Catalog gains `basesOf(level)` (that level only) for level bars.

## 3. Controller (`src/app/game.ts`)

- After every Test answer / hint and Learn choose / type / reveal (not skip,
  not keep / drop): `touchStreak`, add `xpFor(...)`, check `unlocked(...)`,
  mark `iv1_p` dirty; a toast «Достижение: <name>» per new one.
- Learn: the event is built from the round's format before the answer and
  the word status before / after (`becameLearned`); Test: `correct` when the
  answer step is `choose`.
- The last gain is passed to the Learn / Test views as `xpGain` (chip "+N XP"
  when > 0).
- New screen `progress`; action `openProgress()`.

## 4. UI

- Menu: streak chip «N дней» (plural день / дня / дней) and XP chip
  «1 240 XP» (thin-space thousands), Progress button next to Settings
  (mockup 2).
- `screens/progress.ts` (mockup 7): XP card, streak card, 7-day row with
  weekday names, 4 level bars «X из Y», 8 achievements (unlocked colored,
  locked grey with a lock icon), «N из 8» heading.
- Learn header chip «+N XP»; Test "correct" screen chip «+10 XP».

## 5. Tests (first)

`game-layer.test.ts` (XP table, streak across days / month / year / missed
day, current streak, week marks, each achievement, no double unlock),
`codec.test.ts` (game stats round trip, old save, broken `g`, worst case),
`game.test.ts` (XP + streak after answers, no XP for wrong / hint / skip /
My words, achievement toast, reset clears stats, Progress screen),
`screens` tests (menu chips, progress screen, plural of days).
