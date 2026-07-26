---
id: typescript-boundaries.local-naming
owner: typescript-boundaries
canonical: true
severity: advisory
references: [Ubiquitous Language (DDD), Bounded Context (DDD)]
---

# Local Naming

Decision: Name internal models by local meaning, not by the current provider's vocabulary, unless provider traceability is the local meaning. Owns provider-derived naming at boundary translation — for general naming choices in owned code, read `skill://typescript-skills/typescript-coding-standards/rules/naming-and-semantic-center.md`.

Use when:
- A provider field/status appears in an internal type name.
- Local code has names like `StripeCustomer`, `WebhookPayload`, or `ProviderStatus` outside adapters.
- A provider word is partially correct but carries extra semantics.
- A model name would become false if the provider changed.

Do:
- Choose names that describe what the app promises or needs.
- Keep provider names in adapter modules and metadata fields.
- Use local names for collapsed states, derived booleans, and app-facing concepts.
- Preserve provider trace fields with explicit names like `providerStatus` when needed.

Avoid:
- Treating provider vocabulary as domain vocabulary by default.
- Hiding provider-specific semantics behind local names without translation.
- Renaming aggressively when provider words are already the clearest local language.

Exceptions:
- Keep provider names for audit, traceability, idempotency keys, raw metadata, or edge contracts.
- Use standard ecosystem terms when they are more recognizable than a local synonym.

Verify:
- Ask whether the name is still true if the provider changes.
- Check whether a reader needs provider docs to understand internal behavior.
- Check that provider-specific names are confined to adapters or explicit metadata.
