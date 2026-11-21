// StartView is what the start screen shows and where.
export interface StartView {
  root: HTMLElement
  opens: number
  verbs: number
}

// TextElementInput is one plain-text element to build.
export interface TextElementInput {
  tag: 'h1' | 'p'
  text: string
}
