---
id: typescript-coding-standards.generics-and-conditional-types
owner: typescript-coding-standards
canonical: true
severity: default
references: [TypeScript Handbook (Generics, Conditional Types, Mapped Types), RightNow-AI/openfang typescript-expert, Jeffallan/typescript-pro advanced-types]
---

# Generics and Conditional Types

Decision: Concrete types first. Reach for generics when two or more callers diverge in type and the shared logic is real. Reach for conditional and mapped types only when a generic alone can't express the input-to-output relationship. Constraints should be the minimum that proves type safety, not the maximum that "documents" intent.

Use when:
- A function or class is copy-pasted because its only difference is the type it operates on.
- A library API needs to preserve the caller's type through transformations (`pick`, `pluck`, `map`).
- You see `function f(x: any)` or `function f<T>(x: T): any` — a generic started but the type relationship was lost.
- A type expression repeats `string | undefined`, `Promise<X>`, `Partial<X>` inline more than 2-3 times.
- The output type depends structurally on the input (conditional type), transforms the input's keys (mapped type), or a sub-type must be pulled from a generic position (`infer`).

Escalation order: concrete type → unconstrained generic → constrained generic (`extends`) → built-in utility type → mapped type → conditional type with `infer` → distributive/template-literal types (rare). Stop at the first step that solves the problem.

Do:
- Write the concrete version first; refactor to generic only when a second caller with a different type appears.
- Constrain with `extends` to the minimum the body needs — `T extends { id: string }` over `T extends object`.
- Name type parameters by role: `T` the thing, `K` key, `V` value, `U` the other thing, `R` return.
- Prefer built-in utility types (`Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record`, `Awaited`) before inventing equivalents; a mapped type earns its keep only when it transforms values, not when it just re-shapes keys a utility already covers.
- Use `infer` to extract a sub-type in a conditional type instead of making the caller spell it out — check for a built-in first (e.g. `Awaited<T>` over a hand-rolled unwrap).
- Preserve the caller's type through a wrapper's return — never widen to `any` mid-pipeline.
- Document non-obvious conditional/mapped types with a one-line comment — the type is the spec.

Avoid:
- Generics with one caller — concrete is clearer.
- A constraint that's a lie: `function f<T>(x: T): T` where the body actually needs `T extends string`.
- `function f<T = any>(x: T)` — defaulting to `any` defeats the generic.
- Conditional types where a discriminated union or separate functions would do (e.g., return type that switches on a literal arg).
- 4+ chained conditional types, or distributive-conditional/template-literal types when a simpler tool works — split into named intermediates instead.
- A generic parameter used in only one position — concrete is fine even with 2+ callers.
- A generic passed through 3+ layers without narrowing — reconsider whether the abstraction earns its complexity.

Exceptions:
- Library code with many anonymous callers may need generics from day one to avoid breaking changes later.
- Framework integrations (typed RPC wrappers) and code-generation contexts (Zod inference, Prisma client) may require deep conditional/mapped types because that's the contract being modeled.

Example:

Bad — constraint is wider than the body needs, forcing an escape hatch:

```ts
function findById<T>(items: T[], id: string): T | undefined {
  return items.find((x) => (x as any).id === id); // 'any' signals the constraint is wrong
}
```

Good — constrained to exactly what the body uses:

```ts
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((x) => x.id === id);
}
```

Verify:
- Each generic has 2+ callers, or is part of a published API.
- Each constraint is as narrow as the body needs, and type parameter names communicate role (`T`/`K`/`V`/`U`/`R`).
- Built-in utility types are used where applicable instead of hand-rolled equivalents.
- Conditional types appear only where generics + utilities can't express the relationship, and 4+ chains are split into named intermediates.
