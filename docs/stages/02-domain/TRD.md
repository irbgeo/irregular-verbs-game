# Stage 2 TRD: domain

Status: **approved by the owner** (2026-11-21).
Stage PRD: [PRD.md](PRD.md). Bot source: `../irregular-verbs-tgbot/internal/service/`.

## 1. Shape

The bot's service is a Telegram state machine: every call loads the user,
mutates it, saves it and returns a `View` (screen enum). The game keeps the
**rules** and drops the Telegram shape:

- One plain, JSON-safe `Progress` object holds everything about the player.
- Three small flow objects (`TestFlow`, `LearnFlow`, `MyWords`) change a
  `Progress` in place and return a step result for the UI. They never save;
  stage 3 saves `Progress` after a step.
- Pure functions for the rules (check, ladder, options, pick) are exported on
  their own, so stage 5 (Arcade) reuses them.
- Randomness: `Rng = (n: number) => number` returning `[0, n)`, passed to
  constructors (default: `Math.random`). Tests pass a scripted sequence, like
  the bot's `seqRng`.

## 2. Files (`src/domain/`)

| File | Contents |
|---|---|
| `types.ts` | `Verb`, `Level`, `Variant`, `FormKind`, `WordStatus`, `WordProgress`, `Progress`, sessions, step results, `Feedback`, argument structs |
| `catalog.ts` | `newCatalog(verbs)`: `verb(base)`, `levelsUpTo(level)`, `basesUpTo(level)`, `allBases` (level order, then alphabetical — as the bot) |
| `check.ts` | `tokensOf`, `matchForm`, `checkAllFormsOrdered`, `checkTarget`, `formValue`, `formVariants` |
| `progress.ts` | `newProgress()`, `isOnboarded`, `setSettings`, `setStudy`, `setSkipped` |
| `ladder.ts` | `applyLadder(word, ok)` — Leitner transition |
| `options.ts` | `formOptions(...)` — choice buttons |
| `pick.ts` | `pickLearnWord(...)`, `pushRecent` |
| `test-flow.ts` | `newTestFlow(catalog, progress, rng)` |
| `learn-flow.ts` | `newLearnFlow(catalog, progress, rng)` |
| `my-words.ts` | `newMyWords(catalog, progress)` |
| `rng.ts` | `Rng` type, `mathRng`, `shuffle` |

Rule from PRD: nothing in `src/domain/` imports `src/platform`, `src/ui` or
VK Bridge (checked by an ESLint `no-restricted-imports` rule on that folder).

## 3. Data model

```ts
type Level = 'elementary' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate'
type Variant = 'gb' | 'us'
type FormKind = 'base' | 'past' | 'participle'
type WordStatus = 'study' | 'learned' | 'skipped'   // "new" = no entry

interface WordProgress {
  status: WordStatus
  mode: 0 | 1 | 2     // 0 = added from My words, not started yet
  box: number         // 0..5
}

interface Progress {
  version: 1
  settings: {
    variant: Variant | null
    level: Level | null
  }
  words: Record<string, WordProgress>   // base → progress
  test: TestSession | null              // unfinished Test
  learn: LearnSession | null            // Learn cooldown + current round
}

interface TestSession {
  base: string          // current word
  queue: string[]       // remaining words
  awaitingChoice: boolean   // answered correctly, waiting "to study"/"skip"
  counts: {
    correct: number
    incorrect: number
    hint: number
    skipped: number
  }
}

interface LearnSession {
  recent: string[]      // last 5 bases
  round: Round | null
}

interface Round {
  base: string
  anchor: FormKind
  target: FormKind      // never equal to anchor
  options: string[]     // mode 1 buttons; [] for typed mode
}
```

The current round is stored, so a reload shows the same question.
The My words draft is **not** in `Progress`: it lives only while the screen is
open (the bot stored it because a bot has no screen memory).

## 4. Flows

```ts
// Feedback: what to show after an answer (UI owns the wording).
interface Feedback {
  result: 'correct' | 'hint' | 'incorrect'
  addedToStudy: boolean
  base: string
  past: string[]
  participle: string[]
  translations: string[]
}

type TestStep =
  | { kind: 'question'; base: string; feedback: Feedback | null }
  | { kind: 'choose'; feedback: Feedback }          // correct → study or skip
  | { kind: 'done'; counts: TestSession['counts']; feedback: Feedback | null }

type LearnStep =
  | { kind: 'round'; round: RoundView; feedback: Feedback | null }
  | { kind: 'empty' }
```

`RoundView` = `Round` + `format` (`'choice' | 'input'`), `anchorValue`
(forms joined by `/`, base without "to"), `repeat` (word is learned).

