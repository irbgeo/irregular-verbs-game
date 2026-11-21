import type { Catalog } from './catalog'
import { checkTarget, formValue, formVariants, norm } from './check'
import { applyLadder } from './ladder'
import { pushRecent } from './pick'
import { variantOf } from './progress'
import { shuffle } from './rng'
import { pickTask, roundTasks } from './tasks'
import type {
  ArcadeAnswer,
  ArcadeAnswerArgs,
  ArcadeLadderArgs,
  ArcadeQuestion,
  ArcadeRound,
  CheckTargetArgs,
  ExtendArgs,
  FormArgs,
  FormKind,
  FormOptionsArgs,
  LadderArgs,
  PickTaskArgs,
  Progress,
  RecentArgs,
  Rng,
  ShuffleArgs,
  TasksArgs,
  Verb,
  WordProgress,
} from './types'

// Arcade rules (project PRD §3.4).
export const roundMs = 60_000
const penaltyMs = 3_000
const pointsPerAnswer = 10
export const x2From = 5
export const x3From = 10
const buttons = 4
const kinds: readonly FormKind[] = [
  'base',
  'past',
  'participle',
]

// Arcade is one 60-second round over a player's Progress (words are trained in place).
export interface Arcade {
  start(now: number): ArcadeRound
  // answer: null when there is no running round (over, paused, not started)
  answer(args: ArcadeAnswerArgs): ArcadeAnswer | null
  timeLeft(now: number): number
  isOver(now: number): boolean
  pause(now: number): void
  resume(now: number): void
  round(): ArcadeRound | null
  // extend: once per round, after the time is up — more time (rewarded ad).
  extend(args: ExtendArgs): boolean
}

class Round implements Arcade {
  private current: ArcadeRound | null = null

  constructor(
    private readonly catalog: Catalog,
    private readonly progress: Progress,
    private readonly rng: Rng,
  ) {}

  start(now: number): ArcadeRound {
    if (this.progress.settings.level === null || this.progress.settings.variant === null) {
      throw new Error('arcade: settings are not set')
    }
    const question = this.nextQuestion([])
    this.current = {
      endsAt: now + roundMs,
      pausedAt: null,
      score: 0,
      run: 0,
      bestRun: 0,
      correct: 0,
      wrong: 0,
      recent: [question.base],
      question: question,
      extended: false,
    }
    return this.current
  }

  answer(args: ArcadeAnswerArgs): ArcadeAnswer | null {
    const r = this.current
    const option = r?.question.options[args.index]
    if (r === null || r.pausedAt !== null || this.isOver(args.now) || option === undefined) {
      return null
    }

    const correct = this.isCorrect(option)
    this.train(correct)
    const points = this.score(correct)
    if (!correct) {
      r.endsAt -= penaltyMs
    }

    r.question = this.nextQuestion(r.recent)
    const recentArgs: RecentArgs = {
      recent: r.recent,
      base: r.question.base,
    }
    r.recent = pushRecent(recentArgs)
    return {
      correct: correct,
      points: points,
    }
  }

  timeLeft(now: number): number {
    const r = this.current
    if (r === null) {
      return 0
    }
    const at = r.pausedAt ?? now
    const left = Math.max(0, r.endsAt - at)
    return left
  }

  isOver(now: number): boolean {
    const left = this.timeLeft(now)
    return left === 0
  }

  pause(now: number): void {
    if (this.current !== null && this.current.pausedAt === null) {
      this.current.pausedAt = now
    }
  }

  resume(now: number): void {
    const r = this.current
    if (r === null || r.pausedAt === null) {
      return
    }
    r.endsAt += now - r.pausedAt
    r.pausedAt = null
  }

  round(): ArcadeRound | null {
    return this.current
  }

  extend(args: ExtendArgs): boolean {
    const r = this.current
    if (r === null || r.extended || !this.isOver(args.now)) {
      return false
    }
    r.extended = true
    r.pausedAt = null
    r.endsAt = args.now + args.ms
    return true
  }

  // score: +10 × multiplier; the run counts this answer (x2 from the 5th, x3 from the 10th).
  private score(correct: boolean): number {
    const r = this.current as ArcadeRound
    if (!correct) {
      r.run = 0
      r.wrong++
      return 0
    }
    r.run++
    r.correct++
    r.bestRun = Math.max(r.bestRun, r.run)
    const points = pointsPerAnswer * multiplierFor(r.run)
    r.score += points
    return points
  }

