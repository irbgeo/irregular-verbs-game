import { renderFeedback } from '../feedback'
import { fromTemplate, refs } from '../template'
import type { TestDoneView } from '../types'

const html = `
<main class="screen">
  <h1 class="h1 center intro">Тест пройден</h1>
  <div data-ref="feedback"></div>
  <dl class="stats">
    <div><dt>Верно</dt><dd class="ok-text" data-ref="correct"></dd></div>
    <div><dt>Ошибок</dt><dd class="bad-text" data-ref="incorrect"></dd></div>
    <div><dt>Подсказок</dt><dd data-ref="hint"></dd></div>
    <div><dt>Пропущено</dt><dd data-ref="skipped"></dd></div>
  </dl>
  <p class="muted center">Слова с ошибками и подсказками уже в «Учить»</p>
  <div class="grow"></div>
  <button type="button" class="btn btn-primary" data-ref="menu" data-autofocus>В меню</button>
</main>`

// renderTestDone: the end of a Test with the counts.
export function renderTestDone(view: TestDoneView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)

  r.correct.textContent = String(view.counts.correct)
  r.incorrect.textContent = String(view.counts.incorrect)
  r.hint.textContent = String(view.counts.hint)
  r.skipped.textContent = String(view.counts.skipped)
  if (view.feedback !== null) {
    const banner = renderFeedback(view.feedback)
    r.feedback.append(banner)
  }

  r.menu.addEventListener('click', () => view.actions.toMenu())
  return root
}
