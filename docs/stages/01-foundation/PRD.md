# Stage 1 PRD: foundation

Status: **approved by the owner** (2026-11-21).
Project PRD: [../../PRD.md](../../PRD.md), stage 1.

## Goal

An empty game runs inside VK, and the whole path "code → tests → build →
VK" works, by hand and from CI. Every later stage only adds features on top;
none of them has to touch tooling, deploy or the platform basics again.

## Why first

The risky, platform-specific parts (VK Bridge init, VK Storage, VK hosting,
CI token) are checked on a tiny game before any real logic depends on them.
If something in VK works differently from the docs, we learn it here.

## User stories

1. **Owner, local dev.** I run `make dev` and open the game in a normal
   browser; it works without VK (progress is kept in the browser).
2. **Owner, testing inside VK.** I can open the game from my machine inside
   VK (phone and desktop) to test before a deploy.
3. **Owner, deploy by hand.** I run `make deploy`; tests and lint run first,
   and if they pass the new build is on VK hosting.
4. **Owner, deploy from CI.** I push a `v*` tag; GitHub Actions does the same
   as `make deploy`. A failing test stops the deploy.
5. **Player.** I open the game in VK and see a start screen in Russian
   without errors, on phone and desktop, portrait and landscape.
6. **Player, progress kept.** The start screen shows "Вы открыли игру N раз".
   N grows on each open and is the same on my phone and my computer
   (it is saved in VK Storage). This is a test of storage, not a feature.
7. **Owner, data in place.** The verb list is in the repo, and the start
   screen shows how many verbs are loaded (133).

## Acceptance criteria

- All 5 Makefile targets work: `dev`, `test`, `lint`, `build`, `deploy`.
- `make test` runs Vitest with a coverage report and fails below 70%.
- `make lint` runs ESLint (with `--fix`) and the TypeScript type check.
- `make build` = test + lint + production build; fails if any step fails.
- `make deploy` puts the build on VK hosting; a `v*` tag does the same in CI;
  the VK token is only in GitHub secrets / the owner's machine, never in git.
- Inside VK: `VKWebAppInit` is sent; no errors in the console on start.
- Outside VK: the game still starts, using a local storage fallback.
- The open counter survives a reload and shows the same value on a second
  device logged in to the same VK account.
- The platform code sits behind a small port with a fake for tests; the start
  screen does not import VK Bridge directly.
- `data/verbs.json` is a copy of the bot's file; the start screen shows 133.
- First load (gzipped JS + CSS + HTML, without `verbs.json`) is at most
  **100 KB**.
- README says how to run, test and deploy, and what the owner must set up
  once in VK and GitHub.

## Needs from the owner (one-time)

- A VK app (mini app / game) created in the VK developer console, its
  `app_id`.
- An access token for `vk-miniapps-deploy` (local) and the same as the
  `MINI_APPS_ACCESS_TOKEN` secret in the GitHub repo.
- A GitHub repo for this project (remote for CI).

## Out of scope

- Any domain logic (stage 2), real screens and theme (stage 3).
- Leaderboard, sounds, animations, moderation (stages 5–6).
- CI on pull requests (only the tag deploy was chosen).
- Yandex / OK implementations of the port.
