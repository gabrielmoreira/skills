---
id: typescript-coding-standards.branded-and-opaque-types
owner: typescript-coding-standards
canonical: true
severity: default
references: [Nominal typing (Scala/Haskell newtype), Branded types (TypeScript Handbook), Opaque types (Flow), addyosmani/agent-skills, ThamJiaHe C-5]
---

# Branded and Opaque Types

Decision: Wrap domain primitives that should not be interchangeable in branded types so the compiler refuses to mix them. `UserId`, `OrderId`, `EmailAddress`, `PositiveNumber` all start as `string` or `number` — branding adds a phantom tag that makes assignment between them a type error.

Use when:
- Multiple `string` IDs of different domain meaning flow through the same code (`userId`, `orderId`, `productId`).
- Numeric quantities with different units coexist (`Cents`, `Dollars`, `Milliseconds`, `Seconds`).
- A primitive value passed validation (parsed email, validated URL, sanitized HTML) and downstream code assumes that.
- A bug shipped because the wrong ID was passed (e.g., `userId` where `orderId` was expected) and the compiler said nothing.
- A team standardizes on "no raw strings/numbers for domain values".

Start here:
- Plain primitives are fine when there is one kind of `string` or `number` in scope and confusion is unlikely.
- Brand once a primitive carries domain semantics that must not mix with another primitive of the same shape.
- Construct branded values only at the boundary that proves the invariant — parser, validator, ID generator.

Escalate when:
- Two or more branded types of the same primitive shape exist (`UserId` vs `OrderId`) — branding is now load-bearing.
- The brand encodes an invariant beyond identity (`PositiveNumber`, `NonEmptyString`, `Email`) — pair with a validator/smart constructor.
- Branded types cross module/package boundaries — export the type and the constructor together.
- The codebase outgrows hand-rolled brands — adopt a `Brand<K, T>` helper and apply consistently.

Complexity ladder:
1. Plain `string`/`number` — fine when only one kind exists.
2. Type alias for documentation: `type UserId = string` — no compile-time protection, just intent.
3. Branded type with smart constructor: `type UserId = string & { readonly __brand: "UserId" }` + `function asUserId(s: string): UserId`.
4. Validated branded type (smart constructor verifies invariant): `function asEmail(s: string): Email | null`.
5. Generic `Brand<K, T>` helper used across many domain primitives: `type Brand<K, T> = K & { readonly __brand: T }`.
6. Library-backed (e.g., `zod`'s `.brand<"...">()`, `effect/Brand`) when integration with parsing earns the dependency.

Do:
- Brand the primitive at the place that proves the invariant — parser, validator, ID factory.
- Pair every branded type with one constructor; downstream code does not cast.
- Name the brand after the domain concept, not the primitive (`UserId`, not `StringUserId`).
- Use `readonly __brand` (or similar) so it cannot be assigned by accident.
- Export the type and the constructor together; consumers cannot fabricate values.
- For numeric units, brand both type and unit (`type Cents = number & { readonly __brand: "Cents" }`).
- Brands are erased at compile time — no runtime cost; they exist only for the compiler.

Avoid:
- Branding everything by reflex — `string` is fine when there is only one in scope.
- Letting downstream code cast into a brand: `value as UserId` defeats the purpose.
- Multiple unrelated constructors for the same brand (each one is a backdoor that bypasses the others' invariants).
- Brands that are merely renames without added meaning (`type Name = string`) — use a comment if you only want documentation.
- Forgetting that branded numbers still arithmetic-coerce to plain `number` — explicit conversions when needed.

Exceptions:
- One-file scripts and prototype code do not need brands.
- When integrating with libraries that take plain primitives, you may unbrand at the call site (a single explicit cast inside a wrapper is acceptable).
- Discriminated unions handle "tagged variant" cases; brands are for "same shape, different meaning".

Example:

Branded type with smart constructor (Pattern from addyosmani/agent-skills, ThamJiaHe C-5):

```ts
type UserId  = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

// SAFETY: brand is purely nominal — any string is a UserId by definition.
function asUserId(s: string): UserId   { return s as UserId; }
// SAFETY: brand is purely nominal — any string is an OrderId by definition.
function asOrderId(s: string): OrderId { return s as OrderId; }

function getUser(id: UserId)   { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const u = asUserId("u_123");
const o = asOrderId("o_456");

getUser(u);  // ok
getOrder(o); // ok
getUser(o);  // ts error: argument of type 'OrderId' is not assignable to parameter of type 'UserId'
getUser("u_123"); // ts error: 'string' is not assignable to 'UserId'
```

Generic `Brand<K, T>` helper (Pattern from Jeffallan/typescript-pro):

```ts
type Brand<K, T> = K & { readonly __brand: T };

type UserId    = Brand<string, "UserId">;
type Email     = Brand<string, "Email">;
type Cents     = Brand<number, "Cents">;
type Milliseconds = Brand<number, "Milliseconds">;
```

Validated brand — constructor proves the invariant:

```ts
type Email = Brand<string, "Email">;

function asEmail(raw: string): Email | null {
  const trimmed = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  // SAFETY: regex above proves the Email invariant; cast carries the proof into the brand.
  return trimmed as Email;
}

// downstream is guaranteed: any Email value passed validation
function sendWelcome(to: Email) { /* ... */ }

const maybe = asEmail(userInput);
if (maybe === null) return badRequest("invalid email");
sendWelcome(maybe);
```

`PositiveNumber` invariant (NeoLabHQ/kaizen):

```ts
type PositiveNumber = Brand<number, "PositiveNumber">;

function asPositive(n: number): PositiveNumber | null {
  // SAFETY: invariant verified above (n > 0); cast carries the proof into the brand.
  return n > 0 ? (n as PositiveNumber) : null;
}

function setRetries(count: PositiveNumber) { /* ... */ }
```

Cross-link with type-narrowing — parsing into a brand:

```ts
function parseUserId(raw: unknown): Result<UserId, "invalid_user_id"> {
  if (typeof raw !== "string" || !raw.startsWith("u_")) {
    return { ok: false, error: "invalid_user_id" };
  }
  // SAFETY: raw is narrowed to string with the "u_" prefix above; cast carries the proof into the brand.
  return { ok: true, value: raw as UserId };
}
```

Verify:
- For each pair of same-shape primitives with different meaning, both are branded — or both are not.
- Each brand has one canonical constructor; no `as Brand` casts at random call sites.
- Smart constructors actually verify the invariant they promise (Email constructor checks email shape, PositiveNumber checks > 0).
- Downstream consumers do not need to re-validate — the brand is the proof.
- Constructors and types are exported together (consumers cannot fabricate values without going through validation).
