import { describe, expect, it } from 'vitest'
import verbsData from '../../data/verbs.json'
import { newCatalog } from '../../src/domain/catalog'
import { formValue } from '../../src/domain/check'
import { newLearnFlow } from '../../src/domain/learn-flow'
import { roundTasks } from '../../src/domain/tasks'
import type { LearnStep, Progress, RoundView, Verb, WordProgress } from '../../src/domain/types'
import { learnCatalog, learned, player, seqRng, skipped, study, zeroRng } from './helpers'

const catalog = learnCatalog()

function roundOf(step: LearnStep): RoundView {
  if (step.kind !== 'round') {
    throw new Error('expected a round')
  }
  return step.round
}

function correctAnswer(round: RoundView): string {
  const verb = catalog.verb(round.base)!
  return formValue({ verb, kind: round.target, variant: 'gb' })
}

function startWith(words: Record<string, WordProgress>, rng = zeroRng) {
  const p: Progress = player(words)
  const flow = newLearnFlow(catalog, p, rng)
  const step = flow.start()
  return { flow, p, step }
}

// bot: learn_round_test.go (changed: target is never the anchor)
describe('rounds', () => {
  it('input format: anchor and target are two different forms, no options', () => {
    // rng: pick (100, n) → go; task 1 of go = base → participle
    const { step } = startWith({ go: study(2) }, seqRng(0, 0, 1))
    const round = roundOf(step)

    expect(round.format).toBe('input')
    expect(round.anchor).toBe('base')
    expect(round.target).toBe('participle')
    expect(round.options).toEqual([])
  })

  it('target is never the anchor', () => {
    for (let seed = 0; seed < 50; seed++) {
      let x = seed
      const rng = (n: number) => {
        x = (x * 1103515245 + 12345) % 2147483648
        return x % n
      }
      const { step } = startWith({ go: study(2), be: study(1) }, rng)
      const round = roundOf(step)
      expect(round.target).not.toBe(round.anchor)
    }
  })

  it('choice format fills options (go: 5)', () => {
    const { step } = startWith({ go: study(1) })
    const round = roundOf(step)

    expect(round.format).toBe('choice')
    expect(round.options).toHaveLength(5)
  })

  it('round view fields: anchor value joined, repeat flag', () => {
    // be, task 2 = past → base
    const { step } = startWith({ be: study(2) }, seqRng(0, 0, 2))
    const round = roundOf(step)

    expect(round.anchor).toBe('past')
    expect(round.anchorValue).toBe('was/were')
    expect(round.target).toBe('base')
    expect(round.repeat).toBe(false)

    const learnedStep = startWith({ go: learned }).step
    expect(roundOf(learnedStep).repeat).toBe(true)
    expect(roundOf(learnedStep).format).toBe('input')
  })
})

// bot: learn_flow_test.go, learn_edge_test.go, learn_mode0_test.go, learn_choice_variants_test.go
describe('LearnFlow', () => {
  it('empty pool gives empty', () => {
    const { step, p } = startWith({ do: skipped })
    expect(step).toEqual({ kind: 'empty' })
    expect(p.learn).toBeNull()
  })

  it('start shows a round and fills the cooldown ring', () => {
    const { step, p } = startWith({ go: study(2) })
    expect(step.kind).toBe('round')
    expect(p.learn?.recent).toEqual(['go'])
  })

  it('correct typed answer shows feedback with all forms', () => {
    const { flow, step } = startWith({ go: study(2) })
    const next = flow.type(correctAnswer(roundOf(step)))

    expect(next.kind === 'round' && next.feedback).toEqual({
      result: 'correct',
      addedToStudy: false,
      base: 'go',
      past: ['went'],
      participle: ['gone'],
      translations: ['идти'],
    })
  })

  it('correct typed answer moves the box and stays in rounds', () => {
    // rng: study group, candidate 1 of [be, go] → go
    const { flow, p, step } = startWith({ go: study(2, 2), be: study(2, 0) }, seqRng(0, 1))
    expect(roundOf(step).base).toBe('go')
    const next = flow.type(correctAnswer(roundOf(step)))

    expect(next.kind).toBe('round')
    expect(p.words.go.box).toBe(3)
  })

  it('wrong typed answer shows feedback and zeroes the box', () => {
    const { flow, p } = startWith({ go: study(2, 3) })
    const next = flow.type('definitely-wrong')

    expect(next.kind === 'round' && next.feedback?.result).toBe('incorrect')
    expect(p.words.go.box).toBe(0)
  })

  it('reveal is a failure with result hint', () => {
    const { flow, p } = startWith({ go: study(2, 4) })
    const next = flow.reveal()

    expect(next.kind === 'round' && next.feedback?.result).toBe('hint')
    expect(p.words.go).toMatchObject(study(2, 0))
  })

  it('choosing the correct option bumps the box', () => {
    const { flow, p, step } = startWith({ go: study(1, 1) })
    const round = roundOf(step)
    flow.choose(round.options.indexOf(correctAnswer(round)))

    expect(p.words.go.box).toBe(2)
  })

  it('typed text is ignored in choice format; a bad index is ignored', () => {
    const { flow, p, step } = startWith({ go: study(1, 1) })

    expect(flow.type('whatever')).toEqual(step)
    expect(flow.choose(99)).toEqual(step)
    expect(p.words.go.box).toBe(1)
  })

  it('choice is ignored in input format', () => {
    const { flow, p, step } = startWith({ go: study(2, 1) })

    expect(flow.choose(0)).toEqual(step)
    expect(p.words.go.box).toBe(1)
  })

})

