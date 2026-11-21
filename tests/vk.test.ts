import { describe, expect, it, vi } from 'vitest'
import { newVKPlatform, type Bridge } from '../src/platform/vk'

function fakeBridge(reply: unknown) {
  const send = vi.fn(async () => reply)
  const bridge = { send } as unknown as Bridge
  return { bridge, send }
}

describe('VK platform', () => {
  it('init sends VKWebAppInit', async () => {
    const { bridge, send } = fakeBridge({ result: true })
    await newVKPlatform(bridge).init()

    expect(send).toHaveBeenCalledWith('VKWebAppInit')
  })

  it('load asks VK Storage for the key and returns its value', async () => {
    const { bridge, send } = fakeBridge({ keys: [{ key: 'opens', value: '7' }] })
    const value = await newVKPlatform(bridge).load('opens')

    expect(send).toHaveBeenCalledWith('VKWebAppStorageGet', { keys: ['opens'] })
    expect(value).toBe('7')
  })

  it('load gives null for an empty value (VK means "not set")', async () => {
    const { bridge } = fakeBridge({ keys: [{ key: 'opens', value: '' }] })
    expect(await newVKPlatform(bridge).load('opens')).toBeNull()
  })

  it('load gives null when VK returns no such key', async () => {
    const { bridge } = fakeBridge({ keys: [] })
    expect(await newVKPlatform(bridge).load('opens')).toBeNull()
  })

  it('save sends VKWebAppStorageSet', async () => {
    const { bridge, send } = fakeBridge({ result: true })
    await newVKPlatform(bridge).save({ key: 'opens', value: '8' })

    expect(send).toHaveBeenCalledWith('VKWebAppStorageSet', { key: 'opens', value: '8' })
  })

  it('a bridge error is thrown, not swallowed', async () => {
    const send = vi.fn(async () => {
      throw new Error('flood control')
    })
    const bridge = { send } as unknown as Bridge

    await expect(newVKPlatform(bridge).load('opens')).rejects.toThrow('flood control')
  })
})
