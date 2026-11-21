import type { Platform } from './port'
import type { StorageEntry } from './types'

// keyPrefix keeps our keys apart from anything else on the same origin.
const keyPrefix = 'iv:'

class LocalPlatform implements Platform {
  constructor(private readonly storage: Storage) {}

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
}

// newLocalPlatform creates the Platform used outside VK (local dev): browser storage only.
export function newLocalPlatform(
  storage: Storage,
): Platform {
  return new LocalPlatform(
    storage,
  )
}
