# Stage 6 RESULT: polish-release

Status: **code and documents done, checked locally; the owner's VK panel
steps and moderation are next** (2026-11-22). PRD + TRD written and
implemented in one go; monetization chosen by the owner («Реклама в этапе 6»).

## Done

- **Sounds** (`src/ui/sound.ts`): synthesized with Web Audio (no files, no
  licenses): correct, wrong, round end, achievement. «Звук» switch in
  Settings, saved as the third item of `"s"` in `iv1_p` (old saves → on);
  muted while hidden (browser `visibilitychange`, VK `VKWebAppViewHide` /
  `ViewRestore`) and while an ad plays.
- **Motion** (`styles.css`): pop (banners, «+N», badge), shake (wrong
  banner, «−3 с»), toast slide-up, record pulse — only under
  `prefers-reduced-motion: no-preference`.
- **Ads** (`Platform.showAd`, `src/app/ads.ts`): VK `VKWebAppCheckNativeAds`
  → `VKWebAppShowNativeAds`, never throws; interstitial when leaving a
  finished Arcade round or Test to the menu; «+15 секунд за рекламу» once
  per Arcade round (`Arcade.extend`); one ad per 60 s; no ad → the game goes
  on (reward: toast «Реклама сейчас недоступна»).
- **Loading**: «Загрузка…» in `index.html` until the first screen.
- **Release documents**: `docs/legal/terms.md`, `docs/legal/privacy.md`
  (placeholders for name / status / date / support link),
  `CHECKLIST.md` (VK panel steps, card texts, moderation scenario text,
  §1.2.2 explanation).
- `newGame` takes one `GameDeps` struct (7 dependencies, owner's rule for
  more than 5).

## How it was checked

- `make build`: 309 tests pass (16 new); coverage 96.1% statements / 91.1%
  branches; ESLint + `tsc` clean.
- Bundle: JS 24.8 KB + CSS 3.2 KB + HTML 0.4 KB gzip (budget 60 KB).
- Code review of the stage diff: an unused import found by lint; my own
  60 s-throttle test was wrong (the second round ended exactly 61 s later,
  so the gap had passed) — rewritten to leave a finished Test right after.

## Waiting (owner)

- [ ] `make deploy`; check sounds, the switch, silence when the VK app is
      closed / minimized, motion, «+15 секунд за рекламу», interstitial on
      leaving results (after ads are enabled in the VK panel).
- [ ] Every step of `CHECKLIST.md` (community, documents, cashout, ads,
      Company Name, icons, screenshots, moderation).

## Not verified / risks

- VK games pages on design / moderation / ads settings returned HTTP 500;
  requirements were taken from `mini-apps-rules` (edition 13 Nov 2026).
  Exact panel field names for documents, ads and screenshots are marked
  «проверить» in the checklist.
- Ads were tested with a fake platform only; real ads appear only after the
  owner enables monetization in the VK panel.
- `src/app/game.ts` has grown large (one controller for all screens);
  splitting it (e.g. an Arcade / ads controller) is debt for after release.

## Deviations

- Interstitial ads are shown only when leaving result screens to the menu,
  not on «Ещё раунд» — fewer ads for players who replay Arcade.
