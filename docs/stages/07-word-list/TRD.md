# Stage 7 TRD: word-list

Status: written and implemented with the PRD (2026-11-22).

## Domain (`src/domain/my-words.ts`, replaces the draft API)

```ts
interface EditArgs { base: string; original: WordProgress | undefined }
interface MyWords {
  studyBases(): string[]              // stored study + learned, alphabetical
  items(bases: string[]): MyWordsItem[]
  levelItems(level: Level): MyWordsItem[]   // basesOf(level), alphabetical
  cycle(args: EditArgs): void         // My words: study → learned → skipped → study
  toggleStudy(args: EditArgs): void   // Word list: study ↔ not study
}
```

`original` = the word's entry when it was first touched on this screen
(controller keeps a per-visit map). A new status equal to the original
status → the original entry comes back (mode / box kept). Otherwise:
study from learned → `{study, 2, 0}`; study from new / skipped →
`{study, 0, 0}` (Learn starts it at step 1); learned → `{learned, 2, 5}`;
skipped → `{skipped, 0, 0}`; not-study in the word list when the original was
study → entry deleted ("new").

`Draft`, `toggle`, `commit` are removed (owner: no draft).

## Controller / UI

- Screen `word-list`; actions `openWordList()`, `wordListLevel(level)`,
  `wordListToggle(base)`; My words actions `myWordsToggle(base)` (now
  instant), `myWordsSave` / `myWordsCancel` removed.
- `openMyWords()` snapshots `studyBases()`; the screen lists that snapshot.
- Per-visit `originals` map, reset on opening either list.
- `show()` keeps `#app` scroll and focus (by `data-key`) when the same screen
  is re-rendered.
- `screens/word-list.ts`: back bar, level `<select>` (with counts), rows as
  in My words (status chip: «учу» / «выучено» / «+ учить»).
- Menu: row «Все слова · 133» under «Мои слова».
