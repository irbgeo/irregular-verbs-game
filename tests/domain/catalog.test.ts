import { describe, expect, it } from 'vitest'
import verbsData from '../../data/verbs.json'
import { levels, newCatalog } from '../../src/domain/catalog'
import type { Verb } from '../../src/domain/types'
import { testCatalog } from './helpers'

// bot: catalog_test.go
describe('catalog', () => {
  it('looks up by base', () => {
    const c = testCatalog()
    expect(c.verb('be')?.level).toBe('elementary')
    expect(c.verb('nope')).toBeUndefined()
  })

  it('basesUpTo is cumulative and sorted inside a level', () => {
    const c = testCatalog()
    expect(c.basesUpTo('elementary')).toEqual(['be', 'go'])
    expect(c.basesUpTo('pre-intermediate')).toEqual(['be', 'go', 'build'])
  })

  it('allBases: level order, then alphabetical', () => {
    expect(testCatalog().allBases).toEqual(['be', 'go', 'build'])
  })
})

// bot: load_test.go — run on our copy of verbs.json
describe('data/verbs.json', () => {
  const verbs = verbsData.verbs as Verb[]

  it('has 133 verbs; be past gb = was/were', () => {
    expect(verbs).toHaveLength(133)
    const be = newCatalog(verbs).verb('be')
    expect(be?.level).toBe('elementary')
    expect(be?.past.gb).toEqual(['was', 'were'])
  })

  it('invariants: unique base, known level, forms, translation, ≥2 mistakes', () => {
    const seen = new Set<string>()
    for (const v of verbs) {
      expect(seen.has(v.base), `duplicate ${v.base}`).toBe(false)
      seen.add(v.base)
      expect(levels, v.base).toContain(v.level)
      for (const variant of ['gb', 'us'] as const) {
        expect(v.past[variant].length, `${v.base} past ${variant}`).toBeGreaterThan(0)
        expect(v.participle[variant].length, `${v.base} participle ${variant}`).toBeGreaterThan(0)
      }
      expect(v.translations.length, v.base).toBeGreaterThan(0)
      expect(v.common_mistakes.length, v.base).toBeGreaterThanOrEqual(2)
    }
  })

  it('common mistakes are clean distractors: latin words, not real forms, no duplicates', () => {
    for (const v of verbs) {
      const forms = new Set([v.base, ...v.past.gb, ...v.past.us, ...v.participle.gb, ...v.participle.us].map((f) => f.toLowerCase()))
      const seen = new Set<string>()
      for (const m of v.common_mistakes) {
        const n = m.toLowerCase().trim()
        expect(n, `${v.base}: ${m}`).toMatch(/^[a-z]+$/)
        expect(forms.has(n), `${v.base}: ${m} is a real form`).toBe(false)
        expect(seen.has(n), `${v.base}: duplicate ${m}`).toBe(false)
        seen.add(n)
      }
    }
  })
})
