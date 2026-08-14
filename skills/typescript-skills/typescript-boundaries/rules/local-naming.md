---
id: typescript-boundaries.local-naming
owner: typescript-boundaries
canonical: true
severity: advisory
references: [Ubiquitous Language (DDD), Bounded Context (DDD)]
---

# Local Naming

Decision: **Name an internal model by local meaning, not by the current provider's vocabulary**, unless provider traceability is the local meaning. This rule owns provider-derived naming at the boundary. General naming inside owned code belongs to `skill://typescript-skills/typescript-coding-standards/rules/naming-and-semantic-center.md`.

Use when:
- **A provider field or status appears inside an internal type name.**
- **A provider-shaped name shows up outside an adapter.**
- **A provider word is partly right** but carries extra meaning the app does not want.
- **A model name would become false** if the provider changed.

Do:
- **Name what the app promises or needs**, not what the vendor calls it.
- **Keep provider names inside adapter modules and metadata fields.**
- **Use local names for collapsed states, derived booleans, and app-facing concepts.**
- **Preserve a provider trace field under an explicit name**, such as `providerStatus`, where it is genuinely needed.

Avoid:
- **Treating provider vocabulary as domain vocabulary by default.**
- **Hiding provider-specific semantics behind a local name** with no translation underneath.
- **Renaming aggressively** where the provider's words are already the clearest local language.

Exceptions:
- **Keep the provider's name for audit, traceability, idempotency keys, raw metadata, or an edge contract.**
- **Use a standard ecosystem term** where it is more recognisable than a local synonym.

Example (one instance, not the set):

```ts
// Bad: the local type is named for a vendor it may outlive.
type StripeCustomerStatus = "active" | "past_due";

// Good: local meaning, with the provider's value kept for tracing.
type BillingStanding = "in_good_standing" | "overdue";
type Account = { standing: BillingStanding; providerStatus: string };
```

Verify:
- **Ask whether the name stays true if the provider is replaced.**
- **Check whether a reader needs provider docs** to follow internal behaviour.
- **Check provider-specific names are confined** to adapters or explicit metadata fields.
