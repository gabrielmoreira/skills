---
id: typescript-error-handling.error-boundary-contract
owner: typescript-error-handling
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Hexagonal Architecture edge translation, RFC 9457 Problem Details (obsoletes RFC 7807), GraphQL error extensions]
---

# Error Boundary Contract

Decision: At every boundary an error crosses (HTTP handler, Lambda, GraphQL formatter, RPC interceptor, library entrypoint), exactly one translator decides what shape the next layer sees. The boundary always owns that outward shape. The canonical internal error shape and the public response shape are related, but they are not the same thing.

Use when:
- A handler returns raw library error fields (`error.message`, `error.code`) to the caller, or different routes/handlers return different shapes for the same logical failure.
- A GraphQL resolver throws and the framework sends an unstructured error to the client.
- A library is published and consumers receive throws from internal dependencies they never imported.
- Domain code is encoding HTTP status codes or protocol errors directly.
- A 500 response leaks stack traces, DB column names, vendor messages, or internal paths.
- A `catch` converts an error into a fallback/default path and no log, span event, metric, or explicit error result explains why behavior changed.

Do:
- Decide whose error shape callers see at the boundary — always your own, never the dependency's. Translate exactly once per boundary: route handler, lambda handler, GraphQL formatter, RPC server, library entrypoint.
- Translate by family-level wrapper or canonical error data (`kind`, `code`, `retry`), not by every concrete subclass. Class-based: use `instanceof BusinessError` / `InfraError` / `SecurityError` / `ValidationError`. Result-based: unwrap the `Result` once at the boundary and map the same way.
- Start public projection from the root contract (`code`, `message`, safe parts of root `details`); `http.status` is a boundary concern, not part of the root contract.
- Treat `context`, `normalizedCause`, and runtime `cause` as internal by default. Do not project stack traces, raw vendor messages, raw causes, raw headers, raw response bodies, third-party request IDs, or arbitrary internal metadata unless the boundary explicitly requires them and the data is safe — coordinate with security/redaction guidance before exposing anything that may carry secrets or PII.
- Always include a stable `code`, correlation identifier, and sanitized message in outward errors; make unknown errors produce a generic internal-error response with a fresh correlation identifier.
- Keep vendor and library error shapes behind the boundary; log the richer internal shape (full canonical data, cause, upstream status/body/reason) separately from the public response shape.
- Sanitizing the public response is never a reason to throw away internal upstream detail early, e.g. at an adapter that normalizes every non-OK response into one generic message — losing that detail leaves incidents undiagnosable even though the public shape stays narrow.
- If code swallows an error, returns a fallback, or otherwise changes control flow instead of propagating normally, emit one meaningful signal — a log, span event, metric, or explicit error result — at the layer that owns that recovery decision. Do not require the same error to be logged again at every layer it passes through; the owning layer's signal is enough.

Avoid:
- Returning third-party `error.message` directly to callers, or letting framework default handlers leak implementation details in production.
- Copy-pasting formatting logic into every handler, or mixing log shape and response shape.
- Embedding protocol status codes into domain logic, or enumerating every concrete subclass in the boundary translator.
- One generic `{ error: "Something went wrong" }` response for every failure.
- Silent fallback or silent swallow when an error changed the control flow, or duplicating the same error log at every layer instead of one owned signal.

Exceptions:
- Tiny one-handler scripts may inline mapping until a second handler appears.
- Framework-native error hooks (NestJS filters, Fastify handlers, GraphQL formatters) should host the translator rather than be bypassed.
- A private internal boundary may choose a richer projection than a public one, but it should still be deliberate.

Example — wrong (leaks vendor shape) vs. right (one translator, sanitized, logged separately):

```ts
// Wrong: exposes vendor error.message/code straight to the client.
res.status(500).json({ message: err.message, code: err.code });

// Right: one translator per boundary projects canonical data to a stable outward shape.
export function translate(e: unknown): { status: number; body: ApiErrorBody } {
  if (e instanceof ValidationError) return { status: e.data.http?.status ?? 400, body: pick(e) };
  if (e instanceof BusinessError)   return { status: e.data.http?.status ?? 400, body: pick(e) };
  if (e instanceof SecurityError)   return { status: e.data.http?.status ?? 403, body: pick(e) };
  if (e instanceof InfraError)      return { status: e.data.http?.status ?? (e.data.retry?.allowed ? 503 : 500), body: pick(e) };
  return { status: 500, body: { code: "internal_error", errorId: ulid(), message: "internal error" } };
}

function pick(e: AppError): ApiErrorBody {
  return { code: e.data.code, errorId: e.data.metadata?.errorId ?? ulid(), message: e.data.message };
}

// Applied once, at the boundary; logs keep the real error, the response stays sanitized.
app.use((err: unknown, req, res, next) => {
  const { status, body } = translate(err);
  if (status >= 500) req.log.error("request_failed", { code: body.code, errorId: body.errorId, err });
  res.status(status).json(body);
});

// Result-based: unwrap once and project the same way.
function toHttp<T>(result: { ok: true; value: T } | { ok: false; error: AppErrorData }) {
  if (result.ok) return { status: 200, body: result.value };
  const error = result.error;
  return { status: error.http?.status ?? 500, body: { code: error.code, errorId: error.metadata?.errorId ?? ulid(), message: error.message } };
}
```

Verify:
- Each boundary has exactly one translation point; public responses use an app-owned shape, never a vendor or framework default shape.
- `context`, `normalizedCause`, and runtime `cause` are omitted by default from outward responses; logs retain the richer internal diagnostic shape separately.
- The translator catches family wrappers or reads canonical classification fields instead of enumerating every concrete subclass.
- Silent fallbacks or swallowed errors emit one meaningful signal at the owning layer rather than disappearing unobserved.
