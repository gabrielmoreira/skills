---
id: typescript-testing.contracts-and-characterization
owner: typescript-testing
canonical: true
severity: hard-gate
references: [Characterization Tests (Feathers), Contract Testing]
---

# Contracts and Characterization

Decision: Test caller-visible contracts and behavior; use characterization tests temporarily when refactoring uncertain behavior.

Use when:
- A test asserts helper names, private fields, file paths, call order, or dependency graph details.
- A refactor changes structure but should preserve behavior, especially when a harmless refactor would currently break the test.
- Existing behavior is uncertain, risky, undocumented, or important-but-messy (config defaults, auth context, downstream mapping, pass-through proxies, globals, hidden imports).
- Config/default/failure shape is the caller-visible contract, or the boundary contract includes failure shape, persistence, emitted events, or public wiring.
- Code currently reads env, globals, hidden imports, framework/transport objects, or mixed runtime concerns.

Do:
- Write the smallest test that proves a caller-visible promise, in the local test style.
- Scale from a focused behavior test for one public promise, to a boundary contract test for returned/failure shape, to a characterization test before a risky refactor, to a temporary internal assertion only when it protects migration safety — then remove or narrow characterization once the new contract is explicit.
- Assert values, failure shape, side effects, public events, persisted output, or observable behavior.
- Write characterization tests before risky refactors: characterize shaky boundaries first, then change structure with the baseline in place.
- Label temporary characterization tests and state what they protect.

Avoid:
- Tests that fail on harmless renames or helper extraction.
- Snapshotting private wiring unless the graph is the public contract.
- Mock assertions that test the mock instead of the code.
- Keeping temporary characterization as permanent design approval.

Exceptions:
- Internal structure may be asserted when it is itself the public contract, migration safety net, or externally consumed artifact.
- Characterization may pin awkward legacy behavior temporarily; include removal/revisit condition.

Example:

Brittle:

```ts
expect(parseConfig.toString()).toContain("readEmailApiKey");
```

Contract-focused:

```ts
expect(() => parseEmailConfig({})).toThrow("EMAIL_API_KEY is required");
expect(parseEmailConfig({ EMAIL_API_KEY: "test-key" })).toEqual({ apiKey: "test-key" });
```

Verify:
- Explain what caller promise each assertion protects.
- Check whether a harmless refactor would fail the test.
- Confirm characterization tests existed before the refactor and are revisited after cutover.
- Confirm the test seam matches local style; if unclear, read `skill://typescript-skills/typescript-testing/rules/local-test-style.md`.
