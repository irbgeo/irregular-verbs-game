# PRD: Irregular Verbs — browser game

Status: **approved by the owner** (2026-11-21), stage slugs confirmed.
Decisions were collected with the owner in brainstorming sessions on
2026-11-21. This file is the single source of truth for the project.

## 1. Goal

A small, fast HTML5 game for drilling English irregular verbs (3 forms), for
Russian-speaking learners. It is a port of the working Telegram bot
`../irregular-verbs-tgbot` (Go) plus a game layer: points, day streak,
achievements and a timed Arcade mode with a leaderboard.

Success for v1: the game passes VK moderation, is in the VK Games catalog, and
a player can go from first run to "learned" words using only the game.

## 2. Audience and platform

- Players: Russian-speaking school students and adults learning English,
  mostly on phones, also desktop.
- **v1 platform: VK Games** (VK Mini Apps, VK Bridge) — mobile apps and web.
- Later platforms (separate stages): Yandex Games, OK (Odnoklassniki).
- **Out of scope for this project:** CrazyGames, Poki and other foreign
  portals — the owner plans a different game for them.
- UI language: Russian. Code, comments and docs: English.

## 3. Scope of v1

### 3.1 Data
- `data/verbs.json` copied from the bot repo (133 verbs; levels elementary 78,
  pre-intermediate 16, intermediate 33, upper-intermediate 6). No sync; copy
  again by hand when the bot's file changes.
- Each verb: base, past and participle per variant (`gb` / `us`, several
  forms possible), Russian translations, common mistakes.

### 3.2 Domain rules (ported from the bot, its Go code and tests are the truth)

Before designing a flow, read in the bot repo: `CLAUDE.md`,
`docs/USER_GUIDE.md` (full user-facing behaviour, Russian) and
`docs/superpowers/specs/` (per-feature design docs). Where the rules live
(~1 500 lines of logic in `internal/service/`):

| Rule | Bot file |
|---|---|
| Verb catalog | `verbs.go`, `data/verbs.json` |
| Answer check | `check.go` |
| Test | `test_flow.go` |
| Learn / Leitner | `learn.go` |
| My words | `lists.go` |
| Onboarding (variant, level) | `onboarding.go` |
| Search (not v1) | `search.go` |

Port the tests (`internal/service/*_test.go`) to Vitest together with the
logic.

- **Answer check**: any non-letter separates forms; optional leading "to";
  case and spaces ignored; no typo tolerance; multi-variant forms as in the
  bot (`docs/USER_GUIDE.md` §3, `was-were-only-both` spec).
- **Test**: words of the chosen level and all earlier levels; the player types
  all 3 forms; wrong or hint → word goes to study; correct → "to study" or skip.
- **Learn (Leitner)**: box 0–5 per mode; correct +1, wrong or "show" → box 0.
  Mode 1 = 4 choice buttons (correct form, the word's other forms, its common
  mistakes); mode 1 box 5 → mode 2 (typed); mode 2 box 5 → learned. A learned
  word answered wrong on review → study, mode 2 box 0. Pick: 90% study / 10%
  learned, 5-word cooldown. Anchor = one random form, target = another form.
- **My words**: study + learned words; status cycle study → learned →
  skipped; changes staged and applied on confirm.

### 3.3 Game layer (Learn and Test)
- XP: +5 correct choice (mode 1), +10 correct typed (mode 2), +20 when a word
  becomes learned. Wrong answers never take XP away.
- Day streak: at least 1 answer per calendar day; a missed day resets it; no
  freeze, no paid/ad rescue.
- Level progress: one bar per level, "learned X of Y".
- 8 achievements: first learned word; 10 / 50 / 100 learned; a whole level
  learned; streak 3 / 7 / 30 days.

### 3.4 Arcade
- 60-second round; questions are 4 choice buttons (anchor form → pick the
  target form); words = chosen level + all earlier levels.
- Score: +10 per correct; streak multiplier x2 from 5 correct in a row, x3
  from 10; a wrong answer resets the streak and costs −3 s.
- Arcade answers update Leitner boxes like Learn (correct +1, wrong → box 0).
- Arcade score is separate from XP. Personal best is saved.
- One VK leaderboard of Arcade score (`VKWebAppShowLeaderBoardBox`) **if**
  results can be recorded from the client without a server. If not, v1 shows
  the personal best only and the VK board moves to a later stage.

### 3.5 Screens
1. First run — choose GB/US variant and start level.
2. Main menu — Test, Learn, Arcade, My words, Progress, Settings.
3. Test.
4. Learn (mode 1 buttons, mode 2 typed; XP shown per answer).
5. Arcade — round, then result (score, personal best, leaderboard button).
6. My words.
7. Progress — XP, day streak, level bars, achievements.
8. Settings — variant, level, sound on/off, reset progress (with confirm).

### 3.6 Input on phones
Typing stays everywhere it is in the bot (Test, Learn mode 2): autocorrect,
autocapitalize and spellcheck off; Enter submits; the layout does not jump when
the keyboard opens; Test uses one field, forms separated by spaces.

### 3.7 Look and sound
Flat simple style, big buttons, one bright accent, no characters; light and
dark theme from the player's VK scheme; CSS-only animations (green on correct,
shake on wrong, streak pulse, achievement toast); 4 short sounds (correct,
wrong, round end, achievement) with an on/off switch, muted when the tab is
hidden; system font.

### 3.8 Progress storage
- VK Storage via VK Bridge (`VKWebAppStorageGet/Set`), per VK user, works
  across devices. No own server.
- Known limits: 1000 keys per user, 1000 calls per hour per user, values live
  1 year. → Saves are batched (not after every answer); the exact scheme and
  value-size limit are settled in the TRD.

## 4. Non-goals for v1

- Ads (a later stage, if the game gets players).
- Reminders / push (no channel on the platform).
- Any link with the bot: no shared backend, no account linking.
- Full word list by level and search (a later stage).
- English UI (nice to have, later).
- Own server of any kind.

## 5. Constraints and technical decisions

| Topic | Decision |
|---|---|
| Stack | TypeScript + Vite, plain DOM + CSS, no framework (no VKUI/React), no game engine |
| Platform | `@vkontakte/vk-bridge` behind a small platform port (init, storage, leaderboard, theme, visibility); tests use a fake; Yandex/OK later are new implementations of the same port |
| Architecture | Pure domain logic (no UI, no SDK imports) → UI layer renders it; same split as the bot |
| Tests | Vitest; bot tests from `internal/service/*_test.go` ported with the logic; TDD; coverage ≥70% on changed code |
| Code style | Owner's global rules (`~/.claude/rules/code-style.md`) applied to TS |
| Bundle | Small: fast first load on mobile is a priority |
| Repo | Separate repo (this one), not a monorepo with the bot |
| Logic | Rewritten from Go to TS, not compiled |

Rejected alternatives:

| Alternative | Why rejected |
|---|---|
| Go → WASM (reuse bot code as is) | 2–5 MB bundle and slow start; platforms check load time, mobile players leave on slow loads |
| Phaser or another game engine | +~1 MB, awkward text input and lists — the game is mostly forms and buttons |
| VKUI / React | Heavy for a game, ties the UI to VK, useless on Yandex/OK |
| Monorepo with the bot | Different toolchain and deploy; would mean moving the working bot into `bot/` and risking its deploy |
| One repo, a branch per product | Branches drift; no shared code is gained |
| Shared backend / account link with the bot | Needs a server; separate products, separate players |
| Sync of `verbs.json` with the bot | Changes rarely; a manual `cp` is enough |
| Playgama Bridge (one SDK for many platforms) | We need ~5 platform functions; own port is smaller and clearer; its platform list is unclear |

## 6. Deployment

- Hosting: VK Mini Apps hosting.
- Tool: `@vkontakte/vk-miniapps-deploy` with `vk-hosting-config.json`.
- Local: `make deploy` (test → lint → build → deploy).
- CI: GitHub Actions runs the same on a `v*` tag; `MINI_APPS_ACCESS_TOKEN` in
  GitHub secrets.
- Makefile targets: `dev`, `test`, `lint`, `build`, `deploy`.
- Catalog: first release is sent to VK moderation by hand in the VK app
  settings.

## 7. Stages

Each stage gets `docs/stages/NN-<slug>/` with PRD.md → TRD.md → code →
RESULT.md. Slugs below are confirmed by the owner.

| # | Slug (proposal) | Goal | In the stage | Done when | Depends on |
|---|---|---|---|---|---|
| 1 | `foundation` | An empty game runs inside VK | Vite + TS + Vitest + ESLint setup, Makefile (5 targets), GitHub Actions deploy on tag, platform port + fake + VK implementation of init and storage, `verbs.json` copied, "hello" screen on VK hosting | `make deploy` and a `v*` tag both put the screen into VK; storage round-trip works in VK | — |
| 2 | `domain` | Bot logic in TS | Verb catalog, answer check, Test flow, Learn/Leitner, My words — pure TS with ported bot tests | All ported tests pass; coverage ≥70%; no UI/SDK imports in the domain | 1 |
| 3 | `core-screens` | Playable like the bot | Screens 1–4, 6, 8 (first run, menu, Test, Learn, My words, Settings without sound), base styles + light/dark theme, mobile input rules, batched saves to VK Storage | A player can learn words end to end in VK on phone and desktop; progress survives reload and another device | 2 |
| 4 | `game-layer` | Motivation on top of learning | XP, day streak, level bars, 8 achievements, Progress screen (7) | Rules of §3.3 covered by tests and visible in VK | 3 |
| 5 | `arcade` | Timed mode with a board | Arcade round, score and multiplier, −3 s, Leitner updates, personal best, VK leaderboard or the fallback | Rules of §3.4 covered by tests; round playable in VK; leaderboard decision recorded in RESULT | 3 |
| 6 | `polish-release` | Ready for the catalog | Animations, 4 sounds + switch, mute on hidden tab, check against VK moderation rules, icons/description, send to moderation | Game is accepted into the VK Games catalog | 4, 5 |

Later stages (not v1, order to decide then): ads; Yandex Games port (incl.
guest/auth question); OK port; word list and search; English UI.

## 8. Open questions (settled in the TRD of the named stage)

- Value-size limit of VK Storage and the save scheme (stage 1 / 3).
- Can a leaderboard result be recorded from the client without a server
  (stage 5).
- Exact VK moderation checklist for games, current version (stage 6).
- Sound files: source and license (stage 6).

## Appendix A. Yandex Games notes (for the later Yandex stage)

Collected 2026-11-21; verify every item against the current docs before use:
https://yandex.ru/dev/games/doc/ru/

- Build is a static bundle: `index.html` at the **root of a zip**, uploaded by
  hand in the developer console as a draft, then sent to moderation (usually
  3–5 working days). No public upload API — only build + zip can be automated
  (e.g. `make release` → `release/game-<version>.zip`).
- SDK: `<script src="/sdk.js">`, `YaGames.init()`; call
  `ysdk.features.LoadingAPI.ready()` when the game is playable.
- Progress: `ysdk.getPlayer()` → `getData` / `setData`. Must work for guests
  (not logged-in players) and keep their progress. Login via Yandex ID
  (`ysdk.auth.openAuthDialog()`) only on the player's action — decide whether
  to offer it for cross-device progress.
- Language: `ysdk.environment.i18n.lang`.
- Payments only through the SDK. Ads (if used): fullscreen between rounds,
  rewarded video; pause the game and mute sound during ads and when the tab is
  hidden.
- Leaderboards are created in the console first.
- Must work on mobile and desktop, portrait and landscape.
- Local testing: the console's debug mode loads the game from `localhost`.
- Monetization: "single license scheme" (ads + in-app purchases in one
  agreement); self-employed form available.
