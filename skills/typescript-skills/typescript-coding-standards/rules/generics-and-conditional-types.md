---
id: typescript-coding-standards.generics-and-conditional-types
owner: typescript-coding-standards
canonical: true
severity: default
references: [TypeScript Handbook (Generics, Conditional Types, Mapped Types), RightNow-AI/openfang typescript-expert, Jeffallan/typescript-pro advanced-types]
---

# Generics and Conditional Types

Decision: Concrete types first. Reach for generics when two or more callers diverge in type and the shared logic is real. Reach for conditional and mapped types only when a generic alone cannot express the relationship between input and output. Constraints should be the minimum that proves type safety; not the maximum that "documents" intent.

Use when:
- A function or class is being copy-pasted because its only difference is the type it operates on.
- A library API needs to preserve the caller's type through transformations (`pick`, `pluck`, `map`).
- A wrapper around a third-party API needs to track the result shape per overload.
- You see `function f(x: any)` or `function f<T>(x: T): any` — generics started but the type relationship was lost.
- A type expression repeats `string | undefined`, `Promise<X>`, `Partial<X>` inline more than 2-3 times.

Start here:
- Use a concrete type when there is one caller and one shape.
- Use a generic when 2+ callers share logic but differ in type, AND the function preserves the type through its return.
- Constrain the generic with `extends` only as far as needed for the body to typecheck.
- Use built-in utility types (`Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`) before inventing your own.

Escalate when:
- The output type depends on the input type in a structural way (e.g., "if input is array, output is array of the element's mapped type") — conditional type.
- The input is an object and the output is a transformation of its keys (e.g., add prefix, make optional, rename) — mapped type.
- A combinator needs to infer a sub-type from a generic position (e.g., extract the resolved value from `Promise<T>`) — `infer`.
- A generic is being passed through 3+ layers without narrowing — consider whether the abstraction earns its complexity.

Complexity ladder:
1. Concrete type — one caller, one shape, no abstraction needed.
2. Generic with no constraint: `function identity<T>(x: T): T` — preserve the caller's type.
3. Generic with `extends` constraint: `function pick<T extends object, K extends keyof T>(...)` — the body needs to know more about `T`.
4. Built-in utility types: `Pick<T, K>`, `Omit<T, K>`, `Partial<T>`, `Record<K, V>` — do not reinvent.
5. Mapped type: `type Nullable<T> = { [K in keyof T]: T[K] | null }` — transform every property.
6. Conditional type with `infer`: `type AwaitedValue<T> = T extends Promise<infer U> ? U : T` — extract a position from a generic shape.
7. Distributive conditional / template literal types — only when no simpler tool works.

Do:
- Write the concrete version first; refactor to generic when the second caller appears.
- Use the smallest constraint that lets the body typecheck. `T extends object` is rarely the right answer; `T extends { id: string }` or `T extends keyof U` is usually better.
- Name type parameters by what they represent: `T` for "the thing", `K` for "key", `V` for "value", `U` for "the other thing", `R` for return.
- Prefer built-in utility types over hand-rolled equivalents.
- Use `infer` to extract sub-types in conditional types instead of forcing the caller to spell them out.
- For library APIs, preserve the caller's type through the return — never widen to `any` mid-pipeline.
- Document non-obvious conditional/mapped types with one-line comments — the type is the spec.

Avoid:
- Generics with one caller — concrete is clearer.
- `function f<T>(x: T): T` where the body actually needs `T extends string` — the constraint is a lie.
- `function f<T = any>(x: T)` — defaulting to `any` defeats the generic.
- Conditional types where a discriminated union would do (e.g., return type that switches on a literal arg).
- Mapped types that recreate built-in utilities (`type MyPartial<T> = { [K in keyof T]?: T[K] }` = `Partial<T>`).
- 4+ chained conditional types — splitting into named intermediate types is almost always clearer.
- Generic parameters that are only used in one position — concrete type is fine.

Exceptions:
- Library code with many anonymous callers may need generics from day one to avoid breaking changes later.
- Framework integrations (e.g., a typed RPC wrapper) may use deep conditional/mapped types because that's the contract being modelled.
- Code-generation contexts (Zod inference, Prisma client) produce complex types whose shape you do not write by hand.

Example:

Concrete first — one caller:

```ts
function getUserName(user: User): string {
  return user.name;
}
```

Generic when 2+ callers diverge:

```ts
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

const names  = pluck(users, "name");      // string[]
const ages   = pluck(users, "age");       // number[]
const titles = pluck(orders, "title");    // string[] (different T)
```

Generic with minimum constraint:

```ts
// Bad: constraint is too wide; body needs `id` but the type does not require it.
function findById<T>(items: T[], id: string): T | undefined {
  return items.find((x) => (x as any).id === id);  // 'any' tells you the constraint is wrong
}

// Good: constrain to what the body actually needs.
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((x) => x.id === id);
}
```

Built-in utility types over hand-rolled:

```ts
// Bad
type WithoutId<T> = { [K in keyof T as K extends "id" ? never : K]: T[K] };

// Good
type WithoutId<T> = Omit<T, "id">;
```

Mapped type that adds value:

```ts
type Optional<T> = { [K in keyof T]?: T[K] };  // === Partial<T>; just use Partial.

// Real use — transforming values, not keys:
type Stringified<T> = { [K in keyof T]: string };

type UserForm = Stringified<User>;  // every field is now a string for HTML form binding
```

Conditional type with `infer` — extract a position:

```ts
type AwaitedValue<T> = T extends Promise<infer U> ? U : T;

type A = AwaitedValue<Promise<string>>;  // string
type B = AwaitedValue<number>;           // number

// Built-in equivalent: TypeScript ships `Awaited<T>`. Prefer it.
```

Wrapper preserving the caller's type:

```ts
async function withTransaction<T>(db: Db, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await db.begin();
  try {
    const result = await fn(tx);
    await tx.commit();
    return result;
  } catch (e) {
    await tx.rollback();
    throw e;
  }
}

const order = await withTransaction(db, (tx) => insertOrder(tx, input));  // order: Order, no `any` in sight
```

When concrete types beat generics — discriminated union:

```ts
// Tempting: conditional type that switches on a literal argument
type RouteResponse<R extends "user" | "order"> =
  R extends "user" ? User : Order;

function getRoute<R extends "user" | "order">(route: R): RouteResponse<R> { /* ... */ }

// Often clearer: separate functions, or a discriminated union return.
function getUser(): User { /* ... */ }
function getOrder(): Order { /* ... */ }
```

Verify:
- Each generic has at least two callers OR is part of a published API.
- The constraint on each generic is as narrow as the body needs — no `T extends object` if `T extends { id: string }` would do.
- Built-in utility types are used where applicable (`Pick`, `Omit`, `Partial`, `Required`, `Record`, `Awaited`).
- Conditional types are only used when generics + utilities cannot express the relationship.
- 4+ chained conditional types are split into named intermediates.
- The function signature, read alone, tells a caller what the return type will be — no surprises.
