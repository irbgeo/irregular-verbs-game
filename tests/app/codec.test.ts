import { describe, expect, it } from 'vitest'
import verbsData from '../../data/verbs.json'
import { decode, encodeSessions, encodeWords } from '../../src/app/codec'
import { newCatalog } from '../../src/domain/catalog'
import { newLearnFlow } from '../../src/domain/learn-flow'
import { newProgress } from '../../src/domain/progress'
import { newTestFlow } from '../../src/domain/test-flow'
import type { Progress, Verb } from '../../src/domain/types'

const catalog = newCatalog(verbsData.verbs as Verb[])
const vkLimit = 4096

function onboarded(): Progress {
  const p = newProgress()
  p.settings = { variant: 'us', level: 'upper-intermediate', sound: true }
  return p
}

function roundTrip(p: Progress): Progress {
  const saved = {
    p: encodeWords(p),
    s: encodeSessions(p),
  }
  return decode({ saved, catalog })
}

describe('codec round trip', () => {
  it('keeps settings, words and both sessions', () => {
    const p = onboarded()
    p.words = {
      go: { status: 'study', mode: 1, box: 4 },
      be: { status: 'learned', mode: 0, box: 0 },
      do: { status: 'skipped', mode: 0, box: 0 },
    }
    newTestFlow(catalog, p, () => 0).start()
    newLearnFlow(catalog, p, () => 0).start()

    expect(roundTrip(p)).toEqual(p)
  })

  it('a fresh player stays fresh', () => {
    expect(roundTrip(newProgress())).toEqual(newProgress())
  })
})

describe('size: worst case fits a VK value', () => {
  it('all 133 words and a full Test queue', () => {
    const p = onboarded()
    for (const base of catalog.allBases) {
      p.words[base] = { status: 'study', mode: 2, box: 4 }
    }
    newTestFlow(catalog, p, () => 0).start()
    newLearnFlow(catalog, p, () => 0).start()
    p.test!.counts = { correct: 9999, incorrect: 9999, hint: 9999, skipped: 9999 }

    expect(encodeWords(p).length).toBeLessThanOrEqual(vkLimit)
    expect(encodeSessions(p).length).toBeLessThanOrEqual(vkLimit)
  })
})

describe('decode: saved data is untrusted', () => {
  const good = () => {
    const p = onboarded()
    p.words = { go: { status: 'study', mode: 1, box: 2 } }
    return { p: encodeWords(p), s: encodeSessions(p) }
  }

  it.each([null, '', 'not json', '{"v":2}', '[]', '{"v":1}'])('words value %j → fresh progress', (raw) => {
    expect(decode({ saved: { p: raw, s: null }, catalog })).toEqual(newProgress())
  })

  it('bad settings → onboarding again, words kept', () => {
    const raw = '{"v":1,"s":["ru","nope"],"w":"go=s12"}'
    const p = decode({ saved: { p: raw, s: null }, catalog })

    expect(p.settings).toEqual({ variant: null, level: null, sound: true })
    expect(p.words.go).toEqual({ status: 'study', mode: 1, box: 2 })
  })

  it('unknown or broken word entries are dropped', () => {
    const raw = '{"v":1,"s":["gb","elementary"],"w":"go=s12;zzz=s10;be=x10;do=s19;see=l00;take"}'
    const p = decode({ saved: { p: raw, s: null }, catalog })

    expect(Object.keys(p.words).sort()).toEqual(['go', 'see'])
  })

  it.each([
    'not json',
    '{"t":{"base":"zzz","queue":[],"awaitingChoice":false,"counts":{"correct":0,"incorrect":0,"hint":0,"skipped":0}},"l":null}',
    '{"t":{"base":"go","queue":["nope"],"awaitingChoice":false,"counts":{"correct":0,"incorrect":0,"hint":0,"skipped":0}},"l":null}',
    '{"t":{"base":"go","queue":[],"awaitingChoice":"yes","counts":{"correct":0,"incorrect":0,"hint":0,"skipped":0}},"l":null}',
    '{"t":{"base":"go","queue":[],"awaitingChoice":false,"counts":{"correct":-1,"incorrect":0,"hint":0,"skipped":0}},"l":null}',
    '{"t":null,"l":{"recent":["go"],"round":{"base":"go","anchor":"base","target":"base","options":[]}}}',
    '{"t":null,"l":{"recent":["zzz"],"round":null}}',
    '{"t":null,"l":{"recent":["go"],"round":{"base":"go","anchor":"x","target":"past","options":[]}}}',
  ])('broken sessions %# → none', (rawSessions) => {
    const p = decode({ saved: { p: good().p, s: rawSessions }, catalog })

    expect(p.test).toBeNull()
    expect(p.learn).toBeNull()
    expect(p.words.go).toBeDefined()
  })
})

