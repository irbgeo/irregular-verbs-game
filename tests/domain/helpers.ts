import learnCatalogData from './fixtures/learn_catalog.json'
import { newCatalog, type Catalog } from '../../src/domain/catalog'
import { newProgress } from '../../src/domain/progress'
import type { Progress, Rng, Verb, WordProgress } from '../../src/domain/types'

// seqRng returns the given values in order (mod n), then 0 forever — as the bot's seqRng.
export function seqRng(...vals: number[]): Rng {
  let i = 0
  return (n: number) => {
    if (i >= vals.length || n <= 0) {
      i++
      return 0
    }
    const v = vals[i]
    i++
    return v % n
  }
}

export const zeroRng: Rng = () => 0

// learnCatalog: the bot's 6-verb fixture (go, be, do, make, see, take; all elementary).
export function learnCatalog(): Catalog {
  return newCatalog(learnCatalogData.verbs as Verb[])
}

function verb(base: string, level: Verb['level'], past: string[], participle: string[], tr: string): Verb {
  return {
    base,
    level,
    past: { gb: past, us: past },
    participle: { gb: participle, us: participle },
    translations: [tr],
    common_mistakes: [],
  }
}

// testCatalog: the bot's 3-verb fixture (be, go elementary; build pre-intermediate).
export function testCatalog(): Catalog {
  return newCatalog([
    verb('go', 'elementary', ['went'], ['gone'], 'идти'),
    verb('be', 'elementary', ['was', 'were'], ['been'], 'быть'),
    verb('build', 'pre-intermediate', ['built'], ['built'], 'строить'),
  ])
}

export function beVerb(): Verb {
  return {
    ...verb('be', 'elementary', ['was', 'were'], ['been'], 'быть'),
    translations: ['быть', 'являться'],
  }
}

// player: onboarded gb / elementary progress with the given words.
export function player(words: Record<string, WordProgress> = {}): Progress {
  const p = newProgress()
  p.settings = { variant: 'gb', level: 'elementary' }
  p.words = words
  return p
}

export function study(mode: 0 | 1 | 2, box = 0): WordProgress {
  return { status: 'study', mode, box }
}

export const learned: WordProgress = { status: 'learned', mode: 0, box: 0 }
export const skipped: WordProgress = { status: 'skipped', mode: 0, box: 0 }
