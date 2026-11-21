import { levels } from '../../domain/catalog'
import type { Level, Variant } from '../../domain/types'
import { fromTemplate, refs } from '../template'
import { levelLabel, verbsLabel } from '../text'
import type { OnboardingView, SettingsChoice } from '../types'

const html = `
<main class="screen">
  <div class="stack-8 intro">
    <h1 class="h1 big">Неправильные глаголы</h1>
    <p class="muted lead">Две настройки, и начнём</p>
  </div>
  <section class="stack-12">
    <h2 class="section-title">Какой английский учим</h2>
    <div class="row2">
      <button type="button" class="choice variant" data-ref="gb" data-autofocus>
        <span class="choice-title">Британский</span>
        <span class="choice-note">got, learnt</span>
      </button>
      <button type="button" class="choice variant" data-ref="us">
        <span class="choice-title">Американский</span>
        <span class="choice-note">gotten, learned</span>
      </button>
    </div>
  </section>
  <section class="stack-12">
    <h2 class="section-title">Ваш уровень</h2>
    <div class="stack-8" data-ref="levels"></div>
    <p class="hint">Уровень включает все предыдущие. Поменять можно в настройках.</p>
  </section>
  <div class="grow"></div>
  <button type="button" class="btn btn-primary" data-ref="start">Начать</button>
</main>`

const levelHtml = `
<button type="button" class="choice level">
  <span class="choice-title" data-ref="name"></span>
  <span class="choice-note" data-ref="count"></span>
</button>`

// renderOnboarding: choose British / American and the level (mockup 1).
export function renderOnboarding(view: OnboardingView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)
  const choice: SettingsChoice = {
    variant: 'gb',
    level: 'elementary',
  }

  const levelButtons = levels.map((level) => {
    const button = fromTemplate(levelHtml)
    const b = refs(button)
    button.dataset.level = level
    b.name.textContent = levelLabel(level)
    b.count.textContent = verbsLabel(view.levelCounts[level])
    return button
  })
  r.levels.append(...levelButtons)

  const update = () => {
    r.gb.setAttribute('aria-pressed', String(choice.variant === 'gb'))
    r.us.setAttribute('aria-pressed', String(choice.variant === 'us'))
    levelButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.level === choice.level)))
  }
  const pickVariant = (variant: Variant) => () => {
    choice.variant = variant
    update()
  }
  r.gb.addEventListener('click', pickVariant('gb'))
  r.us.addEventListener('click', pickVariant('us'))
  levelButtons.forEach((b) => b.addEventListener('click', () => {
    choice.level = b.dataset.level as Level
    update()
  }))
  r.start.addEventListener('click', () => {
    const picked: SettingsChoice = {
      variant: choice.variant,
      level: choice.level,
    }
    view.actions.finishOnboarding(picked)
  })

  update()
  return root
}
