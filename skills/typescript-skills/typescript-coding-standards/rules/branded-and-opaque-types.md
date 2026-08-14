---
id: typescript-coding-standards.branded-and-opaque-types
owner: typescript-coding-standards
canonical: true
severity: default
references: [Nominal typing (newtype), Branded types (TypeScript Handbook), Opaque types (Flow)]
---

# Branded and Opaque Types

Decision: **Brand a domain primitive that must not be interchangeable with another of the same shape**, so the compiler refuses to mix them. Proving a value is what it claims belongs to `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md`.

Use when:
- **Several string IDs of different meaning flow through the same code.**
- **Numeric quantities with different units coexist.** Cents and dollars, seconds and milliseconds.
- **A primitive passed validation** and downstream code quietly assumes it did.
- **A bug shipped because the wrong same-shaped ID was passed** and the compiler said nothing.

Do:
- **Brand where the invariant is proved.** The parser, the validator, or the ID factory.
- **Pair every branded type with exactly one constructor**, and export them together so nobody can fabricate a value.
- **Name the brand after the domain concept**, not after the primitive underneath it.
- **Make an invariant-bearing constructor actually check the invariant**, returning a nullable or a result when it can fail.
- **Brand both the type and the unit for numbers.**
- **Extract a shared brand helper** once two or three primitives need it.

Avoid:
- **Branding by reflex.** A plain primitive is fine when only one kind is in scope.
- **Casting into a brand downstream.** Only the constructor casts, or the brand means nothing.
- **Several constructors for one brand.** Each is a backdoor around the others' invariants.
- **A brand that is a rename with no added meaning.**
- **Forgetting a branded number still coerces in arithmetic.** Convert explicitly.

Exceptions:
- **A one-file script or a prototype does not need brands.**
- **Unbranding at a library call is fine**, as one explicit cast inside a wrapper.
- **A tagged variant is a different problem.** That belongs to `skill://typescript-skills/typescript-coding-standards/rules/exhaustive-narrowing.md`.

Example (one instance, not the set):

```ts
type UserId  = string & { readonly __brand: "UserId" };
type OrderId = string & { readonly __brand: "OrderId" };

// The brand is nominal only, so the constructor is the single place that casts.
function asUserId(s: string): UserId   { return s as UserId; }
function asOrderId(s: string): OrderId { return s as OrderId; }

getUser(asUserId("u_123"));   // ok
getUser(asOrderId("o_456"));  // error: OrderId is not a UserId
getUser("u_123");             // error: string is not a UserId
```

Verify:
- **For each pair of same-shaped primitives with different meaning, both are branded or neither is.**
- **Check each brand has one canonical constructor**, with no stray casts at callsites.
- **Check an invariant-bearing constructor really checks it.**
- **Check the type and its constructor are exported together.**
