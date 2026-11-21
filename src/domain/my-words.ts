import type { Catalog } from './catalog'
import { boxMax } from './ladder'
import { variantOf } from './progress'
import type { Draft, DraftStatus, ItemArgs, MyWordsItem, Progress, ToggleArgs } from './types'

// MyWords is the "Мои слова" list (bot: lists.go, My words part).
// The draft lives in the UI while the screen is open; commit applies it.
export interface MyWords {
  // items: stored study + learned words, alphabetical, status with the draft applied.
  items(draft: Draft): MyWordsItem[]
  // toggle returns a new draft with the next status: study → learned → skipped → study.
  toggle(args: ToggleArgs): Draft
  commit(draft: Draft): void
}

class List implements MyWords {
  constructor(
    private readonly catalog: Catalog,
    private readonly progress: Progress,
  ) {}

  items(draft: Draft): MyWordsItem[] {
    const all = Object.keys(this.progress.words)
    const bases = all.filter((b) => this.stored(b) === 'study' || this.stored(b) === 'learned')
    bases.sort()

    const items = bases.map((base) => {
      const itemArgs: ItemArgs = {
        base: base,
        draft: draft,
      }
      const item = this.item(itemArgs)
      return item
    })
    return items
  }

  toggle(args: ToggleArgs): Draft {
    const draft = {
      ...args.draft,
    }
    if (this.catalog.verb(args.base) === undefined) {
      return draft
    }

    const stored = this.stored(args.base)
    const effective = draft[args.base] ?? stored
    const target = nextStatus(effective)
    if (target === stored) {
      delete draft[args.base]
    } else {
      draft[args.base] = target
    }
    return draft
  }

  commit(draft: Draft): void {
    const words = this.progress.words
    for (const [base, target] of Object.entries(draft)) {
      if (target === 'new') {
        delete words[base]
        continue
      }
      if (target === 'study') {
        const old = words[base]
        words[base] = {
          status: 'study',
          mode: old?.mode ?? 0,
          box: old?.box ?? 0,
        }
        continue
      }
      if (target === 'learned') {
        words[base] = {
          status: 'learned',
          mode: 2,
          box: boxMax,
        }
        continue
      }
      words[base] = {
        status: 'skipped',
        mode: 0,
        box: 0,
      }
    }
  }

  private item(args: ItemArgs): MyWordsItem {
    const base = args.base
    const variant = variantOf(this.progress)
    const v = this.catalog.verb(base)
    const status = args.draft[base] ?? this.stored(base)
    if (v === undefined) {
      return {
        base: base,
        status: status,
        past: '',
        participle: '',
        translation: '',
      }
    }

    const past = v.past[variant]
    const participle = v.participle[variant]
    return {
      base: base,
      status: status,
      past: past.join('/'),
      participle: participle.join('/'),
      translation: v.translations.join(', '),
    }
  }

  private stored(base: string): DraftStatus {
    const status = this.progress.words[base]?.status ?? 'new'
    return status
  }
}

// nextStatus is the My words tap cycle (bot: nextMyWordsStatus).
function nextStatus(status: DraftStatus): DraftStatus {
  if (status === 'study') {
    return 'learned'
  }
  if (status === 'learned') {
    return 'skipped'
  }
  return 'study'
}

// newMyWords creates the My words list over a player's Progress.
export function newMyWords(
  catalog: Catalog,
  progress: Progress,
): MyWords {
  return new List(
    catalog,
    progress,
  )
}
