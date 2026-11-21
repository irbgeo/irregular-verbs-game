// Sound effects are synthesized with Web Audio: no files, no licenses, ~0 KB.

export type SoundKind = 'correct' | 'wrong' | 'round-end' | 'achievement'

export interface Sound {
  play(kind: SoundKind): void
  // setEnabled: the player's «Звук» switch
  setEnabled(on: boolean): void
  // mute: the game is hidden / closed or an ad is showing
  mute(on: boolean): void
}

interface Note {
  // frequency, Hz
  hz: number
  // start offset and length, seconds
  at: number
  len: number
  type: OscillatorType
}

const volume = 0.15

const tunes: Record<SoundKind, Note[]> = {
  correct: [
    { hz: 660, at: 0, len: 0.08, type: 'sine' },
    { hz: 880, at: 0.08, len: 0.12, type: 'sine' },
  ],
  wrong: [
    { hz: 196, at: 0, len: 0.18, type: 'triangle' },
  ],
  'round-end': [
    { hz: 523, at: 0, len: 0.12, type: 'sine' },
    { hz: 659, at: 0.12, len: 0.12, type: 'sine' },
    { hz: 784, at: 0.24, len: 0.25, type: 'sine' },
  ],
  achievement: [
    { hz: 523, at: 0, len: 0.09, type: 'triangle' },
    { hz: 659, at: 0.09, len: 0.09, type: 'triangle' },
    { hz: 784, at: 0.18, len: 0.09, type: 'triangle' },
    { hz: 1047, at: 0.27, len: 0.3, type: 'triangle' },
  ],
}

class Synth implements Sound {
  private enabled = true
  private muted = false
  private ctx: AudioContext | null = null

  play(kind: SoundKind): void {
    if (!this.enabled || this.muted) {
      return
    }
    const ctx = this.context()
    if (ctx === null) {
      return
    }
    for (const note of tunes[kind]) {
      this.note(ctx, note)
    }
  }

  setEnabled(on: boolean): void {
    this.enabled = on
  }

  mute(on: boolean): void {
    this.muted = on
    if (this.ctx === null) {
      return
    }
    if (on) {
      void this.ctx.suspend()
    } else {
      void this.ctx.resume()
    }
  }

  // context is created on the first play: browsers allow audio only after a user gesture.
  private context(): AudioContext | null {
    if (this.ctx !== null) {
      return this.ctx
    }
    if (typeof AudioContext === 'undefined') {
      return null
    }
    this.ctx = new AudioContext()
    return this.ctx
  }

  // note plays one short tone with a quick fade-out (no clicks).
  private note(ctx: AudioContext, n: Note): void {
    const start = ctx.currentTime + n.at
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = n.type
    osc.frequency.setValueAtTime(n.hz, start)
    gain.gain.setValueAtTime(volume, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + n.len)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + n.len)
  }
}

// newSound creates the sound effects player (on, not muted).
export function newSound(): Sound {
  return new Synth()
}
