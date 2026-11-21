import { describe, expect, it } from 'vitest'
import verbsData from '../../data/verbs.json'
import { newCatalog } from '../../src/domain/catalog'
import {
  addDays,
  currentStreak,
  localDay,
  touchStreak,
  unlocked,
  weekMarks,
  xpFor,
} from '../../src/domain/game-layer'
import { newProgress } from '../../src/domain/progress'
import type { AnswerEvent, GameStats, Verb, WordProgress } from '../../src/domain/types'

const catalog = newCatalog(verbsData.verbs as Verb[])

describe('xpFor', () => {
  it.each<[AnswerEvent, number]>([
    [{ kind: 'choice', correct: true, becameLearned: false }, 5],
    [{ kind: 'input', correct: true, becameLearned: false }, 10],
    [{ kind: 'input', correct: true, becameLearned: true }, 30],
    [{ kind: 'test', correct: true, becameLearned: false }, 10],
    [{ kind: 'choice', correct: false, becameLearned: false }, 0],
    [{ kind: 'input', correct: false, becameLearned: false }, 0],
    [{ kind: 'test', correct: false, becameLearned: false }, 0],
  ])('%j → %d', (event, want) => {
    expect(xpFor(event)).toBe(want)
  })
})

describe('dates', () => {
  it('addDays crosses month and year', () => {
    expect(addDays({ day: '2026-11-30', n: 1 })).toBe('2026-12-01')
    expect(addDays({ day: '2026-12-31', n: 1 })).toBe('2027-01-01')
    expect(addDays({ day: '2027-03-01', n: -1 })).toBe('2027-02-28')
    expect(addDays({ day: '2028-03-01', n: -1 })).toBe('2028-02-29')
  })

  it('localDay uses the local calendar date', () => {
    expect(localDay(new Date(2026, 10, 22, 23, 59))).toBe('2026-11-22')
    expect(localDay(new Date(2026, 0, 5, 0, 1))).toBe('2026-01-05')
  })
})

describe('streak', () => {
  it('starts, grows day by day, keeps the same day, resets after a missed day', () => {
    let s = { days: 0, last: null as string | null }
    s = touchStreak({ streak: s, today: '2026-11-30' })
    expect(s).toEqual({ days: 1, last: '2026-11-30' })
    s = touchStreak({ streak: s, today: '2026-11-30' })
    expect(s.days).toBe(1)
    s = touchStreak({ streak: s, today: '2026-12-01' })
    expect(s).toEqual({ days: 2, last: '2026-12-01' })
    s = touchStreak({ streak: s, today: '2026-12-03' })
    expect(s).toEqual({ days: 1, last: '2026-12-03' })
  })

  it('current streak survives until a whole day is missed', () => {
    const streak = { days: 4, last: '2026-11-21' }
    expect(currentStreak({ streak, today: '2026-11-21' })).toBe(4)
    expect(currentStreak({ streak, today: '2026-11-22' })).toBe(4)
    expect(currentStreak({ streak, today: '2026-11-23' })).toBe(0)
    expect(currentStreak({ streak: { days: 0, last: null }, today: '2026-11-23' })).toBe(0)
  })

  it('week marks: days of the current run, oldest first, today last', () => {
    expect(weekMarks({ streak: { days: 3, last: '2026-11-22' }, today: '2026-11-22' })).toEqual([
      false, false, false, false, true, true, true,
    ])
    expect(weekMarks({ streak: { days: 2, last: '2026-11-21' }, today: '2026-11-22' })).toEqual([
      false, false, false, false, true, true, false,
    ])
    expect(weekMarks({ streak: { days: 9, last: '2026-11-22' }, today: '2026-11-22' })).toEqual([
      true, true, true, true, true, true, true,
    ])
    expect(weekMarks({ streak: { days: 5, last: '2026-11-10' }, today: '2026-11-22' })).toEqual([
      false, false, false, false, false, false, false,
    ])
  })
})

function learnedWords(bases: string[]): Record<string, WordProgress> {
  const words: Record<string, WordProgress> = {}
  for (const b of bases) {
    words[b] = { status: 'learned', mode: 0, box: 0 }
  }
  return words
}

function stats(days = 0): GameStats {
  const s = newProgress().game
  s.streak = { days, last: '2026-11-22' }
  return s
}

describe('achievements', () => {
  const today = '2026-11-22'

  it('learned-word milestones', () => {
    const ten = learnedWords(catalog.allBases.slice(0, 10))
    expect(unlocked({ stats: stats(), words: ten, catalog, today })).toEqual(['first-word', 'words-10'])
    const hundred = learnedWords(catalog.allBases.slice(0, 100))
    expect(unlocked({ stats: stats(), words: hundred, catalog, today })).toEqual(
      expect.arrayContaining(['words-50', 'words-100', 'level-done']),
    )
  })

  it('a whole level learned (upper-intermediate has 6 words)', () => {
    const upper = learnedWords(catalog.basesOf('upper-intermediate'))
    expect(unlocked({ stats: stats(), words: upper, catalog, today })).toContain('level-done')
    const almost = learnedWords(catalog.basesOf('upper-intermediate').slice(1))
    expect(unlocked({ stats: stats(), words: almost, catalog, today })).not.toContain('level-done')
  })

  it('streak milestones use the current streak', () => {
    expect(unlocked({ stats: stats(7), words: {}, catalog, today })).toEqual(['streak-3', 'streak-7'])
    expect(unlocked({ stats: stats(30), words: {}, catalog, today })).toContain('streak-30')
    const old = stats(30)
    old.streak.last = '2026-11-01'
    expect(unlocked({ stats: old, words: {}, catalog, today })).toEqual([])
  })

  it('an unlocked achievement is not given twice', () => {
    const s = stats(3)
    s.achievements = ['streak-3']
    expect(unlocked({ stats: s, words: {}, catalog, today })).toEqual([])
  })

  it('basesOf gives one level only', () => {
    expect(catalog.basesOf('elementary')).toHaveLength(78)
    expect(catalog.basesOf('pre-intermediate')).toHaveLength(16)
    expect(catalog.basesOf('intermediate')).toHaveLength(33)
    expect(catalog.basesOf('upper-intermediate')).toHaveLength(6)
  })
})
