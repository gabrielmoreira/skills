---
id: typescript-error-handling.error-boundary-contract
owner: typescript-error-handling
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Hexagonal Architecture edge translation, RFC 7807 Problem Details, GraphQL error extensions]
---

# Error Boundary Contract

Decision: At every boundary an error crosses (HTTP handler, Lambda, GraphQL formatter, RPC interceptor, library entrypoint), exactly one translator decides what shape the next layer sees. In a class-based project, the translator catches by `AppError` base classes and produces an owned error shape with `errorId`, `code`, and a sanitized message. Vendor and library error shapes never reach the caller.

Use when:
- A handler returns the raw library error (`error.message`, `error.code`) to the client.
- Different routes/handlers return different error shapes for the same logical failure.
- A GraphQL resolver throws and the framework sends an unstructured error to the client.
- A library is published and consumers receive throws from internal dependencies they never imported.
- Domain code is doing HTTP status code mapping inside business logic.
- A 500 response leaks an internal stack trace or DB column name.

Start here:
- Decide whose error shape callers see at the boundary. Always your own — never the dependency's.
- Translate at exactly one place per boundary: route handler, lambda handler, GraphQL formatter, RPC server, library entrypoint.
- The translator catches by **base class** (`AppError`, `BusinessError`, `InfraError`) or by the Result-error category — not by every concrete subclass.
- Define a stable response shape (`code`, `errorId`, `message`, optional `details`) — see `error-shape-and-metadata.md`.

Escalate when:
- The boundary spans many handlers — extract a single translator (middleware, error formatter, response mapper).
- Consumers need machine-readable errors — adopt RFC 7807 Problem Details or GraphQL error extensions.
- Multiple boundaries share the same error contract — extract a shared error-translator module.
- An incident reveals a leaked internal error or a missing `errorId`.

Complexity ladder:
1. Single try/catch in the handler that maps known errors to status codes (one-off scripts).
2. Centralized error middleware/handler that catches by `AppError` base class.
3. Stable `{ code, errorId, message }` response shape returned by the boundary.
4. RFC 7807 Problem Details when consumers parse errors programmatically.
5. Per-domain error contracts when audiences differ (public API vs internal RPC).

Do:
- Translate exactly once per boundary (HTTP route, Lambda handler, GraphQL formatter, RPC server, library entrypoint). The translator owns the response shape.
- Translate by classification (`BusinessError` / `InfraError` / `ValidationError` — or the equivalent Result error `category`), not by concrete subclass.
- Every response carries `code`, `errorId`, sanitized `message`. The matching log line carries the full `cause` chain.
- Vendor / library / SDK error shapes never cross the boundary outward. Wrap or translate at the edge.
- Domain code does not encode HTTP status / GraphQL error codes / RPC status — that lives in the translator.

Do (Class-based — recommended default):
- Match by `instanceof BusinessError` / `instanceof InfraError` / `instanceof ValidationError`, not on each concrete subclass.
- Distinguish caller-actionable failures (4xx, "fix your request") from system failures (5xx, "we'll fix it").
- Preserve `cause` for logs/telemetry while sanitizing the response — see `../typescript-security/rules/redaction.md` for what must not leak.
- Cross-link with `../typescript-boundaries/rules/raw-input-to-internal-model.md` for the input side of the same boundary.

Do (Result-based):
- The transport boundary unwraps the `Result` once and uses its `error.category` / `error.code` to map to status.
- Same response shape as class-based: `{ code, errorId, message }`.

Avoid:
- Returning `error.message` from a third-party library directly to the API caller.
- Letting unhandled exceptions reach the framework default handler in production (often leaks stack traces).
- Per-handler error formatting copy-paste — extract a translator.
- Mixing log shape and response shape — log objects for ops, response shape for callers.
- Embedding HTTP status codes inside domain code (`throw new HttpError(404)` in a use case).
- One generic `{ error: "Something went wrong" }` response for everything — caller cannot react.
- Catching by every concrete subclass — explosion of `if (e instanceof FooError) ...`. Catch the base class.

