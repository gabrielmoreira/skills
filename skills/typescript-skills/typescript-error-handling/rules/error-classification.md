---
id: typescript-error-handling.error-classification
owner: typescript-error-handling
canonical: true
severity: default
references: [Errors are values (Go), Failure modes (resilience engineering), Who can fix it? (Lubu-Labs/langgraph-error-handling), Smithbox-ai/ControlFlow error taxonomy]
---

# Error Classification

Decision: Classify failures by **who can fix it** (caller, system, external) and **whether retrying makes sense**. In a class-based project, classification is the **hierarchy itself** — `BusinessError` (caller fault) and `InfraError` (system fault, with `retryable` flag) — so the boundary translates by `instanceof` against the base class. The boundary does not need to know every subclass to make the right decision.

Use when:
- A caller asks "should I retry this?" and the code cannot answer.
- A retry loop retries everything, including caller errors, and 4xx errors get retried 3 times.
- A new error type was added but the boundary still falls through to generic `500`.
- An incident review reveals an error class was misclassified.
- Two services use different ad-hoc string codes for the same logical failure.

Start here:
- Decide the **classification axes** at the project level: at minimum `BusinessError` vs `InfraError` (with `retryable` on infra).
- New error types extend the appropriate base — they inherit translation, retry semantics, and metadata for free.
- The boundary asks the **base class**, not the subclass: `if (e instanceof InfraError && e.retryable) ...`.

Escalate when:
- A third axis appears (auth/authz failures, conflict failures, dependency-of-dependency failures) — add a sibling to `BusinessError` / `InfraError` only when the boundary actually treats it differently.
- Validation errors need richer field-level detail — `ValidationError extends BusinessError` with `fieldErrors`.
- The codebase has 30+ error classes — keep them grouped by feature module, but rooted in `core/errors`.
- Result-based projects: replicate the same axes as the discriminant (`{ kind: "business" | "infra"; retryable?: boolean; ... }`).

Complexity ladder:
1. Plain `Error` everywhere (small script).
2. Two-class split: `AppError → BusinessError, InfraError` (with `retryable` on infra). Default for mid apps.
3. Three-class split: add `ValidationError extends BusinessError` with field-level detail.
4. Per-feature subclasses inheriting from one of the bases (`OrderNotFoundError extends BusinessError`).
5. Hierarchy lives in `core/errors` shared package; feature packages depend on it, never the reverse.
6. Result-based equivalent: discriminated union with the same axes as fields.

Do:
- Classify every error along two axes: `category` (business vs infra) and `retryable` (only meaningful for infra).
- The classification axes are stable across releases — they are part of the error contract, like `code`.
- Boundary translation reads the **classification**, not the concrete subclass / variant — see `error-boundary-contract.md`.
- The retry mechanism reads `retryable` and decides whether to back off — see `../typescript-async/rules/retry-and-backoff.md`. This rule does not own retry mechanics.

Do (Class-based — the recommended default):
- Define `BusinessError` and `InfraError` (with `retryable: boolean`) as `abstract class` so they cannot be thrown directly.
- Each concrete subclass declares its `code` (stable string) — this is the API contract surface.
- Wrap third-party throws into your own classification at the adapter boundary — the rest of the system never sees raw `StripeError` or `MongoError`.
- Boundary catches by class-base, not by specific subclass.
- Preserve `cause` when wrapping — the original error stays in the chain for debugging.

Do (Result-based — when the project chose this style):
- Discriminate by `kind` and surface the same axes (`category: "business" | "infra"`, `retryable?`).
- Treat the union as the contract; new variants force every consumer to update (with `assertNever`).

Avoid:
- Throwing a generic `Error` from domain code — the boundary cannot classify it.
- Treating all errors as retryable, OR no errors as retryable — both kill availability differently (validation retried = 3× slower failure; transient blip never recovers).
- A single `AppError` with a `code` string and stuffing every failure into it — loses type-narrowing.
- Catching a base class and rethrowing without context (`catch (e) { throw e }`).
- Rethrowing without preserving `cause` — the original error vanishes from the chain.
- Letting subclasses decide whether they are retryable inconsistently — make `retryable` a `readonly` field on the base.
- The boundary doing `if (e.code === "order_not_found")` string-matching instead of `instanceof`.

Exceptions:
- Top-level process handlers may catch broadly to translate unknown errors to a default `500` — that is the boundary's last resort.
- A genuinely unknown error from an opaque library may be classified as `UnknownInfraError` (retryable: false) and alerted.
- Test code may catch broadly to assert on error shape; production code should not.
- One-file scripts may use plain `Error` — the hierarchy is overhead at that scale.

