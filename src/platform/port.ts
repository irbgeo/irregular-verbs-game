import type { StorageEntry } from './types'

// Platform is everything the game needs from the host (VK now, Yandex/OK later).
export interface Platform {
  init(): Promise<void>
  // load gives null when the key was never saved.
  load(key: string): Promise<string | null>
  save(entry: StorageEntry): Promise<void>
}
