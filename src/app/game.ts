import type { Catalog } from '../domain/catalog'
import { levels } from '../domain/catalog'
import { newArcade, type Arcade } from '../domain/arcade'
import { newLearnFlow, type LearnFlow } from '../domain/learn-flow'
import { newMyWords, type MyWords } from '../domain/my-words'
import {
  achievementIds,
  addDays,
  currentStreak,
  localDay,
  touchStreak,
  unlocked,
  weekMarks,
  xpFor,
} from '../domain/game-layer'
import { isOnboarded, newProgress } from '../domain/progress'
import { newTestFlow, type TestFlow } from '../domain/test-flow'
import type {
  AnswerEvent,
  ArcadeAnswer,
  ArcadeAnswerArgs,
  ArcadeRound,
  ExtendArgs,
  DayArgs,
  Draft,
  LearnStep,
  Progress,
  StreakArgs,
  TestSession,
  TestStep,
  ToggleArgs,
  UnlockArgs,
} from '../domain/types'
import { renderArcade, updateArcadeTimer } from '../ui/screens/arcade'
import { renderArcadeResult } from '../ui/screens/arcade-result'
import { renderLearn, renderLearnEmpty } from '../ui/screens/learn'
import { renderMenu } from '../ui/screens/menu'
import { renderMyWords } from '../ui/screens/my-words'
import { renderOnboarding } from '../ui/screens/onboarding'
import { renderProgress } from '../ui/screens/progress'
import { renderSettings } from '../ui/screens/settings'
import { renderTest } from '../ui/screens/test'
import { renderTestDone } from '../ui/screens/test-done'
import { achievementName, weekdayShort } from '../ui/text'
import { showToast } from '../ui/toast'
import type {
  AchievementView,
  Actions,
  ArcadeResultView,
  ArcadeView,
  LevelBar,
  LearnEmptyView,
  LearnView,
  LevelCounts,
  MenuView,
  MyWordsView,
  OnboardingView,
  ProgressView,
  SettingsChoice,
  SettingsView,
  TestDoneView,
  TestPosition,
  TestView,
  TimerArgs,
  WordCounts,
} from '../ui/types'
import type { Saver } from './saver'
import type { DirtyKeys, GameDeps, LearnBefore } from './types'
import { newAdPolicy, type AdPolicy } from './ads'
import type { AdFormat, Platform } from '../platform/port'
import type { Sound } from '../ui/sound'

export type Screen =
  | 'onboarding'
  | 'menu'
  | 'test'
  | 'test-done'
  | 'learn'
  | 'learn-empty'
  | 'my-words'
  | 'settings'
  | 'progress'
  | 'arcade'
  | 'arcade-result'

// Game is the controller: it runs the flows on the Progress, saves, and draws screens.
export interface Game extends Actions {
  start(): void
  screen(): Screen
  // onVisibility pauses / resumes an Arcade round when the page is hidden / shown.
  onVisibility(hidden: boolean): void
}

// The Arcade timer text is redrawn this often.
const tickMs = 250
// A rewarded ad gives this much more Arcade time.
const rewardMs = 15_000

const both: DirtyKeys = {
  words: true,
  sessions: true,
}
const wordsOnly: DirtyKeys = {
  words: true,
  sessions: false,
}

class Controller implements Game {
  private current: Screen = 'onboarding'
  private testStep: TestStep | null = null
  private learnStep: LearnStep | null = null
  private draft: Draft = {}
  // XP of the last answer, shown as "+N XP"
  private lastXp = 0
  private readonly arcade: Arcade
  private timer: ReturnType<typeof setInterval> | null = null
  private lastArcade: ArcadeAnswer | null = null
  private arcadeEnd: ArcadeResultView | null = null
  private readonly testFlow: TestFlow
  private readonly learnFlow: LearnFlow
  private readonly myWords: MyWords
  private readonly levelCounts: LevelCounts

  private readonly catalog: Catalog
  private readonly progress: Progress
  private readonly saver: Saver
  private readonly platform: Platform
  private readonly sound: Sound
  private readonly root: HTMLElement
  private readonly ads: AdPolicy = newAdPolicy()

