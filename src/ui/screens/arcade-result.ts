import { fromTemplate, refs } from '../template'
import type { ArcadeResultView } from '../types'

const html = `
<main class="screen">
  <h1 class="h1 center intro muted-title">Время вышло</h1>
  <div class="score-card">
    <span class="score-label">Ваш счёт</span>
    <span class="score-value" data-ref="score"></span>
    <span class="record-chip" data-ref="record">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4"/><path d="M7 5H4a3 3 0 0 0 3 4"/></svg>
      Новый рекорд!
    </span>
  </div>
  <dl class="stats three">
    <div><dt>Верно</dt><dd class="ok-text" data-ref="correct"></dd></div>
    <div><dt>Ошибок</dt><dd class="bad-text" data-ref="wrong"></dd></div>
    <div><dt>Серия</dt><dd data-ref="run"></dd></div>
  </dl>
  <p class="muted center">Ответы засчитаны в изучение слов</p>
  <div class="grow"></div>
  <div class="stack-12">
    <button type="button" class="btn" data-ref="reward">+15 секунд за рекламу</button>
    <button type="button" class="btn btn-primary" data-ref="again" data-autofocus>Ещё раунд</button>
    <button type="button" class="btn btn-link" data-ref="menu">В меню</button>
  </div>
</main>`

// renderArcadeResult: the end of a round (mockup 5b, without the VK board).
export function renderArcadeResult(view: ArcadeResultView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)

  r.score.textContent = String(view.score)
  if (!view.newRecord) {
    r.record.remove()
  }
  r.correct.textContent = String(view.correct)
  r.wrong.textContent = String(view.wrong)
  r.run.textContent = String(view.bestRun)

  if (view.canReward) {
    r.reward.addEventListener('click', () => view.actions.arcadeReward())
  } else {
    r.reward.remove()
  }
  r.again.addEventListener('click', () => view.actions.openArcade())
  r.menu.addEventListener('click', () => view.actions.toMenu())
  return root
}
