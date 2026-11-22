import { levels } from '../domain/catalog'
import { levelLabel, verbsLabel } from './text'
import type { LevelPickerArgs } from './types'

// renderLevelPicker: the 4 levels as a 2×2 grid of buttons (a radio group) —
// used instead of <select>, whose system dropdown cannot be styled.
export function renderLevelPicker(args: LevelPickerArgs): HTMLElement {
  const grid = document.createElement('div')
  grid.className = 'level-grid'
  grid.setAttribute('role', 'radiogroup')
  grid.setAttribute('aria-label', args.label)

  for (const level of levels) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'level-pick'
    button.setAttribute('role', 'radio')
    button.setAttribute('aria-checked', String(level === args.selected))
    button.dataset.level = level
    // keeps keyboard focus on this button when the screen is re-drawn
    button.dataset.key = `level:${level}`
    if (level === args.selected) {
      button.dataset.autofocus = ''
    }

    const name = document.createElement('span')
    name.className = 'level-pick-name'
    name.textContent = levelLabel(level)
    const count = document.createElement('span')
    count.className = 'level-pick-count'
    count.textContent = verbsLabel(args.counts[level])
    button.append(name, count)

    button.addEventListener('click', () => args.onPick(level))
    grid.append(button)
  }
  return grid
}
