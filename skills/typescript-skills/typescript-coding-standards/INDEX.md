# TypeScript Coding Standards Topic Index

**Use this topic for local design quality in owned code.** Preserve the repository's conventions unless a rule protects a stronger correctness or safety invariant.

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **Enter at the matched row, and read a second where the code matches two.** Say which of them owns the decision and why the other applies. What costs is reading every row, not reading two.
- **Each rule declares its own weight.** A hard gate fails the change, a default is the expected choice, and an advisory rule loses to an established local convention.

**Discriminators.**

- **Abstraction against vertical discipline.** Abstraction decides whether a thing should exist. Vertical discipline decides where it sits and how the flow reads afterwards.
- **Narrowing against branding.** Narrowing proves a value is what it claims to be. Branding stops two values of the same shape being swapped for each other.
- **Branding against exhaustive narrowing.** Branding is for the same shape with different meaning. Exhaustive narrowing is for a tagged variant.
- **Abstraction against functions-versus-classes.** Abstraction decides whether to add a unit. Functions-versus-classes decides which kind of unit it is.
- **Naming against cutovers.** Naming owns what a thing is called. Cutovers owns how long the old name survives.
- **Absence against the edge.** Where the missing value arrived from outside, both apply: the contract it broke is boundaries, the meaning of its absence is here. Read the edge first, then decide what absence means.
- **Absence against narrowing.** Absence decides what a missing value means and what stands in for it. Narrowing decides how a value is proved to be what it claims.
- **Imports against cutovers.** Imports own whether the dependency list is true today. Cutovers owns how long an old path is allowed to remain.
- **Generics against exhaustive narrowing.** Generics keep one shape flowing through. Exhaustive narrowing handles several shapes that must each be answered.

| If you see... | Read |
| --- | --- |
| wrapper, base class, manager, shared helper, premature abstraction | `skill://typescript-skills/typescript-coding-standards/rules/abstraction-and-local-reasoning.md` |
| function-versus-class question | `skill://typescript-skills/typescript-coding-standards/rules/functions-vs-classes.md` |
| confusing name or hidden semantic center | `skill://typescript-skills/typescript-coding-standards/rules/naming-and-semantic-center.md` |
| old and new implementations coexisting | `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md` |
| assertion, non-null assertion, forced type, suppression | `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md` |
| nullish coalescing against logical or, optional chaining, possibly-undefined, an optional field | `skill://typescript-skills/typescript-coding-standards/rules/absence-and-defaults.md` |
| unused import, unresolved module, missing export, `require` in an ESM file, deep package path | `skill://typescript-skills/typescript-coding-standards/rules/imports-and-module-graph.md` |
| long function, mixed abstraction levels, extraction question | `skill://typescript-skills/typescript-coding-standards/rules/vertical-discipline.md` |
| same-shape domain primitives or validated values | `skill://typescript-skills/typescript-coding-standards/rules/branded-and-opaque-types.md` |
| discriminated union completeness | `skill://typescript-skills/typescript-coding-standards/rules/exhaustive-narrowing.md` |
| generic, conditional, or mapped type question | `skill://typescript-skills/typescript-coding-standards/rules/generics-and-conditional-types.md` |

**Default stance.**

- **Preserve local reasoning.** A reader should follow the flow without holding the whole system in mind.
- **Add structure only where it removes more confusion than it creates.**
- **Keep the repository's conventions** unless a rule protects a stronger invariant.
- **Say what a missing value means** before choosing what stands in for it.

**Edges.**

- **Naming something that came from a provider belongs to boundaries.**
- **Which dependency is assembled, and when, belongs to composition.**
- **What a failure means to a caller belongs to error handling.**
- **Parsing untrusted input at the edge belongs to boundaries.**
- **A promise nobody awaits belongs to async.** This topic owns the shape of owned code, not the coordination of asynchronous work.
- **How a change is proved belongs to testing.**
