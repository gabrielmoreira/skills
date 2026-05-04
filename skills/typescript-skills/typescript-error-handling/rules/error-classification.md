---
id: typescript-error-handling.error-classification
owner: typescript-error-handling
canonical: true
severity: default
references: [Errors are values (Go), Failure modes (resilience engineering), Who can fix it? (Lubu-Labs/langgraph-error-handling), Smithbox-ai/ControlFlow error taxonomy]
---

# Error Classification

Decision: Classify failures by semantic family (`kind`) and by whether retry can help. Use `kind` for broad meaning (`business`, `infra`, `security`, `validation`) and `code` for the stable, specific identifier. In class-based projects, family wrappers such as `BusinessError`, `InfraError`, `SecurityError`, and `ValidationError` are the default runtime wrappers. More specific subclasses are allowed when they add clear local value, but the boundary should still translate by family and stable `code`, not by enumerating every subclass.

Use when:
- A caller asks "should I retry this?" and the code cannot answer.
- A retry loop retries everything, including caller errors, and 4xx errors get retried 3 times.
- A new error type was added but the boundary still falls through to generic `500`.
- An incident review reveals an error was classified by technical origin instead of semantic meaning.
- Two services use different ad-hoc codes for the same logical failure.

Start here:
- Decide the classification axes at the project level: broad `kind`, stable `code`, and whether retry is allowed.
- Prefer family wrappers (`BusinessError`, `InfraError`, `SecurityError`, `ValidationError`) as the default runtime wrappers.
- Add more specific subclasses only when they make local code clearer and do not create package coupling.
- The boundary asks the family wrapper or the root data (`kind`, `retry`), not each specific subclass.

Escalate when:
- A third family appears that the boundary truly treats differently — add it deliberately instead of overloading `business` or `infra`.
- Validation failures need field-level detail — carry it in semantic `details` or a validation-focused subclass/factory.
- The codebase has many specific error classes — keep them grouped by feature module, but rooted in `core/errors` or canonical error data.
- Result-based projects need the same classification semantics — mirror `kind`, `code`, and retry fields in the error data.

Complexity ladder:
1. Plain `Error` everywhere (small script).
2. Canonical error data with `kind` + `code`.
3. Family wrappers: `AppError` → `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`.
4. A few local subclasses where they materially improve readability.
5. Shared `core/errors` package for multi-team, multi-package systems.
6. Result-based equivalent: discriminated error data with the same classification axes.

Do:
- Classify every app-owned error with a broad semantic family and a stable `code`.
- Treat `code` as the fine-grained contract and `kind` as the broad family.
- Treat retryability as a deliberate classification output, not an implementation accident.
- Wrap third-party throws into your own classification at the adapter boundary.
- Let the boundary translate by family-level wrapper or `kind`, not by concrete subclass names.
- Preserve `cause` when wrapping so observed failure signals remain available for diagnostics.

Do (Class-based — recommended default):
- Define family wrappers as the default runtime hierarchy.
- Use `instanceof BusinessError` / `InfraError` / `SecurityError` / `ValidationError` at the boundary.
- Allow `OrderNotFoundError`-style subclasses when they improve local clarity, but do not require them for every `code`.
- Keep cross-package contracts on canonical error data and stable `code`, not subclass identity.

Do (Result-based — when the project chose this style):
- Carry the same classification axes in the error data: `kind`, `code`, `retry`.
- Treat the discriminated error data as the contract; new variants should force explicit consumer handling.

Avoid:
- Classifying only by technical origin (`came from HTTP`, `came from Stripe`, `came from Postgres`).
- Assuming every downstream failure is `infra`; downstream failures can still be `security`, `validation`, or `business`.
- Throwing a generic `Error` from domain code for known failure modes.
- Treating all errors as retryable, or none as retryable.
- Making subclass identity the only way to understand an error across packages.
- Boundary code string-matching `message` or enumerating every specific subclass.

Exceptions:
- Top-level process handlers may catch broadly to translate unknown errors to a default `500`.
- A genuinely unknown library error may be classified as a generic infra failure and alerted.
- One-file scripts may stay on plain `Error`.
- A local subsystem may choose a few specific subclasses if they do not become the shared contract.

Example:

[Class-based] Family wrappers are the default hierarchy:

```ts
// core/errors/index.ts — shared package, no reverse deps allowed.
import { AppError } from "core/errors/app-error";

export abstract class BusinessError extends AppError {}

export abstract class InfraError extends AppError {
  readonly retry = { allowed: true };
}

export abstract class SecurityError extends AppError {}
export abstract class ValidationError extends AppError {}
```

A project may still add a specific subclass when it helps locally:

```ts
import { BusinessError } from "core/errors";

export class OrderNotFoundError extends BusinessError {
  readonly code = "order.not_found";

  constructor(public readonly orderId: string) {
    super({
      kind: "business",
      code: "order.not_found",
      message: "order not found",
      details: { orderId },
      http: { status: 404 },
      retry: { allowed: false },
    });
  }
}
```

Downstream origin does not decide semantic family by itself:

```ts
// All three errors came from downstream HTTP calls, but they classify differently.
const unavailable = {
  kind: "infra",
  code: "payments.unavailable",
  message: "payment provider unavailable",
  retry: { allowed: true },
};

const tokenExpired = {
  kind: "security",
  code: "oauth.token_expired",
  message: "oauth token expired",
  retry: { allowed: false },
};

const customerIneligible = {
  kind: "business",
  code: "customer.not_eligible",
  message: "customer is not eligible",
  retry: { allowed: false },
};
```

Boundary translation should read the family, not every subclass:

```ts
if (e instanceof ValidationError) return /* 400 */;
if (e instanceof BusinessError)   return /* 4xx */;
if (e instanceof SecurityError)   return /* 401/403 */;
if (e instanceof InfraError)      return e.retry.allowed ? /* 503 */ : /* 500 */;
if (e instanceof AppError)        return /* 500 */;
return /* 500 + synthesized errorId */;
```

[Result-based] Same axes as structured error data:

```ts
type AppErrorShape = {
  kind: "business" | "infra" | "security" | "validation";
  code: string;
  retry?: { allowed?: boolean };
};

type Result<T, E extends AppErrorShape> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Verify:
- Every app-owned error has a broad semantic family and a stable `code`.
- Adapter boundaries wrap third-party errors into app-owned classification.
- Boundary translation reads family-level wrappers or `kind`, not specific subclass names.
- Retry decisions read explicit retry classification, not ad hoc transport heuristics.
- Cross-package contracts do not depend on every consumer importing the same specific subclass.
- Result-based equivalents preserve the same classification axes as structured data.