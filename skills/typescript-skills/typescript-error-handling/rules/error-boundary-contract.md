---
id: typescript-error-handling.error-boundary-contract
owner: typescript-error-handling
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Hexagonal Architecture edge translation, RFC 9457 Problem Details (obsoletes RFC 7807), GraphQL error extensions]
---

# Error Boundary Contract

Decision: A boundary owns the error shape it exposes. Translate internal or provider failures once into a stable, safe contract for HTTP, GraphQL, RPC, jobs, CLIs, or library consumers.

Use when:
- Handlers expose raw messages, stacks, paths, or provider codes.
- Equivalent failures produce inconsistent outward shapes.
- Domain code contains protocol-specific status or response logic.
- A fallback changes behavior without an observable signal.

Do:
- Centralize translation at the boundary or framework error hook.
- Map stable app codes or families to protocol status and safe messages.
- Return a correlation identifier when operations need support or incident lookup.
- Preserve full internal diagnostics in protected logs or traces after redaction.
- Define what unknown failures expose and fail closed.

Avoid:
- Returning the canonical internal object verbatim.
- Enumerating provider exceptions throughout handlers.
- Logging and responding independently with different classification.
- Swallowing or defaulting without an explicit owned decision.

Example:

```ts
function toHttpProblem(error: AppError): HttpProblem {
  return {
    status: statusByCode[error.code] ?? 500,
    code: error.code,
    message: publicMessage(error),
  };
}
```

Verify:
- One translator owns each outward boundary.
- Responses contain no secrets, stack traces, internal paths, or vendor payloads.
- Known codes map consistently; unknown failures use a safe default.
- Internal diagnostics retain correlation and cause.
