import type { AdFormat, HideListener, Platform, Theme, ThemeListener } from './port'
import type { StorageEntry } from './types'

// keyPrefix keeps our keys apart from anything else on the same origin.
const keyPrefix = 'iv:'

class LocalPlatform implements Platform {
  constructor(
    private readonly storage: Storage,
    private readonly media: MediaQueryList,
  ) {}

  async init(): Promise<void> {}

  async load(key: string): Promise<string | null> {
    const fullKey = keyPrefix + key
    const value = this.storage.getItem(fullKey)
    return value
  }

  async save(entry: StorageEntry): Promise<void> {
    const fullKey = keyPrefix + entry.key
    this.storage.setItem(fullKey, entry.value)
  }

  // onTheme follows the system setting (prefers-color-scheme: dark).
  onTheme(listener: ThemeListener): void {
    const now: Theme = this.media.matches ? 'dark' : 'light'
    listener(now)
    this.media.addEventListener('change', (e) => {
      const theme: Theme = e.matches ? 'dark' : 'light'
      listener(theme)
    })
  }

  // No ads outside VK (local dev).
  async hasAd(format: AdFormat): Promise<boolean> {
    void format
    return false
  }

  async showAd(format: AdFormat): Promise<boolean> {
    void format
    return false
  }

  // The browser tab uses visibilitychange (wired in main); nothing extra here.
  onHide(listener: HideListener): void {
    void listener
  }
}

// newLocalPlatform creates the Platform used outside VK (local dev):
// browser storage and the system theme.
export function newLocalPlatform(
  storage: Storage,
  media: MediaQueryList,
): Platform {
  return new LocalPlatform(
    storage,
    media,
  )
}
