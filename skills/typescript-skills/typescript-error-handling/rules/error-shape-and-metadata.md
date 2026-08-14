---
id: typescript-error-handling.error-shape-and-metadata
owner: typescript-error-handling
canonical: true
severity: default
references: [RFC 9457 Problem Details, W3C Trace Context, ULID / UUID v7]
---

# Error Shape and Metadata

Decision: **Keep the canonical error shape small**, and separate the semantic contract from diagnostics, retry information, protocol projections, and the runtime cause. What those semantics mean belongs to `skill://typescript-skills/typescript-error-handling/rules/define-app-error-semantics-early.md`.

Use when:
- **Errors need a stable code or correlation** across logs, traces, and responses.
- **Modules keep adding unrelated fields at the root.**
- **A public response risks leaking internal context.**
- **People disagree about what is semantic data and what is diagnostics.**

Do:
- **Use an app-owned `code` and `message`**, and keep `details` for semantic payload only.
- **Retain `cause` internally**, as the original error or unknown value.
- **Put the rest in named attachments, and only when needed.**
  - Correlation.
  - A normalized cause summary.
  - Retry policy.
  - Protocol projection.
- **Generate an occurrence identifier and timestamp at materialization**, where correlation requires them.
- **Project an allowlisted public shape at the boundary.**

Avoid:
- **A universal metadata bag** that nobody owns and everybody writes to.
- **Using `message` as a machine-readable discriminator.** It is the field most likely to be reworded.
- **Serializing a stack, a raw cause, a request body, a secret, or a provider payload.**
- **Requiring IDs, timestamps, or trace context** in code that has no consumer for them.

Exceptions:
- **A single-process tool MAY keep everything on one object.** There is no boundary to protect.
- **An attachment MAY be required** where a boundary genuinely always needs it, such as correlation on a public API.

Example (one instance, not the set):

```ts
// Semantic contract at the root; everything else in a named attachment.
type AppErrorData = {
  code: string;
  message: string;
  details?: unknown;
  metadata?: { errorId: string; occurredAt: string };
};
```

Verify:
- **Check each field has one owner and one clear consumer.**
- **Check a creation helper cannot omit a required field.**
- **Check the runtime cause stays out of serialized data.**
- **Check public output is allowlisted and redacted.**
