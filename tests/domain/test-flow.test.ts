import { describe, expect, it } from 'vitest'
import { newProgress } from '../../src/domain/progress'
import { newTestFlow } from '../../src/domain/test-flow'
import type { Progress } from '../../src/domain/types'
import { player, testCatalog, zeroRng } from './helpers'

// started: elementary test on the bot's 3-verb catalog; zeroRng shuffle → [go, be].
function started(p: Progress = player()) {
  const flow = newTestFlow(testCatalog(), p, zeroRng)
  const step = flow.start()
  return { flow, p, step }
}

const correctGo = 'go went gone'

// bot: test_flow_test.go
describe('TestFlow.start', () => {
  it('builds a session from the settings level', () => {
    const { p, step } = started()
    expect(step).toEqual({ kind: 'question', base: 'go', feedback: null })
    expect(p.test?.queue).toEqual(['be'])
  })

  it('is cumulative: includes earlier levels', () => {
    const p = player()
    p.settings.level = 'pre-intermediate'
    const { p: after } = started(p)
    const all = [after.test!.base, ...after.test!.queue].sort()
    expect(all).toEqual(['be', 'build', 'go'])
  })

  it('throws without settings (not onboarded)', () => {
    const flow = newTestFlow(testCatalog(), newProgress(), zeroRng)
    expect(() => flow.start()).toThrow()
  })
})

// bot: test_answer_test.go
describe('TestFlow answers', () => {
  it('wrong answer adds to study (mode 1, box 0) and advances', () => {
    const { flow, p } = started()
    const step = flow.answer('definitely-wrong')

    expect(step.kind).toBe('question')
    expect(step.feedback).toMatchObject({ result: 'incorrect', addedToStudy: true, base: 'go' })
    expect(p.words.go).toEqual({ status: 'study', mode: 1, box: 0 })
    expect(p.test?.base).toBe('be')
  })

  it('all forms in the wrong order is incorrect', () => {
    const { flow, p } = started()
    const step = flow.answer('gone went go')

    expect(step.feedback?.result).toBe('incorrect')
    expect(p.words.go.status).toBe('study')
  })

  it('all correct asks to choose; nothing written yet', () => {
    const { flow, p } = started()
    const step = flow.answer(correctGo)

    expect(step).toEqual({
      kind: 'choose',
      feedback: {
        result: 'correct',
        addedToStudy: false,
        base: 'go',
        past: ['went'],
        participle: ['gone'],
        translations: ['идти'],
      },
    })
    expect(p.words.go).toBeUndefined()
  })

  it('hint adds to study and advances', () => {
    const { flow, p } = started()
    const step = flow.hint()

    expect(step.feedback).toMatchObject({ result: 'hint', addedToStudy: true })
    expect(p.words.go.status).toBe('study')
    expect(p.test?.base).toBe('be')
  })

  it('skip advances without writing', () => {
    const { flow, p } = started()
    flow.skip()

    expect(p.words.go).toBeUndefined()
    expect(p.test?.base).toBe('be')
  })

  it('end of queue: done with counts, session cleared', () => {
    const { flow, p } = started()
    flow.skip()
    const step = flow.skip()

    expect(step).toEqual({
      kind: 'done',
      counts: { correct: 0, incorrect: 0, hint: 0, skipped: 2 },
      feedback: null,
    })
    expect(p.test).toBeNull()
  })

  it('counts every outcome', () => {
    const { flow } = started()
    flow.answer(correctGo)
    flow.keep()
    const step = flow.hint()

    expect(step.kind).toBe('done')
    if (step.kind === 'done') {
      expect(step.counts).toEqual({ correct: 1, incorrect: 0, hint: 1, skipped: 0 })
    }
  })

  it('answer / hint / skip are ignored while waiting for the choice', () => {
    const { flow, p } = started()
    flow.answer(correctGo)

    expect(flow.skip().kind).toBe('choose')
    expect(flow.answer('x').kind).toBe('choose')
    expect(p.test?.base).toBe('go')
  })

  it('keep / drop are ignored while not waiting for the choice', () => {
    const { flow, p } = started()
    expect(flow.keep()).toEqual({ kind: 'question', base: 'go', feedback: null })
    expect(flow.drop().kind).toBe('question')
    expect(p.words.go).toBeUndefined()
  })
})

// bot: test_result_test.go
describe('TestFlow keep / drop', () => {
  it('keep writes study and advances', () => {
    const { flow, p } = started()
    flow.answer(correctGo)
    const step = flow.keep()

    expect(p.words.go).toEqual({ status: 'study', mode: 1, box: 0 })
    expect(step).toEqual({ kind: 'question', base: 'be', feedback: null })
  })

  it('drop writes skipped and advances', () => {
    const { flow, p } = started()
    flow.answer(correctGo)
    flow.drop()

    expect(p.words.go).toEqual({ status: 'skipped', mode: 0, box: 0 })
  })
})

describe('TestFlow.current', () => {
  it('is null without a session and resumes a saved one', () => {
    const p = player()
    expect(newTestFlow(testCatalog(), p, zeroRng).current()).toBeNull()

    const { flow } = started(p)
    flow.answer(correctGo)
    const resumed = newTestFlow(testCatalog(), p, zeroRng).current()
    expect(resumed?.kind).toBe('choose')
  })

  it('resumes a question', () => {
    const { p } = started()
    expect(newTestFlow(testCatalog(), p, zeroRng).current()).toEqual({
      kind: 'question',
      base: 'go',
      feedback: null,
    })
  })
})
