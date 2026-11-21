import type { Platform } from '../src/platform/port'
import type { StorageEntry } from '../src/platform/types'

// FakePlatform keeps storage in memory; tests read `data` directly.
export interface FakePlatform extends Platform {
  data: Map<string, string>
}

export function newFakePlatform(): FakePlatform {
  const data = new Map<string, string>()

  return {
    data: data,
    init: async () => {},
    load: async (key: string) => data.get(key) ?? null,
    save: async (entry: StorageEntry) => {
      data.set(entry.key, entry.value)
    },
  }
}
