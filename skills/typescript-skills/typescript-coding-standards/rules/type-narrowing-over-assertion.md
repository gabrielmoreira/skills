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
- Code uses `!` (non-null assertion) to silence the compiler.
- Code uses `as Type` to force a shape the compiler cannot verify.
- Code uses `as unknown as Type` to bypass type checking entirely.
- Code receives data from an uncontrolled source: network, env, user input, database, file, queue, SDK response, deserialization, or generic container.
- Code accesses an optional property or nullable return and skips the check.

Start here:
- Use `typeof`, `in`, `instanceof`, truthiness checks, or equality narrowing.
- Use a type guard function (`function isX(v): v is X`) when the check is reused or non-trivial.

Escalate when:
- Input is fully untrusted or has a complex shape: use schema validation (zod, valibot, arktype, io-ts, or manual parser returning typed result).
- Multiple related shapes coexist: use discriminated unions with a literal tag field and exhaustive narrowing.
- A library or framework forces a generic container (`unknown`, `any`, `Record<string, unknown>`): parse once at the boundary, return a typed result, and let callers work with the proven type.

Complexity ladder:
1. Simple `typeof` / `instanceof` / truthiness / equality check.
2. `in` operator or property check for structural narrowing.
3. Named type guard function (`function isOrder(v): v is Order`) — reusable across boundaries; throwing parsers compose on top of guards.
4. Schema validation at boundary returning typed result.
5. Discriminated union with exhaustive switch/if-chain.
6. Generic type-safe container or builder when the abstraction earns it.

Do:
- Let the compiler verify the type after narrowing; do not override its judgment.
- Parse unknown data once at the boundary and pass typed results inward.
- Use exhaustive narrowing (`switch` on discriminant, `never` default) for union types.
- Prefer `satisfies` to verify a value matches a type without widening the inferred literal type.
- Prefer `isX(v): v is X` type guards as the reusable narrowing primitive; build throwing parsers (`parseX`) on top of guards when callers need fail-fast.
- Return typed results from parsers and validators instead of asserting the caller's input.
- Name type guard functions after the concept they prove: `isValidOrder`, `isRetryableError`.

Avoid:
- `!` on optional access, nullable return, or Map/Array `.get()`.
- `as Type` to tell the compiler what you think the data is.
- `as unknown as Type` to force an incompatible shape.
- `as any` to silence a type error instead of fixing the mismatch.
- Chaining assertions deeper into code when the boundary parse was skipped.
- Relying on `// @ts-ignore` or `// @ts-expect-error` to mask real type gaps.

Exceptions:
- Test doubles and mocks: allowed when building a partial fake for a complex interface, but prefer typed builders or `Partial<T>` wrappers that make the incompleteness explicit and keep assertions at the test boundary.
- Framework or library types that are genuinely wrong or incomplete: allowed with a `// SAFETY:` comment explaining why the assertion is needed and what guards exist above it.
- Performance-critical paths where the compiler cannot narrow but the value is guaranteed by construction: allowed with a `// SAFETY:` comment and a test proving the invariant.

Example:

Bad: assertion hides a real gap.

```ts
const user = getUser(id) as User;
const email = user.contact!.email;
```

Good: narrowing makes the check visible.

```ts
const user = getUser(id);
if (!user) throw new NotFoundError("user", id);

if (!user.contact?.email) {
  throw new IncompleteProfileError(user.id, "email");
}
const email = user.contact.email;
```

Bad: forcing an unknown response.

```ts
const data = await response.json() as OrderResponse;
```

Good: type guard reusable across boundaries.

```ts
function isOrderResponse(raw: unknown): raw is OrderResponse {
  if (typeof raw !== "object" || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  return typeof obj.orderId === "string"
    && typeof obj.status === "string"
    && typeof obj.total === "number";
}

// usage at boundary
const raw = await response.json();
if (!isOrderResponse(raw)) throw new ParseError("invalid order response");
// raw is OrderResponse from here — no assertion needed
```

Good: throwing parser built on the same guard.

```ts
function parseOrderResponse(raw: unknown): OrderResponse {
  if (!isOrderResponse(raw)) throw new ParseError("invalid order response");
  return raw;
}
```

Better: schema validation.

```ts
const OrderResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "confirmed", "shipped"]),
  total: z.number(),
});

type OrderResponse = z.infer<typeof OrderResponseSchema>;

function parseOrderResponse(raw: unknown): OrderResponse {
  return OrderResponseSchema.parse(raw);
}
```

Acceptable in tests: typed builder instead of raw assertion.

```ts
function makeTestUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-id",
    name: "Test",
    contact: { email: "test@example.com" },
    ...overrides,
  };
}

// instead of: const user = { id: "test-id" } as User;
const user = makeTestUser({ name: "Custom" });

Good: `satisfies` preserves the literal type while verifying the contract.

```ts
type Status = "pending" | "confirmed" | "shipped";

// narrows to literal "pending" and verifies it is a valid Status
const status = "pending" satisfies Status;
//    ^? const status: "pending"

// comparison: annotation widens to the union
const status2: Status = "pending";
//    ^? const status2: Status
```

Good: `satisfies` on config/fixture objects in tests preserves the exact shape.

```ts
const testOrder = {
  orderId: "order-1",
  status: "pending",
  total: 42,
} satisfies OrderResponse;
// testOrder.status is "pending", not string — autocomplete and narrowing work
```

Avoid: annotation that loses the literal you assigned.

```ts
const testOrder: OrderResponse = {
  orderId: "order-1",
  status: "pending",
  total: 42,
};
// testOrder.status is Status ("pending" | "confirmed" | "shipped") — literal lost
```

Verify:
- Search for `as `, ` !.`, `!;`, `as unknown`, `as any`, `@ts-ignore`, `@ts-expect-error` outside test files.
- Check type guards use `v is X` return type and are reused across boundary callers instead of duplicating narrowing logic.
- Check `satisfies` is used instead of `: Type` annotation when the literal or exact shape matters (test fixtures, config constants, status values).
- For each hit in production code, confirm there is a `// SAFETY:` comment with a real justification or replace with narrowing.
- For test files, confirm assertions are contained to test helpers/builders and not leaking into the code under test.
- Check boundary parsers return typed results instead of requiring callers to assert.
