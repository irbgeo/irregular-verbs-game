import type {
  ArcadeAnswer,
  Feedback,
  FormKind,
  Level,
  MyWordsItem,
  RoundView,
  TestCounts,
  TestStep,
  Variant,
} from '../domain/types'

export interface SettingsChoice {
  variant: Variant
  level: Level
}

// Actions are what screens can ask the game to do.
export interface Actions {
  finishOnboarding(choice: SettingsChoice): void
  openTest(): void
  testAnswer(text: string): void
  testHint(): void
  testSkip(): void
  testKeep(): void
  testDrop(): void
  openLearn(): void
  learnChoose(index: number): void
  learnType(text: string): void
  learnReveal(): void
  openMyWords(): void
  // myWordsToggle: the status tap, applied at once (stage 7)
  myWordsToggle(base: string): void
  openWordList(): void
  wordListLevel(level: Level): void
  wordListToggle(base: string): void
  openSettings(): void
  setSettings(choice: SettingsChoice): void
  resetProgress(): void
  toMenu(): void
  openProgress(): void
  openArcade(): void
  arcadeAnswer(index: number): void
  arcadeQuit(): void
  // arcadeReward: «+15 секунд за рекламу» on the Arcade result
  arcadeReward(): void
  setSound(on: boolean): void
}

export type LevelCounts = Record<Level, number>

export interface TestPosition {
  index: number
  total: number
}

export interface OnboardingView {
  actions: Actions
  levelCounts: LevelCounts
}

export interface MenuView {
  actions: Actions
  studying: number
  learned: number
  level: Level
  levelWords: number
  testResume: TestPosition | null
  xp: number
  // current streak in days (0 = none)
  streak: number
  arcadeBest: number
}

export interface ArcadeView {
  actions: Actions
  best: number
  msLeft: number
  score: number
  run: number
  anchorValue: string
  target: FormKind
  options: string[]
  // the result of the previous answer, null at the start
  last: ArcadeAnswer | null
}

export interface ArcadeResultView {
  actions: Actions
  score: number
  newRecord: boolean
  correct: number
  wrong: number
  bestRun: number
  // the «+15 секунд за рекламу» offer (once per round)
  canReward: boolean
}

export interface LevelPickerArgs {
  counts: LevelCounts
  selected: Level
  // the group's accessible name
  label: string
  onPick: (level: Level) => void
}

export interface LastArgs {
  el: HTMLElement
  view: ArcadeView
}

export interface TimerArgs {
  root: HTMLElement
  msLeft: number
}

export interface TestView {
  actions: Actions
  step: TestStep
  position: TestPosition
  // XP for the last answer, 0 = no chip
  xpGain: number
}

export interface TestDoneView {
  actions: Actions
  counts: TestCounts
  feedback: Feedback | null
}

export interface LearnView {
  actions: Actions
  round: RoundView
  feedback: Feedback | null
  box: number
  // XP for the last answer, 0 = no chip
  xpGain: number
}

export interface LearnEmptyView {
  actions: Actions
}

export interface MyWordsView {
  actions: Actions
  items: MyWordsItem[]
  studying: number
  learned: number
}

export interface WordListView {
  actions: Actions
  level: Level
  levelCounts: LevelCounts
  items: MyWordsItem[]
}

export interface SettingsView {
  actions: Actions
  choice: SettingsChoice
  levelCounts: LevelCounts
  sound: boolean
}

export interface LevelBar {
  level: Level
  learned: number
  total: number
}

export interface AchievementView {
  name: string
  unlocked: boolean
}

export interface ProgressView {
  actions: Actions
  xp: number
  streak: number
  // last 7 days, oldest first; true = inside the current streak
  week: boolean[]
  // short weekday names for those 7 days
  weekdays: string[]
  levels: LevelBar[]
  achievements: AchievementView[]
}

export interface WordCounts {
  studying: number
  learned: number
}

export interface HeaderArgs {
  view: TestView
  refs: Record<string, HTMLElement>
}

export interface MarksArgs {
  marks: HTMLElement
  // null hides the marks (a learned word on review)
  box: number | null
}

export interface OptionsArgs {
  view: LearnView
  box: HTMLElement
}

export interface RowArgs {
  actions: Actions
  item: MyWordsItem
}

export interface PluralArgs {
  n: number
  // forms for 1, 2–4, 5+
  forms: [string, string, string]
}

export interface FormsLine {
  base: string
  past: string[]
  participle: string[]
}
