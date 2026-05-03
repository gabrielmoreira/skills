---
id: typescript-error-handling.error-shape-and-metadata
owner: typescript-error-handling
canonical: true
severity: default
references: [RFC 7807 Problem Details for HTTP APIs, RFC 9457 (RFC 7807-bis), Microsoft REST API Guidelines (errors), W3C Trace Context, ULID / UUID v7]
---

# Error Shape and Metadata

Decision: Every error carries a small fixed set of metadata: a stable `code` (machine-readable), an `errorId` (unique per occurrence, ULID or UUID v7), a `timestamp` (when it happened, not when logged), a `cause` chain, and — when tracing is in place — a `traceId`. The boundary log writes the full context; the response sends only what the caller needs to act, plus the `errorId` so support can correlate.

Use when:
- Errors have no unique identifier and support cannot find the matching log line for a customer report.
- Two error types share the same `message` but mean different things to the system.
- The response body is `{ error: "Something went wrong" }` — caller cannot react and ops cannot investigate.
- Errors leak stack traces or internal details to the client.
- Logs and tracing are out of sync because nothing connects the request, the error, and the trace.
- A new error type is added and ad-hoc fields appear in random handlers.

Start here:
- Decide the metadata fields once at the project level: at minimum `code`, `errorId`, `timestamp`, `cause`.
- Place them on the base error class (or the error variant in Result-based projects).
- The boundary log writes the full error (`toLogShape()` — the structured-log mechanics live in `../typescript-observability/rules/meaningful-logging.md`); the response writes `code`, `errorId`, `message` (sanitized).

Escalate when:
- Public API consumers parse errors programmatically — adopt RFC 7807 / RFC 9457 Problem Details.
- Tracing is in place — propagate `traceId` (W3C Trace Context) so logs, traces, and error responses correlate.
- Errors need richer context (rate-limit info, retry-after, field-level validation) — add structured `details` field; do not stuff into `message`.
- Multiple services share a contract — agree on a stable `code` namespace (`<service>.<category>.<specific>`).

Complexity ladder:
1. Plain `Error` with `message` — only acceptable for one-file scripts.
2. Base `AppError` with `code`, `errorId`, `timestamp`, `cause` — default for any real app.
3. Add `traceId` when distributed tracing is in place.
4. Add structured `details` field for field errors, rate-limit metadata, retry-after.
5. RFC 7807 Problem Details response shape for public APIs.
6. Stable `code` namespace and a registry/changelog when many services share contracts.

Do:
- Generate `errorId` at construction (ULID or UUID v7 — both are time-ordered, ULID is shorter and URL-safe).
- Set `timestamp` at construction, not at log time. The error knows when it happened.
- `code` is **stable** across releases — it is the API contract surface. Format: `snake_case`, namespaced if needed (`order.not_found`, `payment.declined`).
- Always pass `cause` when wrapping: `new MyError("msg", { cause: e })`. The whole chain stays for debugging.
- Log every error with the **full** metadata: `errorId`, `code`, `cause` chain, request context. One structured log call per failure — log mechanics live in `../typescript-observability/rules/meaningful-logging.md`.
- The response includes `errorId` and `code` always; `message` only when safe; `details` only when machine-relevant.
- Propagate `traceId` from incoming context (W3C Trace Context header `traceparent`) so error logs join traces.

Avoid:
- `message` doubling as machine code — the message is for humans, the `code` is for machines.
- Generating `errorId` only when logging — log and response will not match.
- `code` strings that change between releases (`"err_001"` → `"order.not_found"`) — consumers depend on them.
- Stuffing structured info into `message` (`"validation failed: field=email reason=invalid"`) — use `details`.
- Random UUIDs (v4) for `errorId` — not time-ordered, harder to scan in logs.
- Sending the full `cause` chain in the response — log it, do not leak it. Coordinate with `../typescript-security/rules/redaction.md` before logging anything that may carry secrets.
- Generating one `errorId` and reusing it across multiple errors in the same request — each error is its own occurrence.

Exceptions:
- A library that throws but does not own logging may skip per-instance `errorId`; the consumer's boundary translator wraps the library throw into its own `AppError` and assigns one then.
- Test code may use deterministic `errorId` for snapshot stability.
- Programmer errors (invariant violations) may lack `code` because they should never reach production responses.

Example:

[Class-based] Base class with metadata:

