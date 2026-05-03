---
id: typescript-coding-standards.cutovers
owner: typescript-coding-standards
canonical: true
severity: default
references: [Strangler Fig, Branch by Abstraction, Parallel Change]
---

# Cutovers

Decision: Default to a clean cutover; keep old and new paths together only when staged migration is required and bounded.

Use when:
- A change replaces an old implementation, name, API, or data path.
- Both old and new code would coexist.
- Compatibility aliases, dual writes, feature flags, or migration shims are proposed.

Do:
- Update callers to the new path in the same change when ownership allows.
- Remove obsolete aliases, comments, re-exports, and tests.
- Keep a staged migration only with an owner, boundary, verification, and removal condition.
- Make the temporary boundary explicit in names or comments if it cannot be removed now.

Avoid:
- Leaving old exports because they might be useful.
- Long-lived compatibility layers without a removal trigger.
- Tests that keep both old and new behavior alive accidentally.
- Incremental migration when the affected code is fully owned and safe to update now.

Exceptions:
- Use staged migration for shared packages, public APIs, data migrations, operational rollout, or high-risk behavior that needs characterization first.
- Preserve behavior first when refactoring legacy code with uncertain contracts; then cut over once tests prove the boundary.

Verify:
- Search references for the old name/path/API.
- Confirm every remaining compatibility piece has a stated owner and removal condition.
- Run the narrowest tests covering old caller behavior and new path behavior.
