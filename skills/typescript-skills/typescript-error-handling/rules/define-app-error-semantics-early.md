---
id: typescript-error-handling.define-app-error-semantics-early
owner: typescript-error-handling
canonical: true
severity: default
references: [App-level error contract design, RFC 7807 Problem Details, W3C Trace Context, ULID / UUID v7]
---

# Define App Error Semantics Early

Decision: Define one canonical, app-owned error model early. Standardize the root semantic contract, normalized cause summary, metadata, projection defaults, and creation helpers before modules invent incompatible error shapes. Runtime `cause` still matters, but it remains the original in-process cause (`Error.cause`), not the serialized project contract.

Use when:
- Starting a new TypeScript service, API, worker, or library.
- Multiple modules need to throw, return, log, classify, and project errors consistently.
- A codebase is drifting into raw `Error`, string throws, ad hoc `Result` variants, and vendor error leakage.
- The team needs one durable error contract that works with either `throw` or `Result`.

Start here:
- Define one canonical `AppErrorData` shape for the project.
- Keep the root focused on the app-owned semantic contract: `kind`, `code`, `message`, `details`.
- Treat `context`, `normalizedCause`, `metadata`, `retry`, and `http` as structured attachments.
- Treat root `details` as the semantic payload of the error.
- Keep runtime `cause` separate from the canonical data shape.
- Normalize cause data into app-owned fields and keep extra diagnostics in metadata instead of overloading the root.
- Add factories and enrichment helpers so callers do not rebuild the whole shape manually.

Escalate when:
- Multiple packages need to share the same error contract — extract the canonical types into a shared `core/errors` package with no reverse dependency.
- Public consumers parse errors programmatically — define projection/redaction rules and an RFC 7807-compatible boundary shape.
- The project needs richer per-boundary behavior — separate protocol projection (`http`) from the root contract instead of stuffing status codes into domain errors.
- Teams keep adding inconsistent fields — review the canonical shape before adding new attachments.

Complexity ladder:
1. Root contract only: `kind`, `code`, `message`, `details`.
2. Add `context` for app-facing execution context.
3. Add `normalizedCause` for normalized cause data (`type`, `code`, `message`, `stacktrace`).
4. Add `metadata`, `retry`, and `http` when diagnostics, resilience, and boundaries need stable structure.
5. Add family wrappers (`AppError`, `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`) and specialized factories once error creation starts repeating.

Do:
- Make the root error contract app-owned and stable.
- Use `code` as the durable discriminator across packages and boundaries.
- Keep root `details` serializable and public-shape-friendly by default.
- Use `context.service` and `context.operation` in the language of the app, not the vendor.
- Use `context.target` for the immediate technical target only when one exists clearly.
- Use `normalizedCause` for app-owned normalized cause data from captured errors or downstream responses.
- Keep `normalizedCause` close to OpenTelemetry-style exception fields: `type`, `message`, `stacktrace`, plus project-specific `code` when useful.
- Use `metadata` for correlation identifiers, request identifiers, occurrence time, and similar diagnostics metadata.
- Put one-off or vendor-specific extras in `metadata.custom` instead of inventing new top-level fields casually.
- Preserve runtime `cause` in wrappers when wrapping, so later in-process diagnostics/logging/tracing can still inspect the original error object.
- Use a dedicated `retry` attachment for retry evaluation instead of scattering booleans across call sites.
- Use a dedicated `http` attachment for HTTP projection instead of making protocol concerns part of the root contract.
- Prefer family-level wrappers as the default runtime wrappers.
- Allow more specific subclasses when they add clear local value, but keep `code` and canonical error data as the shared contract.
- Prefer specialized factories such as `orderNotFound(...)` and helpers such as `withContext(...)`, `withNormalizedCause(...)`, and `withMetadata(...)` over repeated manual object assembly.
- Prefer object-based enrichment helpers or factory options as the default ergonomics; keep nested `withA(withB(withC(...)))` chains as low-level primitives, not the primary API.

- Keep important enrichment fields discoverable at the call site. Teams may decide that some metadata or context fields are always required; helper/factory signatures should make that easy instead of hiding everything behind optional follow-up helpers.

Avoid:
- Letting each module invent its own error shape.
- Using raw vendor/runtime codes as the app's primary contract.
- Encoding HTTP status, database driver names, or SDK class names into the root error contract.
- Treating root `details`, `normalizedCause`, and `metadata` as the same kind of information.
- Dumping raw original causes, raw headers, raw response bodies, secrets, or arbitrary blobs into the canonical shape.
- Treating normalized `normalizedCause.type` / `normalizedCause.code` / `normalizedCause.message` as if they always replace access to runtime `cause` when later diagnostics still need it.
- Making subclass identity the primary cross-package contract.
- Forcing `context.target` when there is no clear technical target.

Exceptions:
- Very small scripts or throwaway utilities may stop at plain `Error` or the root contract only.
- Internal-only code may start with the root contract and add attachments later.
- A project may choose family wrappers only, or may add a few specific subclasses where they clearly help and do not create package coupling.
- Pure parsers and validators may still return `Result` directly; the same canonical error data can be adapted either way.

