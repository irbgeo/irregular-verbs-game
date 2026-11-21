# Notes

- VK facts come from web search, not yet checked on dev.vk.com:
  - storage: 1000 keys / user, 1000 calls / hour / user, values live 1 year;
    value-size limit not found;
  - leaderboard results may need the server method `secure.addAppEvent`
    (service token, only after moderation) — check in stage 5 TRD;
  - `VKWebAppInit` is mandatory; hosting via `@vkontakte/vk-miniapps-deploy`.
- The bot has `learn_mode0_test.go`, while the brief described only Learn
  modes 1 and 2 — clarify in stage 2 TRD what "mode 0" is.
- Bot data: 133 verbs (elementary 78, pre-intermediate 16, intermediate 33,
  upper-intermediate 6).
- Sources used in the survey:
  - https://dev.vk.ru/en/bridge/VKWebAppStorageSet
  - https://dev.vk.ru/en/games/promotion/game-mechanics/leaderboards
  - https://dev.vk.ru/en/games-catalog-rules
  - https://www.npmjs.com/package/@vkontakte/vk-miniapps-deploy
  - https://yandex.ru/dev/games/doc/ru/concepts/requirements
  - https://yandex.ru/dev/games/doc/ru/payments
