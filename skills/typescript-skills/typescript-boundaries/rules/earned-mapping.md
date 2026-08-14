---
id: typescript-boundaries.earned-mapping
owner: typescript-boundaries
canonical: true
severity: default
references: [Anti-Corruption Layer (DDD), Indirection (GRASP)]
---

# Earned Mapping

Decision: **Add a boundary mapper only where it protects a real semantic mismatch, a repeated translation, or an owned API from external churn.**

Use when:
- **The same translation appears in more than one owned module.**
- **Tests duplicate provider fixtures** just to reach local behaviour.
- **Provider semantics differ from local semantics.**
- **Provider states or fields must be collapsed, expanded, rejected, or renamed** to carry local meaning.
- **The provider changes independently**, and one change would touch several owned modules.
- **An unknown or lossy state needs a single policy.**

Do:
- **Start inline, in the edge module**, where there is one obvious callsite.
- **Escalate only as the pressure appears.**
  - A small named mapper, once translation repeats.
  - A boundary adapter that also owns provider errors, once failures need one policy.
- **Keep the mapper next to the boundary it protects.**
- **Map to the smallest local model the callers actually need.**
- **Make lossy translation and unknown states explicit.**
- **Name the mapper for its direction and its boundary**, so the reader knows which way it runs.
- **Publish a local interface only when several providers or packages depend on the contract.**

Avoid:
- **A mapper that renames one field for one callsite.**
- **A generic `mapData` or `transform`** that hides both direction and policy.
- **Mapping every provider field** just because a mapper now exists.
- **Parallel local and provider objects with identical semantics** and no boundary pressure between them.

Exceptions:
- **One callsite is enough to earn a mapper** where it protects a public API, a high-churn provider, a security-sensitive payload, or complex failure semantics.
- **No mapper is needed** where the external and local shapes are honestly identical and stay at the edge.

Example (one instance, not the set):

```ts
// Too early: a one-field rename for one callsite.
function mapUser(providerUser: ProviderUser) {
  return { id: providerUser.id };
}

// Earned, because it collapses provider states into local meaning:
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
- **Name the mismatch or the repeated translation the mapper removes.** Being unable to is the finding.
- **Check that deleting it would bring back provider coupling or duplicated policy.**
- **Check tests assert the local contract**, not the provider's object shape.
