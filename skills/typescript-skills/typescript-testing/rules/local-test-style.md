---
id: typescript-testing.local-test-style
owner: typescript-testing
canonical: true
severity: default
references: [Testing Trophy (Dodds), Arrange-Act-Assert]
---

# Local Test Style

Decision: Start from the package or framework's current test style; extend it before introducing a new testing model.

Use when:
- You are adding or editing tests in an unfamiliar package/module, or the change crosses surfaces (GraphQL plus REST, handler plus config, shared library plus consumer).
- Existing tests use a local seam such as resolver, handler, datasource, use case, composition root, or API operation.
- A new test style, runner, mocking tool, or E2E layer is being introduced, or local tests are too weak to protect the changed behavior.
- Coverage is being discussed as a reason to add broad or brittle tests, or test names/structure make behavior hard to understand, or a shared runtime/library change has representative consumers to test.

Do:
- Inspect nearby tests and local test config first; add the smallest failing test at the seam that matches the change.
- Choose the smallest seam that proves the change: a focused test at the seam closest to the change, then a contract/boundary test when the change is at that boundary, then an integration test only when behavior manifests across process/framework boundaries, then a representative consumer test for shared libraries, then an E2E/browser/API suite only when the package already uses it or the task explicitly needs it — the right seam depends on what changed, not a fixed proportion.
- Use behavior-first test names; use `// Given`, `// When`, `// Then` sections when they improve readability, or a shorter `// When` + `// Then` (or combined `// Given When`) when setup is trivial.
- Treat coverage targets as guidance, not a reason for brittle tests, and respect local package reality when existing tests are weaker than the ideal.

Avoid:
- Vague names like `works`, `test search`, or `handles data`.
- Replacing local test culture wholesale in a drive-by change, or widening to repo-wide tests just because focused local tests are inconvenient.
- Introducing Playwright/browser-style E2E as the default when API or unit seams cover the behavior.
- Adding coverage by asserting helper names, import paths, or private wiring.

Exceptions:
- A new test seam is acceptable when the current local style cannot observe the behavior that changed.
- Snapshot-heavy or integration-heavy packages may be improved gradually; do not rewrite the strategy unless the task includes that migration.
- Use API/browser E2E when the public contract is only visible at that level or the package already owns that style.

Example:

Behavior-first name with sections when helpful (avoid vague names like `works` or `test search`):

```ts
it("returns empty array when no markets match query", async () => {
  // Given
  const query = "missing";
  // When
  const result = await search(query);
  // Then
  expect(result).toEqual([]);
});
```

Verify:
- Check the new test matches nearby test style unless there is a stated reason to change seam.
- Check the name states behavior and condition.
- Check sections improve readability instead of adding ceremony.
- Check the test would fail for a real behavior regression, not a harmless refactor, and that its scope is the narrowest meaningful scope for the changed behavior.
