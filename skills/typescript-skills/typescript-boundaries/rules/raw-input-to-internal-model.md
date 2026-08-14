---
id: typescript-boundaries.raw-input-to-internal-model
owner: typescript-boundaries
canonical: true
severity: hard-gate
references: [Anti-Corruption Layer (DDD), Parse don't validate]
---

# Raw Input to Internal Model

Decision: **Parse and narrow raw input at the boundary before any owned behaviour depends on it.** This rule owns transport shapes, env-like input, webhook payloads, CLI args, and untyped JSON. Vendor and generated types belong to `skill://typescript-skills/typescript-boundaries/rules/provider-containment.md`.

Use when:
- **Untrusted data is being passed inward.**
  - A request body, query, or headers.
  - A webhook payload.
  - CLI args or env-like input.
  - Untyped JSON.
- **Code trusts `unknown`, `any`, or a stringly typed field.**
- **Code trusts an external optional field** without deciding what its absence means.
- **Internal behaviour keeps re-checking raw transport detail.**

Do:
- **Treat raw input as untrusted until it has been parsed.**
- **Produce a small internal model** that makes requiredness, types, and failure shape explicit.
- **Keep transport names and optionality at the edge**, unless they genuinely are the local meaning.
- **Return or throw something a caller can tell apart from success.**

Avoid:
- **Passing `req.body`, raw JSON, or an unparsed payload into business logic.**
- **Using `as`, a non-null assertion, or a comment to claim validity.** None of them check anything.
- **Normalising different input shapes deep inside owned behaviour.**
- **Returning a plausible default when parsing actually failed.**

Exceptions:
- **A pass-through proxy MAY preserve the raw shape** where it does not interpret it. Name it as pass-through.
- **A characterization test MAY capture raw legacy behaviour** before a migration.

Example (one instance, not the set):

```ts
// Bad: the assertion claims a guarantee nothing checked.
export function handle(req: Request) {
  const order = req.body as CreateOrder;
  return createOrder(order);
}

// Good: parse at the edge, and let failure be visible.
export function handle(req: Request) {
  const parsed = parseCreateOrder(req.body);
  if (!parsed.ok) return badRequest(parsed.issues);
  return createOrder(parsed.value);
}
```

Verify:
- **Search for raw request, response, or env objects outside boundary modules.**
- **Check parser tests cover four cases.**
  - Valid input.
  - Invalid input.
  - A missing required field.
  - The failure shape itself.
- **Check behaviour code accepts an owned type**, never raw transport.
