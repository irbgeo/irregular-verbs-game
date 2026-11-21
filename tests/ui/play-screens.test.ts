import { describe, expect, it } from 'vitest'
import { renderLearn, renderLearnEmpty } from '../../src/ui/screens/learn'
import { renderMyWords } from '../../src/ui/screens/my-words'
import { renderTest } from '../../src/ui/screens/test'
import { renderTestDone } from '../../src/ui/screens/test-done'
import type { RoundView } from '../../src/domain/types'
import { byText, stubActions } from './helpers'

function submit(root: HTMLElement, text: string) {
  const input = root.querySelector('input')!
  input.value = text
  root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('test screen', () => {
  it('question: typed answer, hint, skip; field set for phones', () => {
    const actions = stubActions()
    const root = renderTest({
      actions,
      step: { kind: 'question', base: 'take', feedback: null },
      position: { index: 7, total: 78 },
      xpGain: 0,
    })
    expect(root.textContent).toContain('Слово 7 из 78')
    expect(root.textContent).toContain('take')
    const input = root.querySelector('input')!
    expect(input.getAttribute('autocapitalize')).toBe('off')
    expect(input.getAttribute('spellcheck')).toBe('false')

    submit(root, 'take took taken')
    byText(root, 'Подсказка').click()
    byText(root, 'Пропустить').click()
    expect(actions.testAnswer).toHaveBeenCalledWith('take took taken')
    expect(actions.testHint).toHaveBeenCalled()
    expect(actions.testSkip).toHaveBeenCalled()
  })

  it('choose: to study or skip', () => {
    const actions = stubActions()
    const feedback = { result: 'correct' as const, addedToStudy: false, base: 'take', past: ['took'], participle: ['taken'], translations: ['брать'] }
    const root = renderTest({ actions, step: { kind: 'choose', feedback }, position: { index: 7, total: 78 }, xpGain: 10 })
    expect(root.textContent).toContain('take — took — taken')

    byText(root, 'В изучение').click()
    byText(root, 'Я его знаю').click()
    expect(actions.testKeep).toHaveBeenCalled()
    expect(actions.testDrop).toHaveBeenCalled()
  })

  it('done shows counts', () => {
    const actions = stubActions()
    const root = renderTestDone({ actions, counts: { correct: 3, incorrect: 2, hint: 1, skipped: 4 }, feedback: null })
    expect(root.textContent).toContain('Верно3')
    expect(root.textContent).toContain('Пропущено4')
    byText(root, 'В меню').click()
    expect(actions.toMenu).toHaveBeenCalled()
  })
})

const choiceRound: RoundView = {
  base: 'go',
  anchor: 'past',
  target: 'base',
  options: ['gone', 'goed', 'go', 'wented', 'went'],
  format: 'choice',
  anchorValue: 'went',
  repeat: false,
}

describe('learn screen', () => {
  it('choice: option buttons, step marks, show answer', () => {
    const actions = stubActions()
    const root = renderLearn({ actions, round: choiceRound, feedback: null, box: 3, xpGain: 0 })
    expect(root.textContent).toContain('Ступень 1 · выбор')
    expect(root.textContent).toContain('инфинитив')
    expect(root.querySelector('[aria-label="3 из 5"]')).not.toBeNull()

    byText(root, 'go').click()
    byText(root, 'Показать ответ').click()
    expect(actions.learnChoose).toHaveBeenCalledWith(2)
    expect(actions.learnReveal).toHaveBeenCalled()
  })

  it('input: typed answer; review mark for learned words', () => {
    const actions = stubActions()
    const round: RoundView = { ...choiceRound, format: 'input', options: [], repeat: true, target: 'past', anchor: 'participle', anchorValue: 'written' }
    const root = renderLearn({ actions, round, feedback: null, box: 0, xpGain: 0 })
    expect(root.textContent).toContain('повторение')
    expect(root.textContent).toContain('Напишите past')

    submit(root, 'wrote')
    expect(actions.learnType).toHaveBeenCalledWith('wrote')
  })

  it('empty: go to the Test', () => {
    const actions = stubActions()
    const root = renderLearnEmpty({ actions })
    byText(root, 'Пройти тест').click()
    expect(actions.openTest).toHaveBeenCalled()
  })
})

describe('my words screen', () => {
  it('lists words, toggles a status, saves or cancels', () => {
    const actions = stubActions()
    const root = renderMyWords({
      actions,
      studying: 1,
      learned: 1,
      changes: 1,
      items: [
        { base: 'be', status: 'learned', past: 'was/were', participle: 'been', translation: 'быть' },
        { base: 'go', status: 'skipped', past: 'went', participle: 'gone', translation: 'идти' },
      ],
    })
    expect(root.textContent).toContain('be — was/were — been')
    expect(root.textContent).toContain('не учить')

    byText(root, 'не учить').click()
    byText(root, 'Сохранить (1)').click()
    byText(root, 'Отменить').click()
    expect(actions.myWordsToggle).toHaveBeenCalledWith('go')
    expect(actions.myWordsSave).toHaveBeenCalled()
    expect(actions.myWordsCancel).toHaveBeenCalled()
  })

  it('empty list hint', () => {
    const root = renderMyWords({ actions: stubActions(), studying: 0, learned: 0, changes: 0, items: [] })
    expect(root.textContent).toContain('Пока пусто')
  })
})
