# Stage 3 PRD: core-screens

Status: **approved by the owner** (2026-11-21).
Project PRD: [../../PRD.md](../../PRD.md), stage 3.
Mockups: https://claude.ai/artifact/PLvTXW5AwVz69wJC4wGtdn (approved).

## Goal

The game is playable inside VK like the bot: a player sets up, takes the
Test, learns words to "learned" and manages My words — on phone and desktop,
with progress kept in their VK account.

## Why now

Stage 2 gave the rules; this stage puts them in front of players. After it
the game is already useful without the game layer (stage 4) and Arcade
(stage 5).

## User stories

1. **First run.** I open the game for the first time and choose British or
   American English and my level (mockup 1). Next time I go straight to the
   menu.
2. **Menu.** I see Learn (with how many words I study / learned), Test (my
   level and its word count) and My words (mockup 2).
3. **Test.** I type the 3 forms of each word of my level; I can take a hint
   or skip; after a wrong answer or hint I see the right forms and the word
   goes to study; after a correct one I choose "to study" or "I know it,
   skip" (mockups 3, 3b). At the end I see how many were correct / wrong /
   hint / skipped and go back to the menu.
4. **Learn.** I see one form and pick or type another one: buttons at
   step 1, typing at step 2, step progress as 5 marks, "show answer",
   feedback with all 3 forms after each answer, a "review" mark on learned
   words (mockups 4, 4b). With nothing to learn I am sent to the Test.
5. **My words.** I see my study and learned words with forms and
   translation, tap a status to cycle it, and save or cancel my changes
   (mockup 6).
6. **Settings.** I change the variant and the level, and I can reset all
   progress after a second confirmation (mockup 8, without the sound switch).
7. **Progress kept.** I close the game in the middle of a Test or a Learn
   round, open it again (even on another device), and continue where I was.
8. **Looks right.** The game follows the mockups, in light or dark theme as
   my VK is set; it works in portrait and landscape and on desktop.
9. **Typing on a phone.** The answer field has no autocorrect, no capital
   letter, no spellcheck; Enter checks the answer; the screen does not jump
   when the keyboard opens.
10. **Owner, testing.** I can open the game running on my machine inside VK
    (vk-tunnel, moved here from stage 1) or use the dev environment.

## Acceptance criteria

- All stories above work inside VK on a phone (VK app) and on desktop web.
- Screens match the mockups' layout, colors and sizes; buttons ≥44 px.
- Progress (settings, words, unfinished Test / Learn) survives a reload and
  is the same on a second device.
- Saving respects VK Storage limits (value ≤4096 chars, ≤1000 calls per hour
  per user): no save after every keystroke; a full player (133 words) fits.
- Saved data is checked when loaded; broken data does not crash the game
  (start fresh, keep what is valid — exact rule in the TRD).
- If VK Storage fails, the player sees a short message and can keep playing;
  nothing already saved is lost.
- Keyboard: every action is reachable with Tab / Enter on desktop.
- UI code has tests for screen logic (what is shown for a given state);
  coverage ≥70%; `make build` passes; bundle stays small (budget in TRD).

## Out of scope

- XP, day streak, achievements, Progress screen, XP chips in the menu
  (stage 4); Arcade and its menu card (stage 5); sounds, animations beyond
  simple state changes, moderation (stage 6). Menu items for them are not
  shown until their stage.
- Full word list, search, ads, English UI.
