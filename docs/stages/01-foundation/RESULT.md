# Stage 1 RESULT: foundation

Status: **code done and checked locally; VK checks wait for the owner's VK
app** (2026-11-21). The stage closes when the "Waiting" list below is done.

## Done

- Tooling with exact versions from the TRD: Vite 8.3.6, TypeScript 6.0.3,
  Vitest 5.1.0 + coverage-v8, jsdom 31.0.0, ESLint 10.14.0 + typescript-eslint
  8.72.1, `@vkontakte/vk-bridge` 3.0.2, `@vkontakte/vk-miniapps-deploy` 1.0.3.
- Makefile: `dev`, `test`, `lint`, `build`, `deploy`.
- Platform port (`src/platform/`): `Platform` interface, VK implementation
  (`VKWebAppInit`, `VKWebAppStorageGet/Set`), local implementation
  (`localStorage`, prefix `iv:`), `isVK` detection by `vk_app_id`.
- Storage round-trip `countOpen` and the start screen (title, «Открытий игры:
  N», «Глаголов в игре: 133», error text on failure).
- `data/verbs.json` copied from the bot (133 verbs).
- `vk-hosting-config.json`, GitHub Actions deploy on `v*` tag, README with
  the one-time setup.

## How it was checked

- `make build`: 20 tests pass; coverage 100% statements / branches /
  functions / lines (`src/main.ts` excluded as wiring); ESLint and `tsc`
  clean.
- Bundle: JS 8.36 KB gzip + HTML 0.38 KB gzip (verbs included) — limit 100 KB.
- Built `index.html` uses relative paths (`./assets/...`).
- Code review of the stage diff: one redundant check removed in `opens.ts`;
  no other findings.

## Waiting (needs the owner's VK app)

- [x] `make deploy` (app id from `.env`) puts the build on VK hosting —
      2026-11-21, app 54913484; desktop web `vk.com/app54913484` shows the
      start screen with «Открытий игры: 1», «Глаголов в игре: 133».
- [x] Inside VK on phone and desktop: no console errors from the game frame
      (errors seen in the `top` context come from vk.com itself:
      `unload` permissions policy, `stats.vk-portal.net` 403); the counter
      grows and is the same on two devices — checked by the owner 2026-11-21.
- [ ] A `v*` tag deploys from CI; record here whether `production` works
      from CI or needs the confirmation code (then CI uses `dev`).
- [moved] `vk-tunnel` for local testing inside VK — moved to stage 3 by the
      owner's decision (needed when building screens).

## Deviations from the TRD

- `app_id` is not in `vk-hosting-config.json`: it comes from the env
  variable `MINI_APPS_APP_ID` (supported by the deploy tool; a GitHub
  variable in CI). So no placeholder sits in git and the id is set in one
  place per environment.
- `vk.ts` gets VK Bridge as a constructor parameter instead of `vi.mock` in
  tests — simpler tests, same behaviour.
- CI job has `timeout-minutes: 10` in case the deploy tool waits for input.

## Known issues / debt

- If the URL has `vk_app_id` but the page is not inside VK, `VKWebAppInit`
  may never answer and the screen stays empty (no error shown). Only matters
  for hand-made URLs; revisit in stage 3 if it shows up (a timeout on init).
- CI runs `eslint --fix`, so fixable lint problems do not fail CI.

## For the next stage

- Domain code goes to `src/` with no imports from `src/platform/` UI or VK
  Bridge; tests in `tests/`.
- VK Storage: value ≤ 4096 chars, ≤ 1000 keys and ≤ 1000 calls per hour per
  user — design the save scheme in stage 3.
- TypeScript stays on 6.0.x until `typescript-eslint` supports 7.
