# Stage 7 PRD: word-list

Status: **approved by the owner** (2026-11-22): slug `word-list`; taps apply
**at once**, in the new list **and in My words** (no draft, no «Сохранить»).
Project PRD: [../../PRD.md](../../PRD.md) — "full word list by level" (was a
later stage).

## Goal

See all 133 verbs by level and put any word into study (or take it out) with
one tap — without going through the Test.

## User stories

1. From the menu («Все слова») I open the list; it starts on my level; I can
   switch to any of the 4 levels.
2. Each row: «go — went — gone», translation, a status button: «учу»,
   «выучено» or «+ учить» (new or "не учить").
3. Tap «+ учить» → the word is in study at once; tap «учу» → it leaves study
   at once. A second tap brings back exactly what was there before (also the
   word's progress), as long as I stay on the screen.
4. Tap «выучено» → the word goes back to study (typing step, from the start of
   the step) — «повторить»; a second tap makes it learned again.
5. My words: a tap cycles учу → выучено → не учить → учу **at once**; a word I
   set to «не учить» stays visible until I leave the screen, so I can tap it
   back; coming back to the original status restores the original progress.
6. All changes are saved like any progress (VK Storage, all devices).

## Acceptance criteria

- Rules above covered by tests (both lists, the restore of the original on a
  second tap, learned → study step 2 box 0, list order and level counts).
- The list keeps its scroll position and keyboard focus after a tap.
- Matches the existing look (rows like My words); `make build` passes,
  coverage ≥70%.

## Out of scope

- Search (bot feature, later), paging (all rows on one screen; at most 78).
