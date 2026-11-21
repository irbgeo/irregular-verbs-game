import { describe, expect, it } from 'vitest'
import { countOpen } from '../src/app/opens'
import { newFakePlatform } from './fake-platform'

describe('countOpen', () => {
  it('first open gives 1 and saves it', async () => {
    const platform = newFakePlatform()

    expect(await countOpen(platform)).toBe(1)
    expect(platform.data.get('opens')).toBe('1')
  })

  it('each open adds one', async () => {
    const platform = newFakePlatform()
    await countOpen(platform)

    expect(await countOpen(platform)).toBe(2)
  })

  it.each(['abc', '-4', '1.5', ''])('a broken value %j starts again from 1', async (stored) => {
    const platform = newFakePlatform()
    platform.data.set('opens', stored)

    expect(await countOpen(platform)).toBe(1)
  })
})
