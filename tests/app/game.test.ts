import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newGame } from '../../src/app/game'
import type { Saver } from '../../src/app/saver'
import { newProgress } from '../../src/domain/progress'
import type { Progress } from '../../src/domain/types'
import { testCatalog, zeroRng } from '../domain/helpers'
import { byText } from '../ui/helpers'
import { newFakePlatform } from '../fake-platform'
import type { Sound } from '../../src/ui/sound'

function fakeSaver() {
  const saver: Saver = {
    markDirty: vi.fn(),
    flushSoon: vi.fn(),
    flushNow: vi.fn(async () => {}),
  }
  return saver
}

function fakeSound() {
  const sound: Sound = {
    play: vi.fn(),
    setEnabled: vi.fn(),
    mute: vi.fn(),
  }
  return sound
}

function setup(progress: Progress = newProgress()) {
  const root = document.createElement('div')
  const saver = fakeSaver()
  const platform = newFakePlatform()
  const sound = fakeSound()
  const game = newGame({ catalog: testCatalog(), progress, saver, platform, sound, rng: zeroRng, root })
  game.start()
  return { root, saver, game, progress, platform, sound }
}

function onboarded(): Progress {
  const p = newProgress()
  p.settings = { variant: 'gb', level: 'elementary' }
  return p
}

describe('game: start and onboarding', () => {
  it('a new player sees onboarding; finishing it opens the menu and saves', () => {
    const { root, game, saver, progress } = setup()
    expect(game.screen()).toBe('onboarding')

    game.finishOnboarding({ variant: 'us', level: 'pre-intermediate' })

    expect(game.screen()).toBe('menu')
    expect(progress.settings).toEqual({ variant: 'us', level: 'pre-intermediate' })
    expect(saver.markDirty).toHaveBeenCalledWith({ words: true, sessions: false })
    expect(root.textContent).toContain('Pre-Intermediate')
  })

  it('an onboarded player starts on the menu', () => {
    expect(setup(onboarded()).game.screen()).toBe('menu')
  })
})

describe('game: Test', () => {
  it('wrong answer shows feedback and the next word', () => {
    const { root, game, saver } = setup(onboarded())
    game.openTest()
    game.testAnswer('nope')

    expect(game.screen()).toBe('test')
    expect(root.textContent).toContain('Неверно')
    expect(saver.markDirty).toHaveBeenLastCalledWith({ words: true, sessions: true })
  })

  it('a saved Test is resumed from the menu, not restarted', () => {
    const p = onboarded()
    setup(p).game.openTest()
    const first = p.test!.base
    p.test!.queue = []

    const again = setup(p)
    expect(again.root.textContent).toContain('Продолжить')
    again.game.openTest()
    expect(p.test!.base).toBe(first)
  })

  it('the last word ends the Test with counts; back to menu flushes soon', () => {
    const { root, game, saver } = setup(onboarded())
    game.openTest()
    game.testSkip()
    game.testSkip()

    expect(game.screen()).toBe('test-done')
    expect(root.textContent).toContain('Пропущено')
    game.toMenu()
    expect(saver.flushSoon).toHaveBeenCalled()
  })
})

