---
id: typescript-coding-standards.absence-and-defaults
owner: typescript-coding-standards
canonical: true
severity: default
references: [Nullish coalescing (TypeScript Handbook), Optional chaining (MDN), Making illegal states unrepresentable]
---

# Absence and Defaults

Decision: **Give absence a meaning before giving it a default.** `??` and `?.` claim the value may legitimately be missing; `||` claims every falsy value is wrong, which is a different assertion and usually an accidental one. Proving a value is present belongs to `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md`.

Use when:
- **`||` supplies a default** for something that could legitimately be `0`, `""`, or `false`.
- **An optional chain runs through several links**, so `undefined` has more than one possible source.
- **The compiler reports a value is possibly undefined** and the fix under consideration is `!` or a cast.
- **A field is optional because one caller lacks it**, not because absence means something in the domain.

Do:
- **Use `??` where the missing case is `null` or `undefined`.** Reserve `||` for where every falsy value really is invalid, and say which.
- **Name the states absence stands for.** Not yet loaded, not applicable, and not provided are three; one `undefined` cannot carry all three.
- **Keep an optional chain short enough that `undefined` has one source.**
- **Where the value must exist, establish it at the boundary** and carry a type that says so.
- **Make a field optional only where the domain permits absence.**

Avoid:
- **`!` to silence a possibly-undefined diagnostic.**
- **`?.` reaching across a contract the code depends on.** A missing provider field is a contract failure, and that belongs to `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md`.
- **A default chosen to quiet the compiler** rather than to express what missing means.
- **Widening a type with `| undefined` so one caller can omit an argument.**

Exceptions:
- **`||` MAY stand where every falsy value is genuinely invalid**, such as an empty string for a required name.
- **`?.` MAY guard a genuine edge**, provided the absence is reported rather than silently absorbed.

Example (one instance, not the set):

```ts
// 0 is a legitimate limit; `||` would silently replace it.
const limit = options.limit ?? DEFAULT_LIMIT;

// Absence carries meaning, so it is named rather than defaulted away.
type Balance =
  | { state: "loaded"; cents: number }
  | { state: "unavailable"; reason: string };
```

Verify:
- **Check each `||` default**, and confirm every falsy value is invalid there.
- **Check no `!` was added** to satisfy a possibly-undefined diagnostic.
- **Check each optional field is optional because the domain allows absence.**
