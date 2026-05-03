---
name: typescript-testing
description: Provides rules for testing TypeScript boundaries safely, including characterization tests, config contract tests, light composition-root tests, and avoiding brittle structure assertions. Use when refactoring boundaries or trying to make tests protect real behavior instead of internal spellings.
---

# TypeScript Testing

Use this skill when test pain is telling you something about structure.

This skill focuses on:
- characterization before refactor
- testing config and boundary contracts
- light testing of composition roots
- avoiding brittle assertions about internal structure

## Discipline note

Before making the test more complicated, ask:
- am I protecting the real contract?
- am I testing behavior or just internal spelling?
- am I trying to refactor without first capturing current behavior?

## ✅ Pick a rule

- `rules/characterize-before-refactor.md`
- `rules/test-config-contracts.md`
- `rules/test-composition-roots-lightly.md`
- `rules/inject-config-in-tests.md`
- `rules/avoid-brittle-structure-assertions.md`

## Start here if...

### ...you are refactoring existing code
1. `rules/characterize-before-refactor.md`
2. `rules/test-config-contracts.md`

### ...tests are painful because config is hidden
1. `rules/inject-config-in-tests.md`
2. `rules/test-config-contracts.md`

### ...you are testing wiring and boundaries
1. `rules/test-composition-roots-lightly.md`
2. `rules/avoid-brittle-structure-assertions.md`

## What good looks like

A healthy testing setup has:
- characterization before risky refactors
- contract tests around boundaries
- light checks around composition roots
- few assertions against internal file layout or helper names

## Snippets
- `snippets/characterization-test.ts`
- `snippets/config-contract-test.ts`
- `snippets/composition-root-smoke-test.ts`

## References
- `references/testing-boundaries-vs-internals.md`
