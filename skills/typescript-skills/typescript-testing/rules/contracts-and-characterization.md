---
id: typescript-testing.contracts-and-characterization
owner: typescript-testing
canonical: true
severity: hard-gate
references: [Characterization Tests (Feathers), Contract Testing]
---

# Contracts and Characterization

Decision: **Test caller-visible contracts and behaviour, and use characterization tests only as a temporary baseline when refactoring behaviour nobody is sure of.** Where the test goes and what it looks like belongs to `skill://typescript-skills/typescript-testing/rules/local-test-style.md`.

Use when:
- **A test asserts something private.**
  - Helper names or private fields.
  - File paths or call order.
  - Dependency graph detail.
- **A refactor changes structure but should preserve behaviour**, and a harmless refactor would break the test today.
- **Existing behaviour is uncertain, risky, or undocumented.**
  - Config defaults.
  - Auth context.
  - Downstream mapping or pass-through proxies.
- **The caller-visible contract includes more than a return value.**
  - Failure shape.
  - Persistence.
  - Emitted events or public wiring.
- **Code reads env, globals, or transport objects** directly.

Do:
- **Write the smallest test that proves one caller-visible promise.**
- **Scale up only as the pressure appears.**
  - A focused behaviour test for one public promise.
  - A boundary contract test for returned and failure shape.
  - A characterization test before a risky refactor.
  - A temporary internal assertion, only where it protects migration safety.
- **Assert what a caller can observe.**
  - Values and failure shape.
  - Side effects and public events.
  - Persisted output.
- **Characterize the shaky boundary first, then change the structure** with the baseline already in place.
- **Label a temporary characterization test and say what it protects.**
- **Remove or narrow it once the new contract is explicit.**

Avoid:
- **A test that fails on a harmless rename or an extracted helper.**
- **Snapshotting private wiring**, unless the graph really is the public contract.
- **A mock assertion that tests the mock** rather than the code.
- **Keeping characterization as permanent design approval.** It recorded what the code did, not what it should do.

Exceptions:
- **Internal structure MAY be asserted** where it is itself the public contract, a migration safety net, or an externally consumed artifact.
- **Characterization MAY pin awkward legacy behaviour**, with a stated revisit condition.

Example (one instance, not the set):

Brittle, and it breaks on a rename:

```ts
expect(parseConfig.toString()).toContain("readEmailApiKey");
```

Contract-focused:

```ts
expect(() => parseEmailConfig({})).toThrow("EMAIL_API_KEY is required");
expect(parseEmailConfig({ EMAIL_API_KEY: "test-key" })).toEqual({ apiKey: "test-key" });
```

Verify:
- **Say which caller promise each assertion protects.**
- **Check whether a harmless refactor would fail it.**
- **Confirm characterization existed before the refactor**, and is revisited after cutover.
