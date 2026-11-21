import { levels } from './catalog'
import type { FeedbackArgs, Feedback, Level, Progress, Variant, WordArgs } from './types'

const variants: readonly string[] = [
  'gb',
  'us',
]

// newProgress is the state of a player who has not finished onboarding.
export function newProgress(): Progress {
  const p: Progress = {
    version: 1,
    settings: {
      variant: null,
      level: null,
      sound: true,
    },
    words: {},
    test: null,
    learn: null,
    game: {
      xp: 0,
      streak: {
        days: 0,
        last: null,
      },
      achievements: [],
      arcadeBest: 0,
    },
  }
  return p
}

// isOnboarded: both the variant and the level are chosen.
export function isOnboarded(p: Progress): boolean {
  return p.settings.variant !== null && p.settings.level !== null
}

// isVariant checks a value from outside (saved data, UI).
export function isVariant(x: unknown): x is Variant {
  return typeof x === 'string' && variants.includes(x)
}

// isLevel checks a value from outside (saved data, UI).
export function isLevel(x: unknown): x is Level {
  return typeof x === 'string' && (levels as readonly string[]).includes(x)
}

// variantOf gives the player's variant; flows need it, so it must be set.
export function variantOf(p: Progress): Variant {
  const v = p.settings.variant
  if (v === null) {
    throw new Error('progress: variant is not set')
  }
  return v
}

// setStudy puts a word to study from the start (bot: setStudy).
export function setStudy(args: WordArgs): void {
  args.words[args.base] = {
    status: 'study',
    mode: 1,
    box: 0,
  }
}

// setSkipped marks a word "do not learn" (bot: setSkipped).
export function setSkipped(args: WordArgs): void {
  args.words[args.base] = {
    status: 'skipped',
    mode: 0,
    box: 0,
  }
}

// feedbackFor: the correct forms of a verb for the player's variant + the outcome.
export function feedbackFor(args: FeedbackArgs): Feedback {
  const f: Feedback = {
    result: args.result,
    addedToStudy: args.addedToStudy,
    base: args.verb.base,
    past: args.verb.past[args.variant],
    participle: args.verb.participle[args.variant],
    translations: args.verb.translations,
  }
  return f
}
