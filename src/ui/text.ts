import type { AchievementId, FormKind, Level } from '../domain/types'
import type { FormsLine, PluralArgs } from './types'

const levelNames: Record<Level, string> = {
  elementary: 'Elementary',
  'pre-intermediate': 'Pre-Intermediate',
  intermediate: 'Intermediate',
  'upper-intermediate': 'Upper-Intermediate',
}

const kindNames: Record<FormKind, string> = {
  base: 'инфинитив',
  past: 'past',
  participle: 'participle',
}

const achievementNames: Record<AchievementId, string> = {
  'first-word': 'Первое слово',
  'words-10': '10 слов',
  'words-50': '50 слов',
  'words-100': '100 слов',
  'level-done': 'Весь уровень',
  'streak-3': '3 дня',
  'streak-7': '7 дней',
  'streak-30': '30 дней',
}

// Sunday first, as Date.getUTCDay() counts.
const weekdayNames = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function achievementName(id: AchievementId): string {
  return achievementNames[id]
}

// weekdayShort: "пн" for a "YYYY-MM-DD" date.
export function weekdayShort(day: string): string {
  const date = new Date(`${day}T00:00:00Z`)
  const name = weekdayNames[date.getUTCDay()]
  return name
}

export function levelLabel(level: Level): string {
  return levelNames[level]
}

export function kindLabel(kind: FormKind): string {
  return kindNames[kind]
}

// verbsLabel: "1 глагол", "2 глагола", "5 глаголов".
export function verbsLabel(n: number): string {
  const pluralArgs: PluralArgs = {
    n: n,
    forms: ['глагол', 'глагола', 'глаголов'],
  }
  const word = plural(pluralArgs)
  return `${n} ${word}`
}

// daysLabel: "1 день", "3 дня", "7 дней".
export function daysLabel(n: number): string {
  const pluralArgs: PluralArgs = {
    n: n,
    forms: ['день', 'дня', 'дней'],
  }
  const word = plural(pluralArgs)
  return `${n} ${word}`
}

// xpLabel: "1 240 XP" (thousands split by a space).
export function xpLabel(xp: number): string {
  const digits = String(xp)
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${grouped} XP`
}

// formsLine: "be — was/were — been".
export function formsLine(f: FormsLine): string {
  const past = f.past.join('/')
  const participle = f.participle.join('/')
  return `${f.base} — ${past} — ${participle}`
}

// plural picks the Russian form for 1 / 2–4 / 5+ (11–14 take the last one).
function plural(args: PluralArgs): string {
  const last = args.n % 10
  const lastTwo = args.n % 100
  if (last === 1 && lastTwo !== 11) {
    return args.forms[0]
  }
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return args.forms[1]
  }
  return args.forms[2]
}
