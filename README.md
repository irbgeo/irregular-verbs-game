# irregular-verbs-game

HTML5 game for drilling English irregular verbs, for VK Games (later Yandex
Games and OK). TypeScript + Vite, no framework. Plan: [docs/PRD.md](docs/PRD.md).

## Run and test

Needs Node 24+ (Node 22.12+ also works).

```sh
npm ci
make dev      # http://localhost:5173 — outside VK, progress is kept in the browser
make test     # Vitest + coverage (fails below 70%)
make lint     # ESLint --fix + tsc type check
make build    # test + lint + production build → dist/
```

## Deploy to VK

```sh
MINI_APPS_APP_ID=<app id> make deploy
```

`make deploy` runs `make build`, then `vk-miniapps-deploy` uploads `dist/` to
VK hosting (settings in `vk-hosting-config.json`). The first run asks you to
log in to VK and saves the token in
`~/.config/configstore/@vkontakte/vk-miniapps-deploy.json`.

CI: pushing a tag `v*` runs the same in GitHub Actions
(`.github/workflows/deploy.yml`).

### One-time setup

1. Create the app in the VK developer console (https://dev.vk.com) and note
   its `app_id`.
2. Run the first `make deploy` by hand (gives the token), or take the service
   key in the app settings → Разработка → Ключи доступа.
3. In the GitHub repo:
   - secret `MINI_APPS_ACCESS_TOKEN` — the token;
   - variable `MINI_APPS_APP_ID` — the app id;
   - optional variable `MINI_APPS_ENVIRONMENT` — `production` (default) or
     `dev`. VK may ask the main admin for a confirmation code on a
     `production` deploy; if CI cannot pass it, set `dev` here and deploy
     production by hand.

### Testing inside VK from your machine

Run `make dev`, then `npx @vkontakte/vk-tunnel` and set the HTTPS address it
prints as the dev URL in the app settings. Or deploy with
`MINI_APPS_ENVIRONMENT=dev` and open the dev version.

## Data

`data/verbs.json` is a copy of the bot's file
(`../irregular-verbs-tgbot/data/verbs.json`); copy it again by hand when the
bot's list changes.
