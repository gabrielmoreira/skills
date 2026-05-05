---
name: typescript-coding-standards
description: Use when TypeScript work involves naming, abstractions, classes, local reasoning, semantic centers, full cutovers, type assertions, or design cleanup.
---

# TypeScript Coding Standards

Use this skill for local design quality in owned TypeScript code: names, abstractions, classes, semantic centers, and cutovers.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| wrapper, base class, shared helper, interface, manager, adapter-like abstraction | `rules/abstraction-and-local-reasoning.md` |
| class proposed for stateless behavior | `rules/functions-vs-classes.md` |
| confusing name, leaked implementation word, hidden important branch | `rules/naming-and-semantic-center.md` |
| old and new implementations coexisting | `rules/cutovers.md` |
| `!`, `as`, `as unknown as`, `as any`, `@ts-ignore`, non-null assertion, forced type | `rules/type-narrowing-over-assertion.md` |
| blank-line groups in a function, comment labels, long function, mixed levels of abstraction, extraction question, reader must jump up/down through helpers | `rules/vertical-discipline.md` |
| same-shape primitives mixed (UserId vs OrderId), validated value losing its proof | `rules/branded-and-opaque-types.md` |
| switch on union without `default: never`, "what if a new variant is added", silent fallback | `rules/exhaustive-narrowing.md` |
| function copy-pasted per type, generic with `any`, conditional/mapped type question | `rules/generics-and-conditional-types.md` |

## Owns

- Abstraction cost and local reasoning.
- Function vs class defaults.
- Names in owned code.
- Clean cutover policy.
- Type narrowing over assertion as hard gate.
- Branded types and nominal typing for domain primitives.
- Exhaustive narrowing of discriminated unions.
- Generics, conditional types, and mapped types — when each earns itself.

- Vertical discipline: comment labels first, then extraction by responsibility.
## Does Not Own

- Provider/SDK model translation: use `../typescript-boundaries/SKILL.md`.
- Dependency lifecycle and runtime selection: use `../typescript-composition/SKILL.md`.
- Config parsing and defaults: use `../typescript-configs/SKILL.md`.
- Tests for behavior/contracts: use `../typescript-testing/SKILL.md`.
- Type guard and schema validation details beyond the assertion gate: use TypeScript handbook or schema library docs.

## Default

Preserve local reasoning. Add structure only when it removes more confusion than it creates.
