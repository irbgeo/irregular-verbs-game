import { boxMax } from '../../domain/ladder'
import { renderFeedback } from '../feedback'
import { backBar, fromTemplate, refs } from '../template'
import { kindLabel } from '../text'
import type { LearnEmptyView, LearnView, MarksArgs, OptionsArgs } from '../types'

const html = `
<main class="screen">
  ${backBar('Учить')}
  <div data-ref="feedback"></div>
  <div class="spread">
    <span class="row-gap">
      <span class="muted small-text" data-ref="stage"></span>
      <span class="chip streak" data-ref="repeat" hidden>повторение</span>
      <span class="chip xp" data-ref="xp" hidden></span>
    </span>
    <span class="marks" data-ref="marks"></span>
  </div>
  <div class="card word-card">
    <span class="word-big" data-ref="anchor"></span>
    <span class="prompt"><span data-ref="verb"></span> <strong data-ref="target"></strong></span>
  </div>
  <div class="row2" role="group" aria-label="Варианты ответа" data-ref="options"></div>
  <form class="stack-12" data-ref="form" hidden>
    <label for="learn-answer" class="field-label">Ваш ответ</label>
    <input id="learn-answer" class="answer" data-ref="answer" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done">
    <button type="submit" class="btn btn-primary">Проверить</button>
  </form>
  <button type="button" class="btn btn-link" data-ref="reveal">Показать ответ</button>
</main>`

const emptyHtml = `
<main class="screen">
  ${backBar('Учить')}
  <div class="card word-card">
    <span class="h1">Пока нечего учить</span>
    <span class="muted">Пройдите тест: слова, которые вы не знаете, попадут сюда.</span>
  </div>
  <button type="button" class="btn btn-primary" data-ref="test" data-autofocus>Пройти тест</button>
</main>`

// renderLearn: one Learn round — buttons at step 1, typing at step 2 (mockups 4, 4b).
export function renderLearn(view: LearnView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)
  const round = view.round
  const choice = round.format === 'choice'

  r.stage.textContent = choice ? 'Ступень 1 · выбор' : 'Ступень 2 · ввод'
  r.repeat.hidden = !round.repeat
  r.xp.hidden = view.xpGain === 0
  r.xp.textContent = `+${view.xpGain} XP`
  r.anchor.textContent = round.anchorValue
  r.verb.textContent = choice ? 'Выберите' : 'Напишите'
  r.target.textContent = kindLabel(round.target)
  const marksArgs: MarksArgs = {
    marks: r.marks,
    box: round.repeat ? null : view.box,
  }
  fillMarks(marksArgs)
  if (view.feedback !== null) {
    const banner = renderFeedback(view.feedback)
    r.feedback.append(banner)
  }

  if (choice) {
    const optionsArgs: OptionsArgs = {
      view: view,
      box: r.options,
    }
    fillOptions(optionsArgs)
  } else {
    r.options.hidden = true
    r.form.hidden = false
    r.answer.dataset.autofocus = ''
    const answer = r.answer as HTMLInputElement
    r.form.addEventListener('submit', (e) => {
      e.preventDefault()
      view.actions.learnType(answer.value)
    })
  }
  r.reveal.addEventListener('click', () => view.actions.learnReveal())
  r.back.addEventListener('click', () => view.actions.toMenu())
  return root
}

// renderLearnEmpty: nothing to learn yet — go to the Test.
export function renderLearnEmpty(view: LearnEmptyView): HTMLElement {
  const root = fromTemplate(emptyHtml)
  const r = refs(root)
  r.test.addEventListener('click', () => view.actions.openTest())
  r.back.addEventListener('click', () => view.actions.toMenu())
  return root
}

function fillOptions(args: OptionsArgs): void {
  const view = args.view
  const box = args.box
  const options = view.round.options
  options.forEach((option, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn option'
    button.textContent = option
    if (index === 0) {
      button.dataset.autofocus = ''
    }
    // an odd last option takes the whole row, as in the mockup
    if (index === options.length - 1 && options.length % 2 === 1) {
      button.classList.add('span2')
    }
    button.addEventListener('click', () => view.actions.learnChoose(index))
    box.append(button)
  })
}

// fillMarks draws the 5 step marks; null hides them (learned word on review).
function fillMarks(args: MarksArgs): void {
  const marks = args.marks
  const box = args.box
  if (box === null) {
    marks.hidden = true
    return
  }
  marks.setAttribute('aria-label', `${box} из ${boxMax}`)
  for (let i = 0; i < boxMax; i++) {
    const mark = document.createElement('span')
    mark.className = i < box ? 'on' : ''
    marks.append(mark)
  }
}