  constructor(deps: GameDeps) {
    this.catalog = deps.catalog
    this.progress = deps.progress
    this.saver = deps.saver
    this.platform = deps.platform
    this.sound = deps.sound
    this.root = deps.root
    const catalog = deps.catalog
    const progress = deps.progress
    const rng = deps.rng
    this.testFlow = newTestFlow(catalog, progress, rng)
    this.learnFlow = newLearnFlow(catalog, progress, rng)
    this.myWords = newMyWords(catalog, progress)
    this.arcade = newArcade(catalog, progress, rng)
    const counts = levels.map((l) => [l, catalog.basesUpTo(l).length])
    this.levelCounts = Object.fromEntries(counts) as LevelCounts
  }

  start(): void {
    this.sound.setEnabled(this.progress.settings.sound !== false)
    const ready = isOnboarded(this.progress)
    this.show(ready ? 'menu' : 'onboarding')
  }

  screen(): Screen {
    return this.current
  }

  finishOnboarding(choice: SettingsChoice): void {
    this.progress.settings = {
      variant: choice.variant,
      level: choice.level,
    }
    this.saver.markDirty(wordsOnly)
    this.show('menu')
  }

  openTest(): void {
    this.lastXp = 0
    const step = this.testFlow.current() ?? this.testFlow.start()
    this.onTest(step)
  }

  testAnswer(text: string): void {
    const waiting = this.progress.test?.awaitingChoice === true
    const step = this.testFlow.answer(text)
    if (!waiting) {
      const event: AnswerEvent = {
        kind: 'test',
        correct: step.kind === 'choose',
        becameLearned: false,
      }
      this.record(event)
      this.sound.play(event.correct ? 'correct' : 'wrong')
    }
    this.onTest(step)
  }

  testHint(): void {
    const waiting = this.progress.test?.awaitingChoice === true
    const step = this.testFlow.hint()
    if (!waiting) {
      const event: AnswerEvent = {
        kind: 'test',
        correct: false,
        becameLearned: false,
      }
      this.record(event)
    }
    this.onTest(step)
  }

  testSkip(): void {
    const step = this.testFlow.skip()
    this.onTest(step)
  }

  testKeep(): void {
    const step = this.testFlow.keep()
    this.onTest(step)
  }

  testDrop(): void {
    const step = this.testFlow.drop()
    this.onTest(step)
  }

  // Learn from the menu always starts a new session (stage 2 RESULT).
  openLearn(): void {
    this.lastXp = 0
    const step = this.learnFlow.start()
    this.onLearn(step)
  }

  learnChoose(index: number): void {
    const before = this.learnBefore()
    const step = this.learnFlow.choose(index)
    this.afterLearn(before, step)
  }

  learnType(text: string): void {
    const before = this.learnBefore()
    const step = this.learnFlow.type(text)
    this.afterLearn(before, step)
  }

  learnReveal(): void {
    const before = this.learnBefore()
    const step = this.learnFlow.reveal()
    this.afterLearn(before, step)
  }

  openProgress(): void {
    this.show('progress')
  }

  openArcade(): void {
    this.lastArcade = null
    this.arcade.start(Date.now())
    this.show('arcade')
    this.startTimer()
  }

  // arcadeReward: a rewarded ad → the round goes on for 15 s more (once per round).
  arcadeReward(): void {
    void this.reward()
  }

  setSound(on: boolean): void {
    this.progress.settings.sound = on
    this.sound.setEnabled(on)
    this.saver.markDirty(wordsOnly)
    this.show('settings')
  }

  arcadeAnswer(index: number): void {
    const answerArgs: ArcadeAnswerArgs = {
      index: index,
      now: Date.now(),
    }
    const answer = this.arcade.answer(answerArgs)
    if (answer === null) {
      return
    }
    this.lastArcade = answer
    this.sound.play(answer.correct ? 'correct' : 'wrong')
    this.recordDay()
    this.saver.markDirty(wordsOnly)
    this.show('arcade')
  }

  // arcadeQuit leaves the round: no record.
  arcadeQuit(): void {
    this.toMenu()
  }

