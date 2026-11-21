import type { Catalog } from './catalog'
import { checkAllFormsOrdered } from './check'
import { feedbackFor, setSkipped, setStudy, variantOf } from './progress'
import { shuffle } from './rng'
import type {
  AnswerResult,
  CheckArgs,
  Feedback,
  FeedbackArgs,
  Progress,
  Rng,
  ShuffleArgs,
  TestSession,
  TestStep,
  Verb,
  WordArgs,
} from './types'

// TestFlow runs the Test (bot: test_flow.go) on a Progress, in place.
export interface TestFlow {
  // start begins a Test on the settings level (cumulative), words shuffled.
  start(): TestStep
  // current resumes a saved Test; null when there is none.
  current(): TestStep | null
  answer(text: string): TestStep
  hint(): TestStep
  skip(): TestStep
  // keep / drop: after a correct answer — to study / skip the word.
  keep(): TestStep
  drop(): TestStep
}

class Flow implements TestFlow {
  constructor(
    private readonly catalog: Catalog,
    private readonly progress: Progress,
    private readonly rng: Rng,
  ) {}

  start(): TestStep {
    const level = this.progress.settings.level
    if (level === null || this.progress.settings.variant === null) {
      throw new Error('test-flow: settings are not set')
    }

    const shuffleArgs: ShuffleArgs = {
      items: this.catalog.basesUpTo(level),
      rng: this.rng,
    }
    const bases = shuffle(shuffleArgs)
    if (bases.length === 0) {
      throw new Error(`test-flow: level ${level} has no words`)
    }

    this.progress.test = {
      base: bases[0],
      queue: bases.slice(1),
      awaitingChoice: false,
      counts: {
        correct: 0,
        incorrect: 0,
        hint: 0,
        skipped: 0,
      },
    }
    const step = this.question(null)
    return step
  }

  current(): TestStep | null {
    const s = this.progress.test
    if (s === null) {
      return null
    }
    if (s.awaitingChoice) {
      const feedback = this.feedback('correct')
      return {
        kind: 'choose',
        feedback: feedback,
      }
    }
    const step = this.question(null)
    return step
  }

  answer(text: string): TestStep {
    const s = this.open()
    if (s.awaitingChoice) {
      return this.mustCurrent()
    }

    const checkArgs: CheckArgs = {
      verb: this.verb(s.base),
      variant: variantOf(this.progress),
      input: text,
    }
    const ok = checkAllFormsOrdered(checkArgs)
    if (!ok) {
      s.counts.incorrect++
      const step = this.toStudy('incorrect')
      return step
    }

    s.counts.correct++
    s.awaitingChoice = true
    const step = this.mustCurrent()
    return step
  }

  hint(): TestStep {
    const s = this.open()
    if (s.awaitingChoice) {
      return this.mustCurrent()
    }

    s.counts.hint++
    const step = this.toStudy('hint')
    return step
  }

  skip(): TestStep {
    const s = this.open()
    if (s.awaitingChoice) {
      return this.mustCurrent()
    }

    s.counts.skipped++
    const step = this.advance(null)
    return step
  }

  keep(): TestStep {
    const step = this.decide(setStudy)
    return step
  }

  drop(): TestStep {
    const step = this.decide(setSkipped)
    return step
  }

  // decide applies keep / drop to the word that was answered correctly.
  private decide(write: (args: WordArgs) => void): TestStep {
    const s = this.open()
    if (!s.awaitingChoice) {
      return this.mustCurrent()
    }

    const wordArgs: WordArgs = {
      words: this.progress.words,
      base: s.base,
    }
    write(wordArgs)
    s.awaitingChoice = false
    const step = this.advance(null)
    return step
  }

  // toStudy: wrong answer or hint — the word goes to study, show the forms, next.
  private toStudy(result: AnswerResult): TestStep {
    const s = this.open()
    const feedback = this.feedback(result)
    feedback.addedToStudy = true
    const wordArgs: WordArgs = {
      words: this.progress.words,
      base: s.base,
    }
    setStudy(wordArgs)

    const step = this.advance(feedback)
    return step
  }

  private advance(feedback: Feedback | null): TestStep {
    const s = this.open()
    const next = s.queue[0]
    if (next === undefined) {
      this.progress.test = null
      return {
        kind: 'done',
        counts: s.counts,
        feedback: feedback,
      }
    }

    s.base = next
    s.queue = s.queue.slice(1)
    const step = this.question(feedback)
    return step
  }

  private question(feedback: Feedback | null): TestStep {
    const s = this.open()
    return {
      kind: 'question',
      base: s.base,
      feedback: feedback,
    }
  }

  private feedback(result: AnswerResult): Feedback {
    const s = this.open()
    const feedbackArgs: FeedbackArgs = {
      verb: this.verb(s.base),
      variant: variantOf(this.progress),
      result: result,
      addedToStudy: false,
    }
    const f = feedbackFor(feedbackArgs)
    return f
  }

  private mustCurrent(): TestStep {
    const step = this.current()
    if (step === null) {
      throw new Error('test-flow: no test in progress')
    }
    return step
  }

  private open(): TestSession {
    const s = this.progress.test
    if (s === null) {
      throw new Error('test-flow: no test in progress')
    }
    return s
  }

  private verb(base: string): Verb {
    const v = this.catalog.verb(base)
    if (v === undefined) {
      throw new Error(`test-flow: unknown verb ${base}`)
    }
    return v
  }
}

// newTestFlow creates the Test flow over a player's Progress.
export function newTestFlow(
  catalog: Catalog,
  progress: Progress,
  rng: Rng,
): TestFlow {
  return new Flow(
    catalog,
    progress,
    rng,
  )
}
