---
id: typescript-configs.migration
owner: typescript-configs
canonical: true
severity: default
references: [Strangler Fig, Branch by Abstraction]
---

# Config Migration

Decision: **Migrate legacy config reads through an explicit seam that preserves observed behaviour first**, then parse and move callers without changing runtime assumptions along the way. The general cutover policy lives in `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md`.

Use when:
- **Env reads are scattered across feature modules.**
- **Legacy defaults or loading semantics are uncertain**, untested, or inconsistent, and still the live reality.
- **A big-bang rewrite would change behaviour by accident.**
- **Several modules need the same typed decision.**
- **Current behaviour depends on globals or hidden imports** that need characterizing first.

Do:
- **Characterize current behaviour before changing any semantics.**
- **Work the ladder in order.**
  - A characterization test for what happens today.
  - A seam that centralizes the read without changing it.
  - A typed parser behind that seam.
  - Contextual config passed inward to callers.
  - Removal of the old reads and any compatibility alias.
- **Move callers one boundary at a time.**
- **Keep stage and runtime assumptions stable** unless changing them is the task.

Avoid:
- **Rewriting all config and behaviour in one untested step.**
- **Sneaking a requiredness or default change into a mechanical migration.**
- **Preserving permissive legacy behaviour without labelling it temporary.**
- **Leaving raw reads and typed config as two permanent paths.**
- **Introducing a new stage model speculatively.**

Exceptions:
- **Prefer a clean cutover** where the affected code is small, fully owned, and covered.
- **Legacy behaviour MAY be preserved temporarily** where production compatibility requires it, with an owner, tests, and a removal condition.
- **An entrenched naming convention MAY be maintained** on a small compatible path, without deepening it.

Example (one instance, not the set):

```ts
// First, pin what actually happens today, including the surprising part.
test("characterization: empty timeout string falls back to 5000", () => {
  expect(readLegacyTimeout({ EMAIL_TIMEOUT_MS: "" })).toBe(5000);
});

// Then the seam, which changes nothing yet.
export function readEmailRuntimeConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return parseEmailConfig(env);
}
```

Verify:
- **Check tests capture behaviour before the migration and intent after it.**
- **Check stage and runtime assumptions are unchanged**, unless explicitly in scope.
- **Search that old raw reads are removed or explicitly bounded.**
- **Check each temporary fallback has an owner and a removal condition.**
