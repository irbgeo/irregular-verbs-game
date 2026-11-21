import { formValue } from './check'
import type { FormArgs, FormKind, PickTaskArgs, Task, TasksArgs } from './types'

const kinds: readonly FormKind[] = [
  'base',
  'past',
  'participle',
]

// For a verb whose three forms are the same word (cut, put, set) there is
// nothing else to show: ask its past and participle from the infinitive.
const sameFormTasks: readonly Task[] = [
  {
    anchor: 'base',
    target: 'past',
  },
  {
    anchor: 'base',
    target: 'participle',
  },
]

// roundTasks lists the Learn questions for a verb by distinct WORDS, not by
// form kinds: a shown word appears once (understood = past = participle), and
// the answer is never the shown word. Order: base, past, participle.
export function roundTasks(args: TasksArgs): Task[] {
  const valueOf = (kind: FormKind): string => {
    const formArgs: FormArgs = {
      verb: args.verb,
      kind: kind,
      variant: args.variant,
    }
    const value = formValue(formArgs)
    return value
  }

  const tasks: Task[] = []
  const shown = new Set<string>()
  for (const anchor of kinds) {
    const anchorValue = valueOf(anchor)
    if (shown.has(anchorValue)) {
      continue
    }
    shown.add(anchorValue)
    for (const target of kinds) {
      if (target !== anchor && valueOf(target) !== anchorValue) {
        const task: Task = {
          anchor: anchor,
          target: target,
        }
        tasks.push(task)
      }
    }
  }

  if (tasks.length === 0) {
    const fallback = [...sameFormTasks]
    return fallback
  }
  return tasks
}

// pickTask: a random task index, not the word's last one (when there is a choice).
export function pickTask(args: PickTaskArgs): number {
  const all = Array.from({ length: args.count }, (_, i) => i)
  const fresh = all.filter((i) => i !== args.last)
  const candidates = fresh.length > 0 ? fresh : all
  const index = candidates[args.rng(candidates.length)]
  return index
}
