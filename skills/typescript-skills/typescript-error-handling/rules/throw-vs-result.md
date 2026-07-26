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
- Writing a new function that may fail, or the project's chosen default style is not visible yet (read `skill://typescript-skills/typescript-error-handling/INDEX.md` first).
- A pull request mixes both styles in the same package and a reviewer asks why.
- Library code throws in a context where consumers were not expecting it.
- A function returns `T | null` for multiple distinct failure modes and the caller cannot tell why it failed — this is usually a sign the failure should be a `Result`/discriminated value, not that the project needs a specific library.
- A new contributor asks "should I throw or return?" — that usually means the project decision is not visible enough.

Do:
- Confirm and stick to the package's chosen default style; reuse the same canonical error data (`AppErrorData` or equivalent) in either style.
- For programmer errors and invariant violations, both styles may still `throw new Error(...)`. For known business/infra/security/validation failures, follow the package default.
- Wrap third-party throws and vendor error shapes at adapter boundaries; never let them become the app's inward contract. Translate once at a real boundary — domain code should not know about HTTP, GraphQL, or RPC status mapping.
- Do not refactor an existing package from `throw` to `Result` or back without an explicit migration decision.

Do (Class-based — recommended default):
- Wrap canonical error data in family wrappers (`AppError`, `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`) and prefer them as the default runtime wrappers; allow more specific subclasses when they add clear local value, but do not require them for every `code`.
- Use `instanceof BusinessError` / `InfraError` / `SecurityError` / `ValidationError` at the boundary, not message matching.

Do (Result-based — only when the project chose this):
- Return a discriminated union with a literal tag (`ok: true | false`) carrying the same canonical error data on the error variant; compose with `map` / `flatMap` when chaining becomes repetitive; unwrap once at the boundary.
- A pure parser with multiple distinct expected failure modes (missing field, wrong type, unknown field) should return this kind of `Result`, not `null` and not a thrown exception — no specific library is required, only the same canonical error data on the failure variant.

Avoid:
- Mixing both styles casually inside the same package.
- `throw "string"` or `throw { message: "..." }`, or `catch (e) { throw e }` with no added context.
- `return null` for multiple distinct failure modes, or `Result<T, E>` where `E = unknown` or `E = string`.
- Rethrowing without preserving runtime `cause` when wrapping.
- Letting unhandled exceptions reach the framework default handler in production.

Exceptions:
- Constructors and factories with no useful failed-value representation may throw in either style; tests may throw assertions — the test runner is the boundary.
- Critical-path performance code may avoid `Result` allocation if documented and justified.
- A pure parser inside a class-based project may still return `Result`; failure is the result, not an exceptional event.

Example:
```ts
type AppErrorData = { kind: "business" | "infra" | "security" | "validation"; code: string; message: string; details?: unknown };
type AppResult<T, E extends AppErrorData = AppErrorData> = { ok: true; value: T } | { ok: false; error: E };

class AppError<E extends AppErrorData = AppErrorData> extends Error {
  constructor(public readonly data: E, options?: { cause?: unknown }) {
    super(data.message, { cause: options?.cause });
  }
}
class BusinessError<E extends AppErrorData = AppErrorData> extends AppError<E> {}

function throwError<E extends AppErrorData>(error: E, options?: { cause?: unknown }): never {
  throw new BusinessError(error, options); // real code dispatches the wrapper by `kind`
}

function orderNotFound(orderId: string): AppErrorData {
  return { kind: "business", code: "order.not_found", message: "order not found", details: { orderId } };
}

// Result usage
function loadOrder(orderId: string): AppResult<{ id: string }> {
  const found = false;
  if (!found) return { ok: false, error: orderNotFound(orderId) };
  return { ok: true, value: { id: orderId } };
}

// Parser with multiple distinct failure modes: Result, not `null`/throw-only.
type ParseError = { kind: "validation"; code: "order.missing_field" | "order.wrong_type"; message: string };

function parseOrder(raw: unknown): AppResult<{ orderId: string }, ParseError> {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: { kind: "validation", code: "order.missing_field", message: "missing order root" } };
  }
  if (!("orderId" in raw) || typeof raw.orderId !== "string") {
    return { ok: false, error: { kind: "validation", code: "order.wrong_type", message: "orderId must be string" } };
  }
  return { ok: true, value: { orderId: raw.orderId } };
}

// Cross-style boundary: class-based service consumes a Result-returning parser, translating once.
async function createOrder(rawBody: unknown) {
  const parsed = parseOrder(rawBody);
  if (!parsed.ok) throwError(parsed.error);
  return persist(parsed.value);
}
```

Verify:
- The package has chosen one default propagation style and the choice is visible to contributors; the same canonical error data flows through either `fail(...)`/`Result` or `throwError(...)`.
- Class-based code uses family wrappers as the default runtime wrappers; specific subclasses, when used, add local value without becoming the only shared contract.
- Result-based code uses explicit discriminants (never falling back to `unknown`/`string` errors) and returns a `Result`, not `null`, for parsers with multiple distinct expected failure modes.
- Cross-style boundaries translate once instead of leaking style decisions everywhere.
