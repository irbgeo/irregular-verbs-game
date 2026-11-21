import { renderFeedback } from '../feedback'
import { backBar, fromTemplate, refs } from '../template'
import { formsLine } from '../text'
import type { HeaderArgs, TestView } from '../types'

const questionHtml = `
<main class="screen">
  ${backBar('Тест')}
  <div class="progressbar" aria-hidden="true"><span data-ref="bar"></span></div>
  <div data-ref="feedback"></div>
  <div class="card word-card">
    <span class="muted">Напишите 3 формы по порядку</span>
    <span class="word-big" data-ref="word"></span>
  </div>
  <form class="stack-12" data-ref="form">
    <label for="test-answer" class="field-label">Инфинитив, past, participle через пробел</label>
    <input id="test-answer" class="answer" data-ref="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" data-autofocus>
    <button type="submit" class="btn btn-primary">Проверить</button>
    <div class="row2">
      <button type="button" class="btn small" data-ref="hint">Подсказка</button>
      <button type="button" class="btn small" data-ref="skip">Пропустить</button>
    </div>
  </form>
</main>`

const chooseHtml = `
<main class="screen">
  ${backBar('Тест')}
  <div class="progressbar" aria-hidden="true"><span data-ref="bar"></span></div>
  <div class="card word-card ok-card">
    <span class="ok-badge" aria-hidden="true">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>
    </span>
    <span class="ok-head" role="status">Верно!</span>
    <span class="chip xp" data-ref="xp" hidden></span>
    <span class="forms-big" data-ref="forms"></span>
    <span class="muted" data-ref="translation"></span>
  </div>
  <div class="stack-12">
    <p class="center strong">Учить это слово?</p>
    <button type="button" class="btn btn-primary" data-ref="keep" data-autofocus>В изучение</button>
    <button type="button" class="btn" data-ref="drop">Я его знаю, пропустить</button>
  </div>
</main>`

// renderTest: a Test question (mockup 3) or the choice after a correct answer (3b).
export function renderTest(view: TestView): HTMLElement {
  const step = view.step
  if (step.kind === 'choose') {
    const choose = renderChoose(view)
    return choose
  }

  const root = fromTemplate(questionHtml)
  const r = refs(root)
  const headerArgs: HeaderArgs = {
    view: view,
    refs: r,
  }
  fillHeader(headerArgs)
  if (step.kind === 'question') {
    r.word.textContent = step.base
  }
  if (step.feedback !== null) {
    const banner = renderFeedback(step.feedback)
    r.feedback.append(banner)
  }

  const answer = r.answer as HTMLInputElement
  r.form.addEventListener('submit', (e) => {
    e.preventDefault()
    view.actions.testAnswer(answer.value)
  })
  r.hint.addEventListener('click', () => view.actions.testHint())
  r.skip.addEventListener('click', () => view.actions.testSkip())
  return root
}

function renderChoose(view: TestView): HTMLElement {
  if (view.step.kind !== 'choose') {
    throw new Error('test screen: not a choose step')
  }
  const feedback = view.step.feedback
  const root = fromTemplate(chooseHtml)
  const r = refs(root)
  const headerArgs: HeaderArgs = {
    view: view,
    refs: r,
  }
  fillHeader(headerArgs)

  r.xp.hidden = view.xpGain === 0
  r.xp.textContent = `+${view.xpGain} XP`
  r.forms.textContent = formsLine(feedback)
  r.translation.textContent = feedback.translations.join(', ')
  r.keep.addEventListener('click', () => view.actions.testKeep())
  r.drop.addEventListener('click', () => view.actions.testDrop())
  return root
}

function fillHeader(args: HeaderArgs): void {
  const view = args.view
  const r = args.refs
  const p = view.position
  r.title.textContent = `Тест · Слово ${p.index} из ${p.total}`
  const share = Math.round((p.index / p.total) * 100)
  r.bar.style.width = `${share}%`
  r.back.addEventListener('click', () => view.actions.toMenu())
}
