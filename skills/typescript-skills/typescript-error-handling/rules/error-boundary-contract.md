---
id: typescript-error-handling.error-boundary-contract
owner: typescript-error-handling
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Hexagonal Architecture edge translation, RFC 9457 Problem Details]
---

# Error Boundary Contract

Decision: **A boundary owns the error shape it exposes**, and translates internal or provider failures once into a stable, safe contract.

Use when:
- **A handler exposes something internal.** A raw message, a stack, a path, a provider code.
- **Equivalent failures produce inconsistent outward shapes.**
- **Domain code carries protocol-specific status or response logic.**
- **A fallback changes behaviour with no observable signal.**

Do:
- **Centralize translation at the boundary**, or at the framework's error hook.
- **Map a stable app code or family to a protocol status and a safe message.**
- **Return a correlation identifier** where support or incident lookup will need one.
- **Keep full internal diagnostics in protected logs or traces**, after redaction.
- **Define what an unknown failure exposes, and fail closed.** The default is what a caller sees on the worst day.

Avoid:
- **Returning the canonical internal object verbatim.**
- **Enumerating provider exceptions across handlers.** That is the boundary leaking inward.
- **Logging and responding independently**, which lets the two disagree about what happened.
- **Swallowing or defaulting** without an owned, visible decision.

Exceptions:
- **A library MAY rethrow its own typed failures** and leave protocol mapping to its consumer.
- **An internal service MAY expose more detail to a trusted caller**, where the trust boundary is explicit.

Example (one instance, not the set):

```ts
// One translator, one place, a safe default for anything unmapped.
function toHttpProblem(error: AppError): HttpProblem {
  return {
    status: statusByCode[error.code] ?? 500,
    code: error.code,
    message: publicMessage(error),
  };
}
```

Verify:
- **Check one translator owns each outward boundary.**
- **Check responses carry no secrets, stacks, internal paths, or vendor payloads.**
- **Check known codes map consistently**, and unknown failures take a safe default.
- **Check internal diagnostics keep both correlation and cause.**