Exceptions:
- A genuinely unknown error may translate to `{ code: "internal_error" }` with no detail; log the cause with `errorId`.
- Tiny single-handler scripts may inline mapping until a second handler appears.
- Frameworks with built-in error translation (NestJS exception filters, Fastify error handler) should host the translator, not be bypassed.

Example:

[Class-based] Single translator, catches by base class:

```ts
// http/error-translator.ts
import { AppError, BusinessError, InfraError, ValidationError } from "core/errors";
import { ulid } from "ulid";

export type ApiErrorBody = {
  code: string;
  errorId: string;
  message: string;
  details?: unknown;
};

export function translate(e: unknown): { status: number; body: ApiErrorBody } {
  if (e instanceof ValidationError) {
    return {
      status: 400,
      body: { code: e.code, errorId: e.errorId, message: e.message, details: e.fieldErrors },
    };
  }
  if (e instanceof BusinessError) {
    return { status: 400, body: { code: e.code, errorId: e.errorId, message: e.message } };
  }
  if (e instanceof InfraError && e.retryable) {
    return { status: 503, body: { code: e.code, errorId: e.errorId, message: "try again shortly" } };
  }
  if (e instanceof InfraError) {
    return { status: 500, body: { code: e.code, errorId: e.errorId, message: "internal error" } };
  }
  if (e instanceof AppError) {
    return { status: 500, body: { code: e.code, errorId: e.errorId, message: "internal error" } };
  }
  // unknown — synthesize errorId so logs/response correlate
  return { status: 500, body: { code: "internal_error", errorId: ulid(), message: "internal error" } };
}
```

Express — central error middleware applied once:

```ts
import { translate } from "./http/error-translator";

app.use((err: unknown, req, res, next) => {
  const { status, body } = translate(err);
  // log carries the cause chain; response carries only the sanitized body.
  if (status >= 500) {
    const logShape = err instanceof AppError ? err.toLogShape() : { errorId: body.errorId, code: body.code, cause: err };
    req.log.error("request_failed", logShape);
  }
  res.status(status).json(body);
});

// route handler — domain throws, edge translates
app.post("/orders/:id/charge", async (req, res, next) => {
  try {
    const result = await chargeOrder(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
```

Lambda handlers / GraphQL `formatError` / RPC error interceptors call `translate(e)` the same way; replace the Express middleware with the framework's error hook. The translator stays single, the host changes.

Library entrypoint — never throw vendor types past the public API:

```ts
import { Result } from "./result";

export type PublicChargeError =
  | { kind: "payment_declined"; providerCode: string }
  | { kind: "payment_unavailable"; retryable: true }
  | { kind: "internal" };

export async function chargeWithRetry(input: ChargeInput): Promise<Result<ChargeOk, PublicChargeError>> {
  try {
    const v = await chargeOrder(input);
    return { ok: true, value: v };
  } catch (e) {
    if (e instanceof PaymentDeclinedError) {
      return { ok: false, error: { kind: "payment_declined", providerCode: e.providerCode } };
    }
    if (e instanceof PaymentProviderUnavailableError) {
      return { ok: false, error: { kind: "payment_unavailable", retryable: true } };
    }
    return { ok: false, error: { kind: "internal" } };
  }
}
```

For public APIs whose consumers parse errors programmatically, wrap the body in RFC 7807 Problem Details — see `error-shape-and-metadata.md` for the `ProblemDetails` shape and `toProblemDetails()` helper.

Verify:
- Pick any boundary (route, handler, resolver, library function): can a caller distinguish failure modes from the response alone?
- No third-party `error.message` string appears in any 4xx/5xx response body.
- Is there exactly one place per boundary that translates errors?
- Do 5xx responses include `errorId` so support can correlate the log?
- Do 4xx responses give the caller enough info to fix the request without leaking internals?
- Do error `code` strings stay stable across releases?
- Is the translator catching base classes (`BusinessError`, `InfraError`) and not enumerating every subclass?
