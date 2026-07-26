# TypeScript Error Handling Topic Index

Use when a TypeScript system needs stable failure semantics across modules or boundaries. Scale the model to the application: a small script may need only `Error` and `cause`; shared codes, families, metadata, and projections should appear when callers require them.

| If you see... | Read |
| --- | --- |
| modules inventing incompatible errors or losing required context | `skill://typescript-skills/typescript-error-handling/rules/define-app-error-semantics-early.md` |
| choosing throw versus returned failure | `skill://typescript-skills/typescript-error-handling/rules/throw-vs-result.md` |
| retryability, swallowing, or silent fallback | `skill://typescript-skills/typescript-error-handling/rules/error-classification.md` |
| unstable codes, correlation, details, metadata, or cause ownership | `skill://typescript-skills/typescript-error-handling/rules/error-shape-and-metadata.md` |
| provider or internal error leaking through a handler | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` |

Default for a non-trivial application: use one app-owned semantic shape and one propagation style per package. Prefer stable codes over class identity, retain runtime causes for diagnostics, translate at boundaries, and keep swallow or fallback decisions observable. Add families or attachments only when they carry a real contract.

Retry mechanics belong to async; redaction belongs to security.
