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
  },
  {
    id: "double-cast-to-get-past-the-sdk-type",
    bundle: "typescript-boundaries",
    rule: "raw-input-to-internal-model",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Fix this properly. The SDK response type does not match what the service actually sends, so we go `as unknown as OrderResponse` and carry on. It has been fine for a year.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/raw-input-to-internal-model.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Treats the double cast as an unchecked claim about data from outside",
      "Validates the fields the code actually consumes at the edge",
      "Keeps the value unknown until something has checked it"
    ],
    mustNot: [
      "Corrects the SDK type and calls the boundary handled",
      "Accepts a year without incident as evidence the shape holds"
    ],
    tags: ["real-world", "double-cast", "measured-shape"]
  },
  {
    id: "provider-field-names-showing-up-in-the-ui",
    bundle: "typescript-boundaries",
    rule: "provider-containment",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Where should I fix this? The component renders `resp.cust_acct_sts_cd` directly, and the provider is renaming that field next release.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/provider-containment.md"],
    expectedSecondary: ["typescript-boundaries/rules/local-naming.md"],
    must: [
      "Stops the provider vocabulary at the edge",
      "Puts the rename cost in one place instead of every consumer"
    ],
    mustNot: [
      "Aliases the field in the component",
      "Waits for the rename to decide"
    ],
    tags: ["real-world", "vocabulary-leak"]
  },
  {
    id: "one-more-field-through-the-mapper",
    bundle: "typescript-boundaries",
    rule: "earned-mapping",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Add the loyalty tier to the checkout response. It comes straight from the provider payload and nothing transforms it.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/earned-mapping.md"],
    expectedSecondary: [],
    must: [
      "Asks whether this field needs mapping or only passing",
      "Keeps the mapping layer earning its place rather than growing by default"
    ],
    mustNot: [
      "Adds a pass-through entry because the mapper exists"
    ],
    tags: ["real-world", "mapper-growth"]
  },
  {
    id: "our-name-or-theirs-for-this-concept",
    bundle: "typescript-boundaries",
    rule: "local-naming",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "What should we call this? The provider says `subscriber`, our domain has always said `member`, and the new module sits between the two.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/local-naming.md"],
    expectedSecondary: ["typescript-boundaries/rules/provider-containment.md"],
    must: [
      "Uses the domain's word inside and the provider's word only at the edge",
      "Names where the translation happens"
    ],
    mustNot: [
      "Adopts the provider's word inward for consistency with the payload"
    ],
    tags: ["real-world", "ubiquitous-language"]
  },
  {
    id: "internal-module-with-a-mapper-in-front-of-it",
    bundle: "typescript-boundaries",
    rule: "earned-mapping",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Should I add a mapper here? Both sides are ours, the shapes are nearly identical, and someone said we should decouple them.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/earned-mapping.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Asks what pressure the layer would relieve before adding it",
      "Treats two owned modules as a different case from an external edge"
    ],
    mustNot: [
      "Adds the layer because decoupling is generally good"
    ],
    tags: ["near-miss", "unearned-indirection"]
  },
  {
    id: "where-do-i-validate-a-webhook-body",
    bundle: "typescript-boundaries",
    rule: "raw-input-to-internal-model",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Where should a webhook body be validated?",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/raw-input-to-internal-model.md"],
    expectedSecondary: [],
    must: [
      "Validates at the edge before the value reaches anything owned"
    ],
    mustNot: [
      "Validates deep in the handler after the value has been used"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "the-provider-type-is-generated-so-it-must-be-right",
    bundle: "typescript-boundaries",
    rule: "raw-input-to-internal-model",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Do we still need to validate? The types are generated from their OpenAPI spec, so they match by construction, and the extra parsing adds latency to a hot path.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/raw-input-to-internal-model.md"],
    expectedSecondary: [],
    must: [
      "Separates what a spec promises from what a running service sends",
      "Weighs the hot-path cost against what an unchecked shape can do downstream"
    ],
    mustNot: [
      "Accepts generation from a spec as proof of the runtime shape",
      "Demands full parsing on a hot path without weighing it"
    ],
    tags: ["adversarial", "generated-types", "latency-pressure"]
  },
  {
    id: "their-word-in-our-database-column",
    bundle: "typescript-boundaries",
    rule: "local-naming",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Is this worth changing? A provider's term ended up as a column name three years ago and now it is in the ORM model, the API response and two dashboards.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/local-naming.md"],
    expectedSecondary: ["typescript-boundaries/rules/provider-containment.md"],
    must: [
      "Weighs the cost of the rename against the cost of the drift continuing",
      "Names where the translation would go if the column stays"
    ],
    mustNot: [
      "Demands a rename of everything as the only answer"
    ],
    tags: ["real-world", "entrenched-drift"]
  },
  {
    id: "sdk-client-passed-into-the-domain",
    bundle: "typescript-boundaries",
    rule: "provider-containment",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Where should this go? A use case takes the vendor SDK client as an argument so it can call two of its methods.",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/provider-containment.md"],
    expectedSecondary: ["typescript-composition"],
    must: [
      "Keeps the vendor type out of the domain signature",
      "Gives the use case the capability it needs rather than the client"
    ],
    mustNot: [
      "Wraps the SDK in a class with the same method names and calls it contained"
    ],
    tags: ["real-world", "sdk-inward"]
  },
] satisfies EvalScenario[];

export default scenarios;
