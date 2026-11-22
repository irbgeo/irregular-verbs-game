import { describe, expect, it } from 'vitest'
import { renderFeedback } from '../../src/ui/feedback'
import { renderMenu } from '../../src/ui/screens/menu'
import { renderOnboarding } from '../../src/ui/screens/onboarding'
import { renderSettings } from '../../src/ui/screens/settings'
import { verbsLabel } from '../../src/ui/text'
import { byText, levelCounts, stubActions } from './helpers'

describe('verbsLabel (Russian plural)', () => {
  it.each([
    [1, '1 глагол'],
    [2, '2 глагола'],
    [5, '5 глаголов'],
    [11, '11 глаголов'],
    [21, '21 глагол'],
    [94, '94 глагола'],
    [127, '127 глаголов'],
    [133, '133 глагола'],
  ])('%d → %s', (n, want) => {
    expect(verbsLabel(n)).toBe(want)
  })
})

describe('onboarding', () => {
  it('defaults to British + Elementary; the choice is sent on start', () => {
    const actions = stubActions()
    const root = renderOnboarding({ actions, levelCounts })
    expect(root.textContent).toContain('94 глагола')

    byText(root, 'Американский').click()
    root.querySelector<HTMLElement>('[data-level="intermediate"]')!.click()
    byText(root, 'Начать').click()

    expect(actions.finishOnboarding).toHaveBeenCalledWith({ variant: 'us', level: 'intermediate' })
    expect(byText(root, 'Американский').getAttribute('aria-pressed')).toBe('true')
  })
})

describe('menu', () => {
  it('shows counts and opens screens', () => {
    const actions = stubActions()
    const root = renderMenu({
      actions,
      studying: 12,
      learned: 5,
      level: 'elementary',
      levelWords: 78,
      testResume: null,
      xp: 0,
      streak: 0,
      arcadeBest: 0,
    })
    expect(root.textContent).toContain('12 в изучении · 5 выучено')
    expect(root.textContent).toContain('Elementary · 78')

    byText(root, 'Учить').click()
    byText(root, 'Тест').click()
    byText(root, 'Мои слова').click()
    byText(root, 'Настройки').click()
    expect(actions.openLearn).toHaveBeenCalled()
    expect(actions.openTest).toHaveBeenCalled()
    expect(actions.openMyWords).toHaveBeenCalled()
    expect(actions.openSettings).toHaveBeenCalled()
  })

  it('offers to continue a saved Test', () => {
    const root = renderMenu({
      actions: stubActions(),
      studying: 0,
      learned: 0,
      level: 'elementary',
      levelWords: 78,
      testResume: { index: 7, total: 78 },
      xp: 0,
      streak: 0,
      arcadeBest: 0,
    })
    expect(root.textContent).toContain('Продолжить · слово 7 из 78')
  })
})

describe('feedback banner', () => {
  const base = {
    base: 'be',
    past: ['was', 'were'],
    participle: ['been'],
    translations: ['быть', 'являться'],
  }

  it('wrong + added to study', () => {
    const el = renderFeedback({ ...base, result: 'incorrect', addedToStudy: true })
    expect(el.textContent).toContain('Неверно')
    expect(el.textContent).toContain('be — was/were — been')
    expect(el.textContent).toContain('быть, являться · слово добавлено в изучение')
  })

  it('correct and hint', () => {
    expect(renderFeedback({ ...base, result: 'correct', addedToStudy: false }).textContent).toContain('Верно!')
    expect(renderFeedback({ ...base, result: 'hint', addedToStudy: false }).textContent).toContain('Ответ')
  })

  it('data goes in as text, never as HTML', () => {
    const el = renderFeedback({ ...base, base: '<img src=x>', result: 'correct', addedToStudy: false })
    expect(el.querySelector('img')).toBeNull()
  })
})

describe('settings', () => {
  it('variant and level changes call setSettings', () => {
    const actions = stubActions()
    const root = renderSettings({ actions, choice: { variant: 'gb', level: 'elementary' }, levelCounts, sound: true })

    byText(root, 'Американский').click()
    expect(actions.setSettings).toHaveBeenLastCalledWith({ variant: 'us', level: 'elementary' })

    expect(root.querySelector('select')).toBeNull()
    root.querySelector<HTMLElement>('[data-level="intermediate"]')!.click()
    expect(actions.setSettings).toHaveBeenLastCalledWith({ variant: 'gb', level: 'intermediate' })
  })

  it('sound switch', () => {
    const actions = stubActions()
    const root = renderSettings({ actions, choice: { variant: 'gb', level: 'elementary' }, levelCounts, sound: true })
    const sw = root.querySelector<HTMLElement>('[role="switch"]')!
    expect(sw.getAttribute('aria-checked')).toBe('true')
    sw.click()
    expect(actions.setSound).toHaveBeenCalledWith(false)
  })

  it('reset needs two taps', () => {
    const actions = stubActions()
    const root = renderSettings({ actions, choice: { variant: 'gb', level: 'elementary' }, levelCounts, sound: true })
    const reset = byText(root, 'Сбросить прогресс')

    reset.click()
    expect(actions.resetProgress).not.toHaveBeenCalled()
    expect(reset.textContent).toContain('Точно сбросить')

    reset.click()
    expect(actions.resetProgress).toHaveBeenCalled()
  })
})
