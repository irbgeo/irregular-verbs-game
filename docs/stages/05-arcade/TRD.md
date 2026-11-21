# Stage 5 TRD: arcade

Status: written and implemented together with the PRD (2026-11-22).

## 1. Domain: `src/domain/arcade.ts` (pure; time passed in as ms)

```ts
interface ArcadeQuestion { base; anchor; target; anchorValue; options: string[] }
interface ArcadeRound {
  endsAt: number          // ms; moves earlier by 3000 per wrong answer
  pausedAt: number | null
  score: number
  run: number             // correct in a row
  bestRun: number
  correct: number
  wrong: number
  recent: string[]        // last 5 bases
  question: ArcadeQuestion
}
```

- `newArcade(catalog, progress, rng)` → `Arcade` with `start(now)`,
  `answer({ index, now })` → `{ correct, points }`, `timeLeft(now)`,
  `isOver(now)`, `pause(now)`, `resume(now)`, `round()`.
- Score: `points = 10 × m`, `m = run ≥ 10 ? 3 : run ≥ 5 ? 2 : 1` where `run`
  counts this answer.
- `arcadeOptions({ verb, kind, variant, rng })`: correct variants first, then
  distractors (other forms' variants, all common mistakes, case-insensitive
  dedupe, never a correct variant) shuffled and cut so the total is 4;
  shuffled. If a verb has fewer than 4 distinct words, fewer buttons.
- Word pick: random base from `basesUpTo(level)` not in the last 5; task via
  `roundTasks` + `pickTask` (saves `task` on the word when it has an entry).
- Leitner: `arcadeLadder({ word, correct })` per PRD rules (new word wrong →
  `setStudy`; study mode 0 treated as 1).
- The round is not saved (a reload ends it).

## 2. Stats and saving

`GameStats.arcadeBest: number` (default 0), saved in `"g"` as `"b"`; old
saves → 0. Reset clears it.

## 3. Controller (`src/app/game.ts`)

- Screens `arcade`, `arcade-result`; actions `openArcade()`,
  `arcadeAnswer(index)`, `arcadeQuit()`.
- A 250 ms interval re-renders only the timer text; at 0 → result screen,
  best updated (`newRecord` flag), words + stats dirty, flush soon.
- Each answer: streak `touchStreak` (no XP), Leitner effect, marks words
  dirty; the screen re-renders with the next question and a 300 ms flash
  class on the tapped button (correct green / wrong red).
- `visibilitychange` hidden → `pause`, visible → `resume` (wired in main via
  a `game.onVisibility(hidden)` method).
- `arcadeQuit()` stops the timer, back to menu, no best update.

## 4. UI

- `screens/arcade.ts` (mockup 5): close button, «Рекорд N», time «0:42»,
  score, timer bar, chips «x2» and «6 подряд · ещё 4 до x3», word card,
  4 buttons in 2×2.
- `screens/arcade-result.ts` (mockup 5b): «Время вышло», score card,
  «Новый рекорд!» chip, correct / wrong / best run, note, «Ещё раунд»,
  «В меню».
- Menu: Arcade tile next to Test (two tiles in a row), note «Рекорд N».

## 4. Tests

`arcade.test.ts` (options, multiplier, penalty, timer, pause / resume, end,
word pick cooldown, Leitner rules), codec (`arcadeBest`), game (open,
answer, end by timer with fake time, record, quit), screens (round, result,
menu tile).
