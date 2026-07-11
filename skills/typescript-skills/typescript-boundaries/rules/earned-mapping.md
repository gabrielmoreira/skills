---
id: typescript-boundaries.earned-mapping
owner: typescript-boundaries
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Indirection (GRASP)]
---

# Earned Mapping

Decision: Add a boundary mapper only when it protects a real semantic mismatch, repeated translation, or an owned API from external churn.

Use when:
- The same translation appears in more than one owned module, or tests duplicate provider fixtures just to reach local behavior.
- Provider semantics differ from local semantics, or provider states/fields must be collapsed, expanded, rejected, or renamed into local meaning.
- The provider changes independently from owned code, and a provider change would touch multiple owned modules.
- Unknown or lossy states need one policy.

Do:
- Do inline translation in the edge module when there is one obvious callsite; escalate to a small named mapper when translation repeats, then to a boundary adapter that also owns provider errors.
- Keep the mapper near the boundary it protects, mapping to the smallest local model needed by callers.
- Make lossy translation and unknown states explicit; name the mapper to describe direction and boundary.
- Publish a local interface only when multiple providers or packages depend on the contract.

Avoid:
- A mapper that only renames one field for one callsite.
- A generic `mapData` or `transform` that hides direction and policy.
- Mapping every provider field just because a mapper exists.
- Creating parallel local and provider objects with identical semantics and no boundary pressure.

Exceptions:
- One-callsite mapping is acceptable when it protects a public API, high-churn provider, security-sensitive payload, or complex failure semantics.
- No mapper is needed when external and local shape are honestly identical and remain at the edge.

Example:

```ts
// Too early: one-field rename for one callsite.
function mapUser(providerUser: ProviderUser) {
  return { id: providerUser.id };
}

// Earned by semantic collapse:
type LocalUserStatus = "active" | "blocked";

function toLocalUserStatus(status: ProviderUser["status"]): LocalUserStatus {
  switch (status) {
    case "enabled":
    case "trialing":
      return "active";
    case "disabled":
    case "fraud_review":
      return "blocked";
  }
}
```

Verify:
- List which mismatch or repeated translation the mapper removes.
- Check that deleting the mapper would reintroduce provider coupling or duplicated policy.
- Check tests assert local contract, not provider object shape unless that is the boundary contract.
