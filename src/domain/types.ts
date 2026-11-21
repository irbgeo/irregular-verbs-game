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
}

export interface Settings {
  variant: Variant | null
  level: Level | null
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

export interface Progress {
  version: 1
  settings: Settings
  words: Record<string, WordProgress>
  test: TestSession | null
  learn: LearnSession | null
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

export type Draft = Record<string, DraftStatus>

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

export interface ToggleArgs {
  draft: Draft
  base: string
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

export interface ItemArgs {
  base: string
  draft: Draft
}

export interface ResolveArgs {
  ok: boolean
  reveal: boolean
}
