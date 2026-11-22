import { describe, expect, it } from 'vitest'
import { renderWordList } from '../../src/ui/screens/word-list'
import { levelCounts, stubActions } from './helpers'

describe('word list screen', () => {
  it('rows with forms and status buttons; tap and level change call actions', () => {
    const actions = stubActions()
    const root = renderWordList({
      actions,
      level: 'elementary',
      levelCounts,
      items: [
        { base: 'be', status: 'learned', past: 'was/were', participle: 'been', translation: 'быть' },
        { base: 'go', status: 'study', past: 'went', participle: 'gone', translation: 'идти' },
        { base: 'do', status: 'new', past: 'did', participle: 'done', translation: 'делать' },
        { base: 'see', status: 'skipped', past: 'saw', participle: 'seen', translation: 'видеть' },
      ],
    })
    const text = root.textContent ?? ''
    expect(text).toContain('go — went — gone')
    expect(text).toContain('выучено')
    expect(text).toContain('учу')
    expect(root.querySelectorAll('.word-list [data-key]')).toHaveLength(4)

    root.querySelector<HTMLElement>('[data-key="do"]')!.click()
    expect(actions.wordListToggle).toHaveBeenCalledWith('do')
    expect(root.querySelector('[data-key="see"]')!.textContent).toBe('+ учить')

    expect(root.querySelector('select')).toBeNull()
    const current = root.querySelector<HTMLElement>('[data-level="elementary"]')!
    expect(current.getAttribute('aria-checked')).toBe('true')
    expect(current.textContent).toContain('78 глаголов')
    root.querySelector<HTMLElement>('[data-level="intermediate"]')!.click()
    expect(actions.wordListLevel).toHaveBeenCalledWith('intermediate')
  })
})
