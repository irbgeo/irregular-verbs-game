import { multiplierFor, roundMs, x2From, x3From } from '../../domain/arcade'
import { fromTemplate, refs } from '../template'
import { kindLabel } from '../text'
import type { ArcadeView, LastArgs, TimerArgs } from '../types'

const html = `
<main class="screen">
  <header class="topbar">
    <button type="button" class="icon-btn" data-ref="quit" aria-label="Выйти из раунда">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>
    </button>
    <h1 class="title">Аркада</h1>
    <span class="muted small-text" data-ref="best"></span>
  </header>
  <div class="card arcade-board">
    <div class="spread arcade-numbers">
      <div class="stack-4">
        <span class="muted small-text">Время</span>
        <span class="arcade-time" data-ref="time"></span>
      </div>
      <div class="stack-4 right">
        <span class="muted small-text">Очки</span>
        <span class="arcade-score" data-ref="score"></span>
      </div>
    </div>
    <span class="progressbar thick" aria-hidden="true"><span data-ref="bar"></span></span>
    <div class="row-gap">
      <span class="pill multiplier" data-ref="multiplier"></span>
      <span class="pill streak" data-ref="run"></span>
      <span class="pill" data-ref="last" role="status"></span>
    </div>
  </div>
  <div class="card word-card">
    <span class="word-big" data-ref="anchor"></span>
    <span class="prompt">Выберите <strong data-ref="target"></strong></span>
  </div>
  <div class="row2" role="group" aria-label="Варианты ответа" data-ref="options"></div>
</main>`

// renderArcade: one Arcade question with time, score, multiplier and run (mockup 5).
export function renderArcade(view: ArcadeView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)

  r.best.textContent = `Рекорд ${view.best}`
  r.score.textContent = String(view.score)
  r.anchor.textContent = view.anchorValue
  r.target.textContent = kindLabel(view.target)
  const timerArgs: TimerArgs = {
    root: root,
    msLeft: view.msLeft,
  }
  updateArcadeTimer(timerArgs)

  const multiplier = multiplierFor(view.run)
  r.multiplier.textContent = `x${multiplier}`
  r.run.textContent = runText(view.run)
  r.run.hidden = view.run === 0
  const lastArgs: LastArgs = {
    el: r.last,
    view: view,
  }
  fillLast(lastArgs)

  view.options.forEach((option, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn option arcade-option'
    button.textContent = option
    if (index === 0) {
      button.dataset.autofocus = ''
    }
    if (index === view.options.length - 1 && view.options.length % 2 === 1) {
      button.classList.add('span2')
    }
    button.addEventListener('click', () => view.actions.arcadeAnswer(index))
    r.options.append(button)
  })
  r.quit.addEventListener('click', () => view.actions.arcadeQuit())
  return root
}

// updateArcadeTimer redraws only the time and its bar (called every 250 ms).
export function updateArcadeTimer(args: TimerArgs): void {
  const time = args.root.querySelector<HTMLElement>('[data-ref="time"]')
  const bar = args.root.querySelector<HTMLElement>('[data-ref="bar"]')
  if (time === null || bar === null) {
    return
  }
  const seconds = Math.ceil(args.msLeft / 1000)
  const minutes = Math.floor(seconds / 60)
  const rest = String(seconds % 60).padStart(2, '0')
  time.textContent = `${minutes}:${rest}`
  time.setAttribute('aria-label', `Осталось ${seconds} с`)
  const share = Math.round((args.msLeft / roundMs) * 100)
  bar.style.width = `${share}%`
}

// runText: "6 подряд · ещё 4 до x3".
function runText(run: number): string {
  if (run < x2From) {
    return `${run} подряд · ещё ${x2From - run} до x2`
  }
  if (run < x3From) {
    return `${run} подряд · ещё ${x3From - run} до x3`
  }
  return `${run} подряд`
}

function fillLast(args: LastArgs): void {
  const el = args.el
  const view = args.view
  if (view.last === null) {
    el.hidden = true
    return
  }
  el.classList.add(view.last.correct ? 'ok-pill' : 'bad-pill')
  el.textContent = view.last.correct ? `+${view.last.points}` : '−3 с'
}
