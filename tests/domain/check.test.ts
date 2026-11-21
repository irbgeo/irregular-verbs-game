import { describe, expect, it } from 'vitest'
import { checkAllFormsOrdered, checkTarget, formValue, matchForm } from '../../src/domain/check'
import verbsData from '../../data/verbs.json'
import { newCatalog } from '../../src/domain/catalog'
import type { Verb } from '../../src/domain/types'
import { beVerb, learnCatalog } from './helpers'

const goVerb: Verb = {
  base: 'go',
  level: 'elementary',
  past: { gb: ['went'], us: ['went'] },
  participle: { gb: ['gone'], us: ['gone'] },
  translations: ['идти'],
  common_mistakes: [],
}

const burn: Verb = {
  base: 'burn',
  level: 'elementary',
  past: { gb: ['burnt', 'burned'], us: ['burned', 'burnt'] },
  participle: { gb: ['burnt', 'burned'], us: ['burned', 'burnt'] },
  translations: ['жечь'],
  common_mistakes: [],
}

// bot: match_form_test.go TestMatchForm
describe('matchForm: any single variant or all of them', () => {
  it.each([
    ['was', ['was', 'were'], true],
    ['were', ['was', 'were'], true],
    ['was were', ['was', 'were'], true],
    ['were was', ['was', 'were'], true],
    ['burnt', ['burnt', 'burned'], true],
    ['burned', ['burnt', 'burned'], true],
    ['burnt burned', ['burnt', 'burned'], true],
    ['went', ['went'], true],
    ['nope', ['went'], false],
  ])('%j vs %j → %s', (input, forms, want) => {
    expect(matchForm({ input, forms })).toBe(want)
  })
})

// bot: all_forms_test.go TestAllFormsMatch (all-variants path of matchForm)
describe('matchForm: all variants together', () => {
  it.each([
    ['was were', true],
    ['were was', true],
    ['was/were', true],
    ['was, were', true],
    ['  was   /  were ', true],
    ['Was WERE', true],
    ['was were eaten', false],
    ['was was', false], // missing were; not a single variant either
    ['', false],
  ])('%j → %s', (input, want) => {
    expect(matchForm({ input, forms: ['was', 'were'] })).toBe(want)
  })

  it('single form and empty options', () => {
    expect(matchForm({ input: 'went', forms: ['went'] })).toBe(true)
    expect(matchForm({ input: 'go', forms: ['went'] })).toBe(false)
    expect(matchForm({ input: 'anything', forms: [] })).toBe(false)
  })
})

// bot: all_forms_ordered_test.go TestCheckAllFormsOrdered
describe('checkAllFormsOrdered: go', () => {
  it.each([
    ['go went gone', true],
    ['to go went gone', true],
    ['GO  went / gone', true],
    ['go-went-gone', true],
    ['go - went - gone', true],
    ['go|went|gone', true],
    ['go.went.gone', true],
    ['go;went,gone', true],
    ['went go gone', false],
    ['go gone went', false],
    ['go went', false],
    ['go went gone gone', false],
  ])('%j → %s', (input, want) => {
    expect(checkAllFormsOrdered({ verb: goVerb, variant: 'gb', input })).toBe(want)
  })
})

// bot: all_forms_ordered_test.go TestCheckAllFormsOrderedVariants
describe('checkAllFormsOrdered: multi-variant forms', () => {
  it.each([
    [beVerb(), 'be was were been', true],
    [beVerb(), 'be was/were been', true],
    [beVerb(), 'be were was been', true],
    [beVerb(), 'be was been', true],
    [beVerb(), 'be been was were', false],
    [burn, 'burn burnt burnt', true],
    [burn, 'burn burned burned', true],
    [burn, 'burn burnt burned', true],
    [burn, 'burn burned burnt', true],
    [burn, 'burn burnt burned burnt', true],
    [burn, 'burn nope burnt', false],
  ])('%s: %j → %s', (verb, input, want) => {
    expect(checkAllFormsOrdered({ verb, variant: 'gb', input })).toBe(want)
  })
})

// bot: base_to_test.go, all_forms_test.go TestCheckTargetPastAcceptsOneOrBoth, learn_check_test.go TestCheckTarget
describe('checkTarget', () => {
  const be = learnCatalog().verb('be')!
  const go = learnCatalog().verb('go')!

  it.each([
    ['be', true],
    ['to be', true],
    [' To Be ', true],
    ['tobe', false],
    ['to go', false],
  ])('base of be: %j → %s', (input, want) => {
    expect(checkTarget({ verb: beVerb(), variant: 'gb', kind: 'base', input })).toBe(want)
  })

  it.each([
    ['go', true],
    ['to go', true],
    ['togo', false],
    ['to went', false],
  ])('base of go: %j → %s', (input, want) => {
    expect(checkTarget({ verb: go, variant: 'gb', kind: 'base', input })).toBe(want)
  })

  it.each([
    ['base', ' Be ', 'gb', true],
    ['base', 'go', 'gb', false],
    ['past', 'was were', 'gb', true],
    ['past', 'were was', 'gb', true],
    ['past', 'was', 'gb', true],
    ['past', 'were', 'gb', true],
    ['past', 'wos', 'gb', false],
    ['participle', 'been', 'us', true],
  ] as const)('be %s %j (%s) → %s', (kind, input, variant, want) => {
    expect(checkTarget({ verb: be, variant, kind, input })).toBe(want)
  })
})

describe('real verbs from data/verbs.json', () => {
  const catalog = newCatalog(verbsData.verbs as Verb[])
  const get = catalog.verb('get')!
  const leap = catalog.verb('leap')!
  const burnReal = catalog.verb('burn')!

  it.each([
    [get, 'gb', 'get got got', true],
    [get, 'gb', 'get got gotten', false],
    [get, 'us', 'get got gotten', true],
    [get, 'us', 'get got got', false],
    [leap, 'gb', 'leap leapt leapt', true],
    [leap, 'gb', 'leap leaped leaped', false],
    [leap, 'us', 'leap leaped leaped', true],
    [burnReal, 'us', 'burn burnt burned', true],
  ] as const)('%s %s: %j → %s', (verb, variant, input, want) => {
    expect(checkAllFormsOrdered({ verb, variant, input })).toBe(want)
  })
})

// bot: learn_check_test.go TestFormValueAndCorrectOption
describe('formValue', () => {
  it('joins variants with "/" and shows base without "to"', () => {
    const be = learnCatalog().verb('be')!
    expect(formValue({ verb: be, kind: 'past', variant: 'gb' })).toBe('was/were')
    expect(formValue({ verb: be, kind: 'base', variant: 'gb' })).toBe('be')
    expect(formValue({ verb: be, kind: 'participle', variant: 'us' })).toBe('been')
  })
})
