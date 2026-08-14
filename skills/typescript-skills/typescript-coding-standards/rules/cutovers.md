---
id: typescript-coding-standards.cutovers
owner: typescript-coding-standards
canonical: true
severity: default
references: [Strangler Fig, Branch by Abstraction, Parallel Change]
---

# Cutovers

Decision: **Default to a clean cutover.** Keep an old and a new path side by side only where a staged migration is genuinely required, and bound it when you do.

Use when:
- **A change replaces an old implementation, name, API, or data path.**
- **Old and new code would coexist** after the change lands.
- **A migration aid is being proposed.** A compatibility alias, a dual write, a flag, a shim.

Do:
- **Update callers to the new path in the same change**, where ownership allows it.
- **Remove what the old path leaves behind.** Aliases, comments, re-exports, and its tests.
- **Give a staged migration all four of these**, or do not stage it.
  - An owner.
  - A boundary.
  - Verification.
  - A removal condition.
- **Make a temporary boundary visible in the name or a comment** where it cannot be removed yet.

Avoid:
- **Leaving an old export because it might be useful.** It will be, to someone who should not use it.
- **A compatibility layer with no removal trigger.**
- **Tests that keep the old behaviour alive by accident.**
- **Staging a migration** when the affected code is fully owned and safe to update now.

Exceptions:
- **Stage it for a shared package, a public API, a data migration, or an operational rollout.**
- **Preserve behaviour first when the legacy contract is uncertain**, then cut over once tests prove the boundary.

Example (one instance, not the set):

```ts
// A staged boundary that says so, and says when it goes.
/** @deprecated remove after the billing service cuts over; owner: payments; drop by the next minor. */
export { chargeCard as legacyChargeCard } from "./charge";
```

Verify:
- **Search for every reference to the old name, path, or API.**
- **Confirm each remaining compatibility piece has an owner and a removal condition.**
- **Run the narrowest tests covering both old caller behaviour and the new path.**
