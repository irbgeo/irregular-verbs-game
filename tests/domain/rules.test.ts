import { describe, expect, it } from 'vitest'
import { applyLadder } from '../../src/domain/ladder'
import { formOptions } from '../../src/domain/options'
import { learnPool, pickLearnWord, pushRecent } from '../../src/domain/pick'
import type { WordProgress } from '../../src/domain/types'
import { learnCatalog, learned, skipped, study, zeroRng } from './helpers'

// bot: learn_ladder_test.go
describe('applyLadder', () => {
  it.each<[string, WordProgress, boolean, WordProgress]>([
    ['mode 1 success', study(1, 2), true, study(1, 3)],
    ['mode 1 promotes', study(1, 4), true, study(2, 0)],
    ['mode 1 fail', study(1, 3), false, study(1, 0)],
    ['mode 2 promotes', study(2, 4), true, { status: 'learned', mode: 0, box: 0 }],
    ['mode 2 fail', study(2, 4), false, study(2, 0)],
    ['learned success unchanged', learned, true, learned],
    ['learned fail demotes', learned, false, study(2, 0)],
  ])('%s', (_name, word, ok, want) => {
    expect(applyLadder({ word, ok })).toEqual(want)
  })

  it('skipped word is unchanged', () => {
    expect(applyLadder({ word: skipped, ok: false })).toEqual(skipped)
  })
})

// bot: learn_check_test.go TestFormOptions*, learn_choice_variants_test.go
describe('formOptions', () => {
  const catalog = learnCatalog()

  it('be past: variants split + other forms + 2 mistakes', () => {
    const opts = formOptions({ verb: catalog.verb('be')!, kind: 'past', variant: 'gb', rng: zeroRng })
    expect([...opts].sort()).toEqual(['are', 'be', 'beed', 'been', 'was', 'were'])
    expect(opts).not.toContain('was/were')
  })

  it('a multi-variant distractor is split too', () => {
    const opts = formOptions({ verb: catalog.verb('be')!, kind: 'base', variant: 'gb', rng: zeroRng })
    expect(opts).toContain('was')
    expect(opts).toContain('were')
    expect(opts).not.toContain('was/were')
  })

  it('a mistake equal to a real form is dropped (do: "done")', () => {
    const opts = formOptions({ verb: catalog.verb('do')!, kind: 'past', variant: 'gb', rng: zeroRng })
    expect([...opts].sort()).toEqual(['did', 'do', 'doed', 'done'])
  })

  it('go: 5 options for a form target', () => {
    const opts = formOptions({ verb: catalog.verb('go')!, kind: 'base', variant: 'gb', rng: zeroRng })
    expect(opts).toHaveLength(5)
  })
})

// bot: learn_test.go
describe('pick', () => {
  const allBases = learnCatalog().allBases

  it('learnPool splits by status', () => {
    const pool = learnPool({
      allBases,
      words: { go: study(1), be: learned, do: skipped, make: study(2, 3) },
    })
    expect(pool.study).toHaveLength(2)
    expect(pool.learned).toHaveLength(1)
  })

  it('empty pool gives null', () => {
    expect(pickLearnWord({ allBases, words: { do: skipped }, recent: [], rng: zeroRng })).toBeNull()
  })

  it('roll < 90 picks study, roll >= 90 picks learned', () => {
    const words = { go: study(1), be: learned }
    expect(pickLearnWord({ allBases, words, recent: [], rng: zeroRng })).toBe('go')
    const highRoll = (n: number) => (n === 100 ? 95 : 0)
    expect(pickLearnWord({ allBases, words, recent: [], rng: highRoll })).toBe('be')
  })

  it('empty group falls back to the other', () => {
    const highRoll = (n: number) => (n === 100 ? 95 : 0)
    expect(pickLearnWord({ allBases, words: { go: study(1) }, recent: [], rng: highRoll })).toBe('go')
  })

  it('excludes recent words', () => {
    const words = { go: study(1), do: study(1) }
    expect(pickLearnWord({ allBases, words, recent: ['do'], rng: zeroRng })).toBe('go')
  })

  it('ignores recent when it would exclude everything', () => {
    expect(pickLearnWord({ allBases, words: { go: study(1) }, recent: ['go'], rng: zeroRng })).toBe('go')
  })

  it('pushRecent keeps the last 5', () => {
    expect(pushRecent({ recent: ['a', 'b', 'c', 'd', 'e'], base: 'f' })).toEqual(['b', 'c', 'd', 'e', 'f'])
  })
})
