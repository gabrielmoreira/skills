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
- Errors have no durable `code` or correlation identifier.
- New error types add random fields in random places.
- Teams cannot agree what belongs in semantic payload versus diagnostics metadata.
- Logs, traces, and responses cannot be correlated reliably.
- Public responses leak internal context or vendor failure details.

Start here:
- Define one canonical `AppErrorData` shape for the project.
- Keep the root small: `kind`, `code`, `message`, `details`.
- Use `context` for app-facing execution context.
- Use `normalizedCause` for normalized observed cause data.
- Use `metadata`, `retry`, and `http` as explicit extensions instead of overloading the root.
- Keep root `details` serializable and public-shape-friendly by default.
- Keep runtime `cause` outside the canonical serialized shape by default.

Escalate when:
- Multiple packages need to share the same error contract — extract the types into `core/errors` or equivalent.
- Public consumers parse errors programmatically — define a projection strategy and consider RFC 7807 / RFC 9457.
- Tracing and correlation are in place — feed `metadata` from an app-owned tracing or observability port.
- Teams keep adding fields without agreement — review the root versus attachment boundaries before adding more.

Complexity ladder:
1. Root only: `kind`, `code`, `message`, `details`.
2. Add `context` for service, operation, and optional technical target.
3. Add `normalizedCause` for normalized observed cause data.
4. Add `metadata`, `retry`, and `http` when resilience, protocol projection, and observability become real concerns.
5. Add family wrappers and enrichment helpers so callers stop rebuilding the shape manually.

Do:
- Use a stable, app-owned `code` as the machine-readable contract.
- Generate `errorId` when the error is materialized, not only when logging.
- Record occurrence time when the error is materialized, not when the log line is written.
- Keep root `details` for semantic payload that belongs to the error itself.
- Use `normalizedCause` for app-owned normalized cause data such as `type`, `code`, `message`, and `stacktrace`.
- Keep `normalizedCause` close to OpenTelemetry exception fields, adding project-specific `code` only where useful.
- Keep root `code` as the app's stable contract; `normalizedCause.code` is only the observed upstream/runtime code when one exists.
- Use `metadata` for correlation IDs, request IDs, occurrence time, and similar diagnostics metadata.
- Put one-off or vendor-specific extras in `metadata.custom`.
- Capture downstream request IDs and equivalent vendor correlation handles in `metadata` or `metadata.custom`.
- Keep `context` and `normalizedCause` internal by default when projecting outward.
- Preserve runtime `cause` on the wrapper/runtime side when later diagnostics or tracing still need it.
- Prefer ULID or UUID v7 for `errorId`.
- Read tracing and correlation data through an app-owned port or helper, not directly from a vendor API in canonical examples.

Avoid:
- Using `message` as the machine contract.
- Stuffing structured payload into `message`.
- Treating root `details`, `normalizedCause`, and `metadata` as interchangeable.
- Reusing one `errorId` across distinct error occurrences.
- Projecting raw runtime causes, raw response bodies, or stacks to clients by default.
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
  };

  normalizedCause?: {
    type?: string;
    code?: string;
    message?: string;
    stacktrace?: string;
  };

  metadata?: {
    errorId?: string;
    traceId?: string;
    correlationId?: string;
    requestId?: string;
    occurredAt?: string;
    custom?: Record<string, unknown>;
  };

  retry?: {
    allowed?: boolean;
    mode?: "backoff" | "after_remediation" | "none";
    afterMs?: number;
  };

  http?: {
    status?: number;
  };
};
```

Family wrappers can carry the same canonical data while runtime `cause` stays on the wrapper:

```ts
import { ulid } from "ulid";

type AppErrorOptions = {
  cause?: unknown;
};

export abstract class AppError<E extends AppErrorData = AppErrorData> extends Error {
  constructor(
    public readonly data: E,
    options: AppErrorOptions = {},
  ) {
    super(data.message, { cause: options.cause });
    this.name = this.constructor.name;
  }

  toLogShape(): Record<string, unknown> {
    return {
      kind: this.data.kind,
      code: this.data.code,
      message: this.data.message,
      details: this.data.details,
      context: this.data.context,
      normalizedCause: this.data.normalizedCause,
      metadata: this.data.metadata,
      retry: this.data.retry,
      http: this.data.http,
      name: this.name,
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
  metadata: {
    errorId: ulid(),
    occurredAt: new Date().toISOString(),
  },
});
```

Root `details` is semantic payload. `normalizedCause` is the normalized cause summary. `metadata` carries correlation and diagnostics data; `metadata.custom` is the escape hatch for one-off extras. Runtime `cause` stays outside the canonical serialized shape:

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
  },
  normalizedCause: {
    type: "AxiosError",
    code: "ECONNRESET",
    message: "socket hang up",
    stacktrace: "AxiosError: socket hang up\n    at ...",
  },
  // `code` above is the app's stable contract. `normalizedCause.code` here is the observed upstream/runtime code.
  metadata: {
    errorId: "01HZX9K3M7QABC456DEF789G",
    traceId: "trace_123",
    correlationId: "corr_456",
    requestId: "req_123",
    occurredAt: "2026-05-03T15:42:11.123Z",
    custom: {
      vendorCorrelationId: "stripe_corr_456",
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

function withMetadata<T extends AppErrorData>(
  error: T,
  tracing: TracingPort,
): T {
  const ctx = tracing.getContext();

  return {
    ...error,
    metadata: {
      ...error.metadata,
      errorId: error.metadata?.errorId ?? ulid(),
      traceId: error.metadata?.traceId ?? ctx.traceId,
      correlationId: error.metadata?.correlationId ?? ctx.correlationId,
      occurredAt: error.metadata?.occurredAt ?? new Date().toISOString(),
      custom: {
        ...error.metadata?.custom,
      },
    },
  };
}
```

Verify:
- Every app-owned error has stable `code`, human-readable `message`, and semantic root `details` when needed.
- `errorId` and occurrence time are assigned when the error is materialized.
- Root `details` stays distinct from `normalizedCause` and diagnostics `metadata`.
- Downstream request IDs / vendor correlation handles are captured in `metadata` or `metadata.custom` when available.
- Runtime `cause` stays separate from the canonical serialized shape.
- Tracing and correlation data enter through an app-owned abstraction, not a concrete tracing import in canonical examples.
- Public projections start from the root contract and omit internal attachments by default.