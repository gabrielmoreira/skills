---
id: typescript-error-handling.error-shape-and-metadata
owner: typescript-error-handling
canonical: true
severity: default
references: [RFC 7807 Problem Details for HTTP APIs, RFC 9457 (RFC 7807-bis), Microsoft REST API Guidelines (errors), W3C Trace Context, ULID / UUID v7]
---

# Error Shape and Metadata

Decision: Define one canonical, app-owned error data shape. Keep the root focused on the semantic contract (`kind`, `code`, `message`, `details`). Use structured attachments for app-facing context, normalized cause data, metadata, retry evaluation, and protocol projections. Root `details` is the semantic payload of the error; runtime `cause` remains internal and separate from the canonical serialized shape.

Use when:
- Errors have no durable `code` or correlation identifier, or new error types add random fields in random places.
- Teams cannot agree what belongs in semantic payload versus diagnostics metadata.
- Logs, traces, and responses cannot be correlated reliably.
- Public responses leak internal context or vendor failure details.

Do:
- Use a stable, app-owned `code` as the machine-readable contract — never `message`.
- Generate `errorId` and record occurrence time when the error is materialized, not only when logging; prefer ULID or UUID v7 for `errorId`.
- Keep root `details` for semantic payload that belongs to the error itself, distinct from diagnostics.
- Use `normalizedCause` for app-owned normalized cause data (`type`, `code`, `message`, `stacktrace`), kept close to OpenTelemetry exception fields.
- Keep root `code` as the app's stable contract; `normalizedCause.code` is only the observed upstream/runtime code when one exists.
- Use `metadata` for correlation IDs, request IDs, occurrence time, and similar diagnostics.
- Put one-off/vendor-specific extras — including downstream request IDs and vendor correlation handles — in `metadata.custom`.
- Preserve runtime `cause` and `normalizedCause.stacktrace` on the wrapper/runtime side for internal diagnostics or tracing, even after the public response has been sanitized — public sanitization is not a reason to discard them.
- Keep `context` and `normalizedCause` internal by default when projecting outward; only root fields are public-shape-friendly by default.
- Read tracing and correlation data through an app-owned port or helper, not directly from a vendor API, in canonical examples.
- Extract the canonical types into a shared `core/errors` package once multiple packages need the same contract; when public consumers parse errors programmatically, define an explicit projection strategy (consider RFC 7807 / RFC 9457) instead of ad hoc shapes.

Avoid:
- Stuffing structured payload into `message`, or treating root `details`, `normalizedCause`, and `metadata` as interchangeable.
- Reusing one `errorId` across distinct error occurrences.
- Projecting raw runtime causes, raw response bodies, or stacks to clients by default, or storing the raw original cause object itself inside the canonical error data shape.
- Treating `normalizedCause.type` / `.code` / `.message` alone as sufficient when stacktrace or richer internal diagnostics are still needed.
- Teaching a concrete tracing SDK as if it were the architecture.

Exceptions:
- Very small scripts may stop at root fields only; internal-only modules may add attachments gradually.
- A library may let the outer boundary assign `errorId` if it does not own logging or projection.
- Test code may override `errorId` and occurrence time for determinism.

Example:
```ts
export type AppErrorData = {
  kind: "business" | "infra" | "security" | "validation";
  code: string;
  message: string;
  details?: unknown;
  context?: { service?: string; operation?: string; target?: { kind?: "http" | "db" | "fs" | "queue" | "cache" | "stream"; name?: string; operation?: string; resource?: string } };
  normalizedCause?: { type?: string; code?: string; message?: string; stacktrace?: string };
  metadata?: { errorId?: string; traceId?: string; correlationId?: string; requestId?: string; occurredAt?: string; custom?: Record<string, unknown> };
  retry?: { allowed?: boolean; mode?: "backoff" | "after_remediation" | "none"; afterMs?: number };
  http?: { status?: number };
};

// Root `code` is the app's stable contract; `normalizedCause.code` is the observed upstream/runtime code.
const error: AppErrorData = {
  kind: "infra",
  code: "payments.unavailable",
  message: "payment provider unavailable",
  details: { orderId: "ord_123" },
  normalizedCause: {
    type: "AxiosError",
    code: "ECONNRESET",
    message: "socket hang up",
    stacktrace: "AxiosError: socket hang up\n    at ...",
  },
  metadata: {
    errorId: "01HZX9K3M7QABC456DEF789G",
    traceId: "trace_123",
    occurredAt: "2026-05-03T15:42:11.123Z",
    custom: { vendorCorrelationId: "stripe_corr_456", retryAfterHeader: "1" },
  },
  retry: { allowed: true, mode: "backoff", afterMs: 1000 },
  http: { status: 503 },
};

// Tracing/correlation data enters through an app-owned port, not a vendor import.
interface TracingPort {
  getContext(): { traceId?: string; correlationId?: string };
}

function withMetadata<T extends AppErrorData>(error: T, tracing: TracingPort): T {
  const ctx = tracing.getContext();
  return {
    ...error,
    metadata: {
      ...error.metadata,
      errorId: error.metadata?.errorId ?? ulid(),
      traceId: error.metadata?.traceId ?? ctx.traceId,
      correlationId: error.metadata?.correlationId ?? ctx.correlationId,
      occurredAt: error.metadata?.occurredAt ?? new Date().toISOString(),
    },
  };
}
```

Verify:
- Every app-owned error has a stable `code`, human-readable `message`, and semantic root `details` when needed; `errorId` and occurrence time are assigned when materialized.
- Root `details` stays distinct from `normalizedCause` and diagnostics `metadata`; runtime `cause` and `normalizedCause.stacktrace` stay available internally even after public projection is sanitized.
- Downstream request IDs / vendor correlation handles are captured in `metadata` or `metadata.custom` when available.
- Public projections start from the root contract; tracing/correlation data enters through an app-owned abstraction, not a concrete tracing import.
