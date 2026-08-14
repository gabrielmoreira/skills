---
id: typescript-coding-standards.exhaustive-narrowing
owner: typescript-coding-standards
canonical: true
severity: default
references: [Discriminated unions (TypeScript Handbook), "`never` exhaustiveness check", sealed classes (Kotlin/Scala/Swift), pattern matching (Rust)]
---

# Exhaustive Narrowing

Decision: When a value is a discriminated union, the compiler should prove every variant is handled. Use `switch` over the discriminant with a `default: assertNever(x)` (or equivalent) so adding a new variant produces a compile error at every callsite that must change.

Use when:
- A discriminated union (`{ kind: "a" } | { kind: "b" } | ...`) is consumed by an `if/else` chain or `switch`.
- A new variant was added but only some callsites were updated and TypeScript said nothing.
- A `default:` branch silently does nothing or returns a generic value.
- Code uses `as never` to silence a switch the developer thinks is exhaustive.

Do:
- Use a literal-typed discriminant (`kind: "ok" | "err"`) and dispatch with `switch`, not `typeof`/ad-hoc chains.
- After all cases, assign to `never` (`const _exhaustive: never = x;`) or call `assertNever(x)` so a new variant is a compile error, not a runtime surprise.
- Let TypeScript's narrowing do the work inside each case — no `as Variant` needed.
- Extract a shared `assertNever`/`unreachable` helper once multiple consumers need it; if the same dispatch repeats across consumers, consider a visitor (object map keyed by `kind`) instead of repeating `switch`.
- When a consumer legitimately only handles a subset, narrow the *input type* at the boundary (e.g. `Extract<Shape, { kind: "circle" }>`) rather than silently ignoring the rest.
- Cross-link with `branded-and-opaque-types.md` for "tagged identity"; this rule is for "tagged variant."

Avoid:
- `default: return null` / `default: throw new Error(...)` without a `never` assignment — a runtime check, not a compile-time guarantee.
- Collapsing multiple "else" cases into one generic branch, or a no-op default — a variant added later is silently ignored.
- `as never` to silence the compiler — the point of `never` is that reaching it should be a compile error.
- Discriminant fields typed `string`/`number` instead of literal unions (loses narrowing), or mutated after creation.

Exceptions:
- `default:` with explicit `unknown` handling is fine when the input genuinely can be unknown (parsing untrusted data) — see `type-narrowing-over-assertion.md`.
- A union with one or two variants may not need the ceremony.

Example:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rectangle"; width: number; height: number };

function assertNever(x: never): never {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
}
```

Good — exhaustive; adding a variant breaks the build until every consumer updates:

```ts
function area(s: Shape): number {
  switch (s.kind) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "square":    return s.side ** 2;
    case "rectangle": return s.width * s.height;
    default:          return assertNever(s); // adding a variant fails to compile here
  }
}
```

Bad — the same bug is silent without `assertNever`:

```ts
function area(s: Shape): number {
  switch (s.kind) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "square":    return s.side ** 2;
    case "rectangle": return s.width * s.height;
    default:          return 0; // bug — a new variant returns 0, no warning
  }
}
```

Verify:
- Every `switch` over a discriminated union ends in `assertNever(x)` / `unreachable(x)` / `const _: never = x;`.
- No `default: return null` / no-op default for unions you control, and no `as never` silencing the check.
- Discriminant fields are literal unions, not bare `string`.
- Consumers that only handle a subset narrow their input type at the boundary instead of ignoring variants.
