import { describe, expect, it } from 'vitest'
import { renderError, renderStart } from '../src/ui/start'

describe('start screen', () => {
  it('shows the title, the open counter and the verb count', () => {
    const root = document.createElement('div')
    renderStart({ root, opens: 5, verbs: 133 })

    expect(root.textContent).toContain('Неправильные глаголы')
    expect(root.textContent).toContain('Открытий игры: 5')
    expect(root.textContent).toContain('Глаголов в игре: 133')
  })

  it('replaces old content on a second render', () => {
    const root = document.createElement('div')
    renderStart({ root, opens: 1, verbs: 133 })
    renderStart({ root, opens: 2, verbs: 133 })

    expect(root.textContent).not.toContain('Открытий игры: 1')
  })

  it('shows an error message', () => {
    const root = document.createElement('div')
    renderError(root)

    expect(root.textContent).toContain('Не удалось загрузить игру')
  })
})
