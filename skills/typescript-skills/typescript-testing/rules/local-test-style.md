---
id: typescript-testing.local-test-style
owner: typescript-testing
canonical: true
severity: default
references: [Testing Trophy (Dodds), Arrange-Act-Assert]
---

# Local Test Style

Decision: **Start from the test style the package already has, and extend it before introducing a new testing model.** What a test may assert belongs to `skill://typescript-skills/typescript-testing/rules/contracts-and-characterization.md`.

Use when:
- **You are adding or editing tests in an unfamiliar package.**
- **A change crosses surfaces**, such as a handler plus its config.
- **Existing tests use a local seam.** A resolver, handler, datasource, use case, or API operation.
- **A new style, runner, mocking tool, or E2E layer is being introduced.**
- **Local tests are too weak to protect what changed.**
- **Coverage is being used as the reason to add broad or brittle tests.**

Do:
- **Read the nearby tests and the local test config first.**
- **Add the smallest failing test at the seam that matches the change.**
- **Choose the seam by what changed, never by a fixed proportion.**
  - A focused test at the seam closest to the change.
  - A contract test, when the change is at that boundary.
  - An integration test, only when behaviour crosses a process or framework boundary.
  - A representative consumer test, for a shared library.
  - An E2E suite, only where the package already uses one or the task needs it.
- **Name tests for behaviour**, stating the condition and the result.
- **Use `// Given`, `// When`, `// Then` sections where they help**, and drop them where setup is trivial.
- **Treat a coverage target as guidance**, never as a reason for a brittle test.

Avoid:
- **A vague name.** `works`, `test search`, `handles data`.
- **Replacing the local test culture in a drive-by change.**
- **Widening to repo-wide tests** because focused local ones are inconvenient.
- **Browser-style E2E as the default** where an API or unit seam already covers the behaviour.
- **Buying coverage by asserting helper names, import paths, or private wiring.**

Exceptions:
- **A new seam is fine where the current style cannot observe what changed.**
- **A snapshot-heavy package MAY be improved gradually.** Do not rewrite its strategy unless the task includes that migration.

Example (one instance, not the set):

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
- **Check the test matches nearby style**, unless there is a stated reason to change seam.
- **Check the name states both the behaviour and the condition.**
- **Check the sections improve readability** rather than adding ceremony.
- **Check it would fail for a real regression**, not for a harmless refactor.