  onVisibility(hidden: boolean): void {
    this.sound.mute(hidden)
    if (this.current !== 'arcade') {
      return
    }
    const now = Date.now()
    if (hidden) {
      this.arcade.pause(now)
    } else {
      this.arcade.resume(now)
    }
  }

  private startTimer(): void {
    this.timer = setInterval(() => this.tick(), tickMs)
  }

  private async reward(): Promise<void> {
    const round = this.arcade.round()
    if (this.current !== 'arcade-result' || round === null || round.extended) {
      return
    }
    const shown = await this.showAd('reward')
    const extendArgs: ExtendArgs = {
      now: Date.now(),
      ms: rewardMs,
    }
    if (!shown || !this.arcade.extend(extendArgs)) {
      showToast('Реклама сейчас недоступна')
      return
    }
    this.lastArcade = null
    this.show('arcade')
    this.startTimer()
  }

  // showAd: sound off while the ad plays; any shown ad starts the 60 s gap.
  private async showAd(format: AdFormat): Promise<boolean> {
    this.sound.mute(true)
    const shown = await this.platform.showAd(format)
    this.sound.mute(false)
    if (shown) {
      this.ads.shown(Date.now())
    }
    return shown
  }

  private playResult(step: LearnStep): void {
    if (step.kind !== 'round' || step.feedback === null) {
      return
    }
    if (step.feedback.result === 'correct') {
      this.sound.play('correct')
    }
    if (step.feedback.result === 'incorrect') {
      this.sound.play('wrong')
    }
  }

  // tick redraws the timer; at 0 the round ends.
  private tick(): void {
    const now = Date.now()
    if (this.arcade.isOver(now)) {
      this.finishArcade()
      return
    }
    const timerArgs: TimerArgs = {
      root: this.root,
      msLeft: this.arcade.timeLeft(now),
    }
    updateArcadeTimer(timerArgs)
  }

  private finishArcade(): void {
    const round = this.arcade.round()
    if (round === null) {
      return
    }
    const stats = this.progress.game
    const newRecord = round.score > stats.arcadeBest
    if (newRecord) {
      stats.arcadeBest = round.score
    }
    this.sound.play('round-end')
    this.arcadeEnd = {
      actions: this,
      score: round.score,
      newRecord: newRecord,
      correct: round.correct,
      wrong: round.wrong,
      bestRun: round.bestRun,
      canReward: !round.extended,
    }
    this.saver.markDirty(wordsOnly)
    this.saver.flushSoon()
    this.show('arcade-result')
  }

  openMyWords(): void {
    this.draft = {}
    this.show('my-words')
  }

  myWordsToggle(base: string): void {
    const toggleArgs: ToggleArgs = {
      draft: this.draft,
      base: base,
    }
    this.draft = this.myWords.toggle(toggleArgs)
    this.show('my-words')
  }

  myWordsSave(): void {
    this.myWords.commit(this.draft)
    this.draft = {}
    this.saver.markDirty(wordsOnly)
    this.show('my-words')
  }

  myWordsCancel(): void {
    this.draft = {}
    this.show('my-words')
  }

  openSettings(): void {
    this.show('settings')
  }

  // setSettings also drops the unfinished Test / Learn: they were built for the old settings.
  setSettings(choice: SettingsChoice): void {
    this.progress.settings = {
      variant: choice.variant,
      level: choice.level,
    }
    this.progress.test = null
    this.progress.learn = null
    this.saver.markDirty(both)
    this.show('settings')
  }

  resetProgress(): void {
    const fresh = newProgress()
    Object.assign(this.progress, fresh)
    this.saver.markDirty(both)
    this.show('onboarding')
  }

  // toMenu: leaving a finished Arcade round or Test may show one interstitial ad.
  toMenu(): void {
    const finished = this.current === 'arcade-result' || this.current === 'test-done'
    this.saver.flushSoon()
    this.show('menu')
    if (finished && this.ads.canShow(Date.now())) {
      void this.showAd('interstitial')
    }
  }

