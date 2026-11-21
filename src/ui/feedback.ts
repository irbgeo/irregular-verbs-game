import type { AnswerResult, Feedback } from '../domain/types'
import { fromTemplate, refs } from './template'
import { formsLine } from './text'

const heads: Record<AnswerResult, string> = {
  correct: 'Верно!',
  incorrect: 'Неверно',
  hint: 'Ответ',
}

const tones: Record<AnswerResult, string> = {
  correct: 'ok',
  incorrect: 'bad',
  hint: 'info',
}

const html = `
<div class="banner" role="status">
  <span class="banner-head" data-ref="head"></span>
  <span class="forms" data-ref="forms"></span>
  <span class="note" data-ref="note"></span>
</div>`

// renderFeedback: the result of the last answer with all three forms.
export function renderFeedback(f: Feedback): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)
  root.classList.add(tones[f.result])

  r.head.textContent = heads[f.result]
  r.forms.textContent = formsLine(f)
  const translation = f.translations.join(', ')
  r.note.textContent = f.addedToStudy ? `${translation} · слово добавлено в изучение` : translation
  return root
}
