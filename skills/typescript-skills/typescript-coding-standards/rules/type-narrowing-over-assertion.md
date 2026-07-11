---
id: typescript-coding-standards.type-narrowing-over-assertion
owner: typescript-coding-standards
canonical: true
severity: hard-gate
references: [Type Guards (TypeScript Handbook), Parse don't validate (Lexi Lambda)]
---

# Type Narrowing over Assertion

Decision: Prove the type; do not assert it. Use narrowing, type guards, schema validation, or discriminated unions instead of `!`, `as`, or `as unknown as`.

Use when:
- Code uses `!`, `as Type`, or `as unknown as Type` to silence or force past the compiler.
- Data comes from an uncontrolled source: network, env, user input, database, file, queue, SDK response, deserialization, or a generic container (`unknown`, `Record<string, unknown>`).
- Code accesses an optional property or nullable return without checking it.

Do:
- Narrow with `typeof`, `in`, `instanceof`, truthiness, or equality checks for simple cases; wrap reusable or non-trivial checks in a named type guard (`function isX(v): v is X`).
- For untrusted or complex-shaped input, validate at the boundary (zod, valibot, arktype, io-ts, or a manual parser) and return a typed result once — callers work with the proven type, not raw casts.
- For multiple related shapes, use discriminated unions with exhaustive narrowing (`switch` + `never` default — see `exhaustive-narrowing.md`).
- Build throwing parsers (`parseX`) on top of guards when callers need fail-fast instead of a boolean check; extract a generic type-safe parser once a boundary shape repeats.
- Prefer `satisfies` over a `: Type` annotation when the literal/exact shape matters (config, fixtures, status values) — annotations widen to the union and lose the literal.
- Name guards after the concept they prove: `isValidOrder`, `isRetryableError`.

Avoid:
- `!` on optional access, nullable return, or Map/Array `.get()`.
- `as Type` / `as unknown as Type` / `as any` to tell the compiler what you think the data is instead of proving it.
- Chaining assertions deeper into callers when the boundary parse was skipped — "the schema is stable" is not proof of the parser; the day it changes, every trusting callsite breaks silently, and shorter code is not a reason to skip the check.
- `// @ts-ignore` or `// @ts-expect-error` to mask real type gaps.

Exceptions:
- Test doubles: use a typed builder, `Partial<T>`, or `Pick<T, K>` narrowed to the smallest interface the production code needs (e.g. `Pick<Stripe, "paymentIntents">` instead of `Stripe`), then mock that — raw `as any as T` is not allowed even for one-off vendor-type mocks.
- Framework/library types that are genuinely wrong, or performance-critical paths the compiler can't narrow: allowed with a `// SAFETY:` comment naming the invariant (plus a proving test for the perf case).
- Branded-type smart constructors: `as Brand` is the canonical way to attach a phantom tag, paired with a `// SAFETY:` comment. See `branded-and-opaque-types.md`.

Example:

Bad — assertion hides a real gap:

```ts
const data = await response.json() as OrderResponse;
const email = data.customer!.email;
```

Good — narrowing makes the check visible, with a reusable guard instead of a cast:

```ts
function hasField<K extends string>(obj: object, key: K): obj is Record<K, unknown> {
  return key in obj;
}
function isOrderResponse(raw: unknown): raw is OrderResponse {
  if (typeof raw !== "object" || raw === null) return false;
  return hasField(raw, "orderId") && typeof raw.orderId === "string"
    && hasField(raw, "customer") && typeof raw.customer === "object";
}

const raw = await response.json();
if (!isOrderResponse(raw)) throw new ParseError("invalid order response");
if (!raw.customer?.email) throw new IncompleteProfileError("customer.email");
const email = raw.customer.email; // raw is OrderResponse from here — no assertion needed
```

Better — schema validation for complex or untrusted shapes:

```ts
const OrderResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "confirmed", "shipped"]),
});
type OrderResponse = z.infer<typeof OrderResponseSchema>;

function parseOrderResponse(raw: unknown): OrderResponse {
  return OrderResponseSchema.parse(raw); // throws on mismatch — no cast needed
}
```

`satisfies` proves a value matches a type without widening its literal, unlike an annotation:

```ts
const status = "pending" satisfies Status;   // type: "pending"
const status2: Status = "pending";           // type: Status — literal lost
```

Verify:
- Search for `as `, ` !.`, `!;`, `as unknown`, `as any`, `@ts-ignore`, `@ts-expect-error` outside test files; each hit needs a `// SAFETY:` comment or should be replaced with narrowing.
- Type guards return `v is X` and are reused across boundary callers instead of duplicated inline.
- `satisfies` is used instead of `: Type` where the literal or exact shape matters.
- Boundary parsers return typed results; test mocks/builders stay contained to test files, not leaking into the code under test.
