import type { VKBridge } from '@vkontakte/vk-bridge'
import type { AdFormat, HideListener, Platform, Theme, ThemeListener } from './port'
import type { StorageEntry, ThemeConfig } from './types'

// Bridge is the part of VK Bridge the platform uses.
export type Bridge = Pick<VKBridge, 'send' | 'subscribe'>

const darkSchemes = [
  'vkcom_dark',
  'space_gray',
]

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

  // onTheme follows VKWebAppUpdateConfig, which VK sends after init and on changes.
  onTheme(listener: ThemeListener): void {
    this.bridge.subscribe((event) => {
      if (event.detail.type !== 'VKWebAppUpdateConfig') {
        return
      }
      const config = event.detail.data as ThemeConfig
      const theme = themeOf(config)
      listener(theme)
    })
  }

  async hasAd(format: AdFormat): Promise<boolean> {
    const adParams = {
      ad_format: format,
    }
    try {
      const check = await this.bridge.send('VKWebAppCheckNativeAds', adParams)
      return check.result
    } catch (err) {
      console.warn('vk: ad check failed', err)
      return false
    }
  }

  async showAd(format: AdFormat): Promise<boolean> {
    const adParams = {
      ad_format: format,
    }
    try {
      const check = await this.bridge.send('VKWebAppCheckNativeAds', adParams)
      if (!check.result) {
        return false
      }
      await this.bridge.send('VKWebAppShowNativeAds', adParams)
      return true
    } catch (err) {
      console.warn('vk: ad not shown', err)
      return false
    }
  }

  // onHide follows the mobile app closing / coming back (VKWebAppViewHide / ViewRestore).
  onHide(listener: HideListener): void {
    this.bridge.subscribe((event) => {
      if (event.detail.type === 'VKWebAppViewHide') {
        listener(true)
      }
      if (event.detail.type === 'VKWebAppViewRestore') {
        listener(false)
      }
    })
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

// themeOf reads the theme from VK's config: `appearance` (apps) or `scheme` (web).
export function themeOf(config: ThemeConfig): Theme {
  if (config.appearance === 'dark') {
    return 'dark'
  }
  if (config.scheme !== undefined && darkSchemes.includes(config.scheme)) {
    return 'dark'
  }
  return 'light'
}
