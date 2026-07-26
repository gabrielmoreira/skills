---
id: typescript-coding-standards.type-narrowing-over-assertion
owner: typescript-coding-standards
canonical: true
severity: default
references: [Type Guards (TypeScript Handbook), Parse don't validate (Lexi Lambda)]
---

# Type Narrowing over Assertion

Decision: Prove uncontrolled data at boundaries. Prefer narrowing over assertions in owned logic, but allow a contained assertion when TypeScript cannot express an already-established invariant and runtime validation would add no safety.

Use when:
- Data comes from network, env, user input, files, queues, databases, SDKs, or deserialization.
- `!`, `as unknown as`, `as any`, or suppression bypasses uncertainty.
- Optional or nullable values are accessed without proof.

Do:
- Narrow simple cases with language checks and reusable cases with named type guards.
- Parse complex untrusted shapes once at the boundary.
- Use discriminated unions for related alternatives.
- Keep unavoidable assertions local and document the invariant they rely on.
- Prefer `satisfies` when checking a literal without widening it.

Avoid:
- Assertions that turn `unknown` external input directly into an owned type.
- Double casts, `as any`, and suppressions used only to silence a real mismatch.
- Runtime schemas for trusted local fixtures or values already constructed by typed code.
- Ceremonial guards that duplicate a framework guarantee without improving safety.

Example:

```ts
const payload: unknown = await response.json();
const order = OrderSchema.parse(payload);

const fixture = { status: "paid" } satisfies OrderFixture;
```

Verify:
- Untrusted inputs are parsed or narrowed before use.
- Assertions are rare, local, and backed by a stated invariant.
- Test fixtures stay contained to tests.
- No suppression hides an unresolved contract mismatch.
