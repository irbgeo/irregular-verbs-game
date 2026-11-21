# Stage 4 PRD: game-layer

Status: **approved by the owner** (2026-11-22), incl. +10 XP per correct Test word.
Project PRD: [../../PRD.md](../../PRD.md) §3.3, stage 4.
Mockups: https://claude.ai/artifact/PLvTXW5AwVz69wJC4wGtdn — 2 (menu chips),
7 (Progress), 4 / 4b (XP chip in Learn).

## Goal

Motivation on top of learning: points for answers, a day streak, progress per
level and achievements — so players come back every day.

## Why now

The game already works like the bot (stage 3). This layer is what makes it a
game, and Arcade (stage 5) builds on the same XP / progress screen.

## User stories

1. **XP.** I get points for correct answers and see them in the menu and on
   the Progress screen; a correct answer in Learn shows "+5 XP" / "+10 XP"
   next to the feedback (mockup 4b).
2. **Day streak.** If I answer at least once a day, my streak grows; if I
   skip a day it starts again. I see "N дней" in the menu and the last 7 days
   on the Progress screen.
3. **Level progress.** On the Progress screen I see, for each of the 4
   levels, "learned X of Y" with a bar.
4. **Achievements.** I unlock 8 achievements; when one unlocks I see a short
   message; on the Progress screen unlocked ones are colored, locked ones grey.
5. **Menu.** The menu shows XP and streak chips and a Progress button
   (mockup 2).
6. **Kept and reset.** All of this is saved with my progress, is the same on
   another device, and «Сбросить прогресс» clears it too.

## Rules

- **XP** (project PRD §3.3):
  - +5 — correct answer by button (Learn step 1);
  - +10 — correct typed answer (Learn step 2, a learned word on review);
  - +20 — extra when a word becomes "learned" in Learn;
  - +10 — each correct word in the Test (typed 3 forms; owner approved);
  - wrong answers, hints, "show answer" never take XP away;
  - marking a word "learned" in My words gives no XP (no free points).
- **Day streak**: a day counts when at least one answer (Test or Learn,
  right or wrong) is given on that calendar day, by the device's local date.
  Yesterday counted and today not yet → the streak still shows (it is not lost
  until a whole day is missed). A missed day → the next answer starts at 1.
  No freeze, no rescue.
- **Level progress**: per level (not cumulative): learned words of that level
  / all words of that level (78, 16, 33, 6).
- **Achievements** (8, once unlocked they stay, even if words are later
  demoted):
  first learned word; 10 / 50 / 100 learned words; a whole level learned (any
  level); streak 3 / 7 / 30 days.
- The 7-day row on the Progress screen shows the days of the current streak
  (filled) and today as current.

## Acceptance criteria

- Every rule above has tests (XP per answer type, learned bonus, no XP for
  wrong / hint / show / My words, streak across days incl. a missed day and
  month / year boundaries, each achievement, level counts).
- Progress screen and menu match mockups 2 and 7; Learn shows the XP chip.
- XP, streak and achievements are saved in VK Storage, survive reload and a
  second device; the saved value stays ≤4096 chars in the worst case (tested).
- Old saves from stage 3 (without these fields) load as XP 0, no streak, no
  achievements.
- `make build` passes, coverage ≥70%.

## Out of scope

- Arcade and its score / leaderboard (stage 5) — the menu gets its card then.
- Sounds and unlock animations beyond a short message (stage 6).
- Ads, rescue of a lost streak, daily goals, levels of XP.
