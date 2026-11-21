# Decisions

- **Multi-variant rule A** (owner, 2026-11-21): any one variant or all
  together, for every verb — as the bot's code since commit `05e6c44`. The
  bot's USER_GUIDE and `was-were-only-both` spec are out of date; the first
  version of the stage PRD copied the old rule from them and was corrected.
- **Target ≠ anchor** (owner approved): fixes the bot's bug.
- **Test level from settings** (owner approved): no level question per Test.
- **Rules, not the Telegram flow** (owner approved): flows return steps;
  pagination, screens, callbacks are UI; My words draft is not persisted.
- Learn choice buttons: as many as the bot builds (usually 5); project PRD
  wording "4 buttons" for Learn corrected. Arcade keeps "4 buttons" (owner's
  Arcade decision) — how to cut to 4 is stage 5.
- Test overwrites progress of a word on wrong / hint (study, mode 1, box 0),
  as the bot — kept; owner was told and did not object.
