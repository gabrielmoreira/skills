---
id: typescript-error-handling.define-app-error-semantics-early
owner: typescript-error-handling
canonical: true
severity: default
references: [App-level error contract design, RFC 7807 Problem Details, W3C Trace Context, ULID / UUID v7]
---

# Define App Error Semantics Early

Decision: Define one canonical, app-owned error model early. Standardize the root error contract, structured attachments, projection defaults, and creation helpers before modules invent incompatible error shapes.

Use when:
- Starting a new TypeScript service, API, worker, or library.
- Multiple modules need to throw, return, log, classify, and project errors consistently.
- A codebase is drifting into raw `Error`, string throws, ad hoc `Result` variants, and vendor error leakage.
- The team needs one durable error contract that works with either `throw` or `Result`.

Start here:
- Define one canonical `AppErrorData` shape for the project.
- Keep the root focused on the app-owned semantic contract: `kind`, `code`, `message`, `details`.
- Treat `context`, `cause`, `retry`, `http`, and `telemetry` as structured attachments.
- Treat root `details` as the semantic payload of the error.
- Treat `context` and `cause` as internal-by-default attachments.
- Normalize `cause` into app-owned fields, preserve runtime-native stacktrace internally when useful, and optionally retain the original cause object reference while still in-process.
- Add factories and enrichment helpers so callers do not rebuild the whole shape manually.

Escalate when:
- Multiple packages need to share the same error contract — extract the canonical types into a shared `core/errors` package with no reverse dependency.
- Public consumers parse errors programmatically — define projection/redaction rules and an RFC 7807-compatible boundary shape.
- The project needs richer per-boundary behavior — separate protocol projection (`http`) from the root contract instead of stuffing status codes into domain errors.
- Teams keep adding inconsistent fields — review the canonical shape before adding new attachments.

Complexity ladder:
1. Root contract only: `kind`, `code`, `message`, `details`.
2. Add `context` for app-facing execution context.
3. Add `cause` for normalized observed failure signals from adapters and dependencies.
4. Add `retry`, `http`, and `telemetry` when resilience, boundaries, and observability need stable structure.
5. Add family wrappers (`AppError`, `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`) and specialized factories once error creation starts repeating.

Do:
- Make the root error contract app-owned and stable.
- Use `code` as the durable discriminator across packages and boundaries.
- Keep root `details` serializable and public-shape-friendly by default.
- Use `context.service` and `context.operation` in the language of the app, not the vendor.
- Use `context.target` for the immediate technical target only when one exists clearly.
- Use `context.metadata` for internal execution metadata.
- Use `cause` for normalized observed data from captured errors or downstream responses.
- Use `cause.metadata` for internal observed-cause metadata.
- Preserve runtime-native cause stacktrace internally when the observed cause provides one.
- Allow an internal original-cause reference for later diagnostics/logging/tracing when the process/runtime boundary still allows it, but keep that reference out of the serialized/public contract by default.
- Use a dedicated `retry` attachment for retry evaluation instead of scattering booleans across call sites.
- Use a dedicated `http` attachment for HTTP projection instead of making protocol concerns part of the root contract.
- Put correlation fields such as `errorId`, `traceId`, `correlationId`, and `occurredAt` in `telemetry`.
- Prefer family-level wrappers as the default runtime wrappers.
- Allow more specific subclasses when they add clear local value, but keep `code` and canonical error data as the shared contract.
- Prefer specialized factories such as `orderNotFound(...)` and helpers such as `withContext(...)`, `withCause(...)`, and `withTelemetry(...)` over repeated manual object assembly.

Avoid:
- Letting each module invent its own error shape.
- Using raw vendor/runtime codes as the app's primary contract.
- Encoding HTTP status, database driver names, or SDK class names into the root error contract.
- Treating root `details`, `context.metadata`, and `cause.metadata` as the same kind of information.
- Dumping stacks, raw headers, raw response bodies, secrets, or arbitrary blobs into the canonical shape.
- Treating normalized `cause.message` / `cause.code` as if they always replace internal stacktrace or later access to the original cause object.
- Serializing the raw original cause object as part of the canonical/public error contract.
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
    metadata?: Record<string, unknown>;
  };

  cause?: {
    name?: string;
    code?: string;
    message?: string;
    status?: number;
    requestId?: string;
    stacktrace?: string;
    metadata?: Record<string, unknown>;
  };

  retry?: {
    allowed?: boolean;
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

type AppResult<T, E extends AppErrorData = AppErrorData> =
  | { ok: true; value: T }
  | { ok: false; error: E };

class AppError<E extends AppErrorData = AppErrorData> extends Error {
  readonly originalCause?: unknown;

  constructor(
    public readonly data: E,
    options?: { cause?: unknown; originalCause?: unknown },
  ) {
    super(data.message, { cause: options?.cause });
    this.name = "AppError";
    this.originalCause = options?.originalCause ?? options?.cause;
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

function fail<E extends AppErrorData>(error: E): AppResult<never, E> {
  return { ok: false, error };
}

function toThrowable<E extends AppErrorData>(
  error: E,
  options?: { cause?: unknown; originalCause?: unknown },
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

function withCause<T extends AppErrorData>(
  error: T,
  observed: unknown,
): T {
  const e = observed instanceof Error ? observed : undefined;

  return {
    ...error,
    cause: {
      ...error.cause,
      name: error.cause?.name ?? e?.name,
      message: error.cause?.message ?? e?.message,
      stacktrace: error.cause?.stacktrace ?? e?.stack,
      metadata: {
        ...error.cause?.metadata,
      },
    },
  };
}

function throwError<E extends AppErrorData>(
  error: E,
  options?: { cause?: unknown; originalCause?: unknown },
): never {
  throw toThrowable(error, options);
}

function withContext<T extends AppErrorData>(
  error: T,
  context: AppErrorData["context"],
): T {
  return {
    ...error,
    context: {
      ...error.context,
      ...context,
      target: {
        ...error.context?.target,
        ...context?.target,
      },
      metadata: {
        ...error.context?.metadata,
        ...context?.metadata,
      },
    },
  };
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
    return fail(
      withContext(orderNotFound({ orderId }), {
        service: "orders",
        operation: "load_order",
        target: {
          kind: "db",
          name: "orders-db",
          operation: "select",
          resource: "orders",
        },
      }),
    );
  }

  return { ok: true, value: { id: orderId } };
}

async function requireOrder(orderId: string): Promise<{ id: string }> {
  const found = false;

  if (!found) {
    const observed = new Error("db row missing");

    throwError(
      withCause(
        withContext(orderNotFound({ orderId }), {
          service: "orders",
          operation: "require_order",
          target: {
            kind: "db",
            name: "orders-db",
            operation: "select",
            resource: "orders",
          },
        }),
        observed,
      ),
      { cause: observed, originalCause: observed },
    );
  }

  return { id: orderId };
}
```

Verify:
- The project has one canonical app-owned error shape.
- The root contract stays stable even when propagation style changes.
- Root `details` is the semantic payload of the error.
- `context.metadata` and `cause.metadata` stay internal-by-default.
- Normalized `cause` data can carry stacktrace for internal diagnostics, while any retained original-cause object reference stays internal-only.
- Family wrappers are the default runtime wrappers; specific subclasses are optional, not mandatory.
- The same specialized error can be enriched once and propagated via either `fail(...)` or `throwError(...)`.
- Public projections can start from the root contract and omit internal attachments by default.
