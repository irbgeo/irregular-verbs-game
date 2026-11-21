import { describe, expect, it } from 'vitest'
import { renderArcade } from '../../src/ui/screens/arcade'
import { renderArcadeResult } from '../../src/ui/screens/arcade-result'
import { byText, stubActions } from './helpers'

describe('arcade round screen', () => {
  it('time, score, multiplier, run, question, buttons, last result', () => {
    const actions = stubActions()
    const root = renderArcade({
      actions,
      best: 340,
      msLeft: 42_000,
      score: 180,
      run: 6,
      anchorValue: 'seen',
      target: 'past',
      options: ['see', 'saw', 'seed', 'sawed'],
      last: { correct: true, points: 20 },
    })
    const text = root.textContent ?? ''
    expect(text).toContain('0:42')
    expect(text).toContain('180')
    expect(text).toContain('x2')
    expect(text).toContain('6 подряд · ещё 4 до x3')
    expect(text).toContain('Выберите past')
    expect(text).toContain('+20')

    byText(root, 'saw').click()
    root.querySelector<HTMLElement>('[data-ref="quit"]')!.click()
    expect(actions.arcadeAnswer).toHaveBeenCalledWith(1)
    expect(actions.arcadeQuit).toHaveBeenCalled()
  })

  it('x3 after 10 in a row; a wrong answer shows −3 s', () => {
    const root = renderArcade({
      actions: stubActions(),
      best: 0,
      msLeft: 5_000,
      score: 0,
      run: 12,
      anchorValue: 'go',
      target: 'base',
      options: ['go', 'went'],
      last: { correct: false, points: 0 },
    })
    expect(root.textContent).toContain('x3')
    expect(root.textContent).toContain('0:05')
    expect(root.textContent).toContain('−3 с')
  })
})

describe('arcade result screen', () => {
  it('score, record, stats, buttons', () => {
    const actions = stubActions()
    const root = renderArcadeResult({ actions, score: 340, newRecord: true, correct: 28, wrong: 3, bestRun: 14, canReward: true })
    expect(root.textContent).toContain('340')
    expect(root.textContent).toContain('Новый рекорд!')
    expect(root.textContent).toContain('Верно28')
    expect(root.textContent).toContain('Серия14')
    byText(root, '+15 секунд за рекламу').click()
    expect(actions.arcadeReward).toHaveBeenCalled()
    byText(root, 'Ещё раунд').click()
    byText(root, 'В меню').click()
    expect(actions.openArcade).toHaveBeenCalled()
    expect(actions.toMenu).toHaveBeenCalled()
  })

  it('no record chip when the record is not beaten', () => {
    const root = renderArcadeResult({ actions: stubActions(), score: 10, newRecord: false, correct: 1, wrong: 0, bestRun: 1, canReward: false })
    expect(root.textContent).not.toContain('Новый рекорд!')
    expect(root.textContent).not.toContain('+15 секунд')
  })
})
