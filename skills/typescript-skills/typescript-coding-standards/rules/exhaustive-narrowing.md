---
id: typescript-coding-standards.exhaustive-narrowing
owner: typescript-coding-standards
canonical: true
severity: default
references: [Discriminated unions (TypeScript Handbook), "`never` exhaustiveness check", sealed classes, pattern matching (Rust)]
---

# Exhaustive Narrowing

Decision: **Model closed variant sets as discriminated unions (like sealed classes) and prove every case is handled.** Adding a variant must fail compilation at each unhandled callsite. Distinguishing same-shaped values belongs to `skill://typescript-skills/typescript-coding-standards/rules/branded-and-opaque-types.md`.

Use when:
- **A discriminated union is consumed by an if-chain or a switch.**
- **A variant was added and only some callsites changed**, with no complaint from the compiler.
- **A default branch silently does nothing**, or returns a generic value.
- **A cast is silencing a switch** the author believes is exhaustive.

Do:
- **Emulate pattern matching using a literal-typed discriminant** dispatched with a switch.
- **Enforce a `never` exhaustiveness check in the default branch**, or call an `assertNever` helper.
- **Let narrowing do the work inside each case.** No cast is needed there.
- **Extract a shared `assertNever` helper** once several consumers need it.
- **Consider a map keyed by the discriminant** where the same dispatch repeats across consumers.
- **Narrow the input type at the boundary** where a consumer legitimately handles only a subset.

Avoid:
- **A default that returns or throws with no `never` assignment.** That is a runtime check, not a compile-time guarantee.
- **Collapsing several cases into one generic branch**, which swallows the variant added next year.
- **Casting to `never` to silence the compiler.** Reaching it is supposed to be the error.
- **A discriminant typed as a bare string or number**, which loses narrowing entirely.

Exceptions:
- **An explicit unknown branch is fine where the input genuinely can be unknown**, such as parsing untrusted data.
- **A union of one or two variants MAY skip the ceremony.**

Example (one instance, not the set):

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function assertNever(x: never): never {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
}

// Good: adding a variant fails to compile right here.
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default:       return assertNever(s);
  }
}

// Bad: the same new variant silently returns 0.
function areaSilent(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "square": return s.side ** 2;
    default:       return 0;
  }
}
```

Verify:
- **Check every switch over an owned union ends in a `never` assignment.**
- **Check no default returns a placeholder** for a union you control.
- **Check discriminants are literal unions**, not bare strings.
- **Check a partial consumer narrows its input** rather than ignoring variants.
