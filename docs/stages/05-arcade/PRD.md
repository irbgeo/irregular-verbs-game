# Stage 5 PRD: arcade

Status: **written and implemented on the owner's "сразу следующий этап"**
(2026-11-22) — owner reviews PRD, TRD and RESULT together.
Project PRD: [../../PRD.md](../../PRD.md) §3.4, stage 5.
Mockups: 5 (round), 5b (result), 2 (menu tile) —
https://claude.ai/artifact/PLvTXW5AwVz69wJC4wGtdn.

## Goal

A short, fast mode: 60 seconds of button answers for points, a personal
record to beat — and every answer still trains the words.

## Leaderboard decision (project PRD §3.4, option A fallback)

VK docs (dev.vk.ru, read 2026-11-22): `VKWebAppShowLeaderBoardBox`
`user_result` is **display only, not saved**; results are recorded only by the
server method `secure.addAppEvent` (service key), and only for games already
published in the catalog. So, as agreed: **v1 shows the personal best only**;
the VK leaderboard (needs a small server) is a later stage. The mockup's
«Таблица рекордов» button is left out.

## User stories

1. From the menu I open Arcade (tile next to Test, shows my record).
2. A 60-second round starts: one shown form, «Выберите <form>», 4 buttons;
   I see time left, score, multiplier and how many in a row (mockup 5).
3. A correct answer: +10 × multiplier (x2 from the 5th in a row, x3 from the
   10th); a wrong one: the run resets and I lose 3 seconds; both show briefly
   (green / red) and the next question comes at once.
4. When time is up I see my score, «Новый рекорд!» if it is, correct /
   wrong / best run, «Ещё раунд» and «В меню» (mockup 5b without the board).
5. I can leave a round with the close button; it ends without a record.
6. Answers in Arcade also train my words (Leitner) and count for the day
   streak; Arcade points are NOT XP.

## Rules

- Words: my level and all earlier levels, random, the last 5 not repeated.
- Question: a task from the stage 4 task list (distinct words, not the
  word's last task), 4 buttons: the correct form (all its variants if several)
  + distractors from the word's other forms and common mistakes.
- Timer: 60 s; −3 s per wrong answer; paused while the game is hidden.
- Leitner (background training, no hint / show in Arcade):
  - study word at step 1: correct +1, wrong → box 0 (as Learn step 1);
  - study word at step 2 (typing): wrong → box 0; correct → no change
    (step 2 needs typed answers);
  - learned word: wrong → back to study, step 2, box 0 (as Learn review);
  - a word not in my list: wrong → to study (as the Test); correct → nothing;
  - skipped word: nothing.
- Personal best: saved with my progress, same on all devices, cleared by
  reset.

## Acceptance criteria

- Every rule has tests (options, score / multiplier, penalty, timer end,
  pause, Leitner effects, best score).
- Round and result screens match mockups 5 / 5b (minus the board button);
  menu tile shows «Рекорд N».
- Best score saved in VK Storage (worst case still ≤4096 chars).
- `make build` passes, coverage ≥70%.

## Out of scope

- VK leaderboard (needs a server; later stage), sounds and animations beyond
  the short color flash (stage 6), ads.
