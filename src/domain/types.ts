// Domain types. Everything in Progress must stay JSON-safe (it is saved as is).

export type Level = 'elementary' | 'pre-intermediate' | 'intermediate' | 'upper-intermediate'

export type Variant = 'gb' | 'us'

export type FormKind = 'base' | 'past' | 'participle'

// "new" means the word has no entry in Progress.words.
export type WordStatus = 'study' | 'learned' | 'skipped'

export type DraftStatus = WordStatus | 'new'

export interface Verb {
  base: string
  level: Level
  past: Record<Variant, string[]>
  participle: Record<Variant, string[]>
  translations: string[]
  common_mistakes: string[]
}

export interface WordProgress {
  status: WordStatus
  // 0 = added from My words and not shown yet; 1 = choice; 2 = typed.
  mode: 0 | 1 | 2
  box: number
  // index of the last Learn task for this word (see tasks.ts), to avoid repeats
  task?: number
}

export interface Settings {
  variant: Variant | null
  level: Level | null
  // sound effects on (undefined = on, for objects made before stage 6)
  sound?: boolean
}

export interface TestCounts {
  correct: number
  incorrect: number
  hint: number
  skipped: number
}

export interface TestSession {
  base: string
  queue: string[]
  // answered correctly, waiting for "to study" / "skip"
  awaitingChoice: boolean
  counts: TestCounts
}

export interface Round {
  base: string
  anchor: FormKind
  target: FormKind
  // choice buttons; empty for typed mode
  options: string[]
}

export interface LearnSession {
  recent: string[]
  round: Round | null
}

export interface Streak {
  // length of the current run of days with answers
  days: number
  // last active day, "YYYY-MM-DD" by the device's local date
  last: string | null
}

export type AchievementId =
  | 'first-word'
  | 'words-10'
  | 'words-50'
  | 'words-100'
  | 'level-done'
  | 'streak-3'
  | 'streak-7'
  | 'streak-30'

export interface GameStats {
  xp: number
  streak: Streak
  // in unlock order; once unlocked, never removed
  achievements: AchievementId[]
  // best Arcade score (Arcade points are not XP)
  arcadeBest: number
}

export interface Progress {
  version: 1
  settings: Settings
  words: Record<string, WordProgress>
  test: TestSession | null
  learn: LearnSession | null
  game: GameStats
}

// AnswerEvent is one answer for XP: a Test word, a Learn button or a Learn typed answer.
export interface AnswerEvent {
  kind: 'test' | 'choice' | 'input'
  correct: boolean
  becameLearned: boolean
}

export type AnswerResult = 'correct' | 'hint' | 'incorrect'

// Feedback is what to show after an answer; the UI owns the wording.
export interface Feedback {
  result: AnswerResult
  addedToStudy: boolean
  base: string
  past: string[]
  participle: string[]
  translations: string[]
}

export type TestStep =
  | {
    kind: 'question'
    base: string
    feedback: Feedback | null
  }
  | {
    kind: 'choose'
    feedback: Feedback
  }
  | {
    kind: 'done'
    counts: TestCounts
    feedback: Feedback | null
  }

export type RoundFormat = 'choice' | 'input'

export interface RoundView extends Round {
  format: RoundFormat
  // anchor form(s) joined by "/", base without "to"
  anchorValue: string
  // the word is learned and shown for review
  repeat: boolean
}

export type LearnStep =
  | {
    kind: 'round'
    round: RoundView
    feedback: Feedback | null
  }
  | {
    kind: 'empty'
  }

export interface MyWordsItem {
  base: string
  // status with the draft applied
  status: DraftStatus
  past: string
  participle: string
  translation: string
}


// Rng returns an integer in [0, n).
export type Rng = (n: number) => number

// Argument bundles (owner's rule: at most one parameter per function).

export interface FormArgs {
  verb: Verb
  kind: FormKind
  variant: Variant
}

export interface CheckArgs {
  verb: Verb
  variant: Variant
  input: string
}

export interface CheckTargetArgs extends CheckArgs {
  kind: FormKind
}

export interface FormOptionsArgs extends FormArgs {
  rng: Rng
}

export interface PickArgs {
  allBases: string[]
  words: Record<string, WordProgress>
  recent: string[]
  rng: Rng
}

export interface FeedbackArgs {
  verb: Verb
  variant: Variant
  result: AnswerResult
  addedToStudy: boolean
}

// SetArgs: write `target` for the tapped word (`new` deletes the entry).
export interface SetArgs {
  edit: EditArgs
  target: DraftStatus
}

// EditArgs: a tap on a word in My words / Word list; `original` is its entry
// when first touched on this screen (undefined = it had none).
export interface EditArgs {
  base: string
  original: WordProgress | undefined
}

export interface LadderArgs {
  word: WordProgress
  ok: boolean
}

export interface MatchFormArgs {
  input: string
  forms: string[]
}

export interface SameSetArgs {
  got: string[]
  want: string[]
}

export interface GroupsArgs {
  groups: string[][]
  tokens: string[]
}

export interface PoolArgs {
  allBases: string[]
  words: Record<string, WordProgress>
}

export interface Pool {
  study: string[]
  learned: string[]
}

export interface RecentArgs {
  recent: string[]
  base: string
}

export interface ShuffleArgs {
  items: string[]
  rng: Rng
}

export interface WordArgs {
  words: Record<string, WordProgress>
  base: string
}

export interface ResolveArgs {
  ok: boolean
  reveal: boolean
}

export interface DayArgs {
  // "YYYY-MM-DD"
  day: string
  n: number
}

export interface StreakArgs {
  streak: Streak
  today: string
}

export interface UnlockArgs {
  stats: GameStats
  words: Record<string, WordProgress>
  catalog: import('./catalog').Catalog
  today: string
}

// Task is one kind of Learn question: show `anchor`, ask for `target`.
export interface Task {
  anchor: FormKind
  target: FormKind
}

export interface TasksArgs {
  verb: Verb
  variant: Variant
}

export interface PickTaskArgs {
  count: number
  // the word's last task index, if any
  last: number | undefined
  rng: Rng
}

export interface ArcadeQuestion {
  base: string
  anchor: FormKind
  target: FormKind
  anchorValue: string
  options: string[]
}

// ArcadeRound lives only while the round is played (not saved).
export interface ArcadeRound {
  // ms timestamp when time runs out; moves earlier by the penalty per wrong answer
  endsAt: number
  pausedAt: number | null
  score: number
  // correct answers in a row
  run: number
  bestRun: number
  correct: number
  wrong: number
  recent: string[]
  question: ArcadeQuestion
  // the round got its one «+15 seconds» after a rewarded ad
  extended: boolean
}

export interface ExtendArgs {
  now: number
  ms: number
}

export interface ArcadeAnswerArgs {
  index: number
  now: number
}

export interface ArcadeAnswer {
  correct: boolean
  points: number
}

export interface ArcadeLadderArgs {
  // undefined = the word is not in the player's list
  word: WordProgress | undefined
  correct: boolean
}
