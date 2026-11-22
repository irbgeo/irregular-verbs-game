# Stage 7 RESULT: word-list

Status: **code done and checked locally; check inside VK waits for the
owner** (2026-11-22).

## Done

- «Все слова» (`src/ui/screens/word-list.ts`): from the menu (and a link at
  the bottom of My words); starts on the player's level, a level `<select>`
  with per-level counts (78 / 16 / 33 / 6); rows «go — went — gone»,
  translation, button «учу» / «выучено» / «+ учить».
- Taps apply **at once** — in the word list and in My words (owner); the
  bot's draft and «Сохранить / Отменить» are gone (`Draft`, `toggle`,
  `commit`, `.bottom-bar` removed).
- Domain `my-words.ts`: `studyBases`, `items`, `levelItems`, `cycle`,
  `toggleStudy`; a per-visit `original` makes a second tap restore the
  word's exact entry (progress included); learned → study = typing step,
  box 0; new / skipped → study = Learn starts it at step 1.
- My words keeps the words of the visit on screen, so a word set to «не
  учить» can be tapped back before leaving.
- The same list screen re-drawn after a tap keeps its scroll position and
  focus on the tapped button.

## How it was checked

- `make build`: 312 tests pass; coverage 96.1% statements / 91.4% branches;
  ESLint + `tsc` clean; bundle JS 25.5 KB + CSS 3.2 KB gzip.
- Tests: both lists (cycle, toggle, restore of the original, learned →
  study step 2, level order), controller (instant apply, "не учить" stays
  until leaving, level switch, scroll and focus kept), screens.
- Two of my new tests were wrong and fixed: one looked for a title with the
  button finder, the focus test ran on a detached element (checked nothing).

## Waiting (owner, inside VK)

- [ ] `make deploy`; open «Все слова», switch levels, add / remove words;
      the list does not jump to the top after a tap.
- [ ] My words: tap through statuses; a «не учить» word stays until you
      leave; coming back restores progress.

## Notes

- The type name `DraftStatus` (study / learned / skipped / new) stayed for a
  smaller diff; there is no draft any more.

## Fix after the owner's look in VK (2026-11-22)

- The level `<select>` looked foreign (arrow at the very edge, system
  dropdown that CSS cannot style). Replaced in **Word list and Settings** by
  `src/ui/level-picker.ts`: a 2×2 grid of level buttons (radio group, name +
  verb count, selected = accent border and soft fill, like onboarding).
  Focus stays on the tapped button; Settings now also keeps scroll and focus
  when re-drawn. Unused `.select` style removed.
