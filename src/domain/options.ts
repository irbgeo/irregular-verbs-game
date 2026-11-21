import { formVariants, norm } from './check'
import { shuffle } from './rng'
import type { FormArgs, FormKind, FormOptionsArgs, ShuffleArgs } from './types'

const kinds: readonly FormKind[] = [
  'base',
  'past',
  'participle',
]
const maxMistakes = 2

// formOptions builds the choice buttons (bot: formOptions): every variant of the
// correct form, every variant of the two other forms, up to 2 common mistakes;
// case-insensitive duplicates dropped; shuffled.
export function formOptions(args: FormOptionsArgs): string[] {
  const opts: string[] = []
  const seen = new Set<string>()
  const add = (value: string): boolean => {
    const n = norm(value)
    if (value === '' || seen.has(n)) {
      return false
    }
    seen.add(n)
    opts.push(value)
    return true
  }

  const ordered = [
    args.kind,
    ...kinds.filter((k) => k !== args.kind),
  ]
  for (const kind of ordered) {
    const formArgs: FormArgs = {
      verb: args.verb,
      kind: kind,
      variant: args.variant,
    }
    formVariants(formArgs).forEach(add)
  }

  let added = 0
  for (const m of args.verb.common_mistakes) {
    if (added >= maxMistakes) {
      break
    }
    if (add(m)) {
      added++
    }
  }

  const shuffleArgs: ShuffleArgs = {
    items: opts,
    rng: args.rng,
  }
  const shuffled = shuffle(shuffleArgs)
  return shuffled
}
