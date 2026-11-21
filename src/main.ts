import bridge from '@vkontakte/vk-bridge'
import verbsData from '../data/verbs.json'
import { countOpen } from './app/opens'
import { isVK } from './platform/detect'
import { newLocalPlatform } from './platform/local'
import { newVKPlatform } from './platform/vk'
import { renderError, renderStart } from './ui/start'

// main wires the game: platform → storage round-trip → start screen.
async function main(): Promise<void> {
  const root = document.getElementById('app')
  if (root === null) {
    throw new Error('main: #app element is missing in index.html')
  }

  const inVK = isVK(window.location.search)
  const platform = inVK ? newVKPlatform(bridge) : newLocalPlatform(window.localStorage)

  try {
    await platform.init()
    const opens = await countOpen(platform)

    const startView = {
      root: root,
      opens: opens,
      verbs: verbsData.verbs.length,
    }
    renderStart(startView)
  } catch (err) {
    console.error('main: start failed', err)
    renderError(root)
  }
}

void main()