describe('LearnFlow edge cases', () => {
  it('a single-word pool keeps returning that word', () => {
    const { flow } = startWith({ go: study(2) })
    const next = flow.type('nope')

    expect(roundOf(next).base).toBe('go')
  })

  it('promotion to learned keeps the session alive', () => {
    const { flow, p, step } = startWith({ go: study(2, 4) })
    const next = flow.type(correctAnswer(roundOf(step)))

    expect(next.kind).toBe('round')
    expect(p.words.go.status).toBe('learned')
  })

  it('a mode-0 word (added from My words) starts at mode 1 and climbs', () => {
    const { flow, p, step } = startWith({ go: study(0) })
    const round = roundOf(step)

    expect(round.format).toBe('choice')
    expect(p.words.go.mode).toBe(1)

    flow.choose(round.options.indexOf(correctAnswer(round)))
    expect(p.words.go.box).toBe(1)
  })

  it.each(['was', 'were'])('tapping either variant of be past (%s) is correct', (pick) => {
    // be, task 0 = base → past
    const { flow, p, step } = startWith({ be: study(1, 0) })
    const round = roundOf(step)
    expect(round.target).toBe('past')

    flow.choose(round.options.indexOf(pick))
    expect(p.words.be.box).toBe(1)
  })

  it('current resumes the saved round; null without a session', () => {
    const p = player({ go: study(2) })
    expect(newLearnFlow(catalog, p, zeroRng).current()).toBeNull()

    const step = newLearnFlow(catalog, p, zeroRng).start()
    expect(newLearnFlow(catalog, p, zeroRng).current()).toEqual(step)
  })

  it('a saved round whose word has no entry any more does not crash', () => {
    const { flow, p } = startWith({ go: study(2), be: study(2) })
    const base = p.learn!.round!.base
    delete p.words[base]

    expect(flow.reveal().kind).toBe('round')
    expect(p.words[base]).toBeUndefined()
  })

  it('answers without a session are ignored', () => {
    const flow = newLearnFlow(catalog, player({ go: study(2) }), zeroRng)
    expect(flow.type('go')).toEqual({ kind: 'empty' })
    expect(flow.reveal()).toEqual({ kind: 'empty' })
  })
})

describe('round tasks: by distinct words, not by form kinds', () => {
  const real = newCatalog(verbsData.verbs as Verb[])
  const tasksOf = (base: string) => roundTasks({ verb: real.verb(base)!, variant: 'gb' })

  it('understand (past = participle): 3 tasks, the answer is never the shown word', () => {
    expect(tasksOf('understand')).toEqual([
      { anchor: 'base', target: 'past' },
      { anchor: 'base', target: 'participle' },
      { anchor: 'past', target: 'base' },
    ])
  })

  it('go (all different): 6 tasks', () => {
    expect(tasksOf('go')).toHaveLength(6)
  })

  it('cut (all the same): base → past / participle only', () => {
    expect(tasksOf('cut')).toEqual([
      { anchor: 'base', target: 'past' },
      { anchor: 'base', target: 'participle' },
    ])
  })

  it('no task on real data shows its own answer (unless all forms are equal)', () => {
    for (const verb of verbsData.verbs as Verb[]) {
      for (const variant of ['gb', 'us'] as const) {
        const values = (['base', 'past', 'participle'] as const).map((kind) => formValue({ verb, kind, variant }))
        if (new Set(values).size === 1) {
          continue
        }
        for (const t of roundTasks({ verb, variant })) {
          const shown = formValue({ verb, kind: t.anchor, variant })
          const answer = formValue({ verb, kind: t.target, variant })
          expect(answer, `${verb.base} ${variant} ${t.anchor}->${t.target}`).not.toBe(shown)
        }
      }
    }
  })
})

describe('round tasks: no repeat for the same word', () => {
  it('the same word never gets the same task twice in a row', () => {
    const real = newCatalog(verbsData.verbs as Verb[])
    const p = player({ understand: study(1), go: study(1) })
    let x = 7
    const rng = (n: number) => {
      x = (x * 1103515245 + 12345) % 2147483648
      return x % n
    }
    const flow = newLearnFlow(real, p, rng)
    let step = flow.start()
    const last: Record<string, string> = {}
    for (let i = 0; i < 300; i++) {
      const r = roundOf(step)
      const key = `${r.anchor}->${r.target}`
      expect(key, `${r.base} at ${i}`).not.toBe(last[r.base])
      last[r.base] = key
      step = flow.reveal()
    }
  })

  it('the last task is kept on the word through the ladder step', () => {
    const { flow, p, step } = startWith({ go: study(2, 1) })
    const task = p.words.go.task
    expect(task).toBe(0)
    flow.type(correctAnswer(roundOf(step)))
    expect(p.words.go.box).toBe(2)
    expect(p.words.go.task).not.toBe(task)
  })
})
