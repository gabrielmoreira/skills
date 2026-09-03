---
id: typescript-error-handling.throw-vs-result
owner: typescript-error-handling
canonical: true
severity: default
references: [Result/Either type (Rust, Scala, fp-ts), Errors are values (Go), Effect.ts, neverthrow]
---

# Throw vs Result

Decision: **Follow the propagation style the package already has.** Exceptions where the API is built around throwing, a result value where expected failures are ordinary control flow, and one translation where the two styles meet.

Use when:
- **A new fallible API has no visible local convention.**
- **Throw and result are mixed** with no boundary between them.
- **Consumers need typed expected failures.**
- **`null` or `undefined` is hiding several distinct failure reasons.**

Do:
- **Look at callers, framework conventions, and neighbouring packages first.**
- **Keep one default within a coherent package or surface.**
- **Return a Result/Either type where callers routinely branch on it.**
- **Preserve cause, code, and classification in either style.** The style changes the channel, not the content.
- **Throw for a programmer error or a broken invariant**, rather than returning it as an ordinary result.

Avoid:
- **Introducing a result library for one isolated function.**
- **`Result<T, Error>` with no useful failure semantics.** That is a throw with extra steps.
- **Catching only to rewrap**, with no context, classification, or translation added.
- **Converting a whole codebase for stylistic consistency alone.**

Exceptions:
- **A boundary MAY convert between styles**, and that is exactly where it should happen.
- **A framework's own convention wins** inside code that framework calls.

Example (one instance, not the set):

```ts
// A result is worth it when callers branch on the failure, not merely observe it.
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Verify:
- **Check callers handle every expected branch.**
- **Check thrown failures reach one intentional boundary.**
- **Check cross-style translation happens once**, not at every hop.
- **Check the chosen style matches the local ecosystem** and what consumers expect.
