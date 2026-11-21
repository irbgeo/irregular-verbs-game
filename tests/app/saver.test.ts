import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { progressKey, sessionsKey } from '../../src/app/codec'
import { newSaver } from '../../src/app/saver'
import { newProgress } from '../../src/domain/progress'
import { newFakePlatform } from '../fake-platform'

function setup() {
  const platform = newFakePlatform()
  const progress = newProgress()
  const errors: unknown[] = []
  const saver = newSaver(platform, progress, (e) => errors.push(e))
  return { platform, progress, saver, errors }
}

const keys = (entries: { key: string }[]) => entries.map((e) => e.key)

describe('saver', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes only dirty keys, once, right away the first time', async () => {
    const { platform, saver } = setup()
    saver.markDirty({ words: true, sessions: false })
    await vi.advanceTimersByTimeAsync(0)

    expect(keys(platform.saves)).toEqual([progressKey])
  })

  it('throttles: at most one flush per 10 s, trailing', async () => {
    const { platform, saver } = setup()
    saver.markDirty({ words: true, sessions: true })
    await vi.advanceTimersByTimeAsync(0)
    saver.markDirty({ words: true, sessions: false })
    saver.markDirty({ words: false, sessions: true })
    await vi.advanceTimersByTimeAsync(9_000)
    expect(platform.saves).toHaveLength(2)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(keys(platform.saves)).toEqual([progressKey, sessionsKey, progressKey, sessionsKey])
  })

  it('flushSoon waits only 2 s after the last flush', async () => {
    const { platform, saver } = setup()
    saver.markDirty({ words: true, sessions: false })
    await vi.advanceTimersByTimeAsync(0)
    saver.markDirty({ words: true, sessions: false })
    saver.flushSoon()
    await vi.advanceTimersByTimeAsync(2_000)

    expect(platform.saves).toHaveLength(2)
  })

  it('flushNow writes at once', async () => {
    const { platform, saver } = setup()
    saver.markDirty({ words: true, sessions: false })
    await vi.advanceTimersByTimeAsync(0)
    saver.markDirty({ words: false, sessions: true })
    await saver.flushNow()

    expect(keys(platform.saves)).toEqual([progressKey, sessionsKey])
  })

  it('a failed write is reported, kept dirty and retried', async () => {
    const { platform, saver, errors } = setup()
    platform.failSaves = true
    saver.markDirty({ words: true, sessions: false })
    await vi.advanceTimersByTimeAsync(0)
    expect(errors).toHaveLength(1)

    platform.failSaves = false
    await vi.advanceTimersByTimeAsync(10_000)
    expect(keys(platform.saves)).toEqual([progressKey])
  })

  it('saves the current state of the progress', async () => {
    const { platform, progress, saver } = setup()
    progress.settings = { variant: 'gb', level: 'elementary' }
    saver.markDirty({ words: true, sessions: false })
    await vi.advanceTimersByTimeAsync(0)

    expect(platform.data.get(progressKey)).toContain('"gb"')
  })
})
