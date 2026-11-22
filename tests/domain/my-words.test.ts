import { describe, expect, it } from 'vitest'
import { newMyWords } from '../../src/domain/my-words'
import type { WordProgress } from '../../src/domain/types'
import { learned, player, skipped, study, testCatalog } from './helpers'

function setup(words: Record<string, WordProgress> = { go: study(2, 3), be: learned, build: skipped }) {
  const p = player(words)
  const list = newMyWords(testCatalog(), p)
  return { p, list }
}

// bot: lists_builders_test.go TestBuildMyWordsView, lists_forms_test.go
describe('My words: list', () => {
  it('studyBases: stored study + learned, alphabetical', () => {
    expect(setup().list.studyBases()).toEqual(['be', 'go'])
  })

  it('items: forms, translation, current status (new when no entry)', () => {
    const { list } = setup()
    expect(list.items(['be', 'go', 'build'])).toEqual([
      { base: 'be', status: 'learned', past: 'was/were', participle: 'been', translation: 'быть' },
      { base: 'go', status: 'study', past: 'went', participle: 'gone', translation: 'идти' },
      { base: 'build', status: 'skipped', past: 'built', participle: 'built', translation: 'строить' },
    ])
    expect(setup({}).list.items(['go'])[0].status).toBe('new')
  })
})

describe('My words: cycle at once (owner: no draft)', () => {
  it('study → learned → skipped → study; back at the start the original progress returns', () => {
    const { p, list } = setup()
    const original = p.words.go

    list.cycle({ base: 'go', original })
    expect(p.words.go).toEqual({ status: 'learned', mode: 2, box: 5 })
    list.cycle({ base: 'go', original })
    expect(p.words.go).toEqual({ status: 'skipped', mode: 0, box: 0 })
    list.cycle({ base: 'go', original })
    expect(p.words.go).toEqual(study(2, 3))
  })

  it('from skipped (not the original) study starts at step 1', () => {
    const { p, list } = setup()
    list.cycle({ base: 'build', original: { status: 'learned', mode: 2, box: 5 } })
    expect(p.words.build).toEqual({ status: 'study', mode: 0, box: 0 })
  })

  it('an unknown word is ignored', () => {
    const { p, list } = setup()
    list.cycle({ base: 'nope', original: undefined })
    expect(p.words.nope).toBeUndefined()
  })
})

// bot: lists_builders_test.go TestBuildWordListView, lists_edit_test.go word-list cases
describe('Word list', () => {
  it('levelItems: that level only, alphabetical, with status', () => {
    const { list } = setup()
    expect(list.levelItems('elementary').map((i) => [i.base, i.status])).toEqual([
      ['be', 'learned'],
      ['go', 'study'],
    ])
    expect(list.levelItems('pre-intermediate').map((i) => [i.base, i.status])).toEqual([['build', 'skipped']])
  })

  it('new → study (step 1) → new again', () => {
    const { p, list } = setup({})
    list.toggleStudy({ base: 'go', original: undefined })
    expect(p.words.go).toEqual({ status: 'study', mode: 0, box: 0 })
    list.toggleStudy({ base: 'go', original: undefined })
    expect(p.words.go).toBeUndefined()
  })

  it('study → out → back with the original progress', () => {
    const { p, list } = setup()
    const original = p.words.go
    list.toggleStudy({ base: 'go', original })
    expect(p.words.go).toBeUndefined()
    list.toggleStudy({ base: 'go', original })
    expect(p.words.go).toEqual(study(2, 3))
  })

  it('skipped → study → back to skipped (bot: skipped round trip)', () => {
    const { p, list } = setup()
    const original = p.words.build
    list.toggleStudy({ base: 'build', original })
    expect(p.words.build).toEqual({ status: 'study', mode: 0, box: 0 })
    list.toggleStudy({ base: 'build', original })
    expect(p.words.build).toEqual(skipped)
  })

  it('learned → study at step 2 from the start → learned again', () => {
    const { p, list } = setup()
    const original = p.words.be
    list.toggleStudy({ base: 'be', original })
    expect(p.words.be).toEqual(study(2, 0))
    list.toggleStudy({ base: 'be', original })
    expect(p.words.be).toEqual(learned)
  })
})
