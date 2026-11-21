import type { LadderArgs, WordProgress } from './types'

// boxMax: 5 correct answers in a row finish a mode.
export const boxMax = 5

// applyLadder is the Leitner step after one answer (bot: learnLadder).
export function applyLadder(args: LadderArgs): WordProgress {
  const w = args.word
  if (w.status === 'learned') {
    if (args.ok) {
      return w
    }
    const demoted: WordProgress = {
      status: 'study',
      mode: 2,
      box: 0,
    }
    return demoted
  }
  if (w.status !== 'study') {
    return w
  }

  if (!args.ok) {
    const reset: WordProgress = {
      status: 'study',
      mode: w.mode,
      box: 0,
    }
    return reset
  }

  const box = w.box + 1
  if (box < boxMax) {
    const next: WordProgress = {
      status: 'study',
      mode: w.mode,
      box: box,
    }
    return next
  }
  if (w.mode === 2) {
    const done: WordProgress = {
      status: 'learned',
      mode: 0,
      box: 0,
    }
    return done
  }
  const promoted: WordProgress = {
    status: 'study',
    mode: 2,
    box: 0,
  }
  return promoted
}
