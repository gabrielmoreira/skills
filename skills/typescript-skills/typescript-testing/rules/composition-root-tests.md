---
id: typescript-testing.composition-root-tests
owner: typescript-testing
canonical: true
severity: default
references: [Smoke Testing, Integration Testing]
---

# Composition Root Tests

Decision: Test composition roots lightly through public surface or smoke behavior; do not freeze incidental dependency graph details.

Use when:
- Tests inspect private fields, constructed dependency arrays, factory names, or registration order.
- A bootstrap/composition function wires dependencies.
- You need confidence that the app starts with parsed config and selected providers.
- Provider selection is runtime behavior.

Do:
- Boot the root with explicit test config.
- Assert public capabilities exist or a small behavior works; assert provider selection only when selection is an intentional contract.
- Keep detailed behavior tests in the modules that own behavior.
- Test handler behavior through the handler factory with explicit deps — no bootstrap import needed.
- Test scope memoization (same reference = same instance) only when testing bootstrap infra itself.

Avoid:
- Snapshotting entire containers or dependency graphs, or testing every edge in the wiring graph.
- Asserting private field names or constructor order.
- Using composition tests to compensate for untested behavior modules.
- Dynamic-importing bootstrap modules (`await import(...)`) with `vi.resetModules()` to test handler behavior — that is a bootstrap infra test, not a handler test.

Exceptions:
- Plugin registries, public DI containers, or generated wiring may make graph shape a contract.
- Critical startup safety checks may deserve explicit tests for a required dependency being present.

Example:

Handler behavior — test the factory directly, no bootstrap:

```ts
it("creates notes through the lambda adapter", async () => {
  const handler = createNoteLambdaHandlerFactory({
    createNoteUsecase: async (input) => ({ ...input, id: "note-1" }),
    currentUserId: "user-1",
  });
  const response = await handler({ body: JSON.stringify({ title: "Ops" }) });
  expect(response.statusCode).toBe(201);
});
```

Bootstrap infra — scope contract test, separate concern:

```ts
it("returns the same usecase for the same request reference", () => {
  const request = { event: {}, awsContext: undefined };
  expect(resolveCreateNoteUsecase(request)).toBe(resolveCreateNoteUsecase(request));
});
```

Verify:
- Check the test would survive harmless refactors of private wiring.
- Check failure would indicate a real startup or public contract problem.
- Check module behavior has focused tests elsewhere.
