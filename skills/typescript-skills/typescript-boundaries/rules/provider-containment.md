---
id: typescript-boundaries.provider-containment
owner: typescript-boundaries
canonical: true
severity: default
references: [Ports and Adapters (Hexagonal Architecture), Anti-Corruption Layer (DDD)]
---

# Provider Containment

Decision: Keep provider, SDK, generated, and external API client shapes at the edge when their names or semantics are not the app's local meaning. This rule owns vendor/SDK/generated types only — for HTTP request/response/transport/env-like raw input, see `rules/raw-input-to-internal-model.md`.

Use when:
- Business logic imports provider, SDK, or generated types, or provider enum/status/field names require provider docs to understand.
- Provider SDK shapes contain fields the application should not expose inward, or the app needs a smaller local view of a larger external shape.
- Owned behavior starts importing provider types, several callsites repeat provider-field checks, or the provider shape is larger or more unstable than the local contract.
- Provider states need local interpretation.

Do:
- Convert external shapes in adapters, controllers, clients, or boundary modules: keep the provider type in one edge module, return a smaller local object, and escalate to a named mapper when translation is repeated or lossy.
- Pass owned local models into behavior code.
- Keep provider-specific fields only where traceability or adapter behavior needs them, and make failure/unknown-state semantics explicit during translation.
- Publish a local interface only when multiple providers or package boundaries require it.

Avoid:
- Letting provider types become domain types by convenience, or passing raw SDK responses into services.
- Copying every provider field into a local model without local meaning.
- Renaming only to hide the provider while preserving foreign semantics.

Exceptions:
- A provider type may stay local to an edge module when no owned behavior depends on it.
- A provider field may be preserved for telemetry/audit if it is named as provider metadata and not used as domain meaning.

Example:

```ts
// Bad: provider semantics leak inward.
import type { Stripe } from "stripe";

export function canShip(intent: Stripe.PaymentIntent) {
  return intent.status === "succeeded";
}

// Good: edge translates to local meaning.
type PaymentSettlement = { paymentId: string; isSettled: boolean; providerStatus: string };

export function toPaymentSettlement(intent: Stripe.PaymentIntent): PaymentSettlement {
  return { paymentId: intent.id, isSettled: intent.status === "succeeded", providerStatus: intent.status };
}
```

Verify:
- Search provider imports outside adapter/edge modules.
- Check that internal model names make sense without provider documentation.
- Check unknown provider states have explicit behavior.