  // learnBefore: what the answered word looked like before the answer.
  private learnBefore(): LearnBefore | null {
    const round = this.progress.learn?.round
    if (round === undefined || round === null) {
      return null
    }
    const word = this.progress.words[round.base]
    const choice = word?.status === 'study' && word.mode === 1
    return {
      base: round.base,
      kind: choice ? 'choice' : 'input',
      wasLearned: word?.status === 'learned',
    }
  }

  // afterLearn records XP / streak when the step really answered (has feedback).
  private afterLearn(before: LearnBefore | null, step: LearnStep): void {
    const answered = step.kind === 'round' && step.feedback !== null
    if (before !== null && answered) {
      const nowLearned = this.progress.words[before.base]?.status === 'learned'
      const event: AnswerEvent = {
        kind: before.kind,
        correct: step.feedback?.result === 'correct',
        becameLearned: !before.wasLearned && nowLearned,
      }
      this.record(event)
      this.playResult(step)
    }
    this.onLearn(step)
  }

  // record: XP for the answer, then the day (streak, achievements).
  private record(event: AnswerEvent): void {
    this.lastXp = xpFor(event)
    this.progress.game.xp += this.lastXp
    this.recordDay()
  }

  // recordDay: streak for today and new achievements (with a toast); Arcade uses it without XP.
  private recordDay(): void {
    const today = localDay(new Date())
    const stats = this.progress.game
    const streakArgs: StreakArgs = {
      streak: stats.streak,
      today: today,
    }
    stats.streak = touchStreak(streakArgs)

    const unlockArgs: UnlockArgs = {
      stats: stats,
      words: this.progress.words,
      catalog: this.catalog,
      today: today,
    }
    const fresh = unlocked(unlockArgs)
    stats.achievements.push(...fresh)
    for (const id of fresh) {
      const name = achievementName(id)
      showToast(`Достижение: ${name}`)
    }
    if (fresh.length > 0) {
      this.sound.play('achievement')
    }
  }

  private onTest(step: TestStep): void {
    this.saver.markDirty(both)
    this.testStep = step
    this.show(step.kind === 'done' ? 'test-done' : 'test')
  }

  private onLearn(step: LearnStep): void {
    this.saver.markDirty(both)
    this.learnStep = step
    this.show(step.kind === 'empty' ? 'learn-empty' : 'learn')
  }

