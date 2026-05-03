---
id: typescript-error-handling.throw-vs-result
owner: typescript-error-handling
canonical: true
severity: default
references: [Java/C# checked exceptions critique, Result/Either type (Rust, Scala, fp-ts), Errors are values (Go), Effect.ts, neverthrow]
---

# Throw vs Result

Decision: The project picks one default style — class-based (throw `AppError` subclasses) or Result-based (`Result<T, E>` discriminated union) — and stays consistent. Within a function, the choice is no longer the developer's; it follows the project default. Throwing for programmer errors (invariants, "should never happen") is allowed in both styles.

Use when:
- Writing a new function that may fail.
- The project has not made the project decision yet (read `SKILL.md` first).
- A pull request mixes both styles in the same package and a reviewer asks why.
- Library code is throwing in a context where consumers were not expecting it.
- A function returns `T | null` for multiple distinct failure modes and the caller cannot tell why it failed.

Start here:
- Confirm the project's chosen style (`SKILL.md` Project Decision).
- For programmer errors and invariant violations, both styles allow `throw new Error("invariant: …")`.
- For known business/infra failures, follow the project default.
- Do not refactor an existing project's style without an explicit decision to migrate.

Escalate when:
- The codebase mixes both styles inconsistently — bring the project decision to the team.
- The chosen style does not fit a specific module (public library inside a class-based project; pure parsers inside a Result-based project) — define the boundary where the styles meet and translate.
- A new contributor asks "should I throw or return?" — that is a sign the SKILL.md Project Decision is not visible enough.

Complexity ladder:
1. Plain `throw new Error("...")` — only for programmer errors / invariants. Both styles allow this.
2. Class-based: throw `AppError` subclasses with `errorId`, `code`, `cause`. Catch at boundary by class-base.
3. Result-based: return discriminated union `{ ok: true; value: T } | { ok: false; error: E }`. Caller branches.
4. Either style: cross-style adapter at a real boundary (library wraps throws into Result; class-based service consumes Result-returning parser and converts to throw).

Do:
- Pick one style as the project default and stick to it inside a package.
- Whichever style you use, every failure carries `code`, `errorId`, `timestamp`, `cause` (see `error-shape-and-metadata.md`).
- Wrap third-party throws / vendor error shapes at the adapter boundary; never let them leak inward.
- The boundary translates once (see `error-boundary-contract.md`); domain code does not know about HTTP / GraphQL / RPC status mapping.

Do (Class-based — recommended default):
- Throw `AppError` subclasses for known business/infra failures; the boundary catches by class hierarchy.
- Use `instanceof BusinessError` / `instanceof InfraError` at the boundary, not string-matching `message`.
- For pure functions (parsers, validators) where failure *is* the result, returning `Result` is acceptable even in a class-based project — see "cross-style boundary" below.

Do (Result-based — only when project chose this):
- Return a discriminated union with a literal tag (`ok: true | false`).
- The error variant carries the same metadata as `AppError` would (`code`, `errorId`, `timestamp`).
- Compose with `Result.map` / `Result.flatMap` helpers when chaining.
- At the very edge of the system, unwrap once into transport-level response.

Avoid:
- Mixing both styles inside the same package.
- `throw "string"` or `throw { message: "..." }` — breaks `instanceof Error`, loses stack/cause.
- `catch (e) { throw e }` — adds nothing.
- `return null` for multiple distinct failure modes (caller cannot tell why).
- `Result<T, E>` where `E = unknown` or `E = string` — defeats the discriminated-union benefit. Use a tagged union.
- Rethrowing without `{ cause }` — destroys the error chain for debugging.
- Letting unhandled exceptions reach the framework default handler in production.

Exceptions:
- Constructors and factories with no useful "failed instance" representation may throw, in either style.
- Tests may throw assertions (the test runner is the boundary).
- Critical-path performance code may avoid `Result` allocation; document the choice.
- A pure parser inside a class-based project may return `Result` — failure is the result, not an exceptional event.

Example:

[Class-based] Throw `AppError` subclasses; boundary catches by class-base:

```ts
// core/errors/app-error.ts — shared package
import { ulid } from "ulid";

// shape-and-metadata.md shows the full constructor with `options` (cause, errorId override, traceId, details).
export abstract class AppError extends Error {
  abstract readonly code: string;
  readonly errorId: string = ulid();
  readonly timestamp: Date = new Date();
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export abstract class BusinessError extends AppError {} // 4xx
export abstract class InfraError extends AppError {
  abstract readonly retryable: boolean;
}

// features/orders/errors.ts
import { BusinessError } from "core/errors";

export class OrderNotFoundError extends BusinessError {
  readonly code = "order_not_found";
  constructor(public readonly orderId: string) {
    super(`order ${orderId} not found`);
  }
}

// features/orders/get-order.ts
async function getOrder(id: string): Promise<Order> {
  const row = await db.orders.findById(id);
  if (!row) throw new OrderNotFoundError(id);
  return row;
}
```

[Class-based] Adapter wraps third-party throws:

```ts
import { InfraError } from "core/errors";

export class PaymentProviderUnavailableError extends InfraError {
  readonly code = "payment_provider_unavailable";
  readonly retryable = true;
}
export class PaymentDeclinedError extends BusinessError {
  readonly code = "payment_declined";
  constructor(public readonly providerCode: string, cause: unknown) {
    super(`payment declined: ${providerCode}`, { cause });
  }
}

async function charge(input: ChargeInput) {
  try {
    return await stripe.paymentIntents.create({ /* ... */ });
  } catch (e) {
    if (e instanceof Stripe.errors.StripeConnectionError) {
      throw new PaymentProviderUnavailableError("stripe connection", { cause: e });
    }
    if (e instanceof Stripe.errors.StripeCardError) {
      throw new PaymentDeclinedError(e.code ?? "unknown", e);
    }
    throw e; // unknown — the request boundary will translate to a generic 5xx with a fresh errorId
  }
}
```

[Result-based] Pure parser returns Result (acceptable in either project style):

```ts
type ParseError =
  | { kind: "missing_field"; field: string }
  | { kind: "wrong_type"; field: string; expected: string };

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ORDER_STATUSES = ["pending", "paid", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function isOrderStatus(s: string): s is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(s);
}

function parseOrder(raw: unknown): Result<Order, ParseError> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { kind: "missing_field", field: "<root>" } };
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.orderId !== "string") {
    return { ok: false, error: { kind: "wrong_type", field: "orderId", expected: "string" } };
  }
  if (typeof obj.status !== "string" || !isOrderStatus(obj.status)) {
    return { ok: false, error: { kind: "wrong_type", field: "status", expected: ORDER_STATUSES.join("|") } };
  }
  if (typeof obj.total !== "number") {
    return { ok: false, error: { kind: "wrong_type", field: "total", expected: "number" } };
  }
  // narrowed explicitly above; status checked against the allowed literal set.
  return { ok: true, value: { orderId: obj.orderId, status: obj.status, total: obj.total } };
}

// Caller branches by tag
const r = parseOrder(input);
if (!r.ok) {
  switch (r.error.kind) {
    case "missing_field": return badRequest(`missing ${r.error.field}`);
    case "wrong_type":    return badRequest(`${r.error.field} must be ${r.error.expected}`);
  }
}
const order = r.value;
```

Cross-style boundary (class-based project that uses a Result-based parser):

```ts
// Class-based service consumes a Result-based parser and converts to throw.
async function createOrder(rawBody: unknown) {
  const parsed = parseOrder(rawBody);
  if (!parsed.ok) {
    throw new CreateOrderValidationError([{ field: parsed.error.kind, message: JSON.stringify(parsed.error) }]);
  }
  return persist(parsed.value);
}
```

Verify:
- The project has chosen one style and `SKILL.md` Project Decision is visible to new contributors.
- Within a single package, all functions follow the chosen style (with documented exceptions for cross-style boundaries).
- Class-based: every thrown error is an `AppError` subclass (or a programmer-error `Error` for invariants); no `throw "string"`.
- Result-based: every error variant has a `kind` (or `ok`) literal discriminant; no `Result<T, unknown>`.
- Either style: error metadata is consistent (`errorId`, `code`, `cause`) — see `error-shape-and-metadata.md`.
- No `as Order` (or similar) inside a parser's "success" branch — narrow by type guard or build the object explicitly.
