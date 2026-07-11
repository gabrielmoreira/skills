---
id: typescript-error-handling.define-app-error-semantics-early
owner: typescript-error-handling
canonical: true
severity: default
references: [App-level error contract design, RFC 9457 Problem Details (obsoletes RFC 7807), W3C Trace Context, ULID / UUID v7]
---

# Define App Error Semantics Early

Decision: Define one canonical, app-owned error model early. Standardize the root semantic contract, normalized cause summary, metadata, projection defaults, and creation helpers before modules invent incompatible error shapes. Runtime `cause` still matters, but it remains the original in-process cause (`Error.cause`), not the serialized project contract.

Use when:
- Starting a new TypeScript service, API, worker, or library.
- Multiple modules need to throw, return, log, classify, and project errors consistently.
- A codebase is drifting into raw `Error`, string throws, ad hoc `Result` variants, and vendor error leakage.
- Teams keep adding inconsistent fields, or multiple packages need to share one durable contract — extract canonical types into a shared `core/errors` package with no reverse dependency.

Do:
- Keep the root focused on the app-owned semantic contract: `kind`, `code`, `message`, `details` (the semantic payload). Treat `context`, `normalizedCause`, `metadata`, `retry`, and `http` as structured attachments, not root-level fields.
- Use `code` as the durable, stable discriminator across packages and boundaries — not raw vendor/runtime codes or subclass identity.
- Use `context.service` / `context.operation` in the app's language, not the vendor's; use `context.target` only when a clear technical target exists.
- Use `normalizedCause` for app-owned normalized cause data, kept close to OpenTelemetry exception fields (`type`, `message`, `stacktrace`, plus a project-specific `code` when useful).
- Use `metadata` for correlation/request identifiers and occurrence time; put one-off or vendor-specific extras in `metadata.custom` instead of inventing new top-level fields.
- Use a dedicated `retry` attachment for retry evaluation and a dedicated `http` attachment for protocol projection — keep both out of the root contract.
- When some context/metadata fields are always needed for an error to be useful, make them explicit or required in the factory/helper signature instead of hoping later composition adds them.
- Preserve runtime `cause` in wrappers when wrapping, so later diagnostics/logging/tracing can still inspect the original error object.
- Prefer family-level wrappers (`AppError`, `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`) as the default runtime wrappers; allow more specific subclasses only when they add clear local value, keeping `code` and canonical data as the shared contract.
- Prefer specialized factories (`orderNotFound(...)`) and object-based enrichment helpers/options as the default ergonomics. Keep nested `withA(withB(withC(...)))` chains as low-level primitives, not the primary API — they hide which fields are available and make callers pass the same cause more than once.

Avoid:
- Letting each module invent its own error shape, or encoding HTTP status, DB driver names, or SDK class names into the root contract.
- Treating root `details`, `normalizedCause`, and `metadata` as the same kind of information, or dumping raw causes, headers, response bodies, secrets, or arbitrary blobs into the canonical shape.
- Treating `normalizedCause.type` / `.code` / `.message` as if they always replace access to runtime `cause` when later diagnostics still need it.
- Defaulting to optional-everything helper signatures when some fields are routinely required in practice — that is an API-shape problem, not only a discipline problem.
- Making subclass identity the primary cross-package contract, or forcing `context.target` when no clear target exists.

Exceptions:
- Very small scripts or throwaway/internal-only utilities may stop at plain `Error` or the root contract only, adding attachments later.
- Pure parsers and validators may still return `Result` directly; the same canonical error data adapts either way.
- A project may choose family wrappers only, or add a few specific subclasses where they clearly help without creating package coupling.

Example:
```ts
export type AppErrorKind = "business" | "infra" | "security" | "validation";

export type AppErrorData = {
  kind: AppErrorKind;
  code: string;
  message: string;
  details?: unknown;
  context?: { service?: string; operation?: string; target?: { kind?: "http" | "db" | "fs" | "queue" | "cache" | "stream"; name?: string; operation?: string; resource?: string } };
  normalizedCause?: { type?: string; code?: string; message?: string; stacktrace?: string };
  metadata?: { errorId?: string; traceId?: string; correlationId?: string; requestId?: string; occurredAt?: string; custom?: Record<string, unknown> };
  retry?: { allowed?: boolean; afterMs?: number };
  http?: { status?: number };
};

// Family wrappers are the default runtime wrappers; keep `code`/data as the real contract.
class AppError<E extends AppErrorData = AppErrorData> extends Error {
  constructor(public readonly data: E, options?: { cause?: unknown }) {
    super(data.message, { cause: options?.cause });
    this.name = "AppError";
  }
}
class BusinessError<E extends AppErrorData = AppErrorData> extends AppError<E> {}
class InfraError<E extends AppErrorData = AppErrorData> extends AppError<E> {}
class SecurityError<E extends AppErrorData = AppErrorData> extends AppError<E> {}
class ValidationError<E extends AppErrorData = AppErrorData> extends AppError<E> {}

export function orderNotFound(input: { orderId: string }): AppErrorData {
  return {
    kind: "business",
    code: "order.not_found",
    message: "order not found",
    details: { orderId: input.orderId },
    http: { status: 404 },
    retry: { allowed: false },
  };
}

// Recommended default: one object-based enrichment helper keeps fields discoverable in one place
// and lets the cause be passed once instead of into every nested `withX(...)` call.
type ErrorOptions = {
  cause?: unknown;
  context?: AppErrorData["context"];
  normalizedCause?: AppErrorData["normalizedCause"];
  metadata?: AppErrorData["metadata"];
  retry?: AppErrorData["retry"];
  http?: AppErrorData["http"];
};

function errorWith<E extends AppErrorData>(error: E, options: ErrorOptions = {}): { data: E; cause?: unknown } {
  const observed = options.cause instanceof Error ? options.cause : undefined;

  return {
    data: {
      ...error,
      context: { ...error.context, ...options.context },
      normalizedCause: {
        ...error.normalizedCause,
        ...options.normalizedCause,
        type: options.normalizedCause?.type ?? error.normalizedCause?.type ?? observed?.name,
        stacktrace: options.normalizedCause?.stacktrace ?? error.normalizedCause?.stacktrace ?? observed?.stack,
      },
      metadata: { ...error.metadata, ...options.metadata } /* retry/http merge the same way */,
    } as E,
    cause: options.cause,
  };
}

function throwError<E extends AppErrorData>(prepared: { data: E; cause?: unknown }): never {
  throw new BusinessError(prepared.data, { cause: prepared.cause }); // real code dispatches by `kind`
}

// Usage: factory first, one enrichment call, cause passed exactly once.
async function requireOrder(orderId: string): Promise<{ id: string }> {
  const found = false;
  if (!found) {
    throwError(
      errorWith(orderNotFound({ orderId }), {
        cause: new Error("db row missing"),
        context: { service: "orders", operation: "require_order" },
        metadata: { requestId: "req_123" },
      }),
    );
  }
  return { id: orderId };
}
```

Verify:
- One canonical app-owned error shape exists project-wide, and the root contract stays stable regardless of propagation style.
- Root `details` stays the semantic payload, distinct from `normalizedCause` and diagnostics `metadata`; runtime `cause` stays internal and separate from the canonical serialized shape.
- Family wrappers are the default runtime wrappers; specific subclasses are optional, not mandatory.
- The same specialized error enriches once (object-based, single cause) and propagates via either `fail(...)` or `throwError(...)`; required fields are explicit at the factory/helper boundary rather than easy to forget.
