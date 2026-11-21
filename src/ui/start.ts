import type { StartView, TextElementInput } from './types'

const title = 'Неправильные глаголы'
const errorText = 'Не удалось загрузить игру'

// renderStart draws the stage 1 start screen into view.root, replacing old content.
export function renderStart(view: StartView): void {
  const heading = textElement({
    tag: 'h1',
    text: title,
  })
  const opens = textElement({
    tag: 'p',
    text: `Открытий игры: ${view.opens}`,
  })
  const verbs = textElement({
    tag: 'p',
    text: `Глаголов в игре: ${view.verbs}`,
  })

  view.root.replaceChildren(heading, opens, verbs)
}

// renderError replaces the screen with a short error message.
export function renderError(root: HTMLElement): void {
  const message = textElement({
    tag: 'p',
    text: errorText,
  })
  root.replaceChildren(message)
}

// textElement builds an element holding plain text (textContent, never HTML).
function textElement(input: TextElementInput): HTMLElement {
  const el = document.createElement(input.tag)
  el.textContent = input.text
  return el
}