Example:

[Class-based] The hierarchy in `core/errors`:

```ts
// core/errors/index.ts — shared package, no reverse deps allowed.
// AppError comes from core/errors — see error-shape-and-metadata.md for the
// full base class with `errorId`, `timestamp`, `code`, `cause`, optional `traceId`.
import { AppError } from "core/errors/app-error";

// BusinessError = caller fault (4xx); InfraError = system fault (5xx, retryable flag).
// See the Decision above.
export abstract class BusinessError extends AppError {}

export abstract class InfraError extends AppError {
  abstract readonly retryable: boolean;
}
```

Adding `ValidationError` when field-level detail is needed (escalation, not required at the two-class baseline):

```ts
export abstract class ValidationError extends BusinessError {
  abstract readonly fieldErrors: Array<{ field: string; message: string }>;
}
```

Feature module declares its concrete errors:

```ts
// features/orders/errors.ts
import { BusinessError, ValidationError } from "core/errors";

export class OrderNotFoundError extends BusinessError {
  readonly code = "order_not_found";
  constructor(public readonly orderId: string) {
    super(`order ${orderId} not found`);
  }
}

export class OrderAlreadyShippedError extends BusinessError {
  readonly code = "order_already_shipped";
  constructor(public readonly orderId: string) {
    super(`order ${orderId} is already shipped`);
  }
}

export class CreateOrderValidationError extends ValidationError {
  readonly code = "create_order_validation";
  constructor(public readonly fieldErrors: Array<{ field: string; message: string }>) {
    super("create order validation failed");
  }
}
```

Adapter wraps third-party throws into your classification:

```ts
// providers/payments/stripe-adapter.ts
import { InfraError, BusinessError } from "core/errors";

export class PaymentProviderUnavailableError extends InfraError {
  readonly code = "payment_provider_unavailable";
  readonly retryable = true;
}

export class PaymentDeclinedError extends BusinessError {
  readonly code = "payment_declined";
  constructor(public readonly providerCode: string, options?: { cause?: unknown }) {
    super(`payment declined: ${providerCode}`, options);
  }
}

async function chargeViaStripe(input: ChargeInput) {
  try {
    return await stripe.paymentIntents.create({ /* ... */ });
  } catch (e) {
    if (e instanceof Stripe.errors.StripeConnectionError) {
      throw new PaymentProviderUnavailableError("stripe connection", { cause: e });
    }
    if (e instanceof Stripe.errors.StripeCardError) {
      throw new PaymentDeclinedError(e.code ?? "unknown", { cause: e });
    }
    throw e; // unknown — propagate
  }
}
```

Boundary translates by base class — full translator lives in `error-boundary-contract.md`. The shape:

```ts
if (e instanceof ValidationError)              return /* 400 + fieldErrors */;
if (e instanceof BusinessError)                return /* 400 */;
if (e instanceof InfraError && e.retryable)    return /* 503 */;
if (e instanceof InfraError)                   return /* 500 */;
if (e instanceof AppError)                     return /* 500 */;
// unknown — synthesize a fresh errorId so response and log can still correlate.
return /* 500 + new ulid() */;
```

Retry layer asks the classification, not specific subclasses:

```ts
import { InfraError } from "core/errors";

if (e instanceof InfraError && e.retryable) {
  return scheduleRetry(); // mechanism lives in typescript-async/rules/retry-and-backoff.md
}
throw e;
```

[Result-based] Same axes as discriminant fields:

```ts
type ErrorCategory = "business" | "infra";

type AppErrorShape = {
  category: ErrorCategory;
  code: string;
  errorId: string;
  timestamp: Date;
  cause?: unknown;
  retryable?: boolean;     // only meaningful when category === "infra"
};

type Result<T, E extends AppErrorShape> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Verify:
- Domain code only throws (or returns) classified errors — no plain `throw new Error(...)` outside of programmer-error invariants.
- Adapter boundaries wrap third-party errors into your classification; raw vendor types do not propagate inward.
- Boundary translates by **base class** (`instanceof BusinessError` / `instanceof InfraError`), not by specific subclass or string match.
- Retry layer only retries `InfraError` with `retryable: true`.
- `cause` chain is preserved on every wrap.
- Hierarchy lives in `core/errors` (or equivalent); feature packages depend on it, never the reverse.
- Result-based equivalent has the same axes as discriminant fields.
