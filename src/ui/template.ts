// Screens are static HTML strings with data-ref marks. Only static markup goes
// through innerHTML here; every piece of data is set later with textContent.

// fromTemplate turns static markup into one element.
export function fromTemplate(html: string): HTMLElement {
  const t = document.createElement('template')
  t.innerHTML = html.trim()
  const el = t.content.firstElementChild
  if (!(el instanceof HTMLElement)) {
    throw new Error('template: markup must have one root element')
  }
  return el
}

// refs gives the elements marked with data-ref="name" (the root too).
export function refs(root: HTMLElement): Record<string, HTMLElement> {
  const out: Record<string, HTMLElement> = {}
  const marked = root.querySelectorAll<HTMLElement>('[data-ref]')
  for (const el of [root, ...marked]) {
    const name = el.dataset.ref
    if (name !== undefined) {
      out[name] = el
    }
  }
  return out
}

// backBar is the top bar with a back-to-menu button; `title` is static text.
export function backBar(title: string): string {
  return `
<header class="topbar">
  <button type="button" class="icon-btn" data-ref="back" aria-label="В меню">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
  </button>
  <h1 class="title" data-ref="title">${title}</h1>
</header>`
}
