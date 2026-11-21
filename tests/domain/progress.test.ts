import { describe, expect, it } from 'vitest'
import { newLearnFlow } from '../../src/domain/learn-flow'
import { isLevel, isOnboarded, isVariant, newProgress } from '../../src/domain/progress'
import { newTestFlow } from '../../src/domain/test-flow'
import { learnCatalog, player, study, zeroRng } from './helpers'

// bot: onboarding_test.go (variant + level instead of variant only)
describe('onboarding', () => {
  it('a new player is not onboarded', () => {
    expect(isOnboarded(newProgress())).toBe(false)
  })

  it('variant alone is not enough; variant + level is', () => {
    const p = newProgress()
    p.settings.variant = 'gb'
    expect(isOnboarded(p)).toBe(false)

    p.settings.level = 'elementary'
    expect(isOnboarded(p)).toBe(true)
  })

  it('validates values from outside (saved data)', () => {
    expect(isVariant('us')).toBe(true)
    expect(isVariant('ru')).toBe(false)
    expect(isLevel('intermediate')).toBe(true)
    expect(isLevel('nope')).toBe(false)
  })
})

describe('Progress', () => {
  it('survives JSON round-trip in the middle of Test and Learn', () => {
    const catalog = learnCatalog()
    const p = player({ go: study(1, 2), be: study(2, 1) })
    newTestFlow(catalog, p, zeroRng).start()
    newLearnFlow(catalog, p, zeroRng).start()

    const copy = JSON.parse(JSON.stringify(p))
    expect(copy).toEqual(p)
  })
})
