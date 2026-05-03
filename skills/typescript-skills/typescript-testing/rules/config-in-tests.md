---
id: typescript-testing.config-in-tests
owner: typescript-testing
canonical: true
severity: default
references: [Dependency Injection for Testability]
---

# Config in Tests

Decision: Inject config into tests when the module API allows it; mutate `process.env` only for the config-reading boundary and restore it completely.

Use when:
- Tests set `process.env` to exercise ordinary feature behavior.
- Module tests fail depending on global environment order.
- Config is read during import time.
- A config parser or config boundary is under test.

Start here:
- Pass typed config directly to the unit under test.

Escalate when:
- The test is specifically about reading raw env/config input.
- Legacy import-time config reads cannot be refactored before characterization.
- Several tests repeat env setup for behavior that should accept config.

Complexity ladder:
1. Inject typed config directly.
2. Test config parser with raw env object argument.
3. Mutate `process.env` only inside an isolated config-boundary test helper.
4. Use module reset only for legacy import-time reads during migration.
5. Refactor toward explicit config injection.

Do:
- Pass typed config directly to factories, constructors, or functions.
- Test the config-reading boundary separately.
- If env mutation is necessary, snapshot and restore env around each test.
- Avoid import-time config reads; prefer explicit factory calls.
- Reset module cache only when testing legacy import-time reads.

Avoid:
- Process-wide env mutation for normal behavior tests.
- Tests that depend on test order or previous env state.
- Hidden defaults that make tests pass without explicit config.
- Reusing production config objects in unit tests.

Exceptions:
- Config parser tests should set raw env/input intentionally.
- Legacy code may require env mutation during characterization; isolate it and migrate toward injection.

Example:

Prefer direct injection:

```ts
const sender = makeEmailSender({ apiKey: "test-key", timeoutMs: 100 });
await sender.send("user@example.com");
```

If testing the env boundary, isolate mutation:

```ts
const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});
```

Verify:
- Search tests for `process.env` writes.
- Confirm env mutation is limited to config boundary tests or isolated legacy characterization.
- Confirm tests can run individually and in any order.
