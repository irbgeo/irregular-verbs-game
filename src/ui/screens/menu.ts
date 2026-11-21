import { fromTemplate, refs } from '../template'
import { daysLabel, levelLabel, xpLabel } from '../text'
import type { MenuView } from '../types'

const html = `
<main class="screen">
  <header class="topbar spread">
    <h1 class="h1">Глаголы</h1>
    <span class="row-gap">
      <span class="pill streak" data-ref="streak">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 4 .5-3-.5-5 0-8z"/></svg>
        <span data-ref="streakText"></span>
      </span>
      <span class="pill xp" data-ref="xp"></span>
    </span>
  </header>
  <button type="button" class="learn-card" data-ref="learn" data-autofocus>
    <span class="learn-head">
      <span class="learn-title">Учить</span>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/></svg>
    </span>
    <span class="learn-note" data-ref="learnNote"></span>
    <span class="learn-bar"><span data-ref="learnBar"></span></span>
  </button>
<div class="row2">
  <button type="button" class="tile" data-ref="test">
    <svg class="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/></svg>
    <span class="stack-4">
      <span class="tile-title">Тест</span>
      <span class="tile-note" data-ref="testNote"></span>
    </span>
  </button>
  <button type="button" class="tile" data-ref="arcade">
    <svg class="icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>
    <span class="stack-4">
      <span class="tile-title">Аркада</span>
      <span class="tile-note" data-ref="arcadeNote"></span>
    </span>
  </button>
  </div>
  <button type="button" class="row-btn" data-ref="words">
    <svg class="icon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
    <span class="row-title">Мои слова</span>
    <span class="muted" data-ref="wordsCount"></span>
  </button>
  <div class="grow"></div>
  <nav class="row2" aria-label="Ещё">
    <button type="button" class="btn small" data-ref="progress">Прогресс</button>
    <button type="button" class="btn small" data-ref="settings">Настройки</button>
  </nav>
</main>`

// renderMenu: streak + XP, Learn, Test, My words, Progress, Settings
// and the Arcade tile (mockup 2).
export function renderMenu(view: MenuView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)
  const total = view.studying + view.learned

  r.streakText.textContent = daysLabel(view.streak)
  r.xp.textContent = xpLabel(view.xp)
  r.arcadeNote.textContent = `Рекорд ${view.arcadeBest}`
  r.learnNote.textContent = `${view.studying} в изучении · ${view.learned} выучено`
  const share = total === 0 ? 0 : Math.round((view.learned / total) * 100)
  r.learnBar.style.width = `${share}%`
  r.wordsCount.textContent = String(total)
  if (view.testResume === null) {
    r.testNote.textContent = `${levelLabel(view.level)} · ${view.levelWords}`
  } else {
    r.testNote.textContent = `Продолжить · слово ${view.testResume.index} из ${view.testResume.total}`
  }

  r.learn.addEventListener('click', () => view.actions.openLearn())
  r.test.addEventListener('click', () => view.actions.openTest())
  r.words.addEventListener('click', () => view.actions.openMyWords())
  r.settings.addEventListener('click', () => view.actions.openSettings())
  r.progress.addEventListener('click', () => view.actions.openProgress())
  r.arcade.addEventListener('click', () => view.actions.openArcade())
  return root
}
