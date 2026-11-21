import type { DraftStatus } from '../../domain/types'
import { backBar, fromTemplate, refs } from '../template'
import type { MyWordsView, RowArgs } from '../types'

const statusNames: Record<DraftStatus, string> = {
  study: 'учу',
  learned: 'выучено',
  skipped: 'не учить',
  new: 'новое',
}

const html = `
<main class="screen">
  ${backBar('Мои слова')}
  <p class="muted small-text" data-ref="counts"></p>
  <p class="hint">Нажмите на статус: учу → выучено → не учить</p>
  <ul class="word-list" data-ref="list"></ul>
  <p class="muted center" data-ref="empty" hidden>Пока пусто. Слова появятся после Теста.</p>
  <div class="bottom-bar" data-ref="bar" hidden>
    <button type="button" class="btn small" data-ref="cancel">Отменить</button>
    <button type="button" class="btn btn-primary small" data-ref="save"></button>
  </div>
</main>`

const rowHtml = `
<li class="word-row">
  <div class="word-text">
    <span class="word-forms" data-ref="forms"></span>
    <span class="muted small-text" data-ref="translation"></span>
  </div>
  <button type="button" class="status" data-ref="status"></button>
</li>`

// renderMyWords: study + learned words; tap a status to cycle it; save / cancel (mockup 6).
export function renderMyWords(view: MyWordsView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)

  r.counts.textContent = `${view.studying} учу · ${view.learned} выучено`
  r.empty.hidden = view.items.length > 0
  const rows = view.items.map((item) => {
    const rowArgs: RowArgs = {
      actions: view.actions,
      item: item,
    }
    const row = renderRow(rowArgs)
    return row
  })
  r.list.append(...rows)
  if (rows.length > 0) {
    refs(rows[0]).status.dataset.autofocus = ''
  }

  r.bar.hidden = view.changes === 0
  r.save.textContent = `Сохранить (${view.changes})`
  r.save.addEventListener('click', () => view.actions.myWordsSave())
  r.cancel.addEventListener('click', () => view.actions.myWordsCancel())
  r.back.addEventListener('click', () => view.actions.toMenu())
  return root
}

function renderRow(args: RowArgs): HTMLElement {
  const actions = args.actions
  const item = args.item
  const row = fromTemplate(rowHtml)
  const r = refs(row)

  r.forms.textContent = `${item.base} — ${item.past} — ${item.participle}`
  r.translation.textContent = item.translation
  r.status.textContent = statusNames[item.status]
  r.status.classList.add(item.status)
  r.status.setAttribute('aria-label', `${item.base}: ${statusNames[item.status]}, нажмите, чтобы изменить`)
  r.status.addEventListener('click', () => actions.myWordsToggle(item.base))
  return row
}
