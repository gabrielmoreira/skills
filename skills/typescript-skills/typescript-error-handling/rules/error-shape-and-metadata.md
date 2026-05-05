---
id: typescript-error-handling.error-shape-and-metadata
owner: typescript-error-handling
canonical: true
severity: default
references: [RFC 7807 Problem Details for HTTP APIs, RFC 9457 (RFC 7807-bis), Microsoft REST API Guidelines (errors), W3C Trace Context, ULID / UUID v7]
---

# Error Shape and Metadata

Decision: Define one canonical, app-owned error data shape. Keep the root focused on the semantic contract (`kind`, `code`, `message`, `details`). Use structured attachments for internal execution context, observed cause, retry evaluation, protocol projections, and telemetry. Root `details` is the semantic payload of the error; `context` and `cause` are internal by default.

Use when:
- Errors have no durable `code` or correlation identifier.
- New error types add random fields in random places.
- Teams cannot agree what belongs in semantic payload versus operational metadata.
- Logs, traces, and responses cannot be correlated reliably.
- Public responses leak internal context or vendor failure details.

Start here:
- Define one canonical `AppErrorData` shape for the project.
- Keep the root small: `kind`, `code`, `message`, `details`.
- Use `context` for app-facing execution context.
- Use `cause` for normalized observed failure data.
- Use `retry`, `http`, and `telemetry` as explicit extensions instead of overloading the root.
- Keep root `details` serializable and public-shape-friendly by default.
- Preserve runtime-native cause stacktrace internally when useful, and keep any original-cause object reference out of the canonical serialized shape by default.

Escalate when:
- Multiple packages need to share the same error contract — extract the types into `core/errors` or equivalent.
- Public consumers parse errors programmatically — define a projection strategy and consider RFC 7807 / RFC 9457.
- Tracing and correlation are in place — feed `telemetry` from an app-owned tracing or observability port.
- Teams keep adding fields without agreement — review the root versus attachment boundaries before adding more.

Complexity ladder:
1. Root only: `kind`, `code`, `message`, `details`.
2. Add `context` for service, operation, and optional technical target.
3. Add `cause` for normalized observed failure signals.
4. Add `retry`, `http`, and `telemetry` when resilience, protocol projection, and observability become real concerns.
5. Add family wrappers and enrichment helpers so callers stop rebuilding the shape manually.

Do:
- Use a stable, app-owned `code` as the machine-readable contract.
- Generate `errorId` when the error is materialized, not only when logging.
- Record occurrence time when the error is materialized, not when the log line is written.
- Keep root `details` for semantic payload that belongs to the error itself.
- Use `context.metadata` for internal execution metadata.
- Use `cause.metadata` for internal observed-cause metadata.
- Preserve cause stacktrace in normalized form when the observed runtime error exposes one and internal diagnostics/tracing still need it.
- If later analysis may need fields beyond the normalized snapshot, retain the original cause object reference internally in the wrapper/runtime layer instead of stuffing it into the canonical data shape.
- Capture downstream request IDs and equivalent vendor correlation handles in `cause` / `cause.metadata`.
- Keep `context` and `cause` internal by default when projecting outward.
- Prefer ULID or UUID v7 for `errorId`.
- Read tracing and correlation data through an app-owned port or helper, not directly from a vendor API in canonical examples.

Avoid:
- Using `message` as the machine contract.
- Stuffing structured payload into `message`.
- Treating root `details`, `context.metadata`, and `cause.metadata` as interchangeable.
- Reusing one `errorId` across distinct error occurrences.
- Projecting raw `cause`, raw headers, raw response bodies, or stacks to clients by default.
- Storing the raw original cause object itself inside the canonical error data shape.
- Teaching a concrete tracing SDK as if it were the architecture.

Exceptions:
- Very small scripts may stop at root fields only.
- Internal-only modules may add attachments gradually.
- A library may let the outer boundary assign `errorId` if it does not own logging or projection.
- Test code may override `errorId` and occurrence time for determinism.

Example:

Canonical shape:

```ts
export type AppErrorKind =
  | "business"
  | "infra"
  | "security"
  | "validation";

export type AppErrorData = {
  kind: AppErrorKind;
  code: string;
  message: string;
  details?: unknown;

  context?: {
    service?: string;
    operation?: string;
    target?: {
      kind?: "http" | "db" | "fs" | "queue" | "cache" | "stream";
      name?: string;
      operation?: string;
      resource?: string;
    };
    metadata?: Record<string, unknown>;
  };

  cause?: {
    name?: string;
    code?: string;
    message?: string;
    status?: number;
    requestId?: string;
    correlationId?: string;
    stacktrace?: string;
    metadata?: Record<string, unknown>;
  };

  retry?: {
    allowed?: boolean;
    mode?: "backoff" | "after_remediation" | "none";
    afterMs?: number;
  };

  http?: {
    status?: number;
  };

  telemetry?: {
    errorId?: string;
    traceId?: string;
    correlationId?: string;
    occurredAt?: string;
  };
};
```

