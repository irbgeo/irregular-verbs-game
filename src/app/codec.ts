import { achievementIds } from '../domain/game-layer'
import { isLevel, isVariant, newProgress } from '../domain/progress'
import type {
  AchievementId,
  FormKind,
  GameStats,
  LearnSession,
  Progress,
  Round,
  Settings,
  TestCounts,
  TestSession,
  WordProgress,
  WordStatus,
} from '../domain/types'
import type { CheckArgs, DecodeArgs } from './types'

// Player storage keys (VK: [a-zA-Z_-0-9], ≤ 4096 chars per value). "1" = format version.
export const progressKey = 'iv1_p'
export const sessionsKey = 'iv1_s'

const formatVersion = 1
const statusCodes: Record<WordStatus, string> = {
  study: 's',
  learned: 'l',
  skipped: 'k',
}
const codeStatuses: Record<string, WordStatus> = {
  s: 'study',
  l: 'learned',
  k: 'skipped',
}
// base=status mode box [last task 0–5]
const wordPattern = /^([a-z]+)=([slk])([0-2])([0-5])([0-5])?$/
const formKinds: readonly string[] = [
  'base',
  'past',
  'participle',
]
const maxRecent = 5
const dayPattern = /^\d{4}-\d{2}-\d{2}$/


// encodeWords: settings + words, one short code per word ("go=s14":
// status letter, mode, box) — plain JSON of 133 words is over VK's limit.
export function encodeWords(p: Progress): string {
  const words = Object.entries(p.words).map(([base, w]) => `${base}=${statusCodes[w.status]}${w.mode}${w.box}${w.task ?? ''}`)
  const saved = {
    v: formatVersion,
    s: [
      p.settings.variant,
      p.settings.level,
      p.settings.sound === false ? 0 : 1,
    ],
    w: words.join(';'),
    g: {
      x: p.game.xp,
      s: [
        p.game.streak.days,
        p.game.streak.last,
      ],
      a: p.game.achievements,
      b: p.game.arcadeBest,
    },
  }
  const json = JSON.stringify(saved)
  return json
}

// encodeSessions: the unfinished Test and Learn round.
export function encodeSessions(p: Progress): string {
  const saved = {
    t: p.test,
    l: p.learn,
  }
  const json = JSON.stringify(saved)
  return json
}

// decode rebuilds Progress from storage. Saved data is untrusted: anything
// broken is dropped (see stage 3 TRD §2), nothing throws.
export function decode(args: DecodeArgs): Progress {
  const p = newProgress()
  const words = parseJSON(args.saved.p)
  if (!isRecord(words) || words.v !== formatVersion) {
    return p
  }

  const settings = readSettings(words.s)
  if (settings !== null) {
    p.settings = settings
  }
  if (typeof words.w === 'string') {
    for (const item of words.w.split(';')) {
      const m = wordPattern.exec(item)
      if (m === null || args.catalog.verb(m[1]) === undefined) {
        continue
      }
      const word: WordProgress = {
        status: codeStatuses[m[2]],
        mode: Number(m[3]) as WordProgress['mode'],
        box: Number(m[4]),
      }
      if (m[5] !== undefined) {
        word.task = Number(m[5])
      }
      p.words[m[1]] = word
    }
  }

  const stats = toGameStats(words.g)
  if (stats !== null) {
    p.game = stats
  }

  const sessions = parseJSON(args.saved.s)
  if (isRecord(sessions)) {
    const testArgs: CheckArgs = {
      value: sessions.t,
      catalog: args.catalog,
    }
    const learnArgs: CheckArgs = {
      value: sessions.l,
      catalog: args.catalog,
    }
    p.test = toTestSession(testArgs)
    p.learn = toLearnSession(learnArgs)
  }
  return p
}

function readSettings(raw: unknown): Settings | null {
  if (!Array.isArray(raw)) {
    return null
  }
  const [variant, level, sound] = raw
  if (!isVariant(variant) || !isLevel(level)) {
    return null
  }
  return {
    variant: variant,
    level: level,
    sound: sound !== 0,
  }
}

// toGameStats reads XP, streak and achievements; anything broken → null (zero stats).
function toGameStats(raw: unknown): GameStats | null {
  if (!isRecord(raw) || !isCount(raw.x) || !Array.isArray(raw.s) || !Array.isArray(raw.a)) {
    return null
  }
  const [days, last] = raw.s
  const lastOk = last === null || (typeof last === 'string' && dayPattern.test(last))
  if (!isCount(days) || !lastOk) {
    return null
  }

  const known: readonly unknown[] = achievementIds
  const ids = raw.a.filter((id): id is AchievementId => known.includes(id))
  return {
    xp: raw.x as number,
    streak: {
      days: days as number,
      last: last as string | null,
    },
    achievements: ids,
    arcadeBest: isCount(raw.b) ? (raw.b as number) : 0,
  }
}

function toTestSession(args: CheckArgs): TestSession | null {
  const t = args.value
  if (!isRecord(t) || !isRecord(t.counts) || typeof t.awaitingChoice !== 'boolean') {
    return null
  }
  const bases = [t.base, ...(Array.isArray(t.queue) ? t.queue : [null])]
  const basesArgs: CheckArgs = {
    value: bases,
    catalog: args.catalog,
  }
  if (!Array.isArray(t.queue) || !knownBases(basesArgs)) {
    return null
  }
  const c = t.counts
  const counts = [c.correct, c.incorrect, c.hint, c.skipped]
  if (!counts.every(isCount)) {
    return null
  }

  return {
    base: t.base as string,
    queue: t.queue as string[],
    awaitingChoice: t.awaitingChoice,
    counts: c as unknown as TestCounts,
  }
}

function toLearnSession(args: CheckArgs): LearnSession | null {
  const l = args.value
  if (!isRecord(l) || !Array.isArray(l.recent) || l.recent.length > maxRecent) {
    return null
  }
  const recentArgs: CheckArgs = {
    value: l.recent,
    catalog: args.catalog,
  }
  if (!knownBases(recentArgs)) {
    return null
  }
  if (l.round === null) {
    return {
      recent: l.recent as string[],
      round: null,
    }
  }

  const roundArgs: CheckArgs = {
    value: l.round,
    catalog: args.catalog,
  }
  const round = toRound(roundArgs)
  if (round === null) {
    return null
  }
  return {
    recent: l.recent as string[],
    round: round,
  }
}

function toRound(args: CheckArgs): Round | null {
  const r = args.value
  if (!isRecord(r) || !formKinds.includes(r.anchor as string) || !formKinds.includes(r.target as string)) {
    return null
  }
  const baseArgs: CheckArgs = {
    value: [r.base],
    catalog: args.catalog,
  }
  const options = Array.isArray(r.options) ? r.options : null
  if (r.anchor === r.target || !knownBases(baseArgs) || options === null || !options.every((o) => typeof o === 'string')) {
    return null
  }

  return {
    base: r.base as string,
    anchor: r.anchor as FormKind,
    target: r.target as FormKind,
    options: options as string[],
  }
}

function knownBases(args: CheckArgs): boolean {
  const list = args.value as unknown[]
  const ok = list.every((b) => typeof b === 'string' && args.catalog.verb(b) !== undefined)
  return ok
}

function isCount(x: unknown): boolean {
  return typeof x === 'number' && Number.isSafeInteger(x) && x >= 0
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function parseJSON(raw: string | null): unknown {
  if (raw === null || raw === '') {
    return null
  }
  try {
    const value: unknown = JSON.parse(raw)
    return value
  } catch {
    return null
  }
}
