# TypeScript Coding Standards Topic Index

Use for local design quality in owned TypeScript code. Preserve repository conventions unless a rule protects a stronger correctness or safety invariant.

| If you see... | Read |
| --- | --- |
| wrapper, base class, manager, shared helper, premature abstraction | `skill://typescript-skills/typescript-coding-standards/rules/abstraction-and-local-reasoning.md` |
| function-versus-class question | `skill://typescript-skills/typescript-coding-standards/rules/functions-vs-classes.md` |
| confusing name or hidden semantic center | `skill://typescript-skills/typescript-coding-standards/rules/naming-and-semantic-center.md` |
| old and new implementations coexisting | `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md` |
| assertion, non-null assertion, `@ts-ignore`, forced type | `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md` |
| long function, mixed abstraction levels, extraction question | `skill://typescript-skills/typescript-coding-standards/rules/vertical-discipline.md` |
| same-shape domain primitives or validated values | `skill://typescript-skills/typescript-coding-standards/rules/branded-and-opaque-types.md` |
| discriminated union completeness | `skill://typescript-skills/typescript-coding-standards/rules/exhaustive-narrowing.md` |
| generic, conditional, or mapped type question | `skill://typescript-skills/typescript-coding-standards/rules/generics-and-conditional-types.md` |

Default: preserve local reasoning. Add structure only when it removes more confusion than it creates.
