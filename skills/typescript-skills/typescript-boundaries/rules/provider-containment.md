---
id: typescript-boundaries.provider-containment
owner: typescript-boundaries
canonical: true
severity: default
references: [Ports and Adapters (Hexagonal Architecture), Anti-Corruption Layer (DDD)]
---

# Provider Containment

Decision: **Keep a provider, SDK, generated, or external client shape at the edge whenever its names or semantics are not the app's local meaning.** This rule owns vendor and generated types. Transport and env-like raw input belong to `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md`.

Use when:
- **Business logic imports a provider, SDK, or generated type.**
- **A provider enum, status, or field name needs provider docs to understand.**
- **An SDK shape carries fields the app should not expose inward.**
- **The app needs a smaller view of a larger external shape.**
- **Several callsites repeat the same provider-field check.**
- **The provider shape is larger or less stable than the local contract.**
- **A provider state needs local interpretation before anything can act on it.**

Do:
- **Convert the external shape at the edge.** An adapter, a controller, a client, or a boundary module.
- **Keep the provider type in one edge module** and return a smaller local object.
- **Escalate to a named mapper** once translation repeats or turns lossy.
- **Pass owned local models into behaviour code.**
- **Keep a provider field only where traceability or adapter behaviour needs it.**
- **Make failure and unknown-state semantics explicit during translation.**
- **Publish a local interface only when several providers or packages depend on the contract.**

Avoid:
- **Letting a provider type become a domain type by convenience.**
- **Passing a raw SDK response into a service.**
- **Copying every provider field into a local model** that has no local meaning for it.
- **Renaming to hide the provider** while keeping its semantics intact.

Exceptions:
- **A provider type MAY stay inside an edge module** where no owned behaviour depends on it.
- **A provider field MAY be preserved for telemetry or audit**, named as provider metadata and never used as domain meaning.

Example (one instance, not the set):

```ts
// Bad: provider semantics leak inward.
import type { Stripe } from "stripe";

export function canShip(intent: Stripe.PaymentIntent) {
  return intent.status === "succeeded";
}

// Good: the edge translates to local meaning.
type PaymentSettlement = { paymentId: string; isSettled: boolean; providerStatus: string };

export function toPaymentSettlement(intent: Stripe.PaymentIntent): PaymentSettlement {
  return { paymentId: intent.id, isSettled: intent.status === "succeeded", providerStatus: intent.status };
}
```

Verify:
- **Search for provider imports outside adapter and edge modules.**
- **Check internal model names make sense without opening provider documentation.**
- **Check an unknown provider state has explicit behaviour** rather than falling through.
