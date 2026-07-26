---
id: typescript-configs.migration
owner: typescript-configs
canonical: true
severity: default
references: [Strangler Fig, Branch by Abstraction]
---

# Config Migration

Decision: Migrate legacy config reads through explicit seams that preserve observed behavior first, then parse and cut over callers without speculatively changing runtime assumptions. This rule owns the config-specific ladder; the general cutover policy (clean cutover by default, staged only when bounded) lives in `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md`.

Use when:
- Env reads are scattered across feature modules, or the same env/config concern appears in several runtime paths.
- Legacy behavior, defaults, or stage/env loading semantics are uncertain, untested, unsafe, or inconsistent but still active runtime reality.
- A big-bang config rewrite would change behavior accidentally.
- Multiple modules need the same typed config decision, or current behavior depends on globals, env loading, or hidden imports that need characterization.

Complexity ladder:
1. Characterization test for current behavior.
2. Seam that centralizes the current read without changing semantics.
3. Typed parser/config behind the seam.
4. Contextual config passed inward to callers.
5. Remove old env reads and compatibility aliases after cutover.

Do:
- Characterize current behavior before changing semantics; keep current stage/runtime assumptions stable unless the task explicitly changes them.
- Introduce a seam that centralizes reads without changing behavior, then add parsing and typed exposure behind the seam.
- Move callers to typed config one boundary at a time.
- Remove old env reads and compatibility aliases after cutover.

Avoid:
- Rewriting all config and behavior in one untested step.
- Sneaking requiredness/default changes into a mechanical migration, or preserving permissive legacy behavior without labeling it temporary.
- Leaving both raw env reads and typed config as permanent paths.
- Introducing a new global stage model speculatively, or renaming/reinterpreting existing stage semantics casually.

Exceptions:
- If the affected code is fully owned, small, and covered, prefer a clean cutover.
- If production compatibility is required, preserve legacy behavior temporarily with owner, tests, and removal/revisit condition.
- Maintaining an entrenched stage/resource naming convention is acceptable when the task only touches a small compatible path; do not deepen it in new paths.

Example:

Characterize legacy fallback before changing it:

```ts
test("characterization: preserves legacy empty timeout fallback during config migration", () => {
  expect(readLegacyTimeout({ EMAIL_TIMEOUT_MS: "" })).toBe(5000);
});
```

Introduce the seam, then move callers:

```ts
export function readEmailRuntimeConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return parseEmailConfig(env);
}
```

Verify:
- Tests capture current behavior before migration and intended behavior after migration.
- Current stage/runtime assumptions are unchanged unless explicitly in scope.
- Search shows old raw env reads are removed or explicitly bounded.
- Each temporary fallback has owner and removal condition.
