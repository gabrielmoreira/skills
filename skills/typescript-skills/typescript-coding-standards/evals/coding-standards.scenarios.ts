import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "coding-standards-class-for-shared-deps-only",
    bundle: "typescript-coding-standards",
    rule: "functions-vs-classes",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A reviewer suggests introducing `ReceiptService` as a class only to group `sendReceipt()` and `stats()` because both use the same `mailer` and `audit` dependencies. There is no instance identity or lifecycle. Should this become a class?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-composition"],
    must: [
      "Prefers a `makeXxx` capability object or functions when the only need is shared dependencies or small private state",
      "Requires identity, lifecycle, protocol, framework pressure, or measured allocation pressure to earn a class",
      "Recognizes closure-private state as a good fit here",
      "Keeps construction separate from behavior when dependencies are external"
    ],
    mustNot: [
      "Treats grouping related functions by itself as enough reason for a class",
      "Treats OO consistency or future flexibility as enough reason for a class",
      "Rejects classes absolutely even when lifecycle or protocol would justify one"
    ],
    tags: ["functions-vs-classes", "makeXxx", "class", "calibration"]
  },
  {
    id: "coding-standards-assertion-on-external-json",
    bundle: "typescript-coding-standards",
    rule: "type-narrowing-over-assertion",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A fetch wrapper does `const data = await response.json() as OrderResponse` and then uses `data.customer!.email`. The author says the API schema is stable and the assertions keep the code short. What should change?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Rejects `as Type` and non-null assertion as proof substitutes for external or nullable data",
      "Requires parsing or narrowing at the boundary before using the value inward",
      "Allows type guards, schema validation, or a small manual parser as acceptable fixes",
      "Makes the nullable or optional access check visible instead of asserting it away"
    ],
    mustNot: [
      "Treats schema stability as enough reason to keep the assertions",
      "Suggests pushing the same assertions deeper into callers",
      "Treats shorter code as enough reason to bypass narrowing"
    ],
    tags: ["type-narrowing-over-assertion", "boundary", "non-null", "calibration"]
  },
  {
    id: "coding-standards-thin-wrapper-for-one-caller",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A PR adds `EmailManager` and `BaseEmailService` so one handler no longer calls `mailer.send(...)` directly. The new types mostly rename the call and there is only one caller. The author says this is cleaner and leaves room for future growth. Should this abstraction stay?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-composition"],
    must: [
      "Keeps direct code when the abstraction does not yet own a real repeated policy or boundary",
      "Requires an abstraction to remove real caller burden or own one clear policy",
      "Rejects generic names like `Base*`, `Manager`, or thin pass-through wrappers when they hide the real decision",
      "Allows a small named abstraction only when it protects a real policy, unsafe detail, or variation point"
    ],
    mustNot: [
      "Treats future flexibility alone as enough reason to keep the abstraction",
      "Treats shorter files or cleaner layering by itself as enough reason",
      "Rejects all helpers or abstractions absolutely even when a real repeated policy exists"
    ],
    tags: ["abstraction-and-local-reasoning", "thin-wrapper", "manager", "calibration"]
  },
  {
    id: "coding-standards-clean-cutover-vs-parallel-path",
    bundle: "typescript-coding-standards",
    rule: "cutovers",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A refactor keeps both `sendReceiptLegacy()` and `sendReceiptNew()` plus a compatibility export because 'we might need the old path later'. The team owns all callers and can update them now. Should both paths stay?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-testing"],
    must: [
      "Defaults to a clean cutover when the team owns the affected callers and can update them safely now",
      "Allows staged migration only with an explicit owner, boundary, verification, and removal condition",
      "Removes obsolete aliases, compatibility exports, or tests that accidentally keep the old path alive",
      "Treats characterization or temporary compatibility as bounded work, not an open-ended default"
    ],
    mustNot: [
      "Keeps old and new paths in parallel just because they might be useful later",
      "Treats future rollback comfort alone as enough reason to preserve the old path",
      "Rejects staged migration absolutely even for shared packages, public APIs, or risky legacy behavior"
    ],
    tags: ["cutovers", "parallel-path", "migration", "calibration"]
  },
  {
    id: "coding-standards-missing-union-variant-handling",
    bundle: "typescript-coding-standards",
    rule: "exhaustive-narrowing",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A union `Status = { kind: 'loading' } | { kind: 'ready'; data: Data } | { kind: 'error'; message: string }` is handled with `if (status.kind === 'loading') ... else return renderReady(status)` because 'there are only two real branches today'. A new variant may be added later. What should change?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Requires exhaustive handling of discriminated unions rather than collapsing remaining variants into a generic else branch",
      "Uses a switch or equivalent narrowing with a `never`/`assertNever` exhaustiveness check",
      "Rejects `default` or fallback branches that silently swallow future variants",
      "Allows narrowing the input type earlier only if this consumer truly handles a smaller subset"
    ],
    mustNot: [
      "Treats today's known variants as enough reason to skip exhaustiveness",
      "Approves `as never` or other silencing tricks to satisfy the compiler",
      "Treats a runtime fallback alone as equivalent to compile-time exhaustiveness"
    ],
    tags: ["exhaustive-narrowing", "union", "assertNever", "calibration"]
  },
  {
    id: "coding-standards-generic-role-name-hides-decision",
    bundle: "typescript-coding-standards",
    rule: "naming-and-semantic-center",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A module names its main function `processData` and hides the real branch inside `handleMode(mode, input)`. Reviewers must open three helpers to learn that the code either approves, rejects, or queues an order. The author says the generic names keep the code reusable. What should change?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Prefers names based on local meaning, caller promise, or policy rather than generic role words",
      "Keeps the important branch or decision visible near the callsite or semantic center",
      "Rejects generic names like `process`, `handle`, `manage`, or `data` when they hide the real behavior",
      "Allows ecosystem/provider terms only when they are truly the clearest local meaning or edge vocabulary"
    ],
    mustNot: [
      "Treats generic reusability alone as enough reason for vague names",
      "Suggests renaming provider edge fields that intentionally preserve wire shape",
      "Turns this into a generic long-function/splitting discussion instead of naming and visible decision pressure"
    ],
    tags: ["naming-and-semantic-center", "semantic-center", "generic-name", "calibration"]
  },
  {
    id: "coding-standards-top-down-function-order",
    bundle: "typescript-coding-standards",
    rule: "vertical-discipline",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A file puts small helpers first and the exported `processOrder` orchestration at the bottom. Reviewers keep scrolling up and down because `processOrder` calls `validateOrder`, `persistOrder`, and `notifyOrder`. The repository has no established ordering convention. Should we reorder it?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: [],
    must: [
      "Prefers a top-down or step-down layout with the outer orchestration first and deeper helpers below when no local convention decides otherwise",
      "Keeps same-depth helpers in the order the reader encounters them from the caller",
      "Frames this as a readability and local-reasoning default rather than an absolute law",
      "Allows established repository or framework order, recursion, required export order, or tightly-related tiny helpers to override the default"
    ],
    mustNot: [
      "Treats function order inside a file as irrelevant personal preference",
      "Demands perfect call-graph sorting even when it hurts local comprehension or required structure",
      "Reduces the issue to naming or line count instead of reading flow"
    ],
    tags: ["vertical-discipline", "step-down", "top-down", "ordering", "calibration"]
  },
  {
    id: "long-handler-with-blank-lines",
    bundle: "typescript-coding-standards",
    rule: "vertical-discipline",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "Code review feedback says my handler is too long. It's 80 lines with three blank-line-separated blocks: input parsing, business call, response formatting. Should I just remove the blanks, add comment headers, or extract functions?",
    expectedPrimary: "typescript-coding-standards",
    must: [
      "Uses comment labels as the discovery step of the ladder before or while deciding to extract",
      "Extracts by responsibility once labels map to real, specific names",
      "Recognizes the three blocks (parse / business call / format) as probably separate responsibilities",
      "Names extracted helpers specifically, not generically (no doWork/processStep1)"
    ],
    mustNot: [
      "Prescribes blank-line removal as the fix",
      "Treats all three presented options as equally valid"
    ],
    tags: ["vertical-discipline", "blank-lines", "extraction", "legacy-migrated"]
  },
  {
    id: "mocked-test-with-as-any",
    bundle: "typescript-coding-standards",
    rule: "type-narrowing-over-assertion",
    tier: "P0",
    mode: "bypass",
    difficulty: "mixed",
    prompt:
      "In a unit test I have `const fakeStripe = { paymentIntents: { create: vi.fn().mockResolvedValue({ id: 'pi_123', status: 'succeeded' }) } } as any as Stripe;`. The Stripe type has 200+ methods and I only need one for this test. Is this acceptable in test code?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-testing"],
    must: [
      "Acknowledges a test-code exception exists without blessing `as any as Stripe`",
      "Recommends depending on a narrow capability/interface instead of the full Stripe shape",
      "Suggests a typed builder or explicit partial wrapper that makes the partiality visible"
    ],
    mustNot: [
      "Leaves the cast in place because it is 'just tests'",
      "Accepts the '200+ methods' practicality appeal as sufficient justification"
    ],
    tags: ["bypass", "test-exception", "as-any", "legacy-migrated"]
  },
  {
    id: "id-confusion",
    bundle: "typescript-coding-standards",
    rule: "branded-and-opaque-types",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "We had an incident where `archiveOrder(orderId)` was called with a `userId` value because both are `string`. The compiler said nothing. How do we prevent this class of bug?",
    expectedPrimary: "typescript-coding-standards",
    must: [
      "Recommends branded/opaque types for the IDs",
      "Mentions a smart constructor (asUserId/asOrderId) creating the branded value",
      "Says downstream code should not cast into the brand"
    ],
    mustNot: [
      "Recommends wrapping IDs in a class as the primary solution",
      "Offers only runtime checks (prefix regex) without compile-time protection"
    ],
    tags: ["branded-types", "nominal-typing", "legacy-migrated"]
  },
  {
    id: "overgeneric-helper",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P2",
    mode: "complexity",
    difficulty: "mixed",
    prompt:
      "I'm writing a `findById(items, id)` helper for the first place that needed it. Should I make it `<T extends { id: string }>(items: T[], id: string): T | undefined` from day one, or wait?",
    expectedPrimary: "typescript-coding-standards",
    must: [
      "Accepts the generic with `extends { id: string }` when a second caller is plausible",
      "Keeps the constraint to the minimum the body needs",
      "Acknowledges a concrete signature is also fine for a single caller"
    ],
    mustNot: [
      "Recommends an unconstrained `<T>` that forces `any` in the body",
      "Recommends a looser constraint like `<T extends object>` when `{ id: string }` is what the body needs",
      "Refuses generics outright on YAGNI grounds"
    ],
    tags: ["generics", "constraints", "progressive-complexity", "legacy-migrated"]
  },
  {
    id: "coding-standards-contained-assertion-for-unrepresentable-invariant",
    bundle: "typescript-coding-standards",
    rule: "type-narrowing-over-assertion",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "A test-only factory builds a complete local object for a generated SDK type whose nominal marker is private and cannot be constructed outside the SDK. The object never crosses an input boundary, every meaningful field is checked by the factory, and one local `as GeneratedEvent` would be the only assertion. Must we add a runtime schema or redesign production code to avoid it?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: ["typescript-testing"],
    must: [
      "Allows a contained assertion because the value is trusted local test data and the remaining mismatch is an unrepresentable nominal invariant",
      "Keeps the assertion inside one typed test factory rather than spreading casts through tests or production code",
      "Requires the factory to construct and check the meaningful shape without `any` or a double cast",
      "Rejects adding runtime validation when it would provide no additional safety for locally constructed data"
    ],
    mustNot: [
      "Treats every assertion as forbidden regardless of provenance or compiler limitation",
      "Generalizes the exception to network, env, file, SDK response, or other uncontrolled input",
      "Requires production architecture changes solely to satisfy a test fixture type"
    ],
    tags: ["type-narrowing-over-assertion", "earned-exception", "trusted-fixture"]
  },
  {
    id: "coding-standards-local-file-order-overrides-step-down",
    bundle: "typescript-coding-standards",
    rule: "vertical-discipline",
    tier: "P2",
    mode: "exception",
    difficulty: "mixed",
    prompt:
      "Every module in this framework keeps route metadata and small helpers before the exported handler because tooling and maintainers expect that order. One reviewer wants this file reordered into strict top-down call order. The current flow is already easy to follow. Should we change it?",
    expectedPrimary: "typescript-coding-standards",
    must: [
      "Keeps the established framework and repository ordering when the current flow is already clear",
      "Treats step-down order as a default for files without a stronger local convention, not a universal mandate",
      "Avoids churn that would make this file inconsistent with its neighbors"
    ],
    mustNot: [
      "Requires strict call-graph order regardless of framework or repository convention",
      "Reorders the file only to satisfy stylistic symmetry"
    ],
    tags: ["vertical-discipline", "earned-exception", "local-convention"]
  },
] satisfies EvalScenario[];

export default scenarios;