  private isCorrect(option: string): boolean {
    const q = (this.current as ArcadeRound).question
    const checkArgs: CheckTargetArgs = {
      verb: this.verb(q.base),
      variant: variantOf(this.progress),
      kind: q.target,
      input: option,
    }
    const ok = checkTarget(checkArgs)
    return ok
  }

  // train applies the Arcade Leitner effect to the asked word.
  private train(correct: boolean): void {
    const base = (this.current as ArcadeRound).question.base
    const old = this.progress.words[base]
    const ladderArgs: ArcadeLadderArgs = {
      word: old,
      correct: correct,
    }
    const next = arcadeLadder(ladderArgs)
    if (next === undefined) {
      return
    }
    if (old?.task !== undefined) {
      next.task = old.task
    }
    this.progress.words[base] = next
  }

  private nextQuestion(recent: string[]): ArcadeQuestion {
    const level = this.progress.settings.level
    const pool = level === null ? [] : this.catalog.basesUpTo(level)
    const fresh = pool.filter((b) => !recent.includes(b))
    const candidates = fresh.length > 0 ? fresh : pool
    const base = candidates[this.rng(candidates.length)]

    const verb = this.verb(base)
    const variant = variantOf(this.progress)
    const tasksArgs: TasksArgs = {
      verb: verb,
      variant: variant,
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

    const task = tasks[index]
    const anchorArgs: FormArgs = {
      verb: verb,
      kind: task.anchor,
      variant: variant,
    }
    const optionsArgs: FormOptionsArgs = {
      verb: verb,
      kind: task.target,
      variant: variant,
      rng: this.rng,
    }
    return {
      base: base,
      anchor: task.anchor,
      target: task.target,
      anchorValue: formValue(anchorArgs),
      options: arcadeOptions(optionsArgs),
    }
  }

  private verb(base: string): Verb {
    const v = this.catalog.verb(base)
    if (v === undefined) {
      throw new Error(`arcade: unknown verb ${base}`)
    }
    return v
  }
}

// newArcade creates an Arcade over the player's Progress.
export function newArcade(
  catalog: Catalog,
  progress: Progress,
  rng: Rng,
): Arcade {
  return new Round(
    catalog,
    progress,
    rng,
  )
}

// multiplierFor: x2 from the 5th correct answer in a row, x3 from the 10th.
export function multiplierFor(run: number): number {
  if (run >= x3From) {
    return 3
  }
  if (run >= x2From) {
    return 2
  }
  return 1
}

// arcadeOptions: the correct form (every variant) + wrong words (the word's
// other forms, its common mistakes) up to 4 buttons, shuffled.
export function arcadeOptions(args: FormOptionsArgs): string[] {
  const correct = formVariants(args)
  const seen = new Set(correct.map(norm))
  const wrong: string[] = []
  const addWrong = (value: string) => {
    const n = norm(value)
    if (value !== '' && !seen.has(n)) {
      seen.add(n)
      wrong.push(value)
    }
  }
  for (const kind of kinds.filter((k) => k !== args.kind)) {
    const otherArgs: FormArgs = {
      verb: args.verb,
      kind: kind,
      variant: args.variant,
    }
    formVariants(otherArgs).forEach(addWrong)
  }
  args.verb.common_mistakes.forEach(addWrong)

  const wrongArgs: ShuffleArgs = {
    items: wrong,
    rng: args.rng,
  }
  const shuffledWrong = shuffle(wrongArgs)
  const room = Math.max(1, buttons - correct.length)
  const all: ShuffleArgs = {
    items: [...correct, ...shuffledWrong.slice(0, room)],
    rng: args.rng,
  }
  const options = shuffle(all)
  return options
}

// arcadeLadder: the background training effect of one Arcade answer (stage 5 PRD).
// undefined = the word stays out of the player's list.
export function arcadeLadder(args: ArcadeLadderArgs): WordProgress | undefined {
  const w = args.word
  if (w === undefined) {
    if (args.correct) {
      return undefined
    }
    // a wrong answer on a new word puts it to study, as in the Test
    const fresh: WordProgress = {
      status: 'study',
      mode: 1,
      box: 0,
    }
    return fresh
  }
  if (w.status === 'skipped') {
    return w
  }
  if (w.status === 'study' && w.mode === 2 && args.correct) {
    return w
  }

  const start: WordProgress = w.status === 'study' && w.mode === 0 ? { ...w, mode: 1 } : w
  const ladderArgs: LadderArgs = {
    word: start,
    ok: args.correct,
  }
  const next = applyLadder(ladderArgs)
  return next
}