describe('codec: game stats (stage 4)', () => {
  it('round trip of XP, streak and achievements', () => {
    const p = onboarded()
    p.game = {
      xp: 1240,
      streak: { days: 7, last: '2026-11-22' },
      achievements: ['first-word', 'streak-3', 'streak-7'],
      arcadeBest: 340,
    }
    expect(roundTrip(p).game).toEqual(p.game)
  })

  it('a stage 3 save (no game stats) loads with zero stats', () => {
    const raw = '{"v":1,"s":["gb","elementary"],"w":"go=s12"}'
    expect(decode({ saved: { p: raw, s: null }, catalog }).game).toEqual(newProgress().game)
  })

  it.each([
    '{"x":-5,"s":[1,"2026-11-22"],"a":[]}',
    '{"x":10,"s":[1,"22.11.2026"],"a":[]}',
    '{"x":10,"s":"x","a":[]}',
    '"nope"',
  ])('broken stats %j → zero stats', (g) => {
    const raw = `{"v":1,"s":["gb","elementary"],"w":"go=s12","g":${g}}`
    expect(decode({ saved: { p: raw, s: null }, catalog }).game).toEqual(newProgress().game)
  })

  it('unknown achievement ids are dropped', () => {
    const raw = '{"v":1,"s":["gb","elementary"],"w":"","g":{"x":5,"s":[0,null],"a":["streak-3","hack"]}}'
    expect(decode({ saved: { p: raw, s: null }, catalog }).game.achievements).toEqual(['streak-3'])
  })

  it('worst case with stats still fits', () => {
    const p = onboarded()
    for (const base of catalog.allBases) {
      p.words[base] = { status: 'learned', mode: 2, box: 5 }
    }
    p.game = {
      xp: 999_999_999,
      streak: { days: 99_999, last: '2026-11-22' },
      achievements: ['first-word', 'words-10', 'words-50', 'words-100', 'level-done', 'streak-3', 'streak-7', 'streak-30'],
      arcadeBest: 10_000_000,
    }
    expect(encodeWords(p).length).toBeLessThanOrEqual(vkLimit)
  })
})

describe('codec: last task per word', () => {
  it('round trip of the task digit; old codes without it still load', () => {
    const p = onboarded()
    p.words = {
      go: { status: 'study', mode: 1, box: 2, task: 4 },
      be: { status: 'study', mode: 2, box: 0 },
    }
    expect(roundTrip(p).words).toEqual(p.words)

    const old = '{"v":1,"s":["gb","elementary"],"w":"go=s12"}'
    expect(decode({ saved: { p: old, s: null }, catalog }).words.go).toEqual({ status: 'study', mode: 1, box: 2 })
  })
})

describe('codec: sound setting (stage 6)', () => {
  it('round trip; old saves have sound on', () => {
    const p = onboarded()
    p.settings.sound = false
    expect(roundTrip(p).settings.sound).toBe(false)

    const old = '{"v":1,"s":["gb","elementary"],"w":""}'
    expect(decode({ saved: { p: old, s: null }, catalog }).settings.sound).toBe(true)
  })
})