```ts
// core/errors/app-error.ts
import { ulid } from "ulid"; // or `import { v7 } from "uuid";`

export type AppErrorOptions = {
  cause?: unknown;
  errorId?: string;     // override for tests
  timestamp?: Date;     // override for tests
  traceId?: string;     // injected by tracing context if available
  details?: unknown;    // structured payload
};

export abstract class AppError extends Error {
  abstract readonly code: string;
  readonly errorId: string;
  readonly timestamp: Date;
  readonly traceId?: string;
  readonly details?: unknown;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.errorId = options.errorId ?? ulid();
    this.timestamp = options.timestamp ?? new Date();
    this.traceId = options.traceId;
    this.details = options.details;
  }

  /**
   * Stable, log-friendly snapshot. Includes the `cause` chain (logs are private).
   * `details` is deliberately omitted at the base because subclasses may put PII there;
   * subclasses opt in via override only when the field is safe to log.
   * Coordinate with `typescript-security/rules/redaction.md` for cause sanitization.
   */
  toLogShape(): Record<string, unknown> {
    return {
      code: this.code,
      errorId: this.errorId,
      timestamp: this.timestamp.toISOString(),
      traceId: this.traceId,
      name: this.name,
      message: this.message,
      cause: this.cause,
      // details deliberately omitted at the base; subclasses opt in if safe.
    };
  }
}
```

Concrete subclass:

```ts
import { BusinessError } from "core/errors";

export class OrderNotFoundError extends BusinessError {
  readonly code = "order.not_found";
  constructor(public readonly orderId: string, options?: AppErrorOptions) {
    super(`order ${orderId} not found`, { ...options, details: { orderId } });
  }
}
```

Boundary writes log + response with the same `errorId`:

```ts
app.use((err: unknown, req, res, next) => {
  const { status, body } = translate(err);  // see error-boundary-contract.md
  if (err instanceof AppError) {
    req.log.error("request_failed", err.toLogShape());
  } else if (status >= 500) {
    req.log.error("request_failed", { errorId: body.errorId, cause: err });
  }
  res.status(status).json(body);
});
```

The response carries the correlation identifier:

```json
{
  "code": "order.not_found",
  "errorId": "01HZX9K3M7QABC456DEF789G",
  "message": "order ord_123 not found"
}
```

The matching log line:

```json
{
  "level": "error",
  "msg": "request_failed",
  "code": "order.not_found",
  "errorId": "01HZX9K3M7QABC456DEF789G",
  "timestamp": "2026-05-03T15:42:11.123Z",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "name": "OrderNotFoundError",
  "message": "order ord_123 not found",
  "cause": { /* original error chain */ }
}
```

Customer support workflow: customer pastes `errorId`; support runs `logs | grep 01HZX9K3M7QABC456DEF789G` and finds the trace.

Tracing context propagation — read the active span at construction; do not pass `traceId` manually through every call site. The lookup belongs to whatever observability adapter the project uses (OpenTelemetry's context, an `AsyncLocalStorage`, etc.) — see `../typescript-observability/rules/tracing-boundary.md`.

```ts
import { trace } from "@opentelemetry/api";

const traceId = trace.getActiveSpan()?.spanContext().traceId;
throw new OrderNotFoundError(orderId, { traceId });
```

RFC 7807 Problem Details for public APIs:

```ts
type ProblemDetails = {
  type: string;       // URI reference identifying the problem class
  title: string;      // short, human-readable summary
  status: number;     // HTTP status
  detail?: string;    // human-readable, instance-specific
  instance?: string;  // URI of this specific occurrence (commonly includes errorId)
  // Extension members (RFC 7807 §3.2):
  code: string;
  errorId: string;
  traceId?: string;
};

function toProblemDetails(e: AppError, status: number, baseUrl: string): ProblemDetails {
  return {
    type: `${baseUrl}/problems/${e.code.replace(/\./g, "-")}`,
    title: e.code.replace(/[._]/g, " "),  // simple human-readable derivation; replace with a registry at scale.
    status,
    detail: e.message,
    instance: `${baseUrl}/errors/${e.errorId}`,
    code: e.code,
    errorId: e.errorId,
    traceId: e.traceId,
  };
}
```

[Result-based] Same metadata as fields on the error variant:

```ts
type AppErrorShape = {
  code: string;
  errorId: string;
  timestamp: string;     // ISO
  traceId?: string;
  category: "business" | "infra";
  retryable?: boolean;
  details?: unknown;
  cause?: unknown;
};

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppErrorShape };
```

Verify:
- Every error has `code`, `errorId`, `timestamp`, `cause` (when wrapping).
- `errorId` is generated at construction, not at log time.
- The same `errorId` appears in both the log line and the API response.
- `code` strings are stable; a registry / changelog catches accidental renames.
- `errorId` is ULID or UUID v7 (time-ordered); not v4.
- The response body never includes the full `cause` chain or stack trace.
- When tracing is in place, `traceId` is on the error object and the log.
- Public API surfaces use RFC 7807 Problem Details (or document the alternative).
