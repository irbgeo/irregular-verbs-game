import type { Progress } from '../domain/types'
import type { Platform } from '../platform/port'
import type { StorageEntry } from '../platform/types'
import { encodeSessions, encodeWords, progressKey, sessionsKey } from './codec'
import type { DirtyKeys } from './types'

// VK Storage allows 1000 calls per hour per user: 2 keys × one flush per 10 s
// = 720 at most. A "soon" flush (back to menu) still waits 2 s after the last one.
const flushEveryMs = 10_000
const soonMs = 2_000

// Saver writes Progress to player storage, throttled, only the changed keys.
export interface Saver {
  markDirty(keys: DirtyKeys): void
  // flushSoon: the player left a screen — save shortly.
  flushSoon(): void
  // flushNow: the page is being hidden — save at once.
  flushNow(): Promise<void>
}

class Throttled implements Saver {
  private readonly dirty: DirtyKeys = {
    words: false,
    sessions: false,
  }
  private lastFlush = 0
  private timer: ReturnType<typeof setTimeout> | null = null
  private due = 0
  private flushing: Promise<void> | null = null

  constructor(
    private readonly platform: Platform,
    private readonly progress: Progress,
    private readonly onError: (err: unknown) => void,
  ) {}

  markDirty(keys: DirtyKeys): void {
    this.dirty.words = this.dirty.words || keys.words
    this.dirty.sessions = this.dirty.sessions || keys.sessions
    this.schedule(flushEveryMs)
  }

  flushSoon(): void {
    this.schedule(soonMs)
  }

  async flushNow(): Promise<void> {
    this.clearTimer()
    await this.flush()
  }

  // schedule a flush `gap` ms after the last one; an earlier due time wins.
  private schedule(gap: number): void {
    if (!this.dirty.words && !this.dirty.sessions) {
      return
    }
    const due = Math.max(Date.now(), this.lastFlush + gap)
    if (this.timer !== null && this.due <= due) {
      return
    }

    this.clearTimer()
    this.due = due
    const wait = due - Date.now()
    this.timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, wait)
  }

  private async flush(): Promise<void> {
    if (this.flushing !== null) {
      await this.flushing
    }
    this.flushing = this.write()
    await this.flushing
    this.flushing = null
  }

  private async write(): Promise<void> {
    this.lastFlush = Date.now()
    const entries = this.dirtyEntries()
    this.dirty.words = false
    this.dirty.sessions = false

    for (const entry of entries) {
      try {
        await this.platform.save(entry)
      } catch (err) {
        this.dirty.words = this.dirty.words || entry.key === progressKey
        this.dirty.sessions = this.dirty.sessions || entry.key === sessionsKey
        this.onError(err)
      }
    }
    this.schedule(flushEveryMs)
  }

  private dirtyEntries(): StorageEntry[] {
    const entries: StorageEntry[] = []
    if (this.dirty.words) {
      const words: StorageEntry = {
        key: progressKey,
        value: encodeWords(this.progress),
      }
      entries.push(words)
    }
    if (this.dirty.sessions) {
      const sessions: StorageEntry = {
        key: sessionsKey,
        value: encodeSessions(this.progress),
      }
      entries.push(sessions)
    }
    return entries
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

// newSaver creates the throttled saver for one Progress object.
export function newSaver(
  platform: Platform,
  progress: Progress,
  onError: (err: unknown) => void,
): Saver {
  return new Throttled(
    platform,
    progress,
    onError,
  )
}
