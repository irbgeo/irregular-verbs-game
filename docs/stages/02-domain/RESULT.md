# Stage 2 RESULT: domain

Status: **done** (2026-11-21).

## Done

`src/domain/` — the bot's learning rules as a pure TS module:

| File | What |
|---|---|
| `types.ts` | all domain types, `Progress` (JSON-safe), step results, argument structs |
| `catalog.ts` | `newCatalog`, `levels`, `basesUpTo` (cumulative), `allBases` |
| `check.ts` | `matchForm`, `checkAllFormsOrdered` (backtracking), `checkTarget`, `formVariants`, `formValue` |
| `ladder.ts` | `applyLadder` (Leitner) |
| `options.ts` | `formOptions` (choice buttons) — for Learn and later Arcade |
| `pick.ts` | `pickLearnWord`, `learnPool`, `pushRecent` |
| `progress.ts` | `newProgress`, `isOnboarded`, `isVariant`, `isLevel`, `setStudy`, `setSkipped`, `feedbackFor` |
| `test-flow.ts` | `newTestFlow`: start / current / answer / hint / skip / keep / drop |
| `learn-flow.ts` | `newLearnFlow`: start / current / choose / type / reveal |
| `my-words.ts` | `newMyWords`: items / toggle / commit |
| `rng.ts` | `mathRng`, `shuffle` |

ESLint forbids `src/domain/` to import `platform`, `ui` or `@vkontakte/*`.

## How it was checked

- `make build`: 163 tests pass (142 in `tests/domain/`); coverage of the
  whole project 96.4% statements / 90.5% branches; ESLint and `tsc` clean.
- Every bot test in the TRD mapping table has a counterpart in
  `tests/domain/` (`check`, `rules`, `test-flow`, `learn-flow`, `my-words`,
  `progress`, `catalog` test files).
- Real data: `get` (gb `got` / us `gotten`), `leap` (gb `leapt` / us
  `leaped`), `burn` checked against `data/verbs.json`; data invariants of the
  bot pass on our copy.
- Import ban checked with a temporary file importing `../platform/detect`
  (ESLint error as expected).
- Code review of the stage diff: duplicated round guard extracted; a guard
  for a saved round whose word was removed; method chains split into named
  steps; one function moved to a one-struct parameter (owner's rule).

## Deviations from the TRD

- `feedbackFor` lives in `progress.ts` (no separate file needed).
- Learn `choose` / `type` / `reveal` without a session return `empty`
  instead of throwing; Test methods without a session throw (the UI always
  starts a Test first).
- One test assumption of mine was wrong and fixed to match the bot:
  `matchForm("was was", [was, were])` is **false** (neither one variant nor
  the full set).

## Known issues / notes for later stages

- `LearnFlow.current()` resumes the saved round even if the word was changed
  in My words meanwhile (e.g. skipped). Stage 3 should call `start()` when the
  player opens Learn from the menu, and `current()` only to restore after a
  reload.
- The bot's own `USER_GUIDE.md` still describes the old was/were rule and the
  bot still has the anchor = target bug — outside this project.
- `formOptions` gives a varying number of buttons (4–6 on the fixtures); the
  Arcade's "4 buttons" rule is decided in stage 5.

## For the next stage (3)

- Save `Progress` as a whole; it has `version: 1` for later migrations.
  Validate it when loading (`isVariant`, `isLevel`), because saved data comes
  from outside.
- VK Storage value limit is 4096 chars: measure a full `Progress` (133 words)
  in the stage 3 TRD before choosing the save scheme.
