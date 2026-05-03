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
- You are adding or editing tests in an unfamiliar package/module.
- Existing tests use a local seam such as resolver, handler, datasource, use case, composition root, or API operation.
- A new test style, runner, mocking tool, or E2E layer is being introduced.
- Coverage is being discussed as a reason to add broad or brittle tests.
- Test names or structure make behavior hard to understand.

Start here:
- Inspect nearby tests and local test config first.
- Add the smallest failing test at the seam that matches the change.

Escalate when:
- The change crosses surfaces, such as GraphQL plus REST, handler plus config, or shared library plus consumer.
- Local tests are too weak to protect the changed behavior.
- A shared runtime/library change has representative consumers.
- The existing style is actively hiding the behavior under test.

Complexity ladder (smaller seam first; the right seam depends on what changed, not on a fixed proportion):
1. Focused behavior test at the seam closest to the change, in local style.
2. Contract/boundary test for handler, resolver, datasource, config, or composition root when the change is at that boundary.
3. Integration test when the changed behavior only manifests across process or framework boundaries.
4. Representative consumer test for shared libraries or shared runtime behavior.
5. E2E/browser/API suite only when the package already uses it or the task explicitly needs it.

Do:
- Use behavior-first test names.
- Use `// Given`, `// When`, `// Then` sections when they improve readability.
- Use shorter `// When` + `// Then` or combined `// Given When` when setup is trivial.
- Treat coverage targets as guidance, not a reason for brittle tests.
- Choose the test seam by what behavior changed; do not impose a fixed unit/integration/e2e proportion.
- Respect local package reality when existing tests are weaker than the ideal.

Avoid:
- Vague names like `works`, `test search`, or `handles data`.
- Replacing local test culture wholesale in a drive-by change.
- Introducing Playwright/browser-style E2E as the default when API or unit seams cover the behavior.
- Widening to repo-wide tests just because focused local tests are inconvenient.
- Adding coverage by asserting helper names, import paths, or private wiring.

Exceptions:
- A new test seam is acceptable when the current local style cannot observe the behavior that changed.
- Snapshot-heavy or integration-heavy packages may be improved gradually; do not rewrite the strategy unless the task includes that migration.
- Use API/browser E2E when the public contract is only visible at that level or the package already owns that style.

Example:

Clear behavior-first name with sections when helpful:

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

Shorter shape when setup is trivial:

```ts
test("throws error when API key is missing", () => {
  // When / Then
  expect(() => parseConfig({})).toThrow("API_KEY is required");
});
```

Avoid vague names:

```ts
test("works", () => {});
test("test search", () => {});
```

Verify:
- Check the new test matches nearby test style unless there is a stated reason to change seam.
- Check the name states behavior and condition.
- Check sections improve readability instead of adding ceremony.
- Check the test would fail for a real behavior regression, not a harmless refactor.
- Check validation scope is the narrowest meaningful scope for the changed behavior.
