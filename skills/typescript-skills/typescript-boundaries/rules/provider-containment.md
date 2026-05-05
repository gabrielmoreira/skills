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
- Business logic imports provider, SDK, or generated types.
- Provider enum/status/field names require provider docs to understand.
- Provider SDK shapes contain fields the application should not expose inward.
- The app needs a smaller local view of a larger external shape.

Start here:
- Keep provider shapes inside the adapter/controller/client when only that edge understands them.

Escalate when:
- Owned behavior starts importing provider types.
- Provider states need local interpretation.
- Several callsites repeat provider-field checks.
- The provider shape is larger or more unstable than the local contract.

Complexity ladder:
1. Provider type stays in one edge module.
2. Edge module returns a smaller local object.
3. Named mapper handles repeated or lossy translation.
4. Adapter boundary owns provider failures, unknown states, and trace metadata.
5. Published local interface only when multiple providers or package boundaries require it.

Do:
- Convert external shapes in adapters, controllers, clients, or boundary modules.
- Pass owned local models into behavior code.
- Keep provider-specific fields only where traceability or adapter behavior needs them.
- Make failure and unknown-state semantics explicit during translation.

Avoid:
- Letting provider types become domain types by convenience.
- Passing raw SDK responses into services.
- Copying every provider field into a local model without local meaning.
- Renaming only to hide the provider while preserving foreign semantics.

Exceptions:
- A provider type may stay local to an edge module when no owned behavior depends on it.
- A provider field may be preserved for telemetry/audit if it is named as provider metadata and not used as domain meaning.

Example:

Bad: provider semantics leak inward.

```ts
import type { Stripe.PaymentIntent } from "stripe";

export function canShip(intent: Stripe.PaymentIntent) {
  return intent.status === "succeeded";
}
```

Good: edge translates to local meaning.

```ts
type PaymentSettlement = {
  paymentId: string;
  isSettled: boolean;
  providerStatus: string;
};

export function toPaymentSettlement(intent: Stripe.PaymentIntent): PaymentSettlement {
  return {
    paymentId: intent.id,
    isSettled: intent.status === "succeeded",
    providerStatus: intent.status,
  };
}
```

Verify:
- Search provider imports outside adapter/edge modules.
- Check that internal model names make sense without provider documentation.
- Check unknown provider states have explicit behavior.
