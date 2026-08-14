---
id: typescript-testing.composition-root-tests
owner: typescript-testing
canonical: true
severity: default
references: [Smoke Testing, Integration Testing]
---

# Composition Root Tests

Decision: **Test a composition root lightly, through its public surface or a smoke behaviour, and never freeze incidental dependency graph detail.**

Use when:
- **Tests inspect wiring internals.** Private fields, constructed dependency arrays, factory names, registration order.
- **A bootstrap function wires dependencies together.**
- **You need confidence the app starts** with parsed config and the selected providers.
- **Provider selection is itself runtime behaviour.**

Do:
- **Boot the root with explicit test config.**
- **Assert that public capabilities exist**, or that one small behaviour works.
- **Assert provider selection only where selection is an intentional contract.**
- **Keep detailed behaviour tests in the modules that own the behaviour.**
- **Test a handler through its factory with explicit dependencies.** No bootstrap import is needed for that.
- **Test scope memoization only when the subject is the bootstrap infrastructure itself.**

Avoid:
- **Snapshotting a whole container or dependency graph.**
- **Testing every edge in the wiring graph.**
- **Asserting private field names or constructor order.**
- **Using a composition test to cover behaviour that has no test of its own.**
- **Dynamically importing bootstrap with a module reset to reach handler behaviour.** That is a bootstrap infrastructure test wearing a handler test's name.

Exceptions:
- **A plugin registry, a public container, or generated wiring MAY make graph shape a contract.**
- **A critical startup safety check MAY deserve its own test**, such as a required dependency being present.

Example (one instance, not the set):

Handler behaviour, tested through the factory:

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

Bootstrap infrastructure, which is a separate concern:

```ts
it("returns the same usecase for the same request reference", () => {
  const request = { event: {}, awsContext: undefined };
  expect(resolveCreateNoteUsecase(request)).toBe(resolveCreateNoteUsecase(request));
});
```

Verify:
- **Check the test survives a harmless refactor of private wiring.**
- **Check a failure would point at a real startup or contract problem.**
- **Check the module's own behaviour is tested somewhere focused.**