| Flow | Methods | Bot source |
|---|---|---|
| `TestFlow` | `start()` (uses `settings.level`, cumulative, shuffled), `current()`, `answer(text)`, `hint()`, `skip()`, `keep()`, `drop()` | `test_flow.go` |
| `LearnFlow` | `start()`, `current()`, `choose(index)`, `type(text)`, `reveal()` | `learn.go` |
| `MyWords` | `items()` (study + learned by stored status, alphabetical, with forms), `toggle(draft, base)`, `commit(draft)`; draft = `Record<base, status \| 'new'>` | `lists.go` (My words part) |

Behaviour kept exactly as the bot (all from the code, not the docs):
- Test wrong / hint → `setStudy` (study, mode 1, box 0 — overwrites old
  progress, as the bot); correct → `choose`; `keep` → `setStudy`; `drop` →
  skipped; `skip` → no write.
- Learn: `choose` only in choice format, `type` only in input format (the
  other is ignored → returns the current step unchanged); `reveal` = wrong
  with result `hint`; after any answer the ladder runs, then the next word.
- Commit: study keeps mode/box; learned → mode 2, box 5; skipped → mode 0,
  box 0; `new` → entry deleted.
- Ladder, pick (90/10, fallback, cooldown 5, ignore cooldown when it empties
  the candidates), `mode 0 → 1` on first show, options (correct variants,
  other forms' variants, ≤2 new mistakes, case-insensitive dedupe, shuffled).
- Check: any non-letter separates; optional leading `to`; case-insensitive;
  multi-variant = any one or all (order inside the group free); ordered 3-form
  check backtracks.

New compared to the bot (from the approved PRD):
- **Target ≠ anchor**: `anchor = kinds[rng(3)]`, `target = others[rng(2)]`.
- **Test level from settings**; `start()` throws if settings are not set.
- **Test counts** shown at the end (bot only said "done").

## 5. Test mapping (bot → game)

Tests live in `tests/domain/`. Each bot case is re-written in Vitest; data is
the real `data/verbs.json` or small fixtures, as in the bot.

| Bot test file | Game test file | Note |
|---|---|---|
| `catalog_test` | `catalog.test.ts` | |
| `load_test` (parse, dataset invariants, clean mistakes) | `data.test.ts` | runs on our copy of `verbs.json` |
| `match_form_test`, `all_forms_test`, `all_forms_ordered_test`, `base_to_test` | `check.test.ts` | all cases 1:1 |
| `learn_check_test` (formValue, checkTarget, options, dedupe), `learn_choice_variants_test` (option split) | `options.test.ts`, `check.test.ts` | |
| `learn_ladder_test` | `ladder.test.ts` | 7 cases 1:1 |
| `learn_test` (pool, pick) | `pick.test.ts` | 6 cases 1:1 |
| `learn_round_test` | `learn-flow.test.ts` | `PicksFormsOnly` changes: target from the 2 other kinds |
| `learn_flow_test`, `learn_edge_test`, `learn_mode0_test`, `learn_repeat_test`, `learn_choice_variants_test` (choose any variant) | `learn-flow.test.ts` | same cases on the new API |
| `test_flow_test`, `test_answer_test`, `test_result_test` | `test-flow.test.ts` | same cases; `OpenTestShowsLevels` / `RejectsUnknownLevel` become "start uses settings level / throws without settings" |
| `onboarding_test` | `progress.test.ts` | variant + level instead of variant only |
| `lists_test` (`EffectiveStatus`), `lists_edit_test` (My words cases), `lists_builders_test` (`BuildMyWordsView`), `lists_forms_test` | `my-words.test.ts` | |
| — | `progress.test.ts` | new: JSON round-trip; new: target ≠ anchor over many seeds; new: Test counts |

Not ported (feature not in v1 or Telegram-only): `reminder_test`,
`search_test`, `search_flow_test`, `seed_test`, `lists_nav_test` (pages,
back navigation), `lists_test` (`PageBounds`), word-list cases of
`lists_edit_test` / `lists_builders_test` (full word list is out of v1),
`ToggleSetsSelectedInfoAndNavClears` (Telegram info block).

## 6. Checks at the end

- `make build` passes; coverage of `src/domain/` close to 100%.
- Every row of §5 has its test file; not-ported list matches.
- ESLint import restriction on `src/domain/` is active.
- Bot behaviour checked by hand on a few real verbs (`be`, `get` gb/us,
  `burn`, `leap`) against the bot's answers.

## 7. Risks

- Bot docs are out of date in places (was/were): code + tests are the truth;
  any other conflict found during porting is written in RESULT.md.
- `Progress` shape becomes the saved format in stage 3; `version: 1` is there
  so a later change can migrate old saves.
