import type { Level, Verb } from './types'

// levels in learning order.
export const levels: readonly Level[] = [
  'elementary',
  'pre-intermediate',
  'intermediate',
  'upper-intermediate',
]

// Catalog is the in-memory verb list (the bot's byBase / byLevel / allBases).
export interface Catalog {
  // allBases: level order, then alphabetical inside a level.
  readonly allBases: string[]
  verb(base: string): Verb | undefined
  // basesUpTo: the level and all earlier levels, in allBases order.
  basesUpTo(level: Level): string[]
  // basesOf: this level only, alphabetical.
  basesOf(level: Level): string[]
}

class VerbCatalog implements Catalog {
  readonly allBases: string[]
  private readonly byBase: Map<string, Verb>
  private readonly byLevel: Map<Level, string[]>

  constructor(verbs: Verb[]) {
    this.byBase = new Map()
    this.byLevel = new Map()
    for (const v of verbs) {
      this.byBase.set(v.base, v)
      const bases = this.byLevel.get(v.level) ?? []
      bases.push(v.base)
      this.byLevel.set(v.level, bases)
    }

    for (const bases of this.byLevel.values()) {
      bases.sort()
    }
    this.allBases = this.basesUpTo('upper-intermediate')
  }

  verb(base: string): Verb | undefined {
    const v = this.byBase.get(base)
    return v
  }

  basesOf(level: Level): string[] {
    const bases = this.byLevel.get(level) ?? []
    const copy = [...bases]
    return copy
  }

  basesUpTo(level: Level): string[] {
    const out: string[] = []
    for (const l of levels) {
      const bases = this.byLevel.get(l) ?? []
      out.push(...bases)
      if (l === level) {
        break
      }
    }
    return out
  }
}

// newCatalog builds the catalog from the verbs of data/verbs.json.
export function newCatalog(
  verbs: Verb[],
): Catalog {
  return new VerbCatalog(
    verbs,
  )
}