Example:
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
    afterMs?: number;
  };

  http?: {
    status?: number;
  };
};

type AppResult<T, E extends AppErrorData = AppErrorData> =
  | { ok: true; value: T }
  | { ok: false; error: E };

class AppError<E extends AppErrorData = AppErrorData> extends Error {
  constructor(
    public readonly data: E,
    options?: { cause?: unknown },
  ) {
    super(data.message, { cause: options?.cause });
    this.name = "AppError";
  }
}

class BusinessError<E extends AppErrorData = AppErrorData> extends AppError<E> {}
class InfraError<E extends AppErrorData = AppErrorData> extends AppError<E> {}
class SecurityError<E extends AppErrorData = AppErrorData> extends AppError<E> {}
class ValidationError<E extends AppErrorData = AppErrorData> extends AppError<E> {}

function defineError<const T extends AppErrorData>(data: T): T {
  return data;
}

function businessError<const T extends Omit<AppErrorData, "kind">>(data: T) {
  return defineError({ kind: "business", ...data });
}

type ErrorOptions = {
  cause?: unknown;
  context?: AppErrorData["context"];
  normalizedCause?: AppErrorData["normalizedCause"];
  metadata?: AppErrorData["metadata"];
  retry?: AppErrorData["retry"];
  http?: AppErrorData["http"];
};

type PreparedError<E extends AppErrorData = AppErrorData> = {
  data: E;
  cause?: unknown;
};

function fail<E extends AppErrorData>(error: E): AppResult<never, E> {
  return { ok: false, error };
}

function toThrowable<E extends AppErrorData>(
  error: E,
  options?: { cause?: unknown },
): AppError<E> {
  switch (error.kind) {
    case "business":
      return new BusinessError(error, options);
    case "infra":
      return new InfraError(error, options);
    case "security":
      return new SecurityError(error, options);
    case "validation":
      return new ValidationError(error, options);
  }
}

// Recommended default: object-based enrichment keeps fields discoverable in one place.
// Low-level `withX(...)` helpers may still exist, but they should not be the primary developer UX.
function errorWith<E extends AppErrorData>(
  error: E,
  options: ErrorOptions = {},
): PreparedError<E> {
  const observed = options.cause instanceof Error ? options.cause : undefined;

  return {
    data: {
      ...error,
      context: {
        ...error.context,
        ...options.context,
        target: {
          ...error.context?.target,
          ...options.context?.target,
        },
      },
      normalizedCause: {
        ...error.normalizedCause,
        ...options.normalizedCause,
        type: options.normalizedCause?.type ?? error.normalizedCause?.type ?? observed?.name,
        message: options.normalizedCause?.message ?? error.normalizedCause?.message ?? observed?.message,
        stacktrace: options.normalizedCause?.stacktrace ?? error.normalizedCause?.stacktrace ?? observed?.stack,
      },
      metadata: {
        ...error.metadata,
        ...options.metadata,
        custom: {
          ...error.metadata?.custom,
          ...options.metadata?.custom,
        },
      },
      retry: {
        ...error.retry,
        ...options.retry,
      },
      http: {
        ...error.http,
        ...options.http,
      },
    },
    cause: options.cause,
  };
}

function failWith<E extends AppErrorData>(
  error: E,
  options: ErrorOptions = {},
): AppResult<never, E> {
  return fail(errorWith(error, options).data);
}

function throwError<E extends AppErrorData>(
  error: E | PreparedError<E>,
): never {
  const prepared = "data" in error ? error : { data: error };
  throw toThrowable(prepared.data, { cause: prepared.cause });
}

export function orderNotFound(input: { orderId: string }) {
  return businessError({
    code: "order.not_found",
    message: "order not found",
    details: { orderId: input.orderId },
    http: { status: 404 },
    retry: { allowed: false },
  });
}

function loadOrder(orderId: string): AppResult<{ id: string }> {
  const found = false;

  if (!found) {
    return failWith(orderNotFound({ orderId }), {
      context: {
        service: "orders",
        operation: "load_order",
        target: {
          kind: "db",
          name: "orders-db",
          operation: "select",
          resource: "orders",
        },
      },
    });
  }

  return { ok: true, value: { id: orderId } };
}

async function requireOrder(orderId: string): Promise<{ id: string }> {
  const found = false;

  if (!found) {
    throwError(
      errorWith(orderNotFound({ orderId }), {
        cause: new Error("db row missing"),
        context: {
          service: "orders",
          operation: "require_order",
          target: {
            kind: "db",
            name: "orders-db",
            operation: "select",
            resource: "orders",
          },
        },
        metadata: {
          requestId: "req_123",
        },
      }),
    );
  }

  return { id: orderId };
}
```

Verify:
- The project has one canonical app-owned error shape.
- The root contract stays stable even when propagation style changes.
- Root `details` is the semantic payload of the error.
- `normalizedCause` stays distinct from diagnostics `metadata`.
- Runtime `cause` remains internal and separate from the canonical data shape.
- Family wrappers are the default runtime wrappers; specific subclasses are optional, not mandatory.
- The same specialized error can be enriched once and propagated via either `fail(...)` or `throwError(...)`.
- Public projections can start from the root contract and omit internal attachments by default.
