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
- A refactor changes structure but should preserve behavior.
- Existing behavior is uncertain, risky, or undocumented.
- Config/default/failure shape is the caller-visible contract.
- Code currently reads env, globals, hidden imports, framework/transport objects, or mixed runtime concerns.

Start here:
- Write the smallest test that proves a caller-visible promise in the local test style.

Escalate when:
- Legacy behavior is unclear and must be preserved before refactor.
- Current behavior is important but messy, especially around config defaults, auth context, downstream mapping, pass-through proxies, globals, or hidden imports.
- The boundary contract includes failure shape, persistence, emitted events, or public wiring.
- A harmless refactor would currently break the test.

Complexity ladder:
1. Focused behavior test for one public promise.
2. Boundary contract test for returned shape and failure shape.
3. Characterization test before risky refactor.
4. Temporary internal assertion only when it protects migration safety.
5. Remove or narrow characterization after the new contract is explicit.

Do:
- Assert values, failure shape, side effects, public events, persisted output, or observable behavior.
- Write characterization tests before risky refactors.
- Characterize shaky boundaries before refactoring, then change structure with the baseline in place.
- Label temporary characterization tests and state what they protect.
- Replace or narrow characterization tests after the new contract is clear.

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

Temporary characterization:

```ts
test("characterization: preserves legacy empty timeout fallback until config migration", () => {
  expect(parseLegacyTimeout({ EMAIL_TIMEOUT_MS: "" })).toBe(5000);
});
```

Verify:
- Explain what caller promise each assertion protects.
- Check whether a harmless refactor would fail the test.
- Confirm characterization tests existed before the refactor and are revisited after cutover.
- Confirm the test seam matches local style; if unclear, read `rules/local-test-style.md`.