describe('game: Learn, My words, Settings', () => {
  it('Learn with nothing to learn shows the empty screen', () => {
    const { game } = setup(onboarded())
    game.openLearn()
    expect(game.screen()).toBe('learn-empty')
  })

  it('Learn from the menu always starts a new session', () => {
    const p = onboarded()
    p.words = { go: { status: 'study', mode: 2, box: 0 } }
    p.learn = { recent: ['be', 'build', 'x', 'y', 'z'], round: null }
    const { game } = setup(p)
    game.openLearn()

    expect(game.screen()).toBe('learn')
    expect(p.learn?.recent).toEqual(['go'])
  })

  it('My words: toggle then save writes the draft', () => {
    const p = onboarded()
    p.words = { go: { status: 'study', mode: 2, box: 3 } }
    const { game, root } = setup(p)
    game.openMyWords()
    game.myWordsToggle('go')
    expect(root.textContent).toContain('Сохранить (1)')

    game.myWordsSave()
    expect(p.words.go.status).toBe('learned')
  })

  it('My words: cancel drops the draft', () => {
    const p = onboarded()
    p.words = { go: { status: 'study', mode: 2, box: 3 } }
    const { game } = setup(p)
    game.openMyWords()
    game.myWordsToggle('go')
    game.myWordsCancel()

    expect(p.words.go.status).toBe('study')
  })

  it('changing settings clears saved sessions', () => {
    const p = onboarded()
    const { game } = setup(p)
    game.openTest()
    game.setSettings({ variant: 'us', level: 'elementary' })

    expect(p.test).toBeNull()
    expect(p.learn).toBeNull()
    expect(p.settings.variant).toBe('us')
  })

  it('reset wipes progress and goes to onboarding', () => {
    const p = onboarded()
    p.words = { go: { status: 'learned', mode: 0, box: 0 } }
    const { game } = setup(p)
    game.openSettings()
    game.resetProgress()

    expect(game.screen()).toBe('onboarding')
    expect(p).toEqual(newProgress())
  })
})

describe('game: XP, streak, achievements (stage 4)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 22, 12, 0))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('a correct Test word gives 10 XP and starts the streak', () => {
    const { game, progress } = setup(onboarded())
    game.openTest()
    game.testAnswer('go went gone')

    expect(progress.game.xp).toBe(10)
    expect(progress.game.streak).toEqual({ days: 1, last: '2026-11-22' })
  })

  it('a wrong answer counts for the streak but gives no XP; skip gives neither', () => {
    const p = onboarded()
    const { game } = setup(p)
    game.openTest()
    game.testSkip()
    expect(p.game.streak.days).toBe(0)

    game.testAnswer('nope')
    expect(p.game.xp).toBe(0)
    expect(p.game.streak.days).toBe(1)
  })

  it('learning a word: 10 + 20 XP, achievement toast, chip on screen', () => {
    const p = onboarded()
    p.words = { go: { status: 'study', mode: 2, box: 4 } }
    const { game, root } = setup(p)
    game.openLearn()
    const target = p.learn!.round!.target
    const answer = { base: 'go', past: 'went', participle: 'gone' }[target]
    game.learnType(answer)

    expect(p.game.xp).toBe(30)
    expect(p.game.achievements).toEqual(['first-word'])
    expect(document.body.textContent).toContain('Достижение: Первое слово')
    expect(root.textContent).toContain('+30 XP')
  })

  it('My words "learned" gives no XP; reset clears stats', () => {
    const p = onboarded()
    p.words = { go: { status: 'study', mode: 2, box: 3 } }
    p.game.xp = 50
    const { game } = setup(p)
    game.openMyWords()
    game.myWordsToggle('go')
    game.myWordsSave()
    expect(p.game.xp).toBe(50)

    game.resetProgress()
    expect(p.game).toEqual(newProgress().game)
  })

  it('Progress screen opens from the menu', () => {
    const p = onboarded()
    p.game = { xp: 1240, streak: { days: 7, last: '2026-11-22' }, achievements: ['first-word'], arcadeBest: 0 }
    const { game, root } = setup(p)
    expect(root.textContent).toContain('7 дней')
    game.openProgress()

    expect(game.screen()).toBe('progress')
    expect(root.textContent).toContain('Достижения · 1 из 8')
  })
})

