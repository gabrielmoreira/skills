---
id: typescript-coding-standards.generics-and-conditional-types
owner: typescript-coding-standards
canonical: true
severity: default
references: [TypeScript Handbook (Generics, Conditional Types, Mapped Types)]
---

# Generics and Conditional Types

Decision: **Concrete types first.** Reach for a generic once two callers diverge in type and the shared logic is real, and for a conditional or mapped type only where a generic alone cannot express the relationship.

Use when:
- **A function is copy-pasted** and the only difference is the type it works on.
- **An API must preserve the caller's type** through a transformation.
- **A generic started and the relationship was lost**, ending in `any`.
- **The same type expression repeats inline** three or more times.
- **The output type depends structurally on the input**, or a sub-type must be pulled out of a generic position.

Do:
- **Write the concrete version first.** Refactor when a second caller with a different type appears.
- **Stop at the first step of this ladder that solves it.**
  - A concrete type.
  - An unconstrained generic.
  - A constrained generic.
  - A built-in utility type.
  - A mapped type.
  - A conditional type with inference.
- **Constrain to the minimum the body needs**, not the maximum that documents intent.
- **Name type parameters by role**, so a reader knows which is the key and which is the value.
- **Prefer a built-in utility** before inventing an equivalent.
- **Preserve the caller's type through a wrapper's return.** Never widen mid-pipeline.
- **Comment a non-obvious conditional type.** The type is the specification.

Avoid:
- **A generic with one caller.** Concrete is clearer.
- **A constraint that lies**, forcing an escape hatch inside the body.
- **A generic defaulted to `any`**, which defeats the point of having one.
- **A conditional type where a union or two functions would do.**
- **Four or more chained conditionals.** Split them into named intermediates.
- **A generic threaded through three layers without narrowing.**

Exceptions:
- **Library code with anonymous callers MAY need generics from day one**, to avoid a breaking change later.
- **A typed RPC wrapper or a code-generation context MAY need deep conditional types**, because that is the contract being modelled.

Example (one instance, not the set):

```ts
// Bad: the constraint is wider than the body needs, so the body needs an escape.
function findById<T>(items: T[], id: string): T | undefined {
  return items.find((x) => (x as any).id === id);
}

// Good: constrained to exactly what the body uses.
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((x) => x.id === id);
}
```

Verify:
- **Check each generic has two or more callers**, or belongs to a published API.
- **Check each constraint is as narrow as the body needs.**
- **Check a built-in utility was used** where one applies.
- **Check conditional types appear only where simpler tools cannot express the relationship.**
