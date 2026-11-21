import { levels } from './catalog'
import type { AchievementId, AnswerEvent, DayArgs, Streak, StreakArgs, UnlockArgs } from './types'

// XP rules (project PRD §3.3, stage 4 PRD).
const xpChoice = 5
const xpTyped = 10
const xpLearnedBonus = 20
const weekLength = 7
const msPerDay = 86_400_000

// achievementIds: all achievements in display order.
export const achievementIds: readonly AchievementId[] = [
  'first-word',
  'words-10',
  'words-50',
  'words-100',
  'level-done',
  'streak-3',
  'streak-7',
  'streak-30',
]

const wordMilestones: [AchievementId, number][] = [
  ['first-word', 1],
  ['words-10', 10],
  ['words-50', 50],
  ['words-100', 100],
]
const streakMilestones: [AchievementId, number][] = [
  ['streak-3', 3],
  ['streak-7', 7],
  ['streak-30', 30],
]

// xpFor: points for one answer; wrong answers give 0 (never negative).
export function xpFor(event: AnswerEvent): number {
  if (!event.correct) {
    return 0
  }
  const base = event.kind === 'choice' ? xpChoice : xpTyped
  const bonus = event.becameLearned ? xpLearnedBonus : 0
  return base + bonus
}

// touchStreak records an answer on `today`: same day — unchanged; the day
// after the last one — one more; a gap — a new run of 1.
export function touchStreak(args: StreakArgs): Streak {
  const s = args.streak
  if (s.last === args.today) {
    return s
  }

  const yesterdayArgs: DayArgs = {
    day: args.today,
    n: -1,
  }
  const yesterday = addDays(yesterdayArgs)
  const days = s.last === yesterday ? s.days + 1 : 1
  return {
    days: days,
    last: args.today,
  }
}

// currentStreak: the run still counts until a whole day is missed.
export function currentStreak(args: StreakArgs): number {
  const s = args.streak
  if (s.last === null) {
    return 0
  }
  const yesterdayArgs: DayArgs = {
    day: args.today,
    n: -1,
  }
  const yesterday = addDays(yesterdayArgs)
  const alive = s.last === args.today || s.last === yesterday
  return alive ? s.days : 0
}

// weekMarks: the last 7 days (oldest first, today last), true inside the current run.
export function weekMarks(args: StreakArgs): boolean[] {
  const days = currentStreak(args)
  const last = args.streak.last
  if (days === 0 || last === null) {
    const empty = new Array<boolean>(weekLength).fill(false)
    return empty
  }

  const firstArgs: DayArgs = {
    day: last,
    n: 1 - days,
  }
  const first = addDays(firstArgs)
  const marks: boolean[] = []
  for (let ago = weekLength - 1; ago >= 0; ago--) {
    const dayArgs: DayArgs = {
      day: args.today,
      n: -ago,
    }
    const day = addDays(dayArgs)
    marks.push(day >= first && day <= last)
  }
  return marks
}

// unlocked: achievements earned now and not unlocked before, in a stable order.
export function unlocked(args: UnlockArgs): AchievementId[] {
  const have = new Set(args.stats.achievements)
  const learned = Object.values(args.words).filter((w) => w.status === 'learned').length
  const streakArgs: StreakArgs = {
    streak: args.stats.streak,
    today: args.today,
  }
  const streak = currentStreak(streakArgs)

  const earned: AchievementId[] = []
  for (const [id, need] of wordMilestones) {
    if (learned >= need) {
      earned.push(id)
    }
  }
  const levelDone = levels.some((level) => {
    const bases = args.catalog.basesOf(level)
    return bases.length > 0 && bases.every((b) => args.words[b]?.status === 'learned')
  })
  if (levelDone) {
    earned.push('level-done')
  }
  for (const [id, need] of streakMilestones) {
    if (streak >= need) {
      earned.push(id)
    }
  }

  const fresh = earned.filter((id) => !have.has(id))
  return fresh
}

// addDays shifts a "YYYY-MM-DD" date by n days (UTC math on the date only — no time-zone drift).
export function addDays(args: DayArgs): string {
  const start = Date.parse(`${args.day}T00:00:00Z`)
  const shifted = new Date(start + args.n * msPerDay)
  const day = shifted.toISOString().slice(0, 10)
  return day
}

// localDay: the device's local calendar date as "YYYY-MM-DD".
export function localDay(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