describe('game: Arcade (stage 5)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 22, 12, 0))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  // zeroRng on the test catalog: first question "be → past", buttons was / were / be / been.
  it('a round: score, streak without XP, ends after 60 s with a new record', () => {
    const p = onboarded()
    const { game, root } = setup(p)
    expect(root.textContent).toContain('Рекорд 0')
    game.openArcade()
    expect(game.screen()).toBe('arcade')

    byText(root, 'was').click()
    expect(root.textContent).toContain('+10')
    expect(p.game.xp).toBe(0)
    expect(p.game.streak.days).toBe(1)

    vi.advanceTimersByTime(61_000)
    expect(game.screen()).toBe('arcade-result')
    expect(root.textContent).toContain('Новый рекорд!')
    expect(p.game.arcadeBest).toBe(10)
  })

  it('a lower score is not a record; quitting keeps the best', () => {
    const p = onboarded()
    p.game.arcadeBest = 500
    const { game, root } = setup(p)
    game.openArcade()
    vi.advanceTimersByTime(61_000)
    expect(root.textContent).not.toContain('Новый рекорд!')

    game.openArcade()
    byText(root, 'was').click()
    game.arcadeQuit()
    expect(game.screen()).toBe('menu')
    expect(p.game.arcadeBest).toBe(500)
  })

  it('a wrong answer costs 3 s; the timer pauses while hidden', () => {
    const { game, root } = setup(onboarded())
    game.openArcade()
    byText(root, 'been').click()
    expect(root.textContent).toContain('−3 с')
    vi.advanceTimersByTime(1_000)
    expect(root.querySelector('[data-ref="time"]')?.textContent).toBe('0:56')

    game.onVisibility(true)
    vi.advanceTimersByTime(30_000)
    game.onVisibility(false)
    vi.advanceTimersByTime(250)
    expect(root.querySelector('[data-ref="time"]')?.textContent).toBe('0:56')
  })
})

describe('game: sound and ads (stage 6)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 22, 12, 0))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sounds for right / wrong answers; the switch is saved; hidden → muted', () => {
    const p = onboarded()
    const { game, sound, saver } = setup(p)
    expect(sound.setEnabled).toHaveBeenCalledWith(true)
    game.openTest()
    game.testAnswer('go went gone')
    expect(sound.play).toHaveBeenLastCalledWith('correct')
    game.testKeep()
    game.testAnswer('nope')
    expect(sound.play).toHaveBeenLastCalledWith('wrong')

    game.setSound(false)
    expect(p.settings.sound).toBe(false)
    expect(sound.setEnabled).toHaveBeenLastCalledWith(false)
    expect(saver.markDirty).toHaveBeenLastCalledWith({ words: true, sessions: false })

    game.onVisibility(true)
    expect(sound.mute).toHaveBeenLastCalledWith(true)
  })

  it('round end sound; leaving the result to the menu shows one interstitial per 60 s', async () => {
    const { game, platform, sound } = setup(onboarded())
    game.openArcade()
    vi.advanceTimersByTime(61_000)
    expect(sound.play).toHaveBeenLastCalledWith('round-end')

    game.toMenu()
    await vi.advanceTimersByTimeAsync(0)
    expect(platform.ads).toEqual(['interstitial'])
    expect(game.screen()).toBe('menu')

    // a finished Test right after: leaving it to the menu is within 60 s → no ad
    game.openTest()
    game.testSkip()
    game.testSkip()
    game.toMenu()
    await vi.advanceTimersByTimeAsync(0)
    expect(platform.ads).toEqual(['interstitial'])
  })

  it('«+15 секунд за рекламу» continues the round once', async () => {
    const { game, root, platform } = setup(onboarded())
    game.openArcade()
    vi.advanceTimersByTime(61_000)
    byText(root, '+15 секунд за рекламу').click()
    await vi.advanceTimersByTimeAsync(0)

    expect(platform.ads).toEqual(['reward'])
    expect(game.screen()).toBe('arcade')
    expect(root.querySelector('[data-ref="time"]')?.textContent).toBe('0:15')

    vi.advanceTimersByTime(16_000)
    expect(game.screen()).toBe('arcade-result')
    expect(root.textContent).not.toContain('+15 секунд за рекламу')
  })

  it('no ad available → a toast, the result stays', async () => {
    const { game, root, platform } = setup(onboarded())
    platform.adResult = false
    game.openArcade()
    vi.advanceTimersByTime(61_000)
    byText(root, '+15 секунд за рекламу').click()
    await vi.advanceTimersByTimeAsync(0)

    expect(game.screen()).toBe('arcade-result')
    expect(document.body.textContent).toContain('Реклама сейчас недоступна')
  })
})
