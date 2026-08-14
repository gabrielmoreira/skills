---
id: typescript-testing.config-in-tests
owner: typescript-testing
canonical: true
severity: default
references: [Dependency Injection for Testability]
---

# Config in Tests

Decision: **Inject config into the unit under test wherever its API allows it.** Mutate `process.env` only for the config-reading boundary, and restore it completely.

Use when:
- **Tests set `process.env` to exercise ordinary feature behaviour.**
- **Several tests repeat the same env setup** for behaviour that could accept config instead.
- **Module tests pass or fail depending on global environment order.**
- **Config is read at import time**, including legacy reads that cannot be refactored yet.
- **A config parser is under test**, specifically to exercise raw input.

Do:
- **Pass typed config straight to the unit.** A factory, a constructor, or a function.
- **Scale up only as the need appears.**
  - Direct config injection.
  - Testing the parser with a raw env object.
  - Isolated `process.env` mutation, inside a config-boundary helper only.
  - A module-cache reset, only for a legacy import-time read during migration.
- **Test the config-reading boundary separately from ordinary behaviour.**
- **Snapshot and restore env around each test** where mutation is unavoidable.
- **Move toward explicit injection** rather than settling at the env mutation.

Avoid:
- **Process-wide env mutation for a normal behaviour test.**
- **A test that depends on run order or on a previous test's env.**
- **A hidden default that lets a test pass without stating its config.**
- **Reusing a production config object in a unit test.**

Exceptions:
- **A config parser test SHOULD set raw input deliberately.** That is its subject.
- **Legacy code MAY need env mutation during characterization.** Isolate it and migrate.

Example (one instance, not the set):

Prefer direct injection:

```ts
const sender = makeEmailSender({ apiKey: "test-key", timeoutMs: 100 });
await sender.send("user@example.com");
```

Isolate the mutation where the env boundary itself is the subject:

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
- **Search tests for writes to `process.env`.**
- **Confirm any mutation sits in a config-boundary test** or in isolated legacy characterization.
- **Confirm each test runs alone and in any order.**
