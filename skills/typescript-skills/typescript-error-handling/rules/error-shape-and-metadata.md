---
id: typescript-error-handling.error-shape-and-metadata
owner: typescript-error-handling
canonical: true
severity: default
references: [RFC 7807 Problem Details for HTTP APIs, RFC 9457 (RFC 7807-bis), Microsoft REST API Guidelines (errors), W3C Trace Context, ULID / UUID v7]
---

# Error Shape and Metadata

Decision: Keep the canonical error shape small. Separate the semantic contract from diagnostics, retry information, protocol projections, and the runtime `cause`.

Use when:
- Errors need stable codes or correlation across logs, traces, and responses.
- Modules add unrelated fields at the root.
- Public responses risk leaking internal context.
- Teams disagree about semantic data versus diagnostics.

Do:
- Use app-owned `code` and `message`; use `details` only for semantic payload.
- Retain `cause` internally as the original unknown or `Error`.
- Put correlation, normalized cause summaries, retry policy, and protocol data in named attachments only when needed.
- Generate occurrence identifiers and timestamps at materialization when correlation requires them.
- Project an allowlisted public shape at the boundary.

Avoid:
- A universal metadata bag with unclear ownership.
- Using `message` as a machine-readable discriminator.
- Serializing stack traces, raw causes, request bodies, secrets, or provider payloads.
- Requiring IDs, timestamps, HTTP data, or trace context in code that has no consumer for them.

Example:

```ts
type AppErrorData = {
  code: string;
  message: string;
  details?: unknown;
  metadata?: { errorId: string; occurredAt: string };
};
```

Verify:
- Each field has one owner and one clear consumer.
- Required fields cannot be forgotten by creation helpers.
- Runtime causes remain separate from serialized data.
- Public output is allowlisted and redacted.
