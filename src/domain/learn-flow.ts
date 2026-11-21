import type { Catalog } from './catalog'
import { checkTarget, formValue } from './check'
import { applyLadder } from './ladder'
import { formOptions } from './options'
import { pickLearnWord, pushRecent } from './pick'
import { feedbackFor, variantOf } from './progress'
import { pickTask, roundTasks } from './tasks'
import type {
  CheckTargetArgs,
  Feedback,
  FeedbackArgs,
  FormArgs,
  FormOptionsArgs,
  LadderArgs,
  LearnSession,
  LearnStep,
  PickArgs,
  PickTaskArgs,
  Progress,
  RecentArgs,
  ResolveArgs,
  Rng,
  Round,
  RoundFormat,
  RoundView,
  TasksArgs,
  Verb,
} from './types'

// LearnFlow runs Learn / Leitner (bot: learn.go) on a Progress, in place.
export interface LearnFlow {
  // start begins a session: a round, or empty when there is nothing to learn.
  start(): LearnStep
  // current resumes the saved round; null when there is no session.
  current(): LearnStep | null
  // choose: tap option `index` (choice format only; otherwise ignored).
  choose(index: number): LearnStep
  // type: typed answer (input format only; otherwise ignored).
  type(text: string): LearnStep
  // reveal: "show" — counts as wrong.
  reveal(): LearnStep
}

class Flow implements LearnFlow {
  constructor(
    private readonly catalog: Catalog,
    private readonly progress: Progress,
    private readonly rng: Rng,
  ) {}

  start(): LearnStep {
    this.progress.learn = {
      recent: [],
      round: null,
    }
    const step = this.next(null)
    return step
  }

  current(): LearnStep | null {
    const round = this.round()
    if (round === null) {
      return null
    }
    const view = this.view(round)
    return {
      kind: 'round',
      round: view,
      feedback: null,
    }
  }

  choose(index: number): LearnStep {
    const round = this.round()
    if (round === null) {
      return { kind: 'empty' }
    }
    const option = round.options[index]
    if (this.format(round.base) !== 'choice' || option === undefined) {
      return this.unchanged()
    }

    const ok = this.isCorrect(option)
    const resolveArgs: ResolveArgs = {
      ok: ok,
      reveal: false,
    }
    const step = this.resolve(resolveArgs)
    return step
  }

  type(text: string): LearnStep {
    const round = this.round()
    if (round === null) {
      return { kind: 'empty' }
    }
    if (this.format(round.base) !== 'input') {
      return this.unchanged()
    }

    const ok = this.isCorrect(text)
    const resolveArgs: ResolveArgs = {
      ok: ok,
      reveal: false,
    }
    const step = this.resolve(resolveArgs)
    return step
  }

  reveal(): LearnStep {
    const round = this.round()
    if (round === null) {
      return { kind: 'empty' }
    }

    const resolveArgs: ResolveArgs = {
      ok: false,
      reveal: true,
    }
    const step = this.resolve(resolveArgs)
    return step
  }

  // resolve: ladder step for the current word, then the next word with feedback.
  private resolve(args: ResolveArgs): LearnStep {
    const round = this.session().round as Round
    const word = this.progress.words[round.base]
    // a saved round may point to a word that has no entry any more
    if (word !== undefined) {
      const ladderArgs: LadderArgs = {
        word: word,
        ok: args.ok,
      }
      const updated = applyLadder(ladderArgs)
      if (word.task !== undefined) {
        updated.task = word.task
      }
      this.progress.words[round.base] = updated
    }

    let result: Feedback['result'] = args.ok ? 'correct' : 'incorrect'
    if (args.reveal) {
      result = 'hint'
    }
    const feedbackArgs: FeedbackArgs = {
      verb: this.verb(round.base),
      variant: variantOf(this.progress),
      result: result,
      addedToStudy: false,
    }
    const feedback = feedbackFor(feedbackArgs)

    const step = this.next(feedback)
    return step
  }

