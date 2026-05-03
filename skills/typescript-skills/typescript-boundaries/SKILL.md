---
name: typescript-boundaries
description: Provides rules for TypeScript boundaries between raw inputs and local models, provider semantics and local meaning, host concerns and application concerns, and translation at the edge. Use when external shapes are leaking too far into owned code.
---

# TypeScript Boundaries

Use this skill when the code sounds more like the provider, transport, or framework than like the app itself.

This skill focuses on:
- translating external shapes at the edge
- keeping local meaning visible
- stopping provider or transport types from becoming local law

## Boundary questions

Ask these first:
- Is this still raw input, or is it already a local model?
- Does this name help the app reader, or only the provider reader?
- Is this mapper protecting a real mismatch, or only adding ceremony?

## ✅ Pick a rule

- `rules/translate-foreign-semantics-at-the-edge.md`
- `rules/raw-input-vs-internal-model.md`
- `rules/name-local-models-by-local-meaning.md`
- `rules/avoid-provider-types-deep-in-owned-code.md`
- `rules/boundary-mapping-only-when-earned.md`

## Start here if...

### ...provider names or DTOs are leaking inward
1. `rules/translate-foreign-semantics-at-the-edge.md`
2. `rules/avoid-provider-types-deep-in-owned-code.md`

### ...you are unsure what the internal model should look like
1. `rules/raw-input-vs-internal-model.md`
2. `rules/name-local-models-by-local-meaning.md`

### ...you are adding another mapper layer
1. `rules/boundary-mapping-only-when-earned.md`
2. `rules/translate-foreign-semantics-at-the-edge.md`

## What good looks like

A healthy boundary has:
- raw input at the edge
- a smaller local model inside
- names that make sense without provider docs
- translation only where it protects something real

## Snippets
- `snippets/map-dto-to-local-model.ts`
- `snippets/translate-provider-enum.ts`
- `snippets/boundary-adapter.ts`

## References
- `references/boundary-glossary.md`
- `references/provider-vs-domain-language.md`
- `references/before-after-mappings.md`
