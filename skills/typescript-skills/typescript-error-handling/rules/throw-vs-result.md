---
id: typescript-error-handling.throw-vs-result
owner: typescript-error-handling
canonical: true
severity: default
references: [Java/C# checked exceptions critique, Result/Either type (Rust, Scala, fp-ts), Errors are values (Go), Effect.ts, neverthrow]
---

# Throw vs Result

Decision: Each package picks one default propagation style — class-based (`throw`) or Result-based (`Result<T, E>` discriminated union) — and stays consistent. The canonical error semantics stay the same either way: both styles reuse the same app-owned error data. Throwing for programmer errors and invariant violations is still allowed in both styles.

Use when:
- Writing a new function that may fail.
- The project decision is not visible yet (read `SKILL.md` first).
- A pull request mixes both styles in the same package and a reviewer asks why.
- Library code is throwing in a context where consumers were not expecting it.
- A function returns `T | null` for multiple distinct failure modes and the caller cannot tell why it failed.

Start here:
- Confirm the package's chosen default style.
- Keep the canonical error contract the same either way — reuse `AppErrorData` or the equivalent app-owned error shape.
- For programmer errors and invariant violations, both styles may still `throw new Error(...)`.
- For known business, infra, security, or validation failures, follow the package default.
- Do not refactor an existing package from `throw` to `Result` or back without an explicit migration decision.

Escalate when:
- The codebase mixes both styles inconsistently — bring the package or project decision to the team.
- The chosen style does not fit a specific module — define the boundary where the styles meet and translate once.
- A new contributor asks "should I throw or return?" — that usually means the project decision is not visible enough.

Complexity ladder:
1. Plain `throw new Error("...")` for programmer errors and invariants only.
2. Canonical error data reused in both styles.
3. Class-based propagation: family wrappers around canonical error data.
4. Result-based propagation: discriminated union carrying canonical error data.
5. Cross-style adapter at a real boundary where one style is translated into the other.

Do:
- Pick one propagation style as the default inside each package and stick to it.
- Reuse the same canonical error data in either style.
- Wrap third-party throws and vendor error shapes at adapter boundaries; never let them become the app's inward contract.
- Translate once at a real boundary; domain code should not know about HTTP, GraphQL, or RPC status mapping.

Do (Class-based — recommended default):
- Wrap canonical error data in family wrappers such as `AppError`, `BusinessError`, `InfraError`, `SecurityError`, and `ValidationError`.
- Prefer family wrappers as the default runtime wrappers.
- Allow more specific subclasses when they add clear local value, but do not require them for every `code`.
- Use `instanceof BusinessError` / `InfraError` / `SecurityError` / `ValidationError` at the boundary, not message matching.

Do (Result-based — only when the project chose this):
- Return a discriminated union with a literal tag such as `ok: true | false`.
- Put the same canonical error data on the error variant.
- Compose with helpers such as `map` / `flatMap` when chaining becomes repetitive.
- Unwrap once at the transport or boundary edge.

Avoid:
- Mixing both styles casually inside the same package.
- `throw "string"` or `throw { message: "..." }`.
- `catch (e) { throw e }` with no added context.
- `return null` for multiple distinct failure modes.
- `Result<T, E>` where `E = unknown` or `E = string`.
- Rethrowing without preserving runtime `cause` when wrapping.
- Letting unhandled exceptions reach the framework default handler in production.

Exceptions:
- Constructors and factories with no useful failed-value representation may throw in either style.
- Tests may throw assertions; the test runner is the boundary.
- Critical-path performance code may avoid `Result` allocation if documented and justified.
- A pure parser inside a class-based project may still return `Result`; failure is the result, not an exceptional event.

Example:

```ts
type AppErrorData = {
  kind: "business" | "infra" | "security" | "validation";
  code: string;
  message: string;
  details?: unknown;
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
    default:
      return new AppError(error, options);
  }
}

function throwError<E extends AppErrorData>(
  error: E,
  options?: { cause?: unknown },
): never {
  throw toThrowable(error, options);
}

function orderNotFound(orderId: string): AppErrorData {
  return {
    kind: "business",
    code: "order.not_found",
    message: "order not found",
    details: { orderId },
  };
}

// Result usage
function loadOrder(orderId: string): AppResult<{ id: string }> {
  const found = false;
  if (!found) {
    return fail(orderNotFound(orderId));
  }
  return { ok: true, value: { id: orderId } };
}

// throw usage
async function requireOrder(orderId: string): Promise<{ id: string }> {
  const found = false;
  if (!found) {
    throwError(orderNotFound(orderId));
  }
  return { id: orderId };
}

// Cross-style boundary: class-based service consumes a Result-returning parser.
type ParseError =
  | { kind: "validation"; code: "order.missing_field"; message: string }
  | { kind: "validation"; code: "order.wrong_type"; message: string };

function parseOrder(raw: unknown): AppResult<{ orderId: string }, ParseError> {
  if (typeof raw !== "object" || raw === null) {
    return {
      ok: false,
      error: {
        kind: "validation",
        code: "order.missing_field",
        message: "missing order root",
      },
    };
  }

  if (!("orderId" in raw) || typeof raw.orderId !== "string") {
    return {
      ok: false,
      error: {
        kind: "validation",
        code: "order.wrong_type",
        message: "orderId must be string",
      },
    };
  }

  return { ok: true, value: { orderId: raw.orderId } };
}

async function createOrder(rawBody: unknown) {
  const parsed = parseOrder(rawBody);
  if (!parsed.ok) {
    throwError(parsed.error);
  }
  return persist(parsed.value);
}
```

Verify:
- The package has chosen one default propagation style and the choice is visible to contributors.
- The same canonical error data can flow through either `fail(...)` or `throwError(...)`.
- Class-based code uses family wrappers as the default runtime wrappers.
- Specific subclasses, when used, add local value without becoming the only shared contract.
- Result-based code uses explicit discriminants and never falls back to `unknown` or `string` errors.
- Cross-style boundaries translate once instead of leaking style decisions everywhere.