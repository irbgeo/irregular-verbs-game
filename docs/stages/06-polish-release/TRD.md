# Stage 6 TRD: polish-release

Status: written and implemented together with the PRD (2026-11-22).

## 1. Platform port

```ts
type AdFormat = 'interstitial' | 'reward'
interface Platform {
  ...
  // showAd: true when an ad was shown to the end (reward: earned); never throws.
  showAd(format: AdFormat): Promise<boolean>
  // onHide: the host hid (true) / restored (false) the app — VK mobile close.
  onHide(listener: (hidden: boolean) => void): void
}
```

- VK: `VKWebAppCheckNativeAds { ad_format }` → `result: false` → `false`;
  else `VKWebAppShowNativeAds { ad_format }` → `true`; any error → `false`.
  `onHide`: `VKWebAppViewHide` / `VKWebAppViewRestore` events.
- Local: `showAd` → `false` (no ads in dev); `onHide` → never called.

## 2. Sound (`src/ui/sound.ts`)

Synthesized with Web Audio (no files): `correct` (two rising notes),
`wrong` (one low short note), `round-end` (three notes), `achievement`
(arpeggio). `newSound()` → `{ play(kind), setEnabled(on), mute(on) }`;
the `AudioContext` is created on the first `play` (after a user gesture);
`mute(true)` suspends it (hidden, closed, ad). No `AudioContext` → silent.

`Settings.sound: boolean` (default true), saved as the third item of `"s"`
in `iv1_p` (`["gb","elementary",1]`); old saves → on.

## 3. Ads in the controller (`src/app/ads.ts` + `game.ts`)

- `newAdPolicy()` → `canInterstitial(now)`, `shown(now)`: at most one ad per
  60 s (interstitial or reward).
- Interstitial: when the player leaves the Arcade result or the Test done
  screen («Ещё раунд», «В меню»), if the policy allows. Sound muted while it
  shows; the next screen opens after `showAd` resolves.
- Reward: the Arcade result shows «+15 секунд за рекламу» if this round has
  not used it; on `true` → `arcade.extend({ now, ms: 15000 })` (domain: only
  once per round, only when over) → back to the round; on `false` → a toast
  «Реклама сейчас недоступна», result stays.
- Best score: updated at every round end (a continued round may beat it).

## 4. Controller wiring

`newGame(deps: GameDeps)` — `{ catalog, progress, saver, platform, sound,
rng, root }` (more than 5 → one struct, owner's rule). `onVisibility(hidden)`
also mutes the sound; `main.ts` sends VK `onHide` there too.

## 5. Motion (`styles.css`)

Keyframes: `pop` (banner, «+N» pill, result chip), `shake` (wrong banner,
«−3 с»), `slide-up` (toast), `pulse` (record chip). All under
`@media (prefers-reduced-motion: no-preference)`.

## 6. Loading

`index.html` `#app` starts with «Загрузка…» (static text, replaced by the
first screen).

## 7. Tests

sound (disabled → no context, mute suspends), VK `showAd` (check false,
show ok, error), `onHide`, ad policy (60 s), arcade `extend` (once, only
when over), codec (sound flag, old save), game (sound on answers / end /
achievement and the Settings switch; interstitial on leaving result,
throttled; reward continues the round; no ad → toast).
