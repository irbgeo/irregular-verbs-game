# Stage 1 TRD: foundation

Status: **approved by the owner** (2026-11-21).
Stage PRD: [PRD.md](PRD.md).

## 1. Toolchain and versions

Rule: exact versions (no `^`), each at least two weeks old on 2026-11-21.
Node 24 LTS in CI (local Node 26 works too: Vitest needs ^22.12 / ^24 / >=26).

| Package | Version | Note |
|---|---|---|
| `vite` | 8.3.6 | build + dev server |
| `typescript` | 6.0.3 | **not 7.x**: `typescript-eslint` supports only `<6.1.0` |
| `vitest`, `@vitest/coverage-v8` | 5.1.0 | tests + coverage |
| `jsdom` | 31.0.0 | DOM for the start-screen test |
| `eslint` | 10.14.0 | flat config |
| `@eslint/js` | 10.0.1 | |
| `typescript-eslint` | 8.72.1 | |
| `@vkontakte/vk-bridge` | 3.0.2 | the only runtime dependency |
| `@vkontakte/vk-miniapps-deploy` | 1.0.3 | dev dependency, deploy CLI |

## 2. Layout

```
index.html
vite.config.ts            # base: './' (hosting URL path is not fixed)
vitest.config.ts          # jsdom, coverage thresholds 70%
eslint.config.js
tsconfig.json             # strict
vk-hosting-config.json    # no secrets
Makefile
.github/workflows/deploy.yml
data/verbs.json           # copy of the bot's file
src/
  main.ts                 # entry: wiring only
  platform/
    port.ts               # Platform interface
    types.ts              # StorageEntry
    vk.ts                 # VK Bridge implementation
    local.ts              # browser localStorage implementation (outside VK)
    detect.ts             # isVK(search): which implementation to use
  app/
    opens.ts              # countOpen(platform): the storage round-trip
  ui/
    start.ts              # renderStart(view): start screen
    types.ts              # StartView
tests/
  fake-platform.ts        # in-memory Platform for tests
  *.test.ts
```

## 3. Platform port

Only what stage 1 needs; later stages add methods (theme, leaderboard).
Owner's rule "at most one parameter (no ctx in TS)" → `save` takes one struct.

```ts
// port.ts
export interface Platform {
  init(): Promise<void>
  load(key: string): Promise<string | null>
  save(entry: StorageEntry): Promise<void>
}

// types.ts
export interface StorageEntry {
  key: string
  value: string
}
```

- **vk.ts** — `init` sends `VKWebAppInit` (must be the first event; only the
  first call counts on web). `load` sends `VKWebAppStorageGet` with
  `keys: [key]`; an empty string value means "not set" → `null`. `save` sends
  `VKWebAppStorageSet`. Errors from the bridge are thrown, not swallowed.
- **local.ts** — same contract on `window.localStorage`, keys prefixed
  `iv:`; `init` does nothing.
- **detect.ts** — `isVK(search)`: true when the launch query string has
  `vk_app_id` (VK adds launch params to the URL). `main.ts` picks `vk` or
  `local` from it.

VK Storage facts (dev.vk.ru, checked 2026-11-21): key `[a-zA-Z_\-0-9]`, up to
100 chars; value up to 4096 chars; 1000 keys and 1000 calls per hour per user
(error 9 = flood control, 103 = out of limits); values stored without expiry,
tied to the user. Stage 3 TRD designs the real save scheme with these limits.

## 4. Start screen and the round-trip

- `countOpen(platform)`: load key `opens` → parse integer (missing or broken
  → 0) → +1 → save → return the new number.
- `renderStart(view)` fills `#app` with two lines. Wording changed from the
  PRD to avoid Russian plural forms: **«Открытий игры: N»** and **«Глаголов
  в игре: 133»**. Title «Неправильные глаголы».
- `main.ts`: pick platform → `init` → `countOpen` → read verb count from
  `data/verbs.json` (imported in the bundle; ~5 KB gzip) → `renderStart`. On
  error: show «Не удалось загрузить игру» and log the error.

## 5. Tests (written first)

| Test | Checks |
|---|---|
| `detect.test.ts` | with / without `vk_app_id` |
| `local.test.ts` | load missing → null; save then load; prefix used |
| `vk.test.ts` (`vi.mock` of vk-bridge) | init sends `VKWebAppInit`; load sends Get with the key, maps value, empty → null; save sends Set; bridge error is thrown |
| `opens.test.ts` (fake platform) | first open → 1; next → 2; broken value → 1 |
| `start.test.ts` (jsdom) | both lines rendered with given numbers |

Coverage: thresholds 70% (lines, branches, functions, statements);
`src/main.ts` excluded (wiring only, checked by hand in VK).

## 6. Lint

ESLint flat config: `@eslint/js` recommended + `typescript-eslint`
recommended, plus `max-lines-per-function: 100` (owner's rule). `make lint` =
`eslint . --fix` and `tsc --noEmit`.

## 7. Makefile

```make
dev:     npx vite                     # http://localhost:5173
test:    npx vitest run --coverage
lint:    npx eslint . --fix && npx tsc --noEmit
build:   test lint → npx vite build   # → dist/
deploy:  build → npx vk-miniapps-deploy
```

## 8. Deploy

`vk-hosting-config.json` (no token, no secrets):

```json
{
  "static_path": "dist",
  "app_id": <owner's app_id>,
  "endpoints": {
    "mobile": "index.html",
    "web": "index.html",
    "mvk": "index.html"
  }
}
```

- Local: `make deploy`. First run asks to log in and saves the token in
  `~/.config/configstore/@vkontakte/vk-miniapps-deploy.json`.
- CI `.github/workflows/deploy.yml`: on push of tag `v*` → checkout → Node 24
  → `npm ci` → `make deploy` with env `MINI_APPS_ACCESS_TOKEN` (secret) and
  `MINI_APPS_ENVIRONMENT`.
- Hosting limits: 24 uploads per day, static files only, the launch URL
  changes on every upload (the tool updates the app settings).

**Risk — production from CI.** VK docs say a `production` deploy needs a
confirmation code from the app's main admin. If CI cannot pass it:
CI deploys to **`dev`** (testers see it at the dev URL), and production stays
`make deploy` on the owner's machine (enters the code). Found out during the
stage, written in RESULT.md.

## 9. Testing inside VK from the local machine

`npx @vkontakte/vk-tunnel` (not a project dependency) gives an HTTPS URL for
the local Vite server; it is set as the dev URL in the app settings. Not
confirmed in docs (the page is missing) → checked during the stage; fallback:
deploy to the `dev` environment and test there.

## 10. Owner setup (README lists it)

1. Create the app in the VK developer console, get `app_id`.
2. First `make deploy` by hand → token saved; or take the service key
   (app settings → Разработка → Ключи доступа).
3. GitHub repo + secret `MINI_APPS_ACCESS_TOKEN`.

## 11. Checks at the end of the stage

- `make build` passes; bundle size from `vite build` output ≤ 100 KB gzip
  (verbs included).
- In VK on phone and desktop: no console errors, counter grows and matches on
  two devices.
- A `v*` tag deploys from CI (to production, or to dev per the risk above).
