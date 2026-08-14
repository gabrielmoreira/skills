# TypeScript Error Handling Topic Index

**Use this topic when a system needs failure semantics that stay stable across modules and boundaries.**

**Scale the model to the application.** A small script may need only `Error` and `cause`. Shared codes, families, metadata, and projections are earned when callers actually need them.

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **One rule per row.** Enter at the matched row.
- **Semantics against shape.** Semantics decides what a failure means. Shape decides which fields carry it.
- **Classification against boundary.** Classification decides what a caller may do. The boundary decides what the outside world sees.

| If you see... | Read |
| --- | --- |
| modules inventing incompatible errors or losing required context | `skill://typescript-skills/typescript-error-handling/rules/define-app-error-semantics-early.md` |
| choosing throw versus returned failure | `skill://typescript-skills/typescript-error-handling/rules/throw-vs-result.md` |
| retryability, swallowing, or silent fallback | `skill://typescript-skills/typescript-error-handling/rules/error-classification.md` |
| unstable codes, correlation, details, metadata, or cause ownership | `skill://typescript-skills/typescript-error-handling/rules/error-shape-and-metadata.md` |
| provider or internal error leaking through a handler | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` |

**Default stance for a non-trivial application.**

- **One app-owned semantic shape, and one propagation style per package.**
- **Prefer a stable code over class identity.**
- **Keep runtime causes for diagnostics, and translate at the boundary.**
- **Keep every swallow and every fallback observable.**

**Edges.**

- **Retry mechanics belong to async.** This topic only decides what is retryable.
- **Redaction belongs to security.**
- **Which failures a test must prove belongs to testing.**
