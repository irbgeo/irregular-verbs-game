# Notes

- dev.vk.com could not be fetched by tools; dev.vk.ru has the same docs and
  worked (StorageSet/Get, hosting overview, config-file, ci, VKWebAppInit).
  The vk-tunnel page is 404 on dev.vk.ru.
- TypeScript 7.0 is out, but typescript-eslint 8.x peer range is
  `>=4.8.4 <6.1.0` → pinned 6.0.3.
- Versions picked: newest stable release older than 2 weeks (supply-chain
  caution); see TRD §1.
- `vk-miniapps-deploy` postinstall only prints a deprecation warning for
  <1.0.0; npm warns it is not in allowScripts — harmless.
- Global `~/.gitignore` ignores `.claude/` → add history with `git add -f`.
- VK games setup (dev.vk.ru/ru/games/getting-started, launch-game,
  settings/general/information, settings/test-groups, settings/moderation):
  - create at dev.vk.com/ru/admin/apps-list → «Создать приложение» → type
    «Игра» → genre → name; confirm in the VK mobile app;
  - unpublished game: «Размещение» → «Состояние» «Отключено» = admins only;
    «Режим разработки» + test URL = admins only; «Тестовые группы» give
    testers their own URL (it wins over dev mode URL);
  - pages placement, hosting, managers, catalog/moderation returned HTTP 500
    on 2026-11-21 — service-key location not confirmed in the games section.
