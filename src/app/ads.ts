// VK ad rules: at most one ad per 30 s; we keep 60 s to stay gentle.
const minGapMs = 60_000

// AdPolicy decides whether an ad may show now.
export interface AdPolicy {
  canShow(now: number): boolean
  shown(now: number): void
}

class Gap implements AdPolicy {
  private last: number | null = null

  canShow(now: number): boolean {
    return this.last === null || now - this.last >= minGapMs
  }

  shown(now: number): void {
    this.last = now
  }
}

// newAdPolicy: one ad (any format) per 60 s.
export function newAdPolicy(): AdPolicy {
  return new Gap()
}
