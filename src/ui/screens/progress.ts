import { backBar, fromTemplate, refs } from '../template'
import { daysLabel, levelLabel, xpLabel } from '../text'
import type { AchievementView, LevelBar, ProgressView } from '../types'

const html = `
<main class="screen">
  ${backBar('Прогресс')}
  <div class="row2">
    <div class="stat-card xp">
      <span class="stat-label">Очки</span>
      <span class="stat-value" data-ref="xp"></span>
    </div>
    <div class="stat-card streak">
      <span class="stat-label">Серия</span>
      <span class="stat-value" data-ref="streak"></span>
    </div>
  </div>
  <div class="week" data-ref="week"></div>
  <section class="levels">
    <h2 class="strong small-title">Выучено по уровням</h2>
    <div class="stack-12" data-ref="levels"></div>
  </section>
  <section class="stack-8">
    <h2 class="strong small-title" data-ref="achievementsTitle"></h2>
    <ul class="achievements" data-ref="achievements"></ul>
  </section>
</main>`

const levelHtml = `
<div class="level-row">
  <span class="spread"><span data-ref="name"></span><span class="muted" data-ref="count"></span></span>
  <span class="level-bar" aria-hidden="true"><span data-ref="bar"></span></span>
</div>`

const starIcon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>'
const lockIcon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'

// renderProgress: XP, streak with the last 7 days, level bars, achievements (mockup 7).
export function renderProgress(view: ProgressView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)

  r.xp.textContent = xpLabel(view.xp)
  r.streak.textContent = daysLabel(view.streak)
  const filled = view.week.filter(Boolean).length
  r.week.setAttribute('aria-label', `Последние 7 дней: занятий ${filled}`)
  view.week.forEach((on, i) => {
    const day = document.createElement('span')
    day.className = on ? 'on' : ''
    day.textContent = view.weekdays[i]
    day.append(document.createElement('i'))
    if (i === view.week.length - 1) {
      day.classList.add('today')
    }
    r.week.append(day)
  })

  const rows = view.levels.map(renderLevel)
  r.levels.append(...rows)
  const open = view.achievements.filter((a) => a.unlocked).length
  r.achievementsTitle.textContent = `Достижения · ${open} из ${view.achievements.length}`
  const items = view.achievements.map(renderAchievement)
  r.achievements.append(...items)

  r.back.addEventListener('click', () => view.actions.toMenu())
  r.back.dataset.autofocus = ''
  return root
}

function renderLevel(bar: LevelBar): HTMLElement {
  const row = fromTemplate(levelHtml)
  const r = refs(row)
  r.name.textContent = levelLabel(bar.level)
  r.count.textContent = `${bar.learned} из ${bar.total}`
  const share = bar.total === 0 ? 0 : Math.round((bar.learned / bar.total) * 100)
  r.bar.style.width = `${share}%`
  return row
}

function renderAchievement(a: AchievementView): HTMLElement {
  const item = fromTemplate(`<li class="achievement">${a.unlocked ? starIcon : lockIcon}<span></span></li>`)
  if (!a.unlocked) {
    item.classList.add('locked')
  }
  const label = item.querySelector('span') as HTMLElement
  label.textContent = a.name
  return item
}
