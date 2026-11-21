import bridge from '@vkontakte/vk-bridge'
import verbsData from '../data/verbs.json'
import { decode, progressKey, sessionsKey } from './app/codec'
import { newGame } from './app/game'
import { newSaver } from './app/saver'
import type { GameDeps, SavedValues } from './app/types'
import { newCatalog } from './domain/catalog'
import { mathRng } from './domain/rng'
import type { Verb } from './domain/types'
import { isVK } from './platform/detect'
import { newLocalPlatform } from './platform/local'
import { newVKPlatform } from './platform/vk'
import { newSound } from './ui/sound'
import { renderError, showToast } from './ui/toast'
import './ui/styles.css'

// main wires the game: platform → theme → saved progress → saver → game.
async function main(): Promise<void> {
  const root = document.getElementById('app')
  if (root === null) {
    throw new Error('main: #app element is missing in index.html')
  }

  const inVK = isVK(window.location.search)
  const darkMedia = window.matchMedia('(prefers-color-scheme: dark)')
  const platform = inVK ? newVKPlatform(bridge) : newLocalPlatform(window.localStorage, darkMedia)
  platform.onTheme((theme) => {
    document.documentElement.dataset.theme = theme
  })

  try {
    await platform.init()
    const catalog = newCatalog(verbsData.verbs as Verb[])
    const savedWords = await platform.load(progressKey)
    const savedSessions = await platform.load(sessionsKey)
    const saved: SavedValues = {
      p: savedWords,
      s: savedSessions,
    }
    const decodeArgs = {
      saved: saved,
      catalog: catalog,
    }
    const progress = decode(decodeArgs)

    const saver = newSaver(platform, progress, (err) => {
      console.error('main: save failed', err)
      showToast('Не удалось сохранить — попробуем ещё раз')
    })
    const sound = newSound()
    const gameDeps: GameDeps = {
      catalog: catalog,
      progress: progress,
      saver: saver,
      platform: platform,
      sound: sound,
      rng: mathRng,
      root: root,
    }
    const game = newGame(gameDeps)
    platform.onHide((hidden) => game.onVisibility(hidden))
    document.addEventListener('visibilitychange', () => {
      const hidden = document.visibilityState === 'hidden'
      game.onVisibility(hidden)
      if (hidden) {
        void saver.flushNow()
      }
    })
    game.start()
  } catch (err) {
    console.error('main: start failed', err)
    renderError(root)
  }
}

void main()
