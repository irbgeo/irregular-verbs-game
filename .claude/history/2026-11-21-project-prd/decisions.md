# Decisions

Product and technical decisions with rejected alternatives are in
`docs/PRD.md` (§5 and the stage table). Only the "why" behind turns of the
discussion is kept here.

- **v1 platform switched from Yandex Games to VK.** The brief was written for
  Yandex; the owner said Yandex Games is not available to them right now. The
  platform port must therefore support several platforms from day one;
  Yandex and OK are later stages.
- **Foreign portals (CrazyGames, Poki, GamePix) out of scope.** Not because of
  terms: the owner plans a different game for them. English UI stays "nice
  to have" only.
- **Telegram Mini App rejected for now.** The bot already lives in Telegram;
  a second product there would compete with it, and Stars / ads monetization
  is weak.
- **No ads in v1.** Owner: add ads only if the game gets players.
- **Leaderboard: option A** (VK board from the client, fallback to personal
  best) chosen over adding a small server — "no server" is kept.
- **Release: option B** (local `make deploy` + GitHub Actions on `v*` tag)
  over local-only or CI-tests-only.
- **Docs rule:** brainstorming output goes into `docs/PRD.md` and
  `docs/stages/NN-<slug>/`, not `docs/superpowers/specs/` or task history
  (task-history.md rule updated to match).
