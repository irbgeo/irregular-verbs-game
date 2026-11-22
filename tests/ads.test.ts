import { describe, expect, it, vi } from 'vitest'
import { newAdPolicy } from '../src/app/ads'
import { newVKPlatform, type Bridge } from '../src/platform/vk'

function bridgeWith(send: (method: string, params?: unknown) => Promise<unknown>) {
  let handler: (e: unknown) => void = () => {}
  const bridge = {
    send: vi.fn(send),
    subscribe: (h: (e: unknown) => void) => {
      handler = h
    },
  } as unknown as Bridge
  return { bridge, emit: (e: unknown) => handler(e) }
}

describe('VK ads', () => {
  it('checks first; no ad → false without showing', async () => {
    const { bridge } = bridgeWith(async () => ({ result: false }))
    expect(await newVKPlatform(bridge).showAd('interstitial')).toBe(false)
    expect(bridge.send).toHaveBeenCalledTimes(1)
    expect(bridge.send).toHaveBeenCalledWith('VKWebAppCheckNativeAds', { ad_format: 'interstitial' })
  })

  it('ad available → shown → true', async () => {
    const { bridge } = bridgeWith(async () => ({ result: true }))
    expect(await newVKPlatform(bridge).showAd('reward')).toBe(true)
    expect(bridge.send).toHaveBeenLastCalledWith('VKWebAppShowNativeAds', { ad_format: 'reward' })
  })

  it('an error → false, never throws', async () => {
    const { bridge } = bridgeWith(async () => {
      throw new Error('no fill')
    })
    expect(await newVKPlatform(bridge).showAd('reward')).toBe(false)
  })

  it('hasAd only checks (VKWebAppCheckNativeAds), never shows', async () => {
    const { bridge } = bridgeWith(async () => ({ result: true }))
    expect(await newVKPlatform(bridge).hasAd('reward')).toBe(true)
    expect(bridge.send).toHaveBeenCalledTimes(1)
    expect(bridge.send).toHaveBeenCalledWith('VKWebAppCheckNativeAds', { ad_format: 'reward' })

    const failing = bridgeWith(async () => {
      throw new Error('offline')
    })
    expect(await newVKPlatform(failing.bridge).hasAd('reward')).toBe(false)
  })

  it('onHide follows VKWebAppViewHide / VKWebAppViewRestore', () => {
    const { bridge, emit } = bridgeWith(async () => ({}))
    const got: boolean[] = []
    newVKPlatform(bridge).onHide((h) => got.push(h))
    emit({ detail: { type: 'VKWebAppViewHide', data: {} } })
    emit({ detail: { type: 'VKWebAppUpdateConfig', data: {} } })
    emit({ detail: { type: 'VKWebAppViewRestore', data: {} } })
    expect(got).toEqual([true, false])
  })
})

describe('ad policy', () => {
  it('at most one ad per 60 s', () => {
    const policy = newAdPolicy()
    expect(policy.canShow(0)).toBe(true)
    policy.shown(1_000)
    expect(policy.canShow(60_999)).toBe(false)
    expect(policy.canShow(61_000)).toBe(true)
  })
})
