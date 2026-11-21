import { describe, expect, it } from 'vitest'
import { renderMenu } from '../../src/ui/screens/menu'
import { renderProgress } from '../../src/ui/screens/progress'
import { daysLabel, xpLabel } from '../../src/ui/text'
import { byText, stubActions } from './helpers'

describe('labels', () => {
  it.each([
    [1, '1 день'],
    [3, '3 дня'],
    [7, '7 дней'],
    [21, '21 день'],
    [0, '0 дней'],
  ])('daysLabel(%d) = %s', (n, want) => {
    expect(daysLabel(n)).toBe(want)
  })

  it('xpLabel groups thousands', () => {
    expect(xpLabel(1240)).toBe('1 240 XP')
    expect(xpLabel(5)).toBe('5 XP')
  })
})

describe('menu chips and Progress button', () => {
  it('shows streak and XP, opens Progress', () => {
    const actions = stubActions()
    const root = renderMenu({
      actions,
      studying: 1,
      learned: 0,
      level: 'elementary',
      levelWords: 78,
      testResume: null,
      xp: 1240,
      streak: 7,
      arcadeBest: 340,
    })
    expect(root.textContent).toContain('7 дней')
    expect(root.textContent).toContain('1 240 XP')
    expect(root.textContent).toContain('Рекорд 340')
    byText(root, 'Прогресс').click()
    byText(root, 'Аркада').click()
    expect(actions.openProgress).toHaveBeenCalled()
    expect(actions.openArcade).toHaveBeenCalled()
  })
})

describe('progress screen', () => {
  it('XP, streak, week, level bars, achievements', () => {
    const root = renderProgress({
      actions: stubActions(),
      xp: 1240,
      streak: 3,
      week: [false, false, false, false, true, true, true],
      weekdays: ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'],
      levels: [{ level: 'elementary', learned: 42, total: 78 }],
      achievements: [
        { name: 'Первое слово', unlocked: true },
        { name: '30 дней', unlocked: false },
      ],
    })
    expect(root.textContent).toContain('1 240 XP')
    expect(root.textContent).toContain('3 дня')
    expect(root.textContent).toContain('42 из 78')
    expect(root.textContent).toContain('Достижения · 1 из 2')
    expect(root.querySelectorAll('.week .on')).toHaveLength(3)
    expect(root.querySelector('.achievement.locked')?.textContent).toContain('30 дней')
  })
})
