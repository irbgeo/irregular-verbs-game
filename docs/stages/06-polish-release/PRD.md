# Stage 6 PRD: polish-release

Status: **written and implemented on the owner's "давай сделаем следующий
этап"** (2026-11-22); monetization chosen by the owner (option "Реклама в
этапе 6"). Owner reviews PRD, TRD and RESULT together.
Project PRD: [../../PRD.md](../../PRD.md), stage 6.

## Goal

The game is ready for the VK Games catalog: it sounds and moves a little,
meets the VK platform rules, has the legal texts and a clear checklist for
the owner to send it to moderation.

## What the VK rules require (dev.vk.ru/ru/mini-apps-rules, edition of 13 Nov 2026)

- **§4.2.1–4.2.2: a game enters the games catalog only with a monetization
  mechanic** — VK Votes goods, rewarded ads, interstitial ads or banners. v1
  had none → ads are added now (owner's choice). Ads rules (§5.1, summary):
  interstitials only at clear transitions, rewarded only on the player's
  request for a stated bonus, not at launch / onboarding, at most one per
  30 s.
- **§2.2.5: sound effects need a quick on/off switch; stop sound when the
  app is closed on mobile (`VKWebAppViewHide`).**
- **§1.1.4: a user agreement and a privacy policy** set in the control
  panel, accepted before use (VK shows them).
- **§2.4.1: a support channel** (e.g. a VK community), answers within 7 days.
- §2.2.3 / §3.5.2: show loading; §3.5.1: an error placeholder; §3.2.2: safe
  areas; §2.3.10: current browsers over HTTPS — already true or added here.
- Not an issue for us: lives / energy (none), first-launch popups (none),
  links outside VK (none), other brands (none), 10-minute minimum play time
  (133 words × 2 steps takes far longer).
- To explain to the moderator: §1.2.2 (validate launch-parameter signature)
  — the game has no own server or accounts; progress lives in VK Storage of
  the signed-in VK user, so there is nothing to authorize on our side.

## User stories

1. **Sounds.** Short sounds for a correct answer, a wrong answer, the end of
   an Arcade round and a new achievement; a «Звук» switch in Settings,
   saved with my progress; silence when the game is hidden or closed and
   during an ad.
2. **Motion.** The answer banner pops in, a wrong answer shakes a little,
   the Arcade «+N» pops, the toast slides in, the record chip pulses — and
   nothing moves if my system asks for reduced motion.
3. **Ads, gentle.** An interstitial ad may show when I leave a finished
   Arcade round or a finished Test (at most once per 60 s, never during
   learning, never at launch or onboarding). When an Arcade round ends I can
   choose «+15 секунд за рекламу» once per round; after the ad the round
   goes on. No ad available → nothing happens, the game goes on.
4. **Loading.** While the game loads I see «Загрузка…», not a white page.
5. **Owner, release.** I get the user agreement and privacy policy texts,
   the card texts, the icons, the moderation scenario text and a step-by-step
   checklist for the VK control panel.

## Acceptance criteria

- Sound, motion, ads and loading behave as above; tests for the sound switch,
  silence on hide, ad throttling, the once-per-round reward and «no ad → go
  on».
- `make build` passes, coverage ≥70%, bundle ≤60 KB gzip; no sound files
  (sounds are synthesized, no license questions).
- `docs/legal/` has the two texts; `docs/stages/06-polish-release/CHECKLIST.md`
  lists every owner step for moderation.

## Out of scope

- Sending to moderation itself (owner's action in the VK panel).
- VK leaderboard (needs a server), Yandex / OK ports, banner ads, purchases.
