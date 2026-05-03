---
id: typescript-boundaries.earned-mapping
owner: typescript-boundaries
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Indirection (GRASP)]
---

# Earned Mapping

Decision: Add a boundary mapper only when it protects a real semantic mismatch, repeated translation, or owned API from external churn.

Use when:
- The same translation appears in more than one owned module.
- Provider semantics differ from local semantics.
- Provider states or fields must be collapsed, expanded, rejected, or renamed for local meaning.
- The provider changes independently from owned code.
- Tests need a stable local contract instead of provider fixtures everywhere.

Start here:
- Do inline translation in the edge module when there is one callsite and the transformation is obvious.

Escalate when:
- Translation repeats.
- Unknown or lossy states need one policy.
- Tests duplicate provider fixtures just to reach local behavior.
- A provider change would touch multiple owned modules.

Complexity ladder:
1. Inline edge translation.
2. Small named mapper in the edge module.
3. Boundary adapter that owns mapper plus provider errors.
4. Local interface only when multiple providers or packages depend on the contract.

Do:
- Keep the mapper near the boundary it protects.
- Map to the smallest local model needed by callers.
- Make lossy translation and unknown states explicit.
- Give the mapper a name that describes direction and boundary.

Avoid:
- A mapper that only renames one field for one callsite.
- A generic `mapData` or `transform` that hides direction and policy.
- Mapping every provider field just because a mapper exists.
- Creating parallel local and provider objects with identical semantics and no boundary pressure.

Exceptions:
- One-callsite mapping is acceptable when it protects a public API, high-churn provider, security-sensitive payload, or complex failure semantics.
- No mapper is needed when external and local shape are honestly identical and remain at the edge.

Example:

Too early:

```ts
function mapUser(providerUser: ProviderUser) {
  return { id: providerUser.id };
}
```

Earned by semantic collapse:

```ts
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
