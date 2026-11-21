import { describe, expect, it } from 'vitest'
import verbsData from '../../data/verbs.json'
import { arcadeLadder, arcadeOptions, newArcade, roundMs } from '../../src/domain/arcade'
import { newCatalog } from '../../src/domain/catalog'
import { checkTarget } from '../../src/domain/check'
import { newProgress } from '../../src/domain/progress'
import type { Progress, Rng, Verb, WordProgress } from '../../src/domain/types'
import { study, zeroRng } from './helpers'

const catalog = newCatalog(verbsData.verbs as Verb[])

function seeded(seed: number): Rng {
  let x = seed
  return (n: number) => {
    x = (x * 1103515245 + 12345) % 2147483648
    return x % n
  }
}

function player(): Progress {
  const p = newProgress()
  p.settings = { variant: 'gb', level: 'elementary' }
  return p
}

// correctIndex: a button that answers the current question correctly.
function correctIndex(arcade: ReturnType<typeof newArcade>): number {
  const q = arcade.round()!.question
  const verb = catalog.verb(q.base)!
  return q.options.findIndex((o) => checkTarget({ verb, variant: 'gb', kind: q.target, input: o }))
}

function wrongIndex(arcade: ReturnType<typeof newArcade>): number {
  const q = arcade.round()!.question
  const verb = catalog.verb(q.base)!
  return q.options.findIndex((o) => !checkTarget({ verb, variant: 'gb', kind: q.target, input: o }))
}

describe('arcadeOptions: 4 buttons', () => {
  it('go → base: the answer + 3 wrong ones, all different', () => {
    const opts = arcadeOptions({ verb: catalog.verb('go')!, kind: 'base', variant: 'gb', rng: zeroRng })
    expect(opts).toHaveLength(4)
    expect(opts).toContain('go')
    expect(new Set(opts).size).toBe(4)
  })

  it('be → past: both variants are there', () => {
    const opts = arcadeOptions({ verb: catalog.verb('be')!, kind: 'past', variant: 'gb', rng: zeroRng })
    expect(opts).toHaveLength(4)
    expect(opts).toEqual(expect.arrayContaining(['was', 'were']))
  })

  it('every verb: exactly one correct "word", the rest wrong, ≤4 buttons', () => {
    for (const verb of verbsData.verbs as Verb[]) {
      for (const kind of ['base', 'past', 'participle'] as const) {
        const opts = arcadeOptions({ verb, kind, variant: 'gb', rng: seeded(3) })
        const good = opts.filter((o) => checkTarget({ verb, variant: 'gb', kind, input: o }))
        expect(opts.length, verb.base).toBeLessThanOrEqual(4)
        expect(opts.length, verb.base).toBeGreaterThanOrEqual(3)
        expect(good.length, `${verb.base} ${kind}`).toBeGreaterThan(0)
        expect(opts.length - good.length, `${verb.base} ${kind}`).toBeGreaterThan(0)
      }
    }
  })
})

describe('arcade round: score, run, penalty, time', () => {
  it('+10, then x2 from the 5th in a row, x3 from the 10th; wrong resets the run', () => {
    const arcade = newArcade(catalog, player(), seeded(1))
    arcade.start(0)
    const points: number[] = []
    for (let i = 0; i < 11; i++) {
      points.push(arcade.answer({ index: correctIndex(arcade), now: 1000 })!.points)
    }
    expect(points).toEqual([10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30])

    const miss = arcade.answer({ index: wrongIndex(arcade), now: 1000 })!
    expect(miss).toEqual({ correct: false, points: 0 })
    const r = arcade.round()!
    expect(r.run).toBe(0)
    expect(r.bestRun).toBe(11)
    expect(r.score).toBe(200)
    expect(r.correct).toBe(11)
    expect(r.wrong).toBe(1)
  })

  it('60 s round, −3 s per wrong answer, ends at 0', () => {
    const arcade = newArcade(catalog, player(), seeded(2))
    arcade.start(10_000)
    expect(arcade.timeLeft(10_000)).toBe(roundMs)
    arcade.answer({ index: wrongIndex(arcade), now: 20_000 })
    expect(arcade.timeLeft(20_000)).toBe(roundMs - 10_000 - 3_000)

    expect(arcade.isOver(66_999)).toBe(false)
    expect(arcade.isOver(67_000)).toBe(true)
    expect(arcade.timeLeft(80_000)).toBe(0)
    expect(arcade.answer({ index: 0, now: 80_000 })).toBeNull()
  })

  it('paused time does not count', () => {
    const arcade = newArcade(catalog, player(), seeded(2))
    arcade.start(0)
    arcade.pause(10_000)
    expect(arcade.timeLeft(50_000)).toBe(50_000)
    arcade.resume(50_000)
    expect(arcade.timeLeft(60_000)).toBe(40_000)
  })

  it('words come from the level and the last 5 do not repeat', () => {
    const arcade = newArcade(catalog, player(), seeded(5))
    arcade.start(0)
    const elementary = new Set(catalog.basesOf('elementary'))
    const seen: string[] = []
    for (let i = 0; i < 300; i++) {
      const base = arcade.round()!.question.base
      expect(elementary.has(base)).toBe(true)
      expect(seen.slice(-5)).not.toContain(base)
      seen.push(base)
      // always correct: wrong answers would use up the time (−3 s each)
      arcade.answer({ index: correctIndex(arcade), now: 0 })
    }
  })

  it('start needs settings', () => {
    expect(() => newArcade(catalog, newProgress(), zeroRng).start(0)).toThrow()
  })
})

describe('arcadeLadder: background training', () => {
  const learned: WordProgress = { status: 'learned', mode: 0, box: 0 }
  const skipped: WordProgress = { status: 'skipped', mode: 0, box: 0 }

  it.each<[string, WordProgress | undefined, boolean, WordProgress | undefined]>([
    ['step 1 correct +1', study(1, 2), true, study(1, 3)],
    ['step 1 wrong → 0', study(1, 3), false, study(1, 0)],
    ['mode 0 counts as step 1', study(0, 0), true, study(1, 1)],
    ['step 2 correct: no change', study(2, 3), true, study(2, 3)],
    ['step 2 wrong → 0', study(2, 3), false, study(2, 0)],
    ['learned correct: no change', learned, true, learned],
    ['learned wrong → study step 2', learned, false, study(2, 0)],
    ['new word wrong → study', undefined, false, study(1, 0)],
    ['new word correct: nothing', undefined, true, undefined],
    ['skipped: nothing', skipped, false, skipped],
  ])('%s', (_name, word, correct, want) => {
    expect(arcadeLadder({ word, correct })).toEqual(want)
  })

  it('answers change the player words', () => {
    const p = player()
    const arcade = newArcade(catalog, p, seeded(9))
    arcade.start(0)
    const base = arcade.round()!.question.base
    arcade.answer({ index: wrongIndex(arcade), now: 0 })
    expect(p.words[base]).toMatchObject(study(1, 0))
  })
})

describe('arcade: +15 s after a rewarded ad', () => {
  it('only when the round is over, only once per round', () => {
    const arcade = newArcade(catalog, player(), seeded(4))
    arcade.start(0)
    expect(arcade.extend({ now: 30_000, ms: 15_000 })).toBe(false)

    expect(arcade.isOver(60_000)).toBe(true)
    expect(arcade.extend({ now: 70_000, ms: 15_000 })).toBe(true)
    expect(arcade.timeLeft(70_000)).toBe(15_000)
    expect(arcade.answer({ index: correctIndex(arcade), now: 71_000 })).not.toBeNull()

    expect(arcade.isOver(85_000)).toBe(true)
    expect(arcade.extend({ now: 90_000, ms: 15_000 })).toBe(false)
    expect(arcade.round()!.extended).toBe(true)
  })
})
