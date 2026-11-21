import type { PickArgs, Pool, PoolArgs, RecentArgs } from './types'

const studyShare = 90
const recentSize = 5

// pickLearnWord: 90% study / 10% learned; an empty group falls back to the
// other; the cooldown ring is skipped unless that leaves no candidates.
// null when there is nothing to learn.
export function pickLearnWord(args: PickArgs): string | null {
  const pool = learnPool(args)
  if (pool.study.length === 0 && pool.learned.length === 0) {
    return null
  }

  const roll = args.rng(100)
  let group = roll < studyShare ? pool.study : pool.learned
  if (group.length === 0) {
    group = pool.study.length > 0 ? pool.study : pool.learned
  }

  const fresh = group.filter((b) => !args.recent.includes(b))
  const candidates = fresh.length > 0 ? fresh : group
  const index = args.rng(candidates.length)
  return candidates[index]
}

// learnPool: study and learned bases in catalog order (deterministic).
export function learnPool(args: PoolArgs): Pool {
  const pool: Pool = {
    study: [],
    learned: [],
  }
  for (const base of args.allBases) {
    const w = args.words[base]
    if (w?.status === 'study') {
      pool.study.push(base)
    }
    if (w?.status === 'learned') {
      pool.learned.push(base)
    }
  }
  return pool
}

// pushRecent adds base to the cooldown ring, keeping the last 5.
export function pushRecent(args: RecentArgs): string[] {
  const all = [
    ...args.recent,
    args.base,
  ]
  const last = all.slice(-recentSize)
  return last
}
