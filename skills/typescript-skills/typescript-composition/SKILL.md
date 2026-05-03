---
name: typescript-composition
description: Provides rules for TypeScript composition roots, dependency assembly, provider selection, lifecycle, and passing ready dependencies inward. Use when deciding where runtime decisions belong or when behavior code is starting to resolve its own dependencies.
---

# TypeScript Composition

Use this skill when behavior and assembly are starting to blur.

This skill focuses on outer-layer wiring:
- where runtime choices belong
- how dependencies get assembled
- when to use factories
- where lifecycle and scope should live

## Symptom → Rule

| Symptom | Open |
| --- | --- |
| Behavior reads env or picks implementations | `rules/composition-root-owns-runtime-decisions.md` |
| A use case is discovering what it needs | `rules/pass-ready-dependencies-inward.md` |
| I am not sure whether to inject a factory | `rules/choose-factories-vs-ready-instances.md` |
| Provider selection is repeated in feature code | `rules/keep-provider-selection-at-the-edge.md` |
| Scope or caching leaks into operations | `rules/keep-lifecycle-and-scope-out-of-behavior.md` |
| Convenience imports are becoming hidden wiring | `rules/avoid-hidden-singletons-in-app-logic.md` |

## ✅ Pick a rule

- `rules/composition-root-owns-runtime-decisions.md`
- `rules/pass-ready-dependencies-inward.md`
- `rules/choose-factories-vs-ready-instances.md`
- `rules/keep-provider-selection-at-the-edge.md`
- `rules/keep-lifecycle-and-scope-out-of-behavior.md`
- `rules/avoid-hidden-singletons-in-app-logic.md`

## Start here if...

### ...runtime choices are leaking into behavior
1. `rules/composition-root-owns-runtime-decisions.md`
2. `rules/pass-ready-dependencies-inward.md`

### ...you are unsure between injecting a factory or a ready dependency
1. `rules/choose-factories-vs-ready-instances.md`
2. `rules/keep-lifecycle-and-scope-out-of-behavior.md`

### ...provider selection is spread across feature code
1. `rules/keep-provider-selection-at-the-edge.md`
2. `rules/avoid-hidden-singletons-in-app-logic.md`

## What good looks like

A healthy composition setup has:
- one visible composition root
- runtime choices made outside behavior code
- ready dependencies passed inward
- lifecycle and scope owned at the edge

## Snippets
- `snippets/composition-root.ts`
- `snippets/make-use-case.ts`
- `snippets/provider-selection.ts`
- `snippets/request-scope.ts`

## References
- `references/composition-vs-behavior.md`
- `references/lifecycle-and-scope.md`
- `references/red-flags.md`
