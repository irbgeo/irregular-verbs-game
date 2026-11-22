# Stage 7: word-list

**Status:** active — code done and checked locally; waiting for the
owner's check inside VK (RESULT.md "Waiting").

**Goal:** all words by level; one tap puts a word into study or takes it out.

**Owner decisions (2026-11-22):** slug `word-list`; taps apply at once — in
the new list AND in My words (the bot's draft + «Сохранить» is dropped).
To keep accidental taps harmless: per-visit memory of the original entry;
a second tap restores it (with progress); My words keeps the visit's word
list visible until leaving.

**Entry points:** `docs/stages/07-word-list/`.
