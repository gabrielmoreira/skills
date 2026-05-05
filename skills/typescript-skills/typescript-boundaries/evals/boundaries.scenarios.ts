import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "boundaries-webhook-raw-plus-provider-cast",
    bundle: "typescript-boundaries",
    rule: "raw-input-to-internal-model",
    tier: "P0",
    mode: "bypass",
    difficulty: "hard",
    prompt: "PR review: `handleStripeWebhook(req)` does `const event = req.body as Stripe.Event` and sends `event` into `processPaymentEvent`. The author says Stripe signs the webhook so the cast is fine. What should happen?",
    expectedPrimary: "typescript-boundaries",
    expectedSecondary: [
      "typescript-coding-standards"
    ],
    must: [
      "Identifies raw request body as untrusted transport input that must be parsed at the boundary",
      "Identifies `Stripe.Event` as a provider shape that should not flow into owned behavior",
      "Rejects the `as` cast as proof of validity",
      "Requires a small owned event/model before calling business behavior",
      "Distinguishes raw-input parsing from provider-shape containment instead of collapsing them"
    ],
    mustNot: [
      "Accepts signature verification as a substitute for parsing/narrowing",
      "Lets `req.body` or `Stripe.Event` flow into domain/service code",
      "Frames this only as a TypeScript cast issue"
    ],
    tags: [
      "hard-gate",
      "webhook",
      "provider",
      "raw-input",
      "collision",
      "simplification-core"
    ]
  },
  {
    id: "boundaries-sdk-type-in-service",
    bundle: "typescript-boundaries",
    rule: "provider-containment",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt: "A service function `canShip(intent: Stripe.PaymentIntent)` checks `intent.status === 'succeeded'`. Only one adapter calls it today. Is that OK, or should we change the boundary?",
    expectedPrimary: "typescript-boundaries",
    expectedSecondary: [],
    must: [
      "Rejects provider SDK type in owned service/business logic",
      "Keeps `Stripe.PaymentIntent` inside adapter/client/controller edge code",
      "Translates to a smaller local model or local meaning such as settlement readiness",
      "Preserves provider status only as explicit provider metadata when needed"
    ],
    mustNot: [
      "Approves because there is only one caller",
      "Copies every Stripe field into a local object",
      "Requires a large interface hierarchy before there is pressure"
    ],
    tags: [
      "provider",
      "sdk",
      "service",
      "simplification-core"
    ]
  },
  {
    id: "boundaries-overeager-one-field-mapper",
    bundle: "typescript-boundaries",
    rule: "earned-mapping",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt: "A new adapter adds `mapCustomer(c) { return { id: c.id } }` for a provider customer used in exactly one callsite. There is no semantic change, no public API, and no repeated translation. Is the mapper useful?",
    expectedPrimary: "typescript-boundaries",
    expectedSecondary: [
      "typescript-coding-standards"
    ],
    must: [
      "Rejects the mapper as unearned ceremony for one simple rename/copy",
      "Allows inline edge translation when one callsite is obvious",
      "Names what would earn a mapper: semantic mismatch, repeated translation, public API, churn, or complex failure semantics",
      "Keeps provider shape at the edge even if no named mapper is created"
    ],
    mustNot: [
      "Creates a mapper just because the word provider appears",
      "Lets the provider object flow inward as the alternative",
      "Names the mapper generically as `mapData` or `transform`"
    ],
    tags: [
      "earned-mapping",
      "exception",
      "over-abstraction"
    ]
  },
  {
    id: "boundaries-provider-status-collapse",
    bundle: "typescript-boundaries",
    rule: "earned-mapping",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt: "Two modules now translate provider statuses `enabled | trialing | disabled | fraud_review` into our local `active | blocked` states. A third module needs the same rule. What should we do?",
    expectedPrimary: "typescript-boundaries",
    expectedSecondary: [],
    must: [
      "Says the mapper is now earned by repeated semantic collapse",
      "Keeps the mapper near the provider boundary",
      "Makes lossy/unknown states explicit",
      "Tests the local contract rather than provider object shape everywhere"
    ],
    mustNot: [
      "Keeps repeating switch statements in every owned module",
      "Maps every provider field just because a mapper exists",
      "Hides unknown provider states behind a default local status"
    ],
    tags: [
      "earned-mapping",
      "semantic-collapse",
      "simplification-core"
    ]
  },
  {
    id: "boundaries-webhook-payload-name-in-domain",
    bundle: "typescript-boundaries",
    rule: "local-naming",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt: "Our payments domain type is named `WebhookPayload` and is used by invoice, receipt, and ledger services. A reviewer says webhook is transport vocabulary, but another reviewer says this is just general naming taste. Which concern owns it?",
    expectedPrimary: "typescript-boundaries",
    expectedSecondary: [
      "typescript-coding-standards"
    ],
    must: [
      "Routes primary ownership to boundary local naming, not general naming taste",
      "Explains that webhook is transport vocabulary leaking into owned domain language",
      "Suggests a local meaning name such as `PaymentEvent`, `PaymentNotification`, or equivalent",
      "Allows provider/transport names at adapters or explicit metadata when traceability is the meaning"
    ],
    mustNot: [
      "Treats this only as subjective naming preference",
      "Keeps transport vocabulary in domain because multiple services already use it",
      "Renames without explaining the boundary leak"
    ],
    tags: [
      "local-naming",
      "router",
      "transport",
      "collision"
    ]
  }
] satisfies EvalScenario[];

export default scenarios;
