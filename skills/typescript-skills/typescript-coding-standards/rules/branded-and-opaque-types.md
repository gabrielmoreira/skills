---
id: typescript-coding-standards.branded-and-opaque-types
owner: typescript-coding-standards
canonical: true
severity: default
references: [Nominal typing (Scala/Haskell newtype), Branded types (TypeScript Handbook), Opaque types (Flow), addyosmani/agent-skills, ThamJiaHe C-5]
---

# Branded and Opaque Types

Decision: Wrap domain primitives that should not be interchangeable in branded types so the compiler refuses to mix them. `UserId`, `OrderId`, `EmailAddress`, `PositiveNumber` all start as `string`/`number` — branding adds a phantom tag that makes assignment between them a type error.

Use when:
- Multiple `string` IDs of different domain meaning flow through the same code (`userId`, `orderId`, `productId`).
- Numeric quantities with different units coexist (`Cents`, `Dollars`, `Milliseconds`).
- A primitive passed validation (parsed email, sanitized HTML) and downstream code assumes that.
- A bug shipped because the wrong same-shaped ID was passed and the compiler said nothing.

Do:
- Brand at the place that proves the invariant — parser, validator, or ID factory — and pair every branded type with exactly one constructor; downstream code never casts.
- Name the brand after the domain concept (`UserId`), not the primitive (`StringUserId`); use `readonly __brand` so it can't be assigned by accident.
- Export the type and its constructor together so consumers can't fabricate values.
- For invariant-bearing brands (`Email`, `PositiveNumber`), make the constructor actually verify the invariant, not just tag the shape — return `T | null` (or a `Result`) when validation can fail.
- For numeric units, brand both type and unit (`type Cents = number & { readonly __brand: "Cents" }`).
- Once 2-3+ domain primitives need branding, extract a shared `type Brand<K, T> = K & { readonly __brand: T }` helper, or adopt a library (`zod`'s `.brand<"...">()`, `effect/Brand`) if parsing integration earns the dependency.

Avoid:
- Branding everything by reflex — plain `string`/`number` is fine when only one kind is in scope.
- Letting downstream code cast into a brand (`value as UserId`) — that defeats the purpose; only the constructor casts.
- Multiple unrelated constructors for the same brand — each is a backdoor around the others' invariants.
- A brand that's a rename with no added meaning (`type Name = string`) — use a comment if only documentation is wanted.
- Forgetting branded numbers still arithmetic-coerce to plain `number` — convert explicitly when needed.

Exceptions:
- One-file scripts and prototypes don't need brands.
- When integrating with a library that takes plain primitives, unbranding at the call site (one explicit cast inside a wrapper) is acceptable.
- Discriminated unions handle "tagged variant"; brands are for "same shape, different meaning" (see `exhaustive-narrowing.md`).

Example:

```ts
type UserId  = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

// SAFETY: brand is purely nominal — any string is a UserId by definition.
function asUserId(s: string): UserId   { return s as UserId; }
// SAFETY: brand is purely nominal — any string is an OrderId by definition.
function asOrderId(s: string): OrderId { return s as OrderId; }

function getUser(id: UserId)   { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

getUser(asUserId("u_123"));   // ok
getUser(asOrderId("o_456"));  // ts error: OrderId not assignable to UserId
getUser("u_123");             // ts error: string not assignable to UserId
```

Verify:
- For each pair of same-shape primitives with different meaning, both are branded, or neither is.
- Each brand has one canonical constructor — no `as Brand` casts at random call sites.
- Smart constructors for invariant-bearing brands actually check the invariant.
- The type and its constructor are exported together.
