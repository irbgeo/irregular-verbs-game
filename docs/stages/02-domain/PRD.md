# Stage 2 PRD: domain

Status: **approved by the owner** (2026-11-21), with changes 1–3.
Project PRD: [../../PRD.md](../../PRD.md), stage 2.

## Goal

All learning rules of the bot work in TypeScript as a pure module: no UI, no
VK, no storage. Stages 3–5 only call it and draw the result. The bot's tests
are ported, so the game behaves like the bot.

## Why now

Rules are the core of the game and the riskiest part to get wrong (answer
check, Leitner ladder). They do not depend on VK, so they can be built and
fully tested before any screen exists.

## Source of truth

The bot repo `../irregular-verbs-tgbot`: `internal/service/*.go` and its tests,
`docs/USER_GUIDE.md`, `docs/superpowers/specs/`. **The code and its tests
win over the docs**: the bot's `USER_GUIDE.md` and the spec
`2026-06-29-was-were-only-both-design.md` are out of date — commit `05e6c44`
(2026-07-06) dropped the was/were special case (owner confirmed rule A on
2026-11-21).

## What the module must do

### Catalog
- Load the 133 verbs from `data/verbs.json`; 4 levels in order elementary →
  pre-intermediate → intermediate → upper-intermediate.
- "Cumulative level": a level plus all earlier levels.
- Forms by variant (`gb` / `us`); a form may have several variants
  (`was/were`, `burnt/burned`).

### Player settings
- Variant `gb` / `us` and level, both chosen at first run and changeable
  later.

### Answer check (typed input)
- Any non-letter separates forms; optional leading "to" on the infinitive;
  case and extra spaces ignored; no typo tolerance.
- Multi-variant form (`was/were`, `burnt/burned`, `hung/hanged`, …): **any
  one variant or all of them together** (any order inside the group), the
  same for every verb. In the 3-form answer an ambiguous token (a past
  variant that also spells the participle) is tried both ways.
- Test: all 3 forms in order base → past → participle; an extra or missing
  form is wrong.
- Learn mode 2: one form (the target).

### Test
- Words of the player's cumulative level, in random order.
- For each word: answer 3 forms, or **hint**, or **skip**.
- Correct → the player chooses "to study" or "skip".
- Wrong or hint → the word goes to study; the right forms are shown.
- At the end: a result (how many correct / wrong / hint / skipped).

### Learn (Leitner)
- Word pick: 90% study / 10% learned; the last 5 words are not repeated while
  others exist; if one group is empty, the other is used.
- Nothing to learn → an "empty" result (the UI suggests the Test).
- A study word added from My words starts at mode 1 (the bot's "mode 0" fix).
- Round: anchor = one random form; target = **another** form (see change 1).
- Mode 1 (choice): buttons = every variant of the correct form + every
  variant of the word's two other forms + up to 2 of its common mistakes, no
  duplicates, shuffled. Any variant of a multi-variant form counts.
- Mode 2 (typed): answer checked as above.
- Ladder: box 0–5 per mode; correct +1, wrong or "show" → box 0; mode 1 box 5
  → mode 2 box 0; mode 2 box 5 → learned; learned word wrong on review →
  study, mode 2, box 0.

### My words
- List of study and learned words, alphabetical (skipped words hidden).
- Tap cycles the status: study → learned → skipped → study.
- Changes are a draft: applied on confirm, dropped on cancel.

### State
- All player progress (settings, word statuses / modes / boxes, an unfinished
  Test or Learn session if any) is one plain object that can be turned into
  JSON and back. The module never saves it; stage 3 decides how.

## Changes from the bot (need owner approval)

1. **Target is always a different form from the anchor.** In the bot both
   are picked at random independently, so in about 1 of 3 rounds it shows
   `went` and asks for the past form. The bot's spec says "another form" —
   this is a bot bug; the game fixes it. (Fixing the bot itself is outside
   this project.)
2. **Test uses the level from settings.** The bot asks for the level every
   time; the game sets it at first run and in Settings (PRD §3.5), so Test
   starts at once.
3. **Rules, not the Telegram flow, are ported.** The bot's service is a
   Telegram state machine (screens, button callbacks, pages of 10 words). The
   game keeps every rule but not the Telegram shapes; pagination and screens
   belong to the UI. Rule tests are ported case by case; flow tests are
   rewritten for the new API with the same cases; Telegram-only tests are not
   ported.

## Acceptance criteria

- Every rule above has tests; each relevant bot test case has a ported
  counterpart (mapping table in the TRD).
- Coverage ≥70% on the module (target: close to 100%, it is pure logic).
- The module imports nothing from `src/platform`, `src/ui` or VK Bridge.
- Randomness is injectable, so tests are deterministic.
- The state object survives `JSON.stringify` → `JSON.parse` unchanged.
- `make build` passes.

## Out of scope

- Screens and storage (stage 3); XP, day streak, achievements (stage 4);
  Arcade rules (stage 5 — it will reuse the choice-button builder from here).
- Bot features not in v1: reminders, search, full word list by level,
  Mongo seeding.
