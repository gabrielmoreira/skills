# TypeScript Coding Standards Topic Index

Use this topic for local design quality in owned TypeScript code: names, abstractions, classes, semantic centers, and cutovers.

## Rule Routing

| If you see... | Read |
| --- | --- |
| wrapper, base class, shared helper, interface, manager, adapter-like abstraction | `skill://typescript-skills/typescript-coding-standards/rules/abstraction-and-local-reasoning.md` |
| class proposed for stateless behavior | `skill://typescript-skills/typescript-coding-standards/rules/functions-vs-classes.md` |
| confusing name, leaked implementation word, hidden important branch | `skill://typescript-skills/typescript-coding-standards/rules/naming-and-semantic-center.md` |
| old and new implementations coexisting | `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md` |
| `!`, `as`, `as unknown as`, `as any`, `@ts-ignore`, non-null assertion, forced type | `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md` |
| blank-line groups in a function, comment labels, long function, mixed levels of abstraction, extraction question, reader must jump up/down through helpers | `skill://typescript-skills/typescript-coding-standards/rules/vertical-discipline.md` |
| same-shape primitives mixed (UserId vs OrderId), validated value losing its proof | `skill://typescript-skills/typescript-coding-standards/rules/branded-and-opaque-types.md` |
| switch on union without `default: never`, "what if a new variant is added", silent fallback | `skill://typescript-skills/typescript-coding-standards/rules/exhaustive-narrowing.md` |
| function copy-pasted per type, generic with `any`, conditional/mapped type question | `skill://typescript-skills/typescript-coding-standards/rules/generics-and-conditional-types.md` |

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

- Provider/SDK model translation: read `skill://typescript-skills/typescript-boundaries/INDEX.md`.
- Dependency lifecycle and runtime selection: read `skill://typescript-skills/typescript-composition/INDEX.md`.
- Config parsing and defaults: read `skill://typescript-skills/typescript-configs/INDEX.md`.
- Tests for behavior/contracts: read `skill://typescript-skills/typescript-testing/INDEX.md`.
- Type guard and schema validation details beyond the assertion gate: use TypeScript handbook or schema library docs.

## Default

Preserve local reasoning. Add structure only when it removes more confusion than it creates.
