import type { CheckArgs, CheckTargetArgs, FormArgs, GroupsArgs, MatchFormArgs, SameSetArgs } from './types'

// Any non-letter separates forms: space, "/", ",", "-", "|", "." and so on.
const separators = /[^\p{L}]+/u
const toMarker = 'to'
const toPrefix = 'to '

// matchForm: a multi-variant form (was/were, burnt/burned) accepts any single
// variant OR all of them together; the same for every verb (bot commit 05e6c44).
export function matchForm(args: MatchFormArgs): boolean {
  const one = anyEqual(args)
  if (one) {
    return true
  }
  const all = allFormsMatch(args)
  return all
}

// checkAllFormsOrdered: the Test answer — base, past, participle in this order,
// optional leading "to"; order inside a multi-variant group is free.
export function checkAllFormsOrdered(args: CheckArgs): boolean {
  const tokens = tokensOf(args.input)
  const start = tokens[0] === toMarker ? 1 : 0

  const groups = [
    [args.verb.base],
    args.verb.past[args.variant],
    args.verb.participle[args.variant],
  ]
  const groupsArgs: GroupsArgs = {
    groups: groups,
    tokens: tokens.slice(start),
  }
  const ok = matchGroupsOrdered(groupsArgs)
  return ok
}

// checkTarget: one typed form (Learn mode 2) or one tapped option (mode 1).
export function checkTarget(args: CheckTargetArgs): boolean {
  if (args.kind === 'base') {
    const input = normBase(args.input)
    const base = norm(args.verb.base)
    return input === base
  }

  const formArgs: FormArgs = {
    verb: args.verb,
    kind: args.kind,
    variant: args.variant,
  }
  const matchArgs: MatchFormArgs = {
    input: args.input,
    forms: formVariants(formArgs),
  }
  const ok = matchForm(matchArgs)
  return ok
}

// formVariants: every variant of a form as its own string (base has one).
export function formVariants(args: FormArgs): string[] {
  if (args.kind === 'base') {
    return [args.verb.base]
  }
  if (args.kind === 'past') {
    return args.verb.past[args.variant]
  }
  return args.verb.participle[args.variant]
}

// formValue: a form for display, variants joined by "/" (base without "to").
export function formValue(args: FormArgs): string {
  const variants = formVariants(args)
  const value = variants.join('/')
  return value
}

// norm: lower case, outer spaces trimmed.
export function norm(s: string): string {
  const trimmed = s.trim()
  const lower = trimmed.toLowerCase()
  return lower
}

// tokensOf splits on any non-letter and normalizes each token.
function tokensOf(s: string): string[] {
  const raw = s.split(separators)
  const nonEmpty = raw.filter((t) => t !== '')
  const tokens = nonEmpty.map(norm)
  return tokens
}

function anyEqual(args: MatchFormArgs): boolean {
  const input = norm(args.input)
  const found = args.forms.some((f) => norm(f) === input)
  return found
}

// allFormsMatch: input lists exactly the set of forms (all present, none extra).
function allFormsMatch(args: MatchFormArgs): boolean {
  if (args.forms.length === 0) {
    return false
  }

  const tokens = tokensOf(args.input)
  const got = new Set(tokens)
  const normForms = args.forms.map(norm)
  const want = new Set(normForms)
  if (got.size !== want.size) {
    return false
  }

  const all = [...want].every((w) => got.has(w))
  return all
}

// sameFormSet: got and want hold the same forms as a multiset.
function sameFormSet(args: SameSetArgs): boolean {
  if (args.got.length !== args.want.length) {
    return false
  }

  const counts = new Map<string, number>()
  for (const f of args.want) {
    const n = norm(f)
    const c = counts.get(n) ?? 0
    counts.set(n, c + 1)
  }
  for (const g of args.got) {
    const c = counts.get(g) ?? 0
    if (c === 0) {
      return false
    }
    counts.set(g, c - 1)
  }
  return true
}

// matchGroupsOrdered: each group takes one variant (one token) or all its
// variants (len(group) tokens); backtracks so an ambiguous token is tried both ways.
function matchGroupsOrdered(args: GroupsArgs): boolean {
  const [group, ...rest] = args.groups
  if (group === undefined) {
    return args.tokens.length === 0
  }
  if (group.length === 0) {
    return false
  }

  const first = args.tokens[0]
  if (first !== undefined) {
    const oneArgs: MatchFormArgs = {
      input: first,
      forms: group,
    }
    const restArgs: GroupsArgs = {
      groups: rest,
      tokens: args.tokens.slice(1),
    }
    if (anyEqual(oneArgs) && matchGroupsOrdered(restArgs)) {
      return true
    }
  }

  if (group.length > 1 && args.tokens.length >= group.length) {
    const setArgs: SameSetArgs = {
      got: args.tokens.slice(0, group.length),
      want: group,
    }
    const restArgs: GroupsArgs = {
      groups: rest,
      tokens: args.tokens.slice(group.length),
    }
    if (sameFormSet(setArgs) && matchGroupsOrdered(restArgs)) {
      return true
    }
  }
  return false
}

// normBase accepts an optional "to " before the infinitive.
function normBase(s: string): string {
  const n = norm(s)
  const base = n.startsWith(toPrefix) ? n.slice(toPrefix.length) : n
  return base
}
