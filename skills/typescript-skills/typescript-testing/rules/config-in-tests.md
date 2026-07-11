---
id: typescript-testing.config-in-tests
owner: typescript-testing
canonical: true
severity: default
references: [Dependency Injection for Testability]
---

# Config in Tests

Decision: Inject config into tests when the module API allows it. Mutate `process.env` only for the config-reading boundary and restore it completely.

Use when:
- Tests set `process.env` to exercise ordinary feature behavior, or several tests repeat env setup for behavior that should accept config instead.
- Module tests fail depending on global environment order.
- Config is read during import time, including legacy import-time reads that cannot yet be refactored.
- A config parser or config boundary is under test, specifically to exercise raw env/config input.

Do:
- Pass typed config directly to the unit under test — factories, constructors, or functions.
- Scale from direct config injection, to testing the config parser with a raw env object, to isolated `process.env` mutation only inside a config-boundary test helper, to module-cache reset only for legacy import-time reads during migration — then refactor toward explicit injection.
- Test the config-reading boundary separately from ordinary behavior.
- If env mutation is necessary, snapshot and restore env around each test.
- Avoid import-time config reads; prefer explicit factory calls.

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
