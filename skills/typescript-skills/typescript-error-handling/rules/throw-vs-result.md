---
id: typescript-error-handling.throw-vs-result
owner: typescript-error-handling
canonical: true
severity: default
references: [Java/C# checked exceptions critique, Result/Either type (Rust, Scala, fp-ts), Errors are values (Go), Effect.ts, neverthrow]
---

# Throw vs Result

Decision: Follow the package's established propagation style. Use exceptions for APIs built around throwing and Result-like values when expected failures are part of ordinary control flow. Translate once where styles meet.

Use when:
- A new fallible API has no visible local convention.
- Throw and Result are mixed without a boundary.
- Consumers need typed expected failures.
- `null` or `undefined` hides distinct failure reasons.

Do:
- Inspect callers, framework conventions, and neighboring packages first.
- Keep one default within a coherent package or surface.
- Use discriminated results for expected outcomes callers routinely branch on.
- Preserve `cause`, codes, and classification in either style.
- Throw programmer errors and broken invariants rather than treating them as ordinary results.

Avoid:
- Introducing a Result library for one isolated function.
- Returning `Result<T, Error>` without useful failure semantics.
- Catching only to wrap without adding context, classification, or translation.
- Converting an entire codebase only for stylistic consistency.

Example:

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Verify:
- Callers handle every expected Result branch.
- Thrown failures reach one intentional boundary.
- Cross-style translation happens once.
- The chosen style matches local ecosystem and consumer expectations.
