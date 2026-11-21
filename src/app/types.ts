import type { Catalog } from '../domain/catalog'
import type { Progress, Rng } from '../domain/types'
import type { Platform } from '../platform/port'
import type { Sound } from '../ui/sound'
import type { Saver } from './saver'

// DirtyKeys tells the saver which saved values changed.
export interface DirtyKeys {
  words: boolean
  sessions: boolean
}

// SavedValues are the raw strings read from player storage (null = never saved).
export interface SavedValues {
  p: string | null
  s: string | null
}

export interface DecodeArgs {
  saved: SavedValues
  catalog: Catalog
}

export interface CheckArgs {
  value: unknown
  catalog: Catalog
}

// LearnBefore: the Learn word before an answer, to tell the XP kind and "became learned".
export interface LearnBefore {
  base: string
  kind: 'choice' | 'input'
  wasLearned: boolean
}

// GameDeps: everything the controller needs (more than 5 → one struct).
export interface GameDeps {
  catalog: Catalog
  progress: Progress
  saver: Saver
  platform: Platform
  sound: Sound
  rng: Rng
  root: HTMLElement
}
