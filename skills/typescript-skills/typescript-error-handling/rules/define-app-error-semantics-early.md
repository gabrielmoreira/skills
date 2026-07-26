---
id: typescript-error-handling.define-app-error-semantics-early
owner: typescript-error-handling
canonical: true
severity: default
references: [App-level error contract design, RFC 9457 Problem Details (obsoletes RFC 7807), W3C Trace Context, ULID / UUID v7]
---

# Define App Error Semantics Early

Decision: Establish app-owned error semantics before multiple modules invent incompatible shapes. Scale the contract to actual consumers: a script may need only `Error` and `cause`; stable codes, families, metadata, and projections are earned by cross-module or boundary needs.

Use when:
- Several modules create, classify, log, or expose the same failures.
- Raw strings, vendor errors, or ad hoc Result variants are spreading.
- Required diagnostic or correlation data is repeatedly lost.

Do:
- Define stable app-owned `code` values and a small semantic payload.
- Keep runtime `cause` for in-process diagnostics; serialize only an explicit safe projection.
- Add broad families such as business, validation, infrastructure, or security only when callers branch on them.
- Make always-required creation data required in helpers.
- Place a shared contract in a dependency-neutral module when packages must exchange it.

Avoid:
- Designing an error framework for a small local script.
- Treating subclass identity, message text, HTTP status, or vendor codes as the durable domain contract.
- An optional-everything error object that lets creators omit essential context.
- Mixing propagation styles casually inside one package.

Example:

```ts
type AppErrorData = {
  code: string;
  message: string;
  details?: unknown;
};

const error = new Error("Charge failed", { cause });
```

Add `kind`, correlation data, retry policy, or protocol projections only when a caller or boundary needs them.

Verify:
- The model is no larger than its current consumers require.
- Codes are stable and app-owned; causes remain available internally.
- Public projections do not expose internal or vendor data.
- New modules reuse the contract instead of inventing parallel shapes.
