import type { VKBridge } from '@vkontakte/vk-bridge'
import type { Platform } from './port'
import type { StorageEntry } from './types'

// Bridge is the part of VK Bridge the platform uses.
export type Bridge = Pick<VKBridge, 'send'>

class VKPlatform implements Platform {
  constructor(private readonly bridge: Bridge) {}

  async init(): Promise<void> {
    await this.bridge.send('VKWebAppInit')
  }

  async load(key: string): Promise<string | null> {
    const getParams = {
      keys: [key],
    }
    const reply = await this.bridge.send('VKWebAppStorageGet', getParams)

    // VK returns an empty value for a key that was never set.
    const found = reply.keys.find((k) => k.key === key)
    if (found === undefined || found.value === '') {
      return null
    }
    return found.value
  }

  async save(entry: StorageEntry): Promise<void> {
    const setParams = {
      key: entry.key,
      value: entry.value,
    }
    await this.bridge.send('VKWebAppStorageSet', setParams)
  }
}

// newVKPlatform creates the Platform backed by VK Bridge and VK Storage.
export function newVKPlatform(
  bridge: Bridge,
): Platform {
  return new VKPlatform(
    bridge,
  )
}
