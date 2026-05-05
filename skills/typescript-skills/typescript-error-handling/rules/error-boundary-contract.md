---
id: typescript-error-handling.error-boundary-contract
owner: typescript-error-handling
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Hexagonal Architecture edge translation, RFC 7807 Problem Details, GraphQL error extensions]
---

# Error Boundary Contract

Decision: At every boundary an error crosses (HTTP handler, Lambda, GraphQL formatter, RPC interceptor, library entrypoint), exactly one translator decides what shape the next layer sees. The boundary always owns that outward shape. The canonical internal error shape and the public response shape are related, but they are not the same thing.

Use when:
- A handler returns raw library error fields (`error.message`, `error.code`) to the caller.
- Different routes or handlers return different shapes for the same logical failure.
- A GraphQL resolver throws and the framework sends an unstructured error to the client.
- A library is published and consumers receive throws from internal dependencies they never imported.
- Domain code is encoding HTTP status codes or protocol errors directly.
- A 500 response leaks stack traces, DB column names, vendor messages, or internal paths.

- A `catch` converts an error into a fallback/default path and no log, span event, metric, or explicit error result explains why behavior changed.
Start here:
- Decide whose error shape callers see at the boundary. Always your own — never the dependency's.
- Translate exactly once per boundary: route handler, lambda handler, GraphQL formatter, RPC server, library entrypoint.
- Translate by family-level wrapper or canonical error data (`kind`, `code`, `retry`), not by every concrete subclass.
- Start public projection from the root contract: `code`, `message`, and safe parts of root `details`.
- Treat `context` and `normalizedCause` as internal by default.

Escalate when:
- Many handlers share the same rules — extract one translator or formatter.
- Consumers parse errors programmatically — define an RFC 7807 / Problem Details-compatible projection.
- Multiple boundaries share the same outward contract — extract a shared boundary translator module.
- An incident reveals leaked internal details or missing correlation identifiers.

Complexity ladder:
1. Single try/catch in a small handler.
2. Centralized translator that catches by family wrapper or canonical error data.
3. Stable outward shape such as `{ code, errorId, message }`.
4. Explicit projection/redaction rules.
5. RFC 7807 Problem Details or equivalent for machine-readable public APIs.

Do:
- Translate exactly once per boundary; the translator owns the outward shape.
- Keep the app's canonical error data internal; project a narrower public shape.
- Translate by family classification (`BusinessError`, `InfraError`, `ValidationError`, `SecurityError`) or equivalent canonical data fields.
- Always include a stable `code`, correlation identifier, and sanitized message in outward errors.
- Keep vendor and library error shapes behind the boundary.
- Log the richer internal shape separately from the public response shape.
- Make unknown errors produce a generic internal-error response with a fresh correlation identifier.
- If code swallows an error, returns a fallback, or otherwise changes control flow instead of propagating normally, emit one meaningful signal at the layer that owns that recovery decision.

Projection:
- Projection adapts canonical error data to the needs of one boundary.
- Projection does not redefine the error; it narrows and formats it.
- Root fields are the first candidates for projection.
- `details` may be projected when it is safe and genuinely useful to the caller.
- `http.status` is a boundary concern, not the root contract.

Redaction:
- Redaction may omit, mask, summarize, or sanitize fields before they cross a boundary.
- Treat `context`, `normalizedCause`, and runtime `cause` as internal by default.
- Do not project stack traces, raw vendor messages, raw runtime causes, raw headers, raw response bodies, request IDs from third parties, or arbitrary internal metadata unless the boundary explicitly requires them and the data is safe.
- Coordinate with security/redaction guidance before logging or exposing anything that may carry secrets or PII.

Do (Class-based — recommended default):
- Match by family wrapper (`BusinessError`, `InfraError`, `ValidationError`, `SecurityError`), not by every concrete subclass.
- Use canonical error data carried by the wrapper to decide status and body shape.
- Preserve runtime `cause` and richer internal diagnostics for logs/tracing while sanitizing the public response.

Do (Result-based):
- Unwrap the `Result` once at the transport boundary.
- Map from the canonical error data to the outward shape in the same way the class-based translator would.

Avoid:
- Returning third-party `error.message` directly to callers.
- Letting framework default handlers leak implementation details in production.
- Copy-pasting formatting logic into every handler.
- Mixing log shape and response shape.
- Embedding protocol status codes into domain logic.
- One generic `{ error: "Something went wrong" }` response for every failure.
- Enumerating every concrete subclass in the boundary translator.
- Silent fallback or silent swallow when an error changed the control flow.
- Duplicating the same error log at every layer instead of emitting one owned signal where the fallback/recovery decision is made.

Exceptions:
- Tiny one-handler scripts may inline mapping until a second handler appears.
- Framework-native error hooks (NestJS filters, Fastify handlers, GraphQL formatters) should host the translator rather than be bypassed.
- A private internal boundary may choose a richer projection than a public one, but it should still be deliberate.

Example:

[Class-based] Single translator, catching by family wrapper:

```ts
import { AppError, BusinessError, InfraError, SecurityError, ValidationError } from "core/errors";
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
      status: e.data.http?.status ?? 400,
      body: {
        code: e.data.code,
        errorId: e.data.metadata?.errorId ?? ulid(),
        message: e.data.message,
        details: e.data.details,
      },
    };
  }

  if (e instanceof BusinessError) {
    return {
      status: e.data.http?.status ?? 400,
      body: {
        code: e.data.code,
        errorId: e.data.metadata?.errorId ?? ulid(),
        message: e.data.message,
      },
    };
  }

  if (e instanceof SecurityError) {
    return {
      status: e.data.http?.status ?? 403,
      body: {
        code: e.data.code,
        errorId: e.data.metadata?.errorId ?? ulid(),
        message: e.data.message,
      },
    };
  }

  if (e instanceof InfraError) {
    return {
      status: e.data.http?.status ?? (e.data.retry?.allowed ? 503 : 500),
      body: {
        code: e.data.code,
        errorId: e.data.metadata?.errorId ?? ulid(),
        message: e.data.retry?.allowed ? "try again shortly" : "internal error",
      },
    };
  }

  if (e instanceof AppError) {
    return {
      status: e.data.http?.status ?? 500,
      body: {
        code: e.data.code,
        errorId: e.data.metadata?.errorId ?? ulid(),
        message: "internal error",
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "internal_error",
      errorId: ulid(),
      message: "internal error",
    },
  };
}
```

Express middleware applies projection once; logs keep real error instance plus safe structured context:

```ts
app.use((err: unknown, req, res, next) => {
  const { status, body } = translate(err);

  if (status >= 500) {
    req.log.error("request_failed", {
      code: body.code,
      errorId: body.errorId,
      err,
    });
  }

  res.status(status).json(body);
});
```

[Result-based] Unwrap once and project once:

```ts
function toHttp<T>(result: { ok: true; value: T } | { ok: false; error: AppErrorData }) {
  if (result.ok) {
    return { status: 200, body: result.value };
  }

  const error = result.error;
  return {
    status: error.http?.status ?? 500,
    body: {
      code: error.code,
      errorId: error.metadata?.errorId ?? ulid(),
      message: error.message,
    },
  };
}
```

Verify:
- Each boundary has exactly one translation point.
- Public responses use an app-owned shape, not a vendor or framework default shape.
- Root fields are the starting point for projection.
- `context`, `normalizedCause`, and runtime `cause` are omitted by default from outward responses.
- Logs retain the richer internal diagnostic shape separately.
- The translator catches family wrappers or reads canonical classification fields instead of enumerating every concrete subclass.