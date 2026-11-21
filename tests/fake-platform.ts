import type { AdFormat, HideListener, Platform, Theme, ThemeListener } from '../src/platform/port'
import type { StorageEntry } from '../src/platform/types'

// FakePlatform keeps storage in memory; tests read `data`, count `saves`,
// make saves fail with `failSaves`, and push a theme with `setTheme`.
export interface FakePlatform extends Platform {
  data: Map<string, string>
  saves: StorageEntry[]
  failSaves: boolean
  // what showAd answers; the formats asked are kept in `ads`
  adResult: boolean
  ads: AdFormat[]
  setTheme(theme: Theme): void
  setHidden(hidden: boolean): void
}

export function newFakePlatform(): FakePlatform {
  const data = new Map<string, string>()
  const listeners: ThemeListener[] = []
  const hideListeners: HideListener[] = []

  const fake: FakePlatform = {
    data: data,
    saves: [],
    failSaves: false,
    adResult: true,
    ads: [],
    init: async () => {},
    load: async (key: string) => data.get(key) ?? null,
    save: async (entry: StorageEntry) => {
      if (fake.failSaves) {
        throw new Error('fake: save failed')
      }
      fake.saves.push(entry)
      data.set(entry.key, entry.value)
    },
    onTheme: (listener: ThemeListener) => {
      listeners.push(listener)
    },
    setTheme: (theme: Theme) => {
      listeners.forEach((l) => l(theme))
    },
    showAd: async (format: AdFormat) => {
      fake.ads.push(format)
      return fake.adResult
    },
    onHide: (listener: HideListener) => {
      hideListeners.push(listener)
    },
    setHidden: (hidden: boolean) => {
      hideListeners.forEach((l) => l(hidden))
    },
  }
  return fake
}
