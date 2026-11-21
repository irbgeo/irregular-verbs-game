import { beforeEach, describe, expect, it } from 'vitest'
import { newLocalPlatform } from '../src/platform/local'

describe('local platform', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('init does nothing and does not throw', async () => {
    const platform = newLocalPlatform(window.localStorage)
    await expect(platform.init()).resolves.toBeUndefined()
  })

  it('load of a missing key gives null', async () => {
    const platform = newLocalPlatform(window.localStorage)
    expect(await platform.load('opens')).toBeNull()
  })

  it('save then load gives the value back, under a prefixed key', async () => {
    const platform = newLocalPlatform(window.localStorage)
    await platform.save({ key: 'opens', value: '3' })

    expect(await platform.load('opens')).toBe('3')
    expect(window.localStorage.getItem('iv:opens')).toBe('3')
  })
})
