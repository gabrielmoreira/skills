---
id: typescript-coding-standards.type-narrowing-over-assertion
owner: typescript-coding-standards
canonical: true
severity: default
references: [Type Guards (TypeScript Handbook), Parse don't validate (Lexi Lambda)]
---

# Type Narrowing over Assertion

Decision: **Prove uncontrolled data at the boundary, and prefer narrowing over assertion in owned logic.** A contained assertion is allowed where the type system cannot express an invariant that is already established, and a runtime check would add no safety. Stopping two same-shaped values being swapped belongs to `skill://typescript-skills/typescript-coding-standards/rules/branded-and-opaque-types.md`.

Use when:
- **Data arrives from outside the program.** Network, env, user input, files, queues, databases, SDKs, deserialization.
- **An escape hatch is bypassing uncertainty.** A non-null assertion, a double cast, a suppression.
- **An optional or nullable value is accessed with no proof** that it is there.

Do:
- **Narrow a simple case with a language check**, and a reusable one with a named type guard.
- **Parse a complex untrusted shape once, at the boundary.**
- **Use a discriminated union for related alternatives**, so narrowing follows the tag.
- **Keep an unavoidable assertion local**, and write down the invariant it rests on.
- **Prefer `satisfies` when checking a literal** without widening it.

Avoid:
- **An assertion that turns external `unknown` straight into an owned type.** Nothing checked anything.
- **A double cast or a suppression used to silence a real mismatch.**
- **A runtime schema over a trusted local fixture** that typed code already built.
- **A ceremonial guard duplicating a framework guarantee** with no added safety.

Exceptions:
- **An assertion is fine where the invariant was just established** in the lines above and the compiler cannot see it.
- **A generated client MAY be trusted at its own edge**, where its contract is verified elsewhere.

Example (one instance, not the set):

```ts
// Untrusted: parse it once, at the boundary.
const payload: unknown = await response.json();
const order = OrderSchema.parse(payload);

// Trusted and local: check the shape without widening it.
const fixture = { status: "paid" } satisfies OrderFixture;
```

Verify:
- **Check untrusted input is parsed or narrowed before use.**
- **Check assertions are rare, local, and carry a stated invariant.**
- **Check test fixtures stay inside tests.**
- **Check no suppression is hiding an unresolved contract mismatch.**
