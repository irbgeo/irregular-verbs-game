import type { StorageEntry } from './types'

export type Theme = 'light' | 'dark'

export type ThemeListener = (theme: Theme) => void

export type AdFormat = 'interstitial' | 'reward'

// HideListener gets true when the host hides the app (VK mobile close), false on restore.
export type HideListener = (hidden: boolean) => void

// Platform is everything the game needs from the host (VK now, Yandex/OK later).
export interface Platform {
  init(): Promise<void>
  // load gives null when the key was never saved.
  load(key: string): Promise<string | null>
  save(entry: StorageEntry): Promise<void>
  // onTheme calls the listener with the host's theme now (when known) and on every change.
  onTheme(listener: ThemeListener): void
  // showAd: true when an ad was shown to the end (reward: earned); never throws.
  showAd(format: AdFormat): Promise<boolean>
  onHide(listener: HideListener): void
}
