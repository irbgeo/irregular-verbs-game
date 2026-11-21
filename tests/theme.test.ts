import { describe, expect, it, vi } from 'vitest'
import type { Theme } from '../src/platform/port'
import { newLocalPlatform } from '../src/platform/local'
import { newVKPlatform, themeOf, type Bridge } from '../src/platform/vk'

describe('themeOf (VK config)', () => {
  it.each([
    [{ appearance: 'dark' }, 'dark'],
    [{ appearance: 'light' }, 'light'],
    [{ scheme: 'vkcom_dark' }, 'dark'],
    [{ scheme: 'space_gray' }, 'dark'],
    [{ scheme: 'bright_light' }, 'light'],
    [{}, 'light'],
  ])('%j → %s', (config, want) => {
    expect(themeOf(config)).toBe(want)
  })
})

describe('VK onTheme', () => {
  it('listens to VKWebAppUpdateConfig only', () => {
    let handler: (e: unknown) => void = () => {}
    const bridge = {
      send: vi.fn(),
      subscribe: (h: (e: unknown) => void) => {
        handler = h
      },
    } as unknown as Bridge
    const got: Theme[] = []
    newVKPlatform(bridge).onTheme((t) => got.push(t))

    handler({ detail: { type: 'VKWebAppUpdateConfig', data: { appearance: 'dark' } } })
    handler({ detail: { type: 'VKWebAppStorageGetResult', data: {} } })
    handler({ detail: { type: 'VKWebAppUpdateConfig', data: { scheme: 'bright_light' } } })

    expect(got).toEqual(['dark', 'light'])
  })
})

describe('local onTheme', () => {
  it('reports the media query now and on change', () => {
    let change: (e: { matches: boolean }) => void = () => {}
    const media = {
      matches: true,
      addEventListener: (_type: string, h: (e: { matches: boolean }) => void) => {
        change = h
      },
    } as unknown as MediaQueryList
    const got: Theme[] = []
    newLocalPlatform(window.localStorage, media).onTheme((t) => got.push(t))
    change({ matches: false })

    expect(got).toEqual(['dark', 'light'])
  })
})
