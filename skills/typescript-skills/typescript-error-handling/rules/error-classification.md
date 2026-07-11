---
id: typescript-error-handling.error-classification
owner: typescript-error-handling
canonical: true
severity: default
references: [Errors are values (Go), Failure modes (resilience engineering), Who can fix it? (Lubu-Labs/langgraph-error-handling), Smithbox-ai/ControlFlow error taxonomy]
---

# Error Classification

Decision: Classify failures by semantic family (`kind`) and by explicit retry mode. Use `kind` for broad meaning (`business`, `infra`, `security`, `validation`), `code` for the stable, specific identifier, and `retry` to distinguish between no retry, retry after modification/remediation, and retry with backoff. In class-based projects, family wrappers such as `BusinessError`, `InfraError`, `SecurityError`, and `ValidationError` are the default runtime wrappers. More specific subclasses are allowed when they add clear local value, but the boundary should still translate by family and stable `code`, not by enumerating every subclass.

Use when:
- A caller asks "should I retry this?" and the code cannot answer, or a retry loop retries everything including caller errors (4xx retried 3 times).
- A new error type was added but the boundary still falls through to a generic `500`.
- An incident review reveals an error was classified by technical origin instead of semantic meaning.
- Two services use different ad-hoc codes for the same logical failure.

Do:
- Classify every app-owned error with a broad semantic family and a stable `code`; treat `code` as the fine-grained contract and `kind` as the broad family.
- Treat retry as a deliberate classification output, not an implementation accident — distinguish backoff retry, retry after modification/remediation, and no retry.
- Wrap third-party throws into your own classification at the adapter boundary; preserve runtime `cause` when wrapping so later diagnostics can still inspect the original failure, and keep normalized cause data on the canonical shape.
- Let the boundary translate by family-level wrapper or `kind`, not by concrete subclass names or message matching.

Do (Class-based — recommended default):
- Define family wrappers as the default runtime hierarchy; use `instanceof BusinessError` / `InfraError` / `SecurityError` / `ValidationError` at the boundary.
- Allow `OrderNotFoundError`-style subclasses when they improve local clarity, but do not require them for every `code`; keep cross-package contracts on canonical error data and stable `code`, not subclass identity.

Do (Result-based — when the project chose this style):
- Carry the same classification axes in the error data: `kind`, `code`, `retry`. Treat the discriminated error data as the contract; new variants should force explicit consumer handling.

Avoid:
- Classifying only by technical origin (`came from HTTP`, `came from Stripe`, `came from Postgres`) — downstream failures can still be `security`, `validation`, or `business`, not only `infra`.
- Throwing a generic `Error` from domain code for known failure modes.
- Treating all errors as retryable, or none as retryable, or collapsing caller-fixable, remediation-needed, and backoff-retryable failures into one vague `retryable` bucket.
- Making subclass identity the only way to understand an error across packages; boundary code string-matching `message` or enumerating every specific subclass.

Exceptions:
- Top-level process handlers may catch broadly to translate unknown errors to a default `500`; a genuinely unknown library error may be classified as a generic infra failure and alerted.
- One-file scripts may stay on plain `Error`; a local subsystem may choose a few specific subclasses if they do not become the shared contract.

Example — family wrappers are the default hierarchy; origin alone doesn't decide `kind`; boundary reads family, not subclass:

```ts
// core/errors — shared package, no reverse deps.
export abstract class BusinessError extends AppError {}
export abstract class InfraError extends AppError {
  readonly retry = { allowed: true };
}
export abstract class SecurityError extends AppError {}
export abstract class ValidationError extends AppError {}

// A specific subclass may still be added locally when it helps.
export class OrderNotFoundError extends BusinessError {
  readonly code = "order.not_found";
  constructor(public readonly orderId: string) {
    super({ kind: "business", code: "order.not_found", message: "order not found", details: { orderId }, retry: { allowed: false } });
  }
}

// All three came from downstream HTTP calls, but origin alone doesn't decide `kind`.
const unavailable         = { kind: "infra",    code: "payments.unavailable",    retry: { allowed: true } };
const tokenExpired        = { kind: "security", code: "oauth.token_expired",     retry: { allowed: false } };
const customerIneligible  = { kind: "business", code: "customer.not_eligible",   retry: { allowed: false } };

// Boundary translation reads the family/kind, never every subclass.
if (e instanceof ValidationError) return /* 400 */;
if (e instanceof BusinessError)   return /* 4xx */;
if (e instanceof SecurityError)   return /* 401/403 */;
if (e instanceof InfraError)      return e.retry.allowed ? /* 503 */ : /* 500 */;
return /* 500 + synthesized errorId */;

// Result-based: same axes as structured error data.
type AppErrorShape = {
  kind: "business" | "infra" | "security" | "validation";
  code: string;
  retry?: { allowed?: boolean; mode?: "backoff" | "after_remediation" | "none" };
};
```

Verify:
- Every app-owned error has a broad semantic family and a stable `code`; retry decisions read explicit retry classification, not ad hoc transport heuristics.
- Adapter boundaries wrap third-party errors into app-owned classification, preserving cause for diagnostics.
- Boundary translation reads family-level wrappers or `kind`, not specific subclass names or message strings.
- Cross-package contracts do not depend on every consumer importing the same specific subclass; Result-based equivalents preserve the same classification axes.
