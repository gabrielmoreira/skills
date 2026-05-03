---
id: typescript-coding-standards.exhaustive-narrowing
owner: typescript-coding-standards
canonical: true
severity: default
references: [Discriminated unions (TypeScript Handbook), `never` exhaustiveness check, sealed classes (Kotlin/Scala/Swift), pattern matching (Rust)]
---

# Exhaustive Narrowing

Decision: When a value is a discriminated union, the compiler should prove every variant is handled. Use `switch` over the discriminant with a `default: assertNever(x)` (or equivalent) so adding a new variant produces a compile error at every callsite that must change.

Use when:
- A discriminated union (`{ kind: "a" } | { kind: "b" } | ...`) is being consumed by an `if/else` chain or `switch`.
- A new variant was added but only some callsites were updated and TypeScript said nothing.
- A `default:` branch silently does nothing or returns a generic value.
- A function takes "all the variants" but the body uses `if (x.kind === "a")` / `else { ... assume the rest ... }`.
- Code uses `as never` to silence a switch that the developer thinks is exhaustive.

Start here:
- Use `switch (x.kind)` with one `case` per variant.
- After the cases, `const _exhaustive: never = x;` (or call `assertNever(x)`) to force the compiler to prove all variants are handled.
- Inside each case, the type narrows to that variant — no extra checks needed.

Escalate when:
- Multiple consumers of the same union exist — extract `assertNever` (or `unreachable`) helper once.
- The union is large enough that `switch` becomes long — consider whether the operation belongs on each variant (visitor / pattern method) instead.
- Variants share behavior — extract a function that operates on the common shape, then `switch` only on the differences.
- The "I don't care about all variants" need is real — narrow the input type at the boundary so this consumer only sees the variants it handles.

Complexity ladder:
1. `if` chain on `kind` field — fine for two variants.
2. `switch (x.kind)` — three or more variants.
3. `switch` + `assertNever(x)` default — exhaustiveness becomes a compile error if a variant is added.
4. Extract `assertNever` / `unreachable` helper to a utility module.
5. Visitor pattern (object map keyed by `kind`) — when the same dispatch repeats in multiple consumers.
6. Refine input type before consuming — narrower types remove branches the consumer cannot meet.

Do:
- Use a literal-typed discriminant: `kind: "ok" | "err"`, `type: "create" | "update" | "delete"`.
- Check the discriminant with `switch` (not `if (typeof ...)` chains).
- Add an unreachable default that takes `never` so the compiler enforces exhaustiveness.
- Let TypeScript's narrowing do the work inside each case — no `as Variant` needed.
- Cross-link with `branded-and-opaque-types.md` for "tagged identity"; this rule is for "tagged variant".

Avoid:
- `default: return null` or `default: throw new Error("unhandled")` without `never` — runtime check, not compile-time guarantee.
- `if (x.kind === "a") { ... } else { ... }` with multiple "else" cases collapsed into one branch.
- `switch` with `// no-op` default — a new variant added later is silently ignored.
- `as never` to silence the compiler — the whole point of `never` is that it should be a compile error if reachable.
- Discriminant fields of type `string` or `number` (lose narrowing) — keep them literal unions.
- Mutating the discriminant after creation — narrowing assumes immutability.

Exceptions:
- `default:` with explicit `unknown` handling is acceptable when input genuinely can be unknown (parsing untrusted data) — see `type-narrowing-over-assertion.md`.
- A union with one or two variants may not need ceremony.
- A consumer that legitimately handles only a subset should narrow its input type, not silently ignore other variants.

Example:

Discriminated union with exhaustiveness check:

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rectangle"; width: number; height: number };

function assertNever(x: never): never {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
}

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "square":    return s.side ** 2;
    case "rectangle": return s.width * s.height;
    default:          return assertNever(s); // ← compile error if a variant is added
  }
}
```

Adding a new variant fails to compile until every consumer is updated:

```ts
// add a variant to the union
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number }; // NEW

// area() now fails to compile:
//   Argument of type '{ kind: "triangle"; ... }' is not assignable to parameter of type 'never'.
```

Without `assertNever` the bug is silent:

```ts
function area(s: Shape): number {
  switch (s.kind) {
    case "circle":    return Math.PI * s.radius ** 2;
    case "square":    return s.side ** 2;
    case "rectangle": return s.width * s.height;
    default:          return 0;          // bug — triangle returns 0, no warning
  }
}
```

Visitor pattern when the same dispatch repeats:

```ts
type ShapeVisitor<R> = {
  circle:    (s: Extract<Shape, { kind: "circle"    }>) => R;
  square:    (s: Extract<Shape, { kind: "square"    }>) => R;
  rectangle: (s: Extract<Shape, { kind: "rectangle" }>) => R;
};

function visit<R>(s: Shape, v: ShapeVisitor<R>): R {
  // SAFETY: visitor map is keyed by s.kind, so v[s.kind] expects exactly the variant of s. TypeScript cannot link the keyed lookup back to the union narrowing on its own.
  return (v[s.kind] as (s: Shape) => R)(s);
}

const area = (s: Shape) => visit(s, {
  circle:    (c) => Math.PI * c.radius ** 2,
  square:    (sq) => sq.side ** 2,
  rectangle: (r) => r.width * r.height,
});
```

Narrow input at the boundary instead of ignoring variants:

```ts
// instead of: function processOnlyCircles(s: Shape) { if (s.kind !== "circle") return; ... }
function processCircle(c: Extract<Shape, { kind: "circle" }>) {
  // body sees only circles, no need to handle the others
}
```

React component with exhaustive variants:

```ts
type Status =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; data: Data };

function StatusView({ status }: { status: Status }) {
  switch (status.kind) {
    case "loading": return <Spinner />;
    case "error":   return <ErrorBox message={status.message} />;
    case "ready":   return <DataView data={status.data} />;
    default:        return assertNever(status);
  }
}
```

Verify:
- Every `switch` over a discriminated union has a `default: assertNever(x)` (or equivalent unreachable).
- No `default: return null` / `default: // no-op` for unions you control.
- Every union consumer ends with `assertNever(x)`, an `unreachable(x)`, or a `const _: never = x;` after the `switch`/`if` chain.
- `as never` is not used to silence the exhaustiveness check.
- Discriminant fields are literal unions (`"a" | "b" | "c"`), not bare `string`.
- Consumers that only handle a subset narrow their input type at the boundary.
