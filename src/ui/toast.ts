const showMs = 4_000

let current: HTMLElement | null = null
let timer: ReturnType<typeof setTimeout> | null = null

// showToast shows a short message at the bottom for a few seconds.
export function showToast(text: string): void {
  if (current === null) {
    current = document.createElement('div')
    current.className = 'toast'
    current.setAttribute('role', 'status')
    document.body.append(current)
  }
  current.textContent = text
  current.hidden = false

  if (timer !== null) {
    clearTimeout(timer)
  }
  timer = setTimeout(() => {
    if (current !== null) {
      current.hidden = true
    }
  }, showMs)
}

// renderError replaces the screen when the game cannot start.
export function renderError(root: HTMLElement): void {
  const message = document.createElement('p')
  message.className = 'fatal'
  message.textContent = 'Не удалось загрузить игру. Попробуйте открыть её ещё раз.'
  root.replaceChildren(message)
}
