import type { DraftStatus } from '../../domain/types'
import { backBar, fromTemplate, refs } from '../template'
import { renderLevelPicker } from '../level-picker'
import type { LevelPickerArgs, RowArgs, WordListView } from '../types'

const chipNames: Record<DraftStatus, string> = {
  study: 'учу',
  learned: 'выучено',
  skipped: '+ учить',
  new: '+ учить',
}

const html = `
<main class="screen">
  ${backBar('Все слова')}
  <div data-ref="level"></div>
  <p class="hint">Нажмите «+ учить», чтобы добавить слово в изучение, или «учу», чтобы убрать.</p>
  <ul class="word-list" data-ref="list"></ul>
</main>`

const rowHtml = `
<li class="word-row">
  <div class="word-text">
    <span class="word-forms" data-ref="forms"></span>
    <span class="muted small-text" data-ref="translation"></span>
  </div>
  <button type="button" class="status" data-ref="status"></button>
</li>`

// renderWordList: every word of a level; a tap puts it into study or takes it out at once (stage 7).
export function renderWordList(view: WordListView): HTMLElement {
  const root = fromTemplate(html)
  const r = refs(root)

  const pickerArgs: LevelPickerArgs = {
    counts: view.levelCounts,
    selected: view.level,
    label: 'Уровень',
    onPick: (level) => view.actions.wordListLevel(level),
  }
  const picker = renderLevelPicker(pickerArgs)
  r.level.replaceWith(picker)

  const rows = view.items.map((item) => {
    const rowArgs: RowArgs = {
      actions: view.actions,
      item: item,
    }
    const row = renderRow(rowArgs)
    return row
  })
  r.list.append(...rows)
  r.back.addEventListener('click', () => view.actions.toMenu())
  return root
}

function renderRow(args: RowArgs): HTMLElement {
  const item = args.item
  const row = fromTemplate(rowHtml)
  const r = refs(row)

  r.forms.textContent = `${item.base} — ${item.past} — ${item.participle}`
  r.translation.textContent = item.translation
  r.status.textContent = chipNames[item.status]
  r.status.classList.add(item.status === 'skipped' ? 'new' : item.status)
  r.status.dataset.key = item.base
  const action = item.status === 'study' ? 'убрать из изучения' : 'учить'
  r.status.setAttribute('aria-label', `${item.base}: ${action}`)
  r.status.addEventListener('click', () => args.actions.wordListToggle(item.base))
  return row
}
