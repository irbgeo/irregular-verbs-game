import { vi } from 'vitest'
import type { Actions } from '../../src/ui/types'

// stubActions: every action is a spy.
export function stubActions(): Actions {
  return {
    finishOnboarding: vi.fn(),
    openTest: vi.fn(),
    testAnswer: vi.fn(),
    testHint: vi.fn(),
    testSkip: vi.fn(),
    testKeep: vi.fn(),
    testDrop: vi.fn(),
    openLearn: vi.fn(),
    learnChoose: vi.fn(),
    learnType: vi.fn(),
    learnReveal: vi.fn(),
    openMyWords: vi.fn(),
    myWordsToggle: vi.fn(),
    myWordsSave: vi.fn(),
    myWordsCancel: vi.fn(),
    openSettings: vi.fn(),
    setSettings: vi.fn(),
    resetProgress: vi.fn(),
    toMenu: vi.fn(),
    openProgress: vi.fn(),
    openArcade: vi.fn(),
    arcadeAnswer: vi.fn(),
    arcadeQuit: vi.fn(),
    arcadeReward: vi.fn(),
    setSound: vi.fn(),
  }
}

// byText finds a button or link: exact text first, else the first that contains `text`.
export function byText(root: HTMLElement, text: string): HTMLElement {
  const all = [...root.querySelectorAll<HTMLElement>('button, a')]
  const exact = all.find((el) => el.textContent?.trim() === text)
  const found = exact ?? all.find((el) => el.textContent?.includes(text))
  if (found === undefined) {
    throw new Error(`no button with text ${text}`)
  }
  return found
}

export const levelCounts = {
  elementary: 78,
  'pre-intermediate': 94,
  intermediate: 127,
  'upper-intermediate': 133,
}
