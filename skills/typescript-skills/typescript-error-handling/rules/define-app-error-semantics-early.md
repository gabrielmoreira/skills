---
id: typescript-error-handling.define-app-error-semantics-early
owner: typescript-error-handling
canonical: true
severity: default
references: [App-level error contract design, RFC 9457 Problem Details, W3C Trace Context, ULID / UUID v7]
---

# Define App Error Semantics Early

Decision: **Settle app-owned error semantics before several modules invent incompatible shapes.** Which fields carry those semantics belongs to `skill://typescript-skills/typescript-error-handling/rules/error-shape-and-metadata.md`.

Use when:
- **Several modules create, classify, log, or expose the same failures.**
- **Ad hoc failure shapes are spreading.** Raw strings, vendor errors, one-off result variants.
- **Required diagnostic or correlation data keeps getting lost** on the way out.
- **A new package needs to exchange failures with an existing one.**

Do:
- **Define stable app-owned `code` values** and a small semantic payload beside them.
- **Scale the contract to its actual consumers.** A script may need only `Error` and `cause`.
- **Keep the runtime `cause` for in-process diagnostics**, and serialize only an explicit safe projection.
- **Add a broad family only when callers branch on it.** Business, validation, infrastructure, security.
- **Make always-required creation data required in the helper**, so it cannot be forgotten.
- **Put a shared contract in a dependency-neutral module** where packages must exchange it.

Avoid:
- **Designing an error framework for a small local script.**
- **Treating any of these as the durable contract.**
  - Subclass identity.
  - Message text.
  - An HTTP status.
  - A vendor code.
- **An optional-everything error object**, which lets a creator omit the context that mattered.
- **Mixing propagation styles casually inside one package.**

Exceptions:
- **A single-module script MAY use `Error` and `cause` alone.** That is the contract, and it is enough.
- **A library MAY expose only codes**, leaving families to the application that consumes it.

Example (one instance, not the set):

```ts
// The whole contract, at the size its consumers need today.
type AppErrorData = {
  code: string;
  message: string;
  details?: unknown;
};

const error = new Error("Charge failed", { cause });
```

- **Add `kind`, correlation data, retry policy, or a protocol projection** only once a caller or a boundary needs it.

Verify:
- **Check the model is no larger than its current consumers require.**
- **Check codes are stable and app-owned**, and causes stay available internally.
- **Check no public projection exposes internal or vendor data.**
- **Check a new module reuses the contract** rather than inventing a parallel one.
