import { levels } from '../../domain/catalog'
import { isLevel } from '../../domain/progress'
import type { Variant } from '../../domain/types'
import { backBar, fromTemplate, refs } from '../template'
import { levelLabel, verbsLabel } from '../text'
import type { SettingsChoice, SettingsView } from '../types'

const html = `
<main class="screen">
  ${backBar('Настройки')}
  <section class="stack-12">
    <h2 class="section-title">Вариант английского</h2>
    <div class="segmented" role="radiogroup" aria-label="Вариант английского">
      <button type="button" role="radio" data-ref="gb" data-autofocus>Британский</button>
      <button type="button" role="radio" data-ref="us">Американский</button>
    </div>
  </section>
  <section class="stack-12">
    <h2 class="section-title"><label for="settings-level">Уровень</label></h2>
    <select id="settings-level" class="select" data-ref="level"></select>
    <p class="hint">Тест берёт слова этого уровня и всех предыдущих. После смены начатые Тест и «Учить» начнутся заново.</p>
  </section>
  <section class="row-btn switch-row">
    <span class="row-title" id="sound-label">Звук</span>
    <button type="button" class="switch" role="switch" data-ref="sound" aria-labelledby="sound-label"><span></span></button>
  </section>
  <div class="grow"></div>
  <section class="stack-12">
    <button type="button" class="btn btn-danger" data-ref="reset">Сбросить прогресс</button>
    <p class="hint center">Удалит все слова и прогресс. Перед сбросом спросим ещё раз.</p>
  </section>
</main>`

// renderSettings: variant, level, sound, reset with a second tap (mockup 8).
export function renderSettings(view: SettingsView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)
  const choice = view.choice

  r.gb.setAttribute('aria-checked', String(choice.variant === 'gb'))
  r.us.setAttribute('aria-checked', String(choice.variant === 'us'))
  const select = r.level as HTMLSelectElement
  for (const level of levels) {
    const option = document.createElement('option')
    option.value = level
    option.textContent = `${levelLabel(level)} · ${verbsLabel(view.levelCounts[level])}`
    option.selected = level === choice.level
    select.append(option)
  }

  const setVariant = (variant: Variant) => () => {
    const next: SettingsChoice = {
      variant: variant,
      level: choice.level,
    }
    view.actions.setSettings(next)
  }
  r.gb.addEventListener('click', setVariant('gb'))
  r.us.addEventListener('click', setVariant('us'))
  select.addEventListener('change', () => {
    if (!isLevel(select.value)) {
      return
    }
    const next: SettingsChoice = {
      variant: choice.variant,
      level: select.value,
    }
    view.actions.setSettings(next)
  })

  r.sound.setAttribute('aria-checked', String(view.sound))
  r.sound.addEventListener('click', () => view.actions.setSound(!view.sound))

  let confirming = false
  r.reset.addEventListener('click', () => {
    if (confirming) {
      view.actions.resetProgress()
      return
    }
    confirming = true
    r.reset.textContent = 'Точно сбросить? Нажмите ещё раз'
  })
  r.back.addEventListener('click', () => view.actions.toMenu())
  return root
}
