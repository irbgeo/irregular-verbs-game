# Stage 4: game-layer

**Status:** done — owner checked inside VK on 2026-11-22: all OK.

**Goal:** XP, day streak, level progress, 8 achievements, Progress screen,
menu chips (mockups 2, 7, 4b).

**Why:** motivation to come back daily; Arcade (stage 5) builds on it.

**Decisions:** +10 XP per correct Test word (owner approved). Owner said
"да, все делай" → TRD was written and implemented without a separate
approval pause; owner reviews TRD + RESULT together. Commit was NOT taken as
approved by that phrase (global rule: explicit "залей" / commit needed).

**Next steps:** owner checks in VK → tick RESULT → stage 5 `arcade`.

**Entry points:** `docs/stages/04-game-layer/` (PRD, TRD, RESULT),
`src/domain/game-layer.ts`, `src/ui/screens/progress.ts`, `src/app/game.ts`.