Family wrappers can carry the same canonical data:

```ts
import { ulid } from "ulid";

type AppErrorOptions = {
  cause?: unknown;
  originalCause?: unknown;
};

export abstract class AppError<E extends AppErrorData = AppErrorData> extends Error {
  readonly originalCause?: unknown;

  constructor(
    public readonly data: E,
    options: AppErrorOptions = {},
  ) {
    super(data.message, { cause: options.cause });
    this.name = this.constructor.name;
    this.originalCause = options.originalCause ?? options.cause;
  }

  toLogShape(): Record<string, unknown> {
    return {
      kind: this.data.kind,
      code: this.data.code,
      message: this.data.message,
      details: this.data.details,
      context: this.data.context,
      cause: this.data.cause,
      retry: this.data.retry,
      http: this.data.http,
      telemetry: this.data.telemetry,
      name: this.name,
      originalCause: this.originalCause,
      causeChain: this.cause,
    };
  }
}

export class BusinessError<E extends AppErrorData = AppErrorData> extends AppError<E> {}

export function orderNotFound(orderId: string): AppErrorData {
  return {
    kind: "business",
    code: "order.not_found",
    message: "order not found",
    details: { orderId },
    retry: { allowed: false },
    http: { status: 404 },
  };
}

const err = new BusinessError({
  ...orderNotFound("ord_123"),
  telemetry: {
    errorId: ulid(),
    occurredAt: new Date().toISOString(),
  },
});
```

Root `details` is semantic payload. `context.metadata` and `cause.metadata` are internal. Downstream request IDs belong in `cause` / `cause.metadata`. Preserve stacktrace in normalized `cause` when useful, but keep any original runtime cause object reference outside the canonical serialized shape:

```ts
const error: AppErrorData = {
  kind: "infra",
  code: "payments.unavailable",
  message: "payment provider unavailable",
  details: {
    orderId: "ord_123",
  },
  context: {
    service: "billing",
    operation: "authorize_payment",
    target: {
      kind: "http",
      name: "stripe",
      operation: "POST",
      resource: "/v1/payment_intents",
    },
    metadata: {
      workflowStep: "payment_authorization",
    },
  },
  cause: {
    name: "AxiosError",
    code: "ECONNRESET",
    message: "socket hang up",
    status: 503,
    requestId: "req_123",
    correlationId: "stripe_corr_456",
    stacktrace: "AxiosError: socket hang up\n    at ...",
    metadata: {
      retryAfterHeader: "1",
    },
  },
  retry: {
    allowed: true,
    mode: "backoff",
    afterMs: 1000,
  },
  http: {
    status: 503,
  },
  telemetry: {
    errorId: "01HZX9K3M7QABC456DEF789G",
    traceId: "trace_123",
    correlationId: "corr_456",
    occurredAt: "2026-05-03T15:42:11.123Z",
  },
};
```

Read tracing data through an app-owned port or helper:

```ts
interface TracingPort {
  getContext(): {
    traceId?: string;
    correlationId?: string;
  };
}

function withTelemetry<T extends AppErrorData>(
  error: T,
  tracing: TracingPort,
): T {
  const ctx = tracing.getContext();

  return {
    ...error,
    telemetry: {
      ...error.telemetry,
      errorId: error.telemetry?.errorId ?? ulid(),
      traceId: error.telemetry?.traceId ?? ctx.traceId,
      correlationId: error.telemetry?.correlationId ?? ctx.correlationId,
      occurredAt: error.telemetry?.occurredAt ?? new Date().toISOString(),
    },
  };
}
```

Verify:
- Every app-owned error has stable `code`, human-readable `message`, and semantic root `details` when needed.
- `errorId` and occurrence time are assigned when the error is materialized.
- Root `details` stays distinct from `context.metadata` and `cause.metadata`.
- Downstream request IDs / vendor correlation handles are captured in internal cause metadata when available.
- `context` and `cause` are treated as internal-by-default attachments.
- Tracing and correlation data enter through an app-owned abstraction, not a concrete tracing import in canonical examples.
- Public projections start from the root contract and omit internal attachments by default.