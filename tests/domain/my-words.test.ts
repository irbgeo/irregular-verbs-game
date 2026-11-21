import { describe, expect, it } from 'vitest'
import { newMyWords } from '../../src/domain/my-words'
import type { Draft } from '../../src/domain/types'
import { learned, player, skipped, study, testCatalog } from './helpers'

function setup() {
  const p = player({ go: study(2, 3), be: learned, build: skipped })
  const words = newMyWords(testCatalog(), p)
  return { p, words }
}

// bot: lists_builders_test.go TestBuildMyWordsView, lists_forms_test.go
describe('MyWords.items', () => {
  it('stored study + learned only, alphabetical, with forms', () => {
    const { words } = setup()

    expect(words.items({})).toEqual([
      { base: 'be', status: 'learned', past: 'was/were', participle: 'been', translation: 'быть' },
      { base: 'go', status: 'study', past: 'went', participle: 'gone', translation: 'идти' },
    ])
  })

  it('draft status is shown; a word drafted to skipped stays until commit', () => {
    const { words } = setup()
    const draft: Draft = { go: 'skipped' }

    expect(words.items(draft).map((i) => [i.base, i.status])).toEqual([
      ['be', 'learned'],
      ['go', 'skipped'],
    ])

    words.commit(draft)
    expect(words.items({}).map((i) => i.base)).toEqual(['be'])
  })
})

// bot: lists_edit_test.go (My words cases), lists_test.go TestEffectiveStatus
describe('MyWords.toggle', () => {
  it('cycles study → learned → skipped → back to stored (draft entry removed)', () => {
    const { p, words } = setup()
    let draft: Draft = {}

    draft = words.toggle({ draft, base: 'go' })
    expect(draft).toEqual({ go: 'learned' })
    expect(p.words.go.status).toBe('study')

    draft = words.toggle({ draft, base: 'go' })
    expect(draft).toEqual({ go: 'skipped' })

    draft = words.toggle({ draft, base: 'go' })
    expect(draft).toEqual({})
  })

  it('does not change the given draft object', () => {
    const { words } = setup()
    const draft: Draft = {}
    words.toggle({ draft, base: 'go' })
    expect(draft).toEqual({})
  })

  it('unknown word: no change', () => {
    const { words } = setup()
    expect(words.toggle({ draft: {}, base: 'nope' })).toEqual({})
  })
})

describe('MyWords.commit', () => {
  it('learned → mode 2, box 5', () => {
    const { p, words } = setup()
    words.commit({ go: 'learned' })
    expect(p.words.go).toEqual({ status: 'learned', mode: 2, box: 5 })
  })

  it('skipped → reset', () => {
    const { p, words } = setup()
    words.commit({ go: 'skipped' })
    expect(p.words.go).toEqual({ status: 'skipped', mode: 0, box: 0 })
  })

  it('study keeps mode and box; a word with no entry starts at mode 0', () => {
    const { p, words } = setup()
    p.words.go = { status: 'skipped', mode: 2, box: 3 }
    words.commit({ go: 'study', build: 'study' })

    expect(p.words.go).toEqual({ status: 'study', mode: 2, box: 3 })
    expect(p.words.build).toEqual({ status: 'study', mode: 0, box: 0 })
  })

  it('new deletes the entry', () => {
    const { p, words } = setup()
    words.commit({ go: 'new' })
    expect(p.words.go).toBeUndefined()
  })
})