  // next picks the next word and builds its round (bot: advanceLearn).
  private next(feedback: Feedback | null): LearnStep {
    const s = this.session()
    const pickArgs: PickArgs = {
      allBases: this.catalog.allBases,
      words: this.progress.words,
      recent: s.recent,
      rng: this.rng,
    }
    const base = pickLearnWord(pickArgs)
    if (base === null) {
      this.progress.learn = null
      return { kind: 'empty' }
    }

    const recentArgs: RecentArgs = {
      recent: s.recent,
      base: base,
    }
    s.recent = pushRecent(recentArgs)
    this.startStudyWord(base)
    s.round = this.buildRound(base)

    const view = this.view(s.round)
    return {
      kind: 'round',
      round: view,
      feedback: feedback,
    }
  }

  // startStudyWord: a word added from My words (mode 0) starts at mode 1.
  private startStudyWord(base: string): void {
    const w = this.progress.words[base]
    if (w?.status === 'study' && w.mode === 0) {
      w.mode = 1
    }
  }

  // buildRound: a task from the word's distinct-word tasks, not the one it had
  // last time (the bot picked form kinds, so equal forms gave trivial or
  // repeated questions — see stage 4 RESULT).
  private buildRound(base: string): Round {
    const tasksArgs: TasksArgs = {
      verb: this.verb(base),
      variant: variantOf(this.progress),
    }
    const tasks = roundTasks(tasksArgs)
    const word = this.progress.words[base]
    const pickArgs: PickTaskArgs = {
      count: tasks.length,
      last: word?.task,
      rng: this.rng,
    }
    const index = pickTask(pickArgs)
    if (word !== undefined) {
      word.task = index
    }
    const anchor = tasks[index].anchor
    const target = tasks[index].target

    let options: string[] = []
    if (this.format(base) === 'choice') {
      const optionsArgs: FormOptionsArgs = {
        verb: this.verb(base),
        kind: target,
        variant: variantOf(this.progress),
        rng: this.rng,
      }
      options = formOptions(optionsArgs)
    }
    return {
      base: base,
      anchor: anchor,
      target: target,
      options: options,
    }
  }

  private view(round: Round): RoundView {
    const anchorArgs: FormArgs = {
      verb: this.verb(round.base),
      kind: round.anchor,
      variant: variantOf(this.progress),
    }
    const anchorValue = formValue(anchorArgs)
    const format = this.format(round.base)
    const repeat = this.progress.words[round.base]?.status === 'learned'
    return {
      ...round,
      format: format,
      anchorValue: anchorValue,
      repeat: repeat,
    }
  }

  private isCorrect(input: string): boolean {
    const round = this.session().round as Round
    const checkArgs: CheckTargetArgs = {
      verb: this.verb(round.base),
      variant: variantOf(this.progress),
      kind: round.target,
      input: input,
    }
    const ok = checkTarget(checkArgs)
    return ok
  }

  // format: choice only for a study word at mode 1 (bot: wordFormat).
  private format(base: string): RoundFormat {
    const w = this.progress.words[base]
    if (w?.status === 'study' && w.mode === 1) {
      return 'choice'
    }
    return 'input'
  }

  private round(): Round | null {
    const round = this.progress.learn?.round ?? null
    return round
  }

  private unchanged(): LearnStep {
    const step = this.current() ?? { kind: 'empty' }
    return step
  }

  private session(): LearnSession {
    const s = this.progress.learn
    if (s === null) {
      throw new Error('learn-flow: no session')
    }
    return s
  }

  private verb(base: string): Verb {
    const v = this.catalog.verb(base)
    if (v === undefined) {
      throw new Error(`learn-flow: unknown verb ${base}`)
    }
    return v
  }
}

// newLearnFlow creates the Learn flow over a player's Progress.
export function newLearnFlow(
  catalog: Catalog,
  progress: Progress,
  rng: Rng,
): LearnFlow {
  return new Flow(
    catalog,
    progress,
    rng,
  )
}
