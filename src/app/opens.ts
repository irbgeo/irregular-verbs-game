import type { Platform } from '../platform/port'
import type { StorageEntry } from '../platform/types'

const opensKey = 'opens'

// countOpen adds one to the saved open counter and returns the new value.
// It is the stage 1 storage round-trip check, not a game feature.
export async function countOpen(platform: Platform): Promise<number> {
  const stored = await platform.load(opensKey)
  const previous = parseCount(stored)

  const opens = previous + 1
  const entry: StorageEntry = {
    key: opensKey,
    value: String(opens),
  }
  await platform.save(entry)

  return opens
}

// parseCount reads a saved counter; anything missing or broken counts as 0.
function parseCount(stored: string | null): number {
  if (stored === null) {
    return 0
  }

  // Number('') is 0, so an empty value also counts as 0.
  const n = Number(stored)
  if (!Number.isSafeInteger(n) || n < 0) {
    return 0
  }
  return n
}
