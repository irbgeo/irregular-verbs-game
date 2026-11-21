import type { Rng, ShuffleArgs } from './types'

// mathRng is the production Rng.
export const mathRng: Rng = (n: number) => {
  if (n <= 0) {
    return 0
  }
  const r = Math.random() * n
  const i = Math.floor(r)
  return i
}

// shuffle returns a shuffled copy (Fisher–Yates, same order of rng calls as the bot).
export function shuffle(args: ShuffleArgs): string[] {
  const out = [...args.items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = args.rng(i + 1)
    const tmp = out[i]
    out[i] = out[j]
    out[j] = tmp
  }
  return out
}
