---
id: typescript-coding-standards.naming-and-semantic-center
owner: typescript-coding-standards
canonical: true
severity: advisory
references: [Ubiquitous Language (DDD), Intention-Revealing Names (Clean Code)]
---

# Naming and Semantic Center

Decision: **Name code for what the reader needs at the callsite, and keep the decision that matters visible there.** This rule owns general naming in owned code. Renaming something that came from a provider belongs to `skill://typescript-skills/typescript-boundaries/rules/local-naming.md`.

Use when:
- **A name describes the implementation instead of the meaning.**
- **A boolean, mode, status, or branch hides the behaviour that matters.**
- **A reader must open several helpers** to learn what the code really does.
- **Local code uses provider or framework words** that are not the local meaning.

Do:
- **Name by local meaning, the caller's promise, or the policy** it enforces.
- **Put the important conditional where the reader naturally looks**, not two helpers down.
- **Prefer a specific name over a role word.** `handle`, `process`, `manage`, and `data` say nothing.
- **Keep a name stable while it describes meaning** rather than the current implementation.

Avoid:
- **A name that only repeats the type.**
- **A provider's word where local semantics differ.**
- **Hiding the domain decision behind a chain of generic helpers.**
- **An abbreviation that needs private context to expand.**

Exceptions:
- **Preserve external field names at an edge module**, where matching the wire shape is the point.
- **Keep the standard vocabulary** where the ecosystem's term is clearer than a local invention.

Example (one instance, not the set):

```ts
// Bad: the name reports the mechanism, and the decision is invisible.
function processData(input: Order[], flag: boolean) { /* ... */ }

// Good: the name carries the promise, and the branch names its own behaviour.
function selectShippableOrders(orders: Order[], includeBackordered: boolean) { /* ... */ }
```

Verify:
- **Ask what a tired maintainer would infer** from the name alone, without opening it.
- **Check the name stays true if the implementation changes.**
- **Where a branch changes behaviour, check its name exposes the difference.**