  private show(screen: Screen): void {
    if (screen !== 'arcade' && this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.current = screen
    const el = this.render()
    this.root.replaceChildren(el)
    const main = el.querySelector<HTMLElement>('[data-autofocus]')
    main?.focus()
  }

  private render(): HTMLElement {
    switch (this.current) {
      case 'onboarding':
        return this.renderOnboarding()
      case 'menu':
        return this.renderMenu()
      case 'test':
      case 'test-done':
        return this.renderTest()
      case 'learn':
      case 'learn-empty':
        return this.renderLearn()
      case 'my-words':
        return this.renderMyWords()
      case 'settings':
        return this.renderSettings()
      case 'progress':
        return this.renderProgress()
      case 'arcade':
        return this.renderArcade()
      case 'arcade-result':
        return renderArcadeResult(this.arcadeEnd as ArcadeResultView)
    }
  }

  private renderArcade(): HTMLElement {
    const round = this.arcade.round() as ArcadeRound
    const q = round.question
    const view: ArcadeView = {
      actions: this,
      best: this.progress.game.arcadeBest,
      msLeft: this.arcade.timeLeft(Date.now()),
      score: round.score,
      run: round.run,
      anchorValue: q.anchorValue,
      target: q.target,
      options: q.options,
      last: this.lastArcade,
    }
    const el = renderArcade(view)
    return el
  }

  private renderProgress(): HTMLElement {
    const today = localDay(new Date())
    const streakArgs: StreakArgs = {
      streak: this.progress.game.streak,
      today: today,
    }
    const weekdays = [6, 5, 4, 3, 2, 1, 0].map((ago) => {
      const dayArgs: DayArgs = {
        day: today,
        n: -ago,
      }
      const day = addDays(dayArgs)
      const name = weekdayShort(day)
      return name
    })
    const bars = levels.map((level): LevelBar => {
      const bases = this.catalog.basesOf(level)
      const learned = bases.filter((b) => this.progress.words[b]?.status === 'learned').length
      return {
        level: level,
        learned: learned,
        total: bases.length,
      }
    })
    const have = new Set(this.progress.game.achievements)
    const achievements = achievementIds.map((id): AchievementView => {
      return {
        name: achievementName(id),
        unlocked: have.has(id),
      }
    })

    const view: ProgressView = {
      actions: this,
      xp: this.progress.game.xp,
      streak: currentStreak(streakArgs),
      week: weekMarks(streakArgs),
      weekdays: weekdays,
      levels: bars,
      achievements: achievements,
    }
    const el = renderProgress(view)
    return el
  }

  private renderOnboarding(): HTMLElement {
    const view: OnboardingView = {
      actions: this,
      levelCounts: this.levelCounts,
    }
    const el = renderOnboarding(view)
    return el
  }

  private renderSettings(): HTMLElement {
    const view: SettingsView = {
      actions: this,
      choice: this.choice(),
      levelCounts: this.levelCounts,
      sound: this.progress.settings.sound !== false,
    }
    const el = renderSettings(view)
    return el
  }

  private renderMenu(): HTMLElement {
    const level = this.choice().level
    const counts = this.wordCounts()
    const testResume = this.progress.test === null ? null : position(this.progress.test)
    const view: MenuView = {
      actions: this,
      studying: counts.studying,
      learned: counts.learned,
      level: level,
      levelWords: this.levelCounts[level],
      testResume: testResume,
      xp: this.progress.game.xp,
      streak: this.streakNow(),
      arcadeBest: this.progress.game.arcadeBest,
    }
    const el = renderMenu(view)
    return el
  }

  private renderTest(): HTMLElement {
    const step = this.testStep as TestStep
    if (step.kind === 'done') {
      const doneView: TestDoneView = {
        actions: this,
        counts: step.counts,
        feedback: step.feedback,
      }
      const done = renderTestDone(doneView)
      return done
    }

    const session = this.progress.test as TestSession
    const view: TestView = {
      actions: this,
      step: step,
      position: position(session),
      xpGain: this.lastXp,
    }
    const el = renderTest(view)
    return el
  }

  private renderLearn(): HTMLElement {
    const step = this.learnStep as LearnStep
    if (step.kind === 'empty') {
      const emptyView: LearnEmptyView = {
        actions: this,
      }
      const empty = renderLearnEmpty(emptyView)
      return empty
    }

    const view: LearnView = {
      actions: this,
      round: step.round,
      feedback: step.feedback,
      box: this.progress.words[step.round.base]?.box ?? 0,
      xpGain: this.lastXp,
    }
    const el = renderLearn(view)
    return el
  }

  private renderMyWords(): HTMLElement {
    const counts = this.wordCounts()
    const items = this.myWords.items(this.draft)
    const view: MyWordsView = {
      actions: this,
      items: items,
      changes: Object.keys(this.draft).length,
      studying: counts.studying,
      learned: counts.learned,
    }
    const el = renderMyWords(view)
    return el
  }

  private streakNow(): number {
    const streakArgs: StreakArgs = {
      streak: this.progress.game.streak,
      today: localDay(new Date()),
    }
    const days = currentStreak(streakArgs)
    return days
  }

  private choice(): SettingsChoice {
    const s = this.progress.settings
    if (s.variant === null || s.level === null) {
      throw new Error('game: settings are not set')
    }
    return {
      variant: s.variant,
      level: s.level,
    }
  }

  private wordCounts(): WordCounts {
    const words = Object.values(this.progress.words)
    const studying = words.filter((w) => w.status === 'study').length
    const learned = words.filter((w) => w.status === 'learned').length
    return {
      studying: studying,
      learned: learned,
    }
  }
}

// position: "word N of M" for a Test session.
function position(s: TestSession): TestPosition {
  const c = s.counts
  const answered = c.correct + c.incorrect + c.hint + c.skipped - (s.awaitingChoice ? 1 : 0)
  return {
    index: answered + 1,
    total: answered + 1 + s.queue.length,
  }
}

// newGame creates the controller; call start() to draw the first screen.
export function newGame(deps: GameDeps): Game {
  return new Controller(deps)
}
