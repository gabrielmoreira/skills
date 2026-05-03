---
name: typescript-coding-standards
description: Provides rules for TypeScript naming, earned abstractions, function-first design, semantic center visibility, local reasoning, and full cutovers. Use when code structure feels harder to change than it should be or when naming and layering are hiding responsibility.
---

# TypeScript Coding Standards

Use this skill when the problem is not syntax quality but structural clarity.

This skill focuses on:
- naming by reader need
- earned abstractions
- functions by default
- semantic center visibility
- local reasoning
- full cutovers

## Symptom → Rule

| Symptom | Open |
| --- | --- |
| Names feel vague or too pattern-shaped | `rules/name-by-reader-need.md` |
| A new wrapper or layer is being proposed | `rules/earn-abstractions.md` |
| A stateless class feels suspicious | `rules/prefer-functions-unless-classes-earn-it.md` |
| The app story is getting lost behind framework folders | `rules/keep-semantic-center-visible.md` |
| One behavior now takes too many files to understand | `rules/preserve-local-reasoning.md` |
| Old and new designs are both still live | `rules/do-full-cutovers.md` |

## ✅ Pick a rule

- `rules/name-by-reader-need.md`
- `rules/earn-abstractions.md`
- `rules/prefer-functions-unless-classes-earn-it.md`
- `rules/keep-semantic-center-visible.md`
- `rules/preserve-local-reasoning.md`
- `rules/do-full-cutovers.md`

## Start here if...

### ...names feel vague or too pattern-shaped
1. `rules/name-by-reader-need.md`
2. `rules/keep-semantic-center-visible.md`

### ...a new layer or wrapper is being proposed
1. `rules/earn-abstractions.md`
2. `rules/preserve-local-reasoning.md`

### ...the design is drifting toward ceremony
1. `rules/prefer-functions-unless-classes-earn-it.md`
2. `rules/do-full-cutovers.md`

## What good looks like

A healthy codebase has:
- names that explain role and ownership
- abstractions that protect something real
- small enough local contexts for readers to follow behavior
- old and new designs not living side by side for long

## Snippets
- `snippets/function-first-module.ts`
- `snippets/earned-abstraction-example.ts`
- `snippets/local-reasoning-example.ts`

## References
- `references/naming-guide.md`
- `references/abstraction-guide.md`
- `references/red-flags.md`
