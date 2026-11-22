import type { Catalog } from './catalog'
import { boxMax } from './ladder'
import { variantOf } from './progress'
import type { DraftStatus, EditArgs, Level, MyWordsItem, Progress, SetArgs, WordProgress } from './types'

// MyWords is "Мои слова" and "Все слова" (bot: lists.go). Changes apply at
// once (owner, stage 7); `original` (the entry when first touched on the
// screen) lets a second tap bring back exactly what was there.
export interface MyWords {
  // studyBases: stored study + learned words, alphabetical
  studyBases(): string[]
  items(bases: string[]): MyWordsItem[]
  // levelItems: every word of the level (not cumulative), alphabetical
  levelItems(level: Level): MyWordsItem[]
  // cycle (My words): study → learned → skipped → study
  cycle(args: EditArgs): void
  // toggleStudy (Word list): in study ↔ not in study
  toggleStudy(args: EditArgs): void
}

class List implements MyWords {
  constructor(
    private readonly catalog: Catalog,
    private readonly progress: Progress,
  ) {}

  studyBases(): string[] {
    const all = Object.keys(this.progress.words)
    const bases = all.filter((b) => this.status(b) === 'study' || this.status(b) === 'learned')
    bases.sort()
    return bases
  }

  items(bases: string[]): MyWordsItem[] {
    const items = bases.map((base) => this.item(base))
    return items
  }

  levelItems(level: Level): MyWordsItem[] {
    const bases = this.catalog.basesOf(level)
    const items = this.items(bases)
    return items
  }

  cycle(args: EditArgs): void {
    if (this.catalog.verb(args.base) === undefined) {
      return
    }
    const setArgs: SetArgs = {
      edit: args,
      target: nextStatus(this.status(args.base)),
    }
    this.set(setArgs)
  }

  toggleStudy(args: EditArgs): void {
    if (this.catalog.verb(args.base) === undefined) {
      return
    }
    let target: DraftStatus = 'study'
    if (this.status(args.base) === 'study') {
      const back = args.original?.status ?? 'new'
      target = back === 'study' ? 'new' : back
    }
    const setArgs: SetArgs = {
      edit: args,
      target: target,
    }
    this.set(setArgs)
  }

  // set writes the target status; the original status gets the original entry back.
  private set(args: SetArgs): void {
    const words = this.progress.words
    const base = args.edit.base
    const original = args.edit.original
    if (original !== undefined && original.status === args.target) {
      words[base] = { ...original }
      return
    }
    if (args.target === 'new') {
      delete words[base]
      return
    }
    const from = this.status(base)
    words[base] = fresh(args.target, from)
  }

  private status(base: string): DraftStatus {
    const status = this.progress.words[base]?.status ?? 'new'
    return status
  }

  private item(base: string): MyWordsItem {
    const variant = variantOf(this.progress)
    const v = this.catalog.verb(base)
    const status = this.status(base)
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
}

// fresh: a new entry for a status reached by a tap (not the original one).
// Back to study from learned = review at the typing step; otherwise Learn starts it at step 1.
function fresh(target: 'study' | 'learned' | 'skipped', from: DraftStatus): WordProgress {
  if (target === 'learned') {
    return {
      status: 'learned',
      mode: 2,
      box: boxMax,
    }
  }
  if (target === 'skipped') {
    return {
      status: 'skipped',
      mode: 0,
      box: 0,
    }
  }
  return {
    status: 'study',
    mode: from === 'learned' ? 2 : 0,
    box: 0,
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

// newMyWords creates the word lists over a player's Progress.
export function newMyWords(
  catalog: Catalog,
  progress: Progress,
): MyWords {
  return new List(
    catalog,
    progress,
  )
}
