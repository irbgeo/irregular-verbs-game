# Stage 5: arcade

**Status:** done — owner checked inside VK on 2026-11-22: all OK.

**Goal:** 60 s button round, score with x2 / x3, −3 s per mistake, personal
best, Leitner in the background.

**Decision:** VK leaderboard needs the server method `secure.addAppEvent`
(service key, only after catalog publication); `VKWebAppShowLeaderBoardBox`
`user_result` is display only (dev.vk.ru, 2026-11-22). Per project PRD option
A fallback → personal best only in v1; leaderboard = later stage with a small
server.

**Entry points:** `docs/stages/05-arcade/`.

**Next steps:** owner checks in VK → stage 6 `polish-release` (sounds,
animations, moderation checklist, icons are ready in `assets/logo/`).
