import { afterEach, describe, expect, it, vi } from 'vitest'
import { newSound } from '../src/ui/sound'

class FakeContext {
  static made = 0
  state = 'running'
  currentTime = 0
  destination = {}
  oscillators = 0
  suspended = 0
  constructor() {
    FakeContext.made++
    FakeContext.last = this
  }
  static last: FakeContext | null = null
  createOscillator() {
    this.oscillators++
    return {
      type: 'sine',
      frequency: { setValueAtTime: () => {} },
      connect: (n: unknown) => n,
      start: () => {},
      stop: () => {},
    }
  }
  createGain() {
    return {
      gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
      connect: (n: unknown) => n,
    }
  }
  suspend() {
    this.suspended++
    this.state = 'suspended'
    return Promise.resolve()
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
}

describe('sound', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    FakeContext.made = 0
    FakeContext.last = null
  })

  it('plays synthesized notes, creating the audio context once, on first play', () => {
    vi.stubGlobal('AudioContext', FakeContext)
    const sound = newSound()
    expect(FakeContext.made).toBe(0)

    sound.play('correct')
    sound.play('achievement')
    expect(FakeContext.made).toBe(1)
    expect(FakeContext.last!.oscillators).toBeGreaterThan(2)
  })

  it('switched off → silent, no context', () => {
    vi.stubGlobal('AudioContext', FakeContext)
    const sound = newSound()
    sound.setEnabled(false)
    sound.play('wrong')
    expect(FakeContext.made).toBe(0)
  })

  it('muted (hidden / ad) → suspended and silent until unmuted', () => {
    vi.stubGlobal('AudioContext', FakeContext)
    const sound = newSound()
    sound.play('correct')
    const ctx = FakeContext.last!
    const before = ctx.oscillators

    sound.mute(true)
    sound.play('wrong')
    expect(ctx.suspended).toBe(1)
    expect(ctx.oscillators).toBe(before)

    sound.mute(false)
    sound.play('wrong')
    expect(ctx.oscillators).toBeGreaterThan(before)
  })

  it('no Web Audio in the browser → silent, no error', () => {
    vi.stubGlobal('AudioContext', undefined)
    expect(() => newSound().play('round-end')).not.toThrow()
  })
})
