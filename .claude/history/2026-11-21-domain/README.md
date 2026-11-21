# Stage 2: domain

**Status:** done — PRD, TRD approved; code, tests, RESULT written.

**Goal:** port the bot's learning rules (catalog, answer check, Test, Learn /
Leitner, My words) to a pure TS module with the bot's tests.

**Why:** the rules are the core and the riskiest part; they do not need VK, so
they are built and tested before screens.

**Found while reading the bot:** anchor and target kinds are picked
independently in `buildRound` (`internal/service/learn.go`), so ~1/3 of Learn
rounds ask for the form already shown. Bot spec intends "another form". The
game fixes it; the bot still has the bug.

**Next steps:** stage 3 `core-screens` (needs its own history folder).

**Entry points:** `docs/stages/02-domain/` (PRD, TRD, RESULT), `src/domain/`,
`tests/domain/`.
