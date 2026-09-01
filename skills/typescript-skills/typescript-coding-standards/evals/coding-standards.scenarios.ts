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
      "What should change here? `Status = { kind: 'loading' } | { kind: 'ready'; data: Data } | { kind: 'error'; message: string }` is handled with `if (status.kind === 'loading') ... else return renderReady(status)`, because there are only two real branches today. A new variant may be added later.",
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
      "Do we have to avoid this cast? A test-only factory builds a complete local object for a generated SDK type whose nominal marker is private and cannot be constructed outside the SDK. It never crosses an input boundary, the factory checks every meaningful field, and one local `as GeneratedEvent` would be the only assertion.",
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
  {
    id: "falsy-default-overwrites-a-legitimate-zero",
    bundle: "typescript-coding-standards",
    rule: "absence-and-defaults",
    tier: "P0",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "A pagination helper does `const limit = opts.limit || 50`. A caller passing `limit: 0` to mean no rows gets 50 rows back. What should change?",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/absence-and-defaults.md"],
    expectedSecondary: ["typescript-configs"],
    must: [
      "Identifies `||` as replacing every falsy value rather than only a missing one",
      "Uses `??` so only null or undefined take the default",
      "Asks what absence means here before choosing what stands in for it"
    ],
    mustNot: [
      "Special-cases zero while leaving `||` in place",
      "Treats the choice between the two operators as style"
    ],
    tags: ["absence", "nullish", "falsy-default"]
  },
  {
    id: "unresolved-module-silenced-by-a-declaration",
    bundle: "typescript-coding-standards",
    rule: "imports-and-module-graph",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "`TS2307: Cannot find module @acme/pricing` appeared after a refactor. Someone added a wildcard `declare module` to a d.ts and the build went green. Is that a fix?",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/imports-and-module-graph.md"],
    expectedSecondary: ["typescript-configs"],
    must: [
      "Treats the wildcard declaration as silencing the diagnostic rather than resolving it",
      "Sends the fix to the cause: a missing dependency, a wrong path, a paths mapping the runtime does not share, or an export never published",
      "Notes the declaration types the module as any, so nothing downstream is checked"
    ],
    mustNot: [
      "Accepts the ambient declaration as a resolution",
      "Recommends a cast at each call site instead"
    ],
    tags: ["module-graph", "unresolved-module", "suppression"]
  },
  {
    id: "deprecated-dependency-warning-suppressed",
    bundle: "typescript-coding-standards",
    rule: "cutovers",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "The linter reports a deprecated helper from a shared package. The quick fix is an inline disable comment; the replacement API exists but needs a small refactor. What should happen?",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/cutovers.md"],
    expectedSecondary: [],
    must: [
      "Treats the deprecation as a cutover whose clock someone else started",
      "Prefers the replacement now, where the code is owned and safe to update",
      "Requires an owner and a removal condition if the replacement is deferred"
    ],
    mustNot: [
      "Accepts the disable comment with nothing scheduled",
      "Defers with no owner and no removal trigger"
    ],
    tags: ["deprecation", "cutover", "scheduled-failure"]
  },
  {
    // Symptom only: the word zero never appears beside the operator that caused it.
    id: "users-who-chose-none-get-twenty",
    bundle: "typescript-coding-standards",
    rule: "absence-and-defaults",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A few users complained that turning their digest down to nothing did not stick. Their preference row stores what they picked, and the digest still goes out with twenty items in it.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/absence-and-defaults.md"],
    expectedSecondary: ["typescript-configs"],
    must: [
      "Suspects a default that replaces a chosen value rather than a missing one",
      "Distinguishes not chosen from chosen as none before proposing the fix"
    ],
    mustNot: [
      "Treats it as a persistence bug without examining how the default is applied",
      "Adds a special case for the smallest value while leaving the rule that caused it"
    ],
    tags: ["symptom-only", "de-biased", "falsy-default"]
  },
  {
    // Near miss for absence: the value really is missing, but it arrives from
    // outside, which another topic owns.
    id: "provider-sometimes-omits-a-field",
    bundle: "typescript-coding-standards",
    rule: "absence-and-defaults",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "The billing provider returns a record without `middleName` for roughly one account in fifty, and our mapper throws when it does. Should the mapper substitute an empty string?",
    expectedPrimary: "typescript-boundaries",
    expectedAll: ["typescript-boundaries/rules/raw-input-to-internal-model.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Treats an inconsistent provider shape as a contract question at the edge",
      "Decides what the internal model requires before choosing any substitute"
    ],
    mustNot: [
      "Answers only with an operator choice for the missing value",
      "Lets the provider's shape reach the internal model unexamined"
    ],
    tags: ["near-miss", "collision", "edge-not-owned-code"]
  },
  {
    // Symptom only for the module graph: three environments disagree, and none
    // of the gate row's words appear.
    id: "editor-and-tests-agree-the-build-does-not",
    bundle: "typescript-coding-standards",
    rule: "imports-and-module-graph",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "My editor jumps to the definition fine and the test suite is green, but the production build stops on the same line saying it cannot find what that line pulls in.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/imports-and-module-graph.md"],
    expectedSecondary: ["typescript-configs"],
    must: [
      "Treats three environments disagreeing as an alias or entry-point question, not a code defect",
      "Asks which resolver each environment uses before changing anything"
    ],
    mustNot: [
      "Silences it with an ambient declaration or a cast",
      "Assumes the dependency is missing without checking how each environment resolves"
    ],
    tags: ["symptom-only", "de-biased", "resolution-disagreement"]
  },
  {
    // Under-specified and multi-rule: names neither gate row, and a correct
    // answer needs both rules. This is the shape C-16 exists to protect.
    id: "same-field-forced-in-one-place-and-stood-in-for-in-another",
    bundle: "typescript-coding-standards",
    rule: "absence-and-defaults",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Fix this properly. The same profile field is pushed past the compiler in one path because the author knew it was set there, and quietly stood in for in another. People who leave it blank get the stand-in, and the first path crashes for accounts where it really is absent.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: [
      "typescript-coding-standards/rules/absence-and-defaults.md",
      "typescript-coding-standards/rules/type-narrowing-over-assertion.md"
    ],
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Separates what absence means from how presence was claimed, and answers both",
      "Rejects the forced form as a claim the compiler cannot check",
      "Distinguishes deliberately blank from not provided before choosing any substitute"
    ],
    mustNot: [
      "Fixes the substitution and leaves the forced access in place",
      "Fixes the forced access and leaves blank indistinguishable from absent"
    ],
    tags: ["multi-rule", "under-specified", "de-biased"]
  },
  {
    // Cross-topic and under-specified. Names neither gate row, and a correct
    // answer needs a rule from each of two topics. This shape was impossible to
    // express until C-16 learned to resolve a sibling topic, which is the right
    // way round: the scenario is what is being protected.
    id: "cache-warm-nobody-waits-for-with-a-stand-in-value",
    bundle: "typescript-coding-standards",
    rule: "absence-and-defaults",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why would a customer see a price that belongs to nobody? Every request kicks off a pricing cache refresh and carries on without it, and when the cache has nothing for a key we serve a stand-in figure so the page still renders.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: [
      "typescript-coding-standards/rules/absence-and-defaults.md",
      "typescript-async/rules/promise-ownership.md"
    ],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Separates the refresh nobody observes from the stand-in value, and answers both",
      "Treats a stand-in indistinguishable from a real price as the reportable defect",
      "Gives the refresh an owner so its failures stop being invisible"
    ],
    mustNot: [
      "Fixes the value and leaves the refresh unobserved",
      "Fixes the refresh and leaves the stand-in indistinguishable from a real price"
    ],
    tags: ["multi-rule", "cross-topic", "under-specified", "de-biased"]
  },
  {
    // A managed migration, not rot: the bar is being raised in stages and the
    // dates are the agreement. The decision is what the convention obliges when
    // you open a file for something else, which differs by whether it expired.
    id: "expired-dated-suppression-in-a-file-you-are-touching",
    bundle: "typescript-coding-standards",
    rule: "type-narrowing-over-assertion",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Change this one function for me. The file has four dated suppressions from the lint migration, two already past their date, and none of them are on the lines I need.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/type-narrowing-over-assertion.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Treats an expired date as due now and an unexpired one as still inside the agreed window",
      "Scopes the repair to what the change already touches rather than opening the whole file",
      "Keeps a suppression only where it names why, and what would remove it"
    ],
    mustNot: [
      "Refreshes the date to buy more time",
      "Rewrites all four while the task was one function",
      "Treats the volume as licence to add another without a date and a reason",
      "Clears the unexpired ones, which the grace period deliberately allows"
    ],
    tags: ["real-world", "legacy", "suppression-debt", "at-scale"]
  },
  {
    // 1132 optional chains in one service. At that volume the question stops
    // being which operator and becomes what a chain is hiding.
    id: "chain-so-deep-that-undefined-says-nothing",
    bundle: "typescript-coding-standards",
    rule: "absence-and-defaults",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why does this page render blank sometimes? The view model is built with long `?.` chains through another team's response, there is no error anywhere, and nobody can say which hop was empty. Support tickets are the only signal we get.",
    expectedPrimary: "typescript-coding-standards",
    // Both apply and the run showed it: the agent opened boundaries, which was
    // defensible, and this claimed only one. The edge broke a contract and the
    // chain hid which hop, so a correct answer opens both.
    expectedAll: [
      "typescript-boundaries/rules/raw-input-to-internal-model.md",
      "typescript-coding-standards/rules/absence-and-defaults.md"
    ],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Identifies that a long chain collapses several distinct absences into one indistinguishable result",
      "Separates absence the domain allows from a contract that was not met",
      "Makes the missing case observable rather than blank"
    ],
    mustNot: [
      "Answers only with an operator swap",
      "Adds a default at the end of the chain and calls it handled"
    ],
    tags: ["real-world", "legacy", "optional-chain-depth", "silent-blank"]
  },
  {
    id: "one-service-class-that-every-team-adds-to",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Add one field to this response. The service it lives in has been added to by every team for four years: it fetches, maps, writes two tables, publishes an event and formats currency. Three people have told me not to touch anything else in there.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Delivers the one field without restructuring the class around it",
      "Names what the class is actually responsible for, so the next change has somewhere to go",
      "Adds the new work where it belongs rather than where the file already is"
    ],
    mustNot: [
      "Rewrites the class because it is doing too much",
      "Adds the field beside the currency formatting because that is where the file ended up"
    ],
    tags: ["real-world", "legacy", "single-responsibility", "at-scale"]
  },
  {
    id: "helper-that-grew-a-flag-per-caller",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A shared helper now takes six boolean options, one added per caller over three years. My caller needs a seventh behaviour. The helper is used in eleven places and has no tests.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    expectedSecondary: ["typescript-testing"],
    must: [
      "Treats a flag per caller as the shared unit having no single responsibility",
      "Prefers a separate path over a seventh flag",
      "Notes what has to be true before the existing callers can be moved"
    ],
    mustNot: [
      "Adds the seventh flag because the pattern is established",
      "Proposes a rewrite of all eleven callers as the only option"
    ],
    tags: ["real-world", "legacy", "flag-per-caller"]
  },
  {
    id: "mapper-that-also-decides-eligibility",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "The function that turns the provider payload into our model also decides whether the customer is eligible, because the eligibility rule needed a field that was easiest to read there. Product now wants the rule changed for one market.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Separates translating a shape from deciding a business outcome",
      "Puts the market-specific rule where a reader would look for business rules"
    ],
    mustNot: [
      "Adds a market branch inside the mapper",
      "Treats convenience of field access as a reason for the decision to live there"
    ],
    tags: ["real-world", "mapping", "business-rule-leak"]
  },
  {
    id: "long-function-that-reads-in-order",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "A checkout function is 180 lines. It reads top to bottom in the order the steps happen, each step is named by a comment, and nothing in it is reused anywhere. A reviewer wants it split into six functions.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/vertical-discipline.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Treats a cohesive flow that reads in order as acceptable",
      "Answers about how the flow reads rather than whether the unit should exist"
    ],
    mustNot: [
      "Splits it because of the line count alone"
    ],
    tags: ["near-miss", "collision", "length-is-not-responsibility"]
  },
  {
    id: "two-functions-doing-the-same-thing",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "I found two functions in different files that both convert our order status to the partner's vocabulary, and they disagree on one case. Which do I keep?",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    expectedSecondary: [],
    must: [
      "Establishes which mapping is correct before removing either"
    ],
    mustNot: [
      "Picks one on style grounds without resolving the disagreement"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "pressure-to-add-to-the-god-class-before-a-release",
    bundle: "typescript-coding-standards",
    rule: "abstraction-and-local-reasoning",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Where should this go? Release is tomorrow. The clean place is a new module, but wiring it means touching the composition root, which needs a review from a team that is offline. The existing service class ships tonight and everyone does that here anyway.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    expectedSecondary: [],
    must: [
      "Names the cost of the expedient placement rather than pretending it is free",
      "Leaves the compromise recorded with what would undo it"
    ],
    mustNot: [
      "Blesses the placement because it is the local custom",
      "Refuses the release without offering a way through"
    ],
    tags: ["adversarial", "deadline-pressure", "local-custom"]
  },
  {
    id: "generic-wrapper-nobody-can-read",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Our repository base class has four type parameters and two conditional types, written by someone who left. Every new repository copies an existing one and edits it until the compiler stops complaining. Nobody can explain what the third parameter does.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/generics-and-conditional-types.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Treats a type nobody can explain as a cost the abstraction has not earned",
      "Asks what varies across the real repositories before keeping any parameter"
    ],
    mustNot: [
      "Adds a fifth parameter to fit the new case",
      "Preserves the shape because removing it would touch many files"
    ],
    tags: ["real-world", "legacy", "unreadable-generic"]
  },
  {
    id: "conditional-type-to-avoid-two-functions",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A function returns a different shape depending on whether a flag is passed, expressed with a conditional return type. Callers now pass the flag from a variable, and the type resolves to a union nobody handles.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/generics-and-conditional-types.md"],
    expectedSecondary: [],
    must: [
      "Notes that a conditional return only helps where the argument is statically known",
      "Prefers two named functions over a type that degrades at the call site"
    ],
    mustNot: [
      "Adds an overload set to paper over the union"
    ],
    tags: ["real-world", "conditional-degrades"]
  },
  {
    id: "generic-that-only-ever-had-one-instantiation",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A cache helper is generic over the stored value. In four years it has only ever been used with one type, and the generic forces every caller to restate it.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/generics-and-conditional-types.md"],
    expectedSecondary: [],
    must: [
      "Treats a parameter with one instantiation as unearned",
      "Keeps the concrete shape until a second use appears"
    ],
    mustNot: [
      "Keeps the generic because it might be useful later"
    ],
    tags: ["real-world", "speculative-generality"]
  },
  {
    id: "same-shape-two-meanings",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "We have customer ids and order ids, both strings, and someone passed one where the other was expected. A colleague suggests generics.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/branded-and-opaque-types.md"],
    expectedSecondary: [],
    must: [
      "Treats this as two values of one shape needing to stay distinct"
    ],
    mustNot: [
      "Reaches for a type parameter where the problem is identity"
    ],
    tags: ["near-miss", "collision", "branding-not-generics"]
  },
  {
    id: "one-parameter-that-flows-through",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Should a function that takes an array and returns its first element be generic, or take unknown[]?",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/generics-and-conditional-types.md"],
    expectedSecondary: [],
    must: [
      "Keeps the parameter, since the shape flows from input to output"
    ],
    mustNot: [
      "Recommends unknown, losing the caller's type"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "pressure-to-keep-a-clever-type-because-it-took-a-week",
    bundle: "typescript-coding-standards",
    rule: "generics-and-conditional-types",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "I spent a week on a mapped type that derives our API surface from the route table. It works, it caught two bugs, and two teammates say they cannot read it and route around it by casting.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/generics-and-conditional-types.md"],
    expectedSecondary: [],
    must: [
      "Weighs the caught bugs against colleagues casting around it",
      "Treats teammates bypassing the type as evidence about the type"
    ],
    mustNot: [
      "Keeps it on the strength of effort already spent",
      "Deletes it without accounting for what it caught"
    ],
    tags: ["adversarial", "sunk-cost", "readability-versus-safety"]
  },
  {
    id: "wrong-id-passed-and-nothing-complained",
    bundle: "typescript-coding-standards",
    rule: "branded-and-opaque-types",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "How do we stop this happening again? A customer id was passed where an order id was expected, both are strings, and it reached production.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/branded-and-opaque-types.md"],
    expectedSecondary: [],
    must: [
      "Makes the two values distinguishable to the compiler",
      "Puts the branding where the values are created rather than at every call"
    ],
    mustNot: [
      "Relies on parameter naming and review",
      "Wraps both in classes with runtime overhead where a type would do"
    ],
    tags: ["real-world", "primitive-obsession"]
  },
  {
    id: "validated-value-loses-its-proof",
    bundle: "typescript-coding-standards",
    rule: "branded-and-opaque-types",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why do we validate this twice? The parser checks the email and returns a string, so every function downstream checks it again to be safe.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/branded-and-opaque-types.md"],
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Carries the proof of validation in the type",
      "Stops downstream re-validation without losing the guarantee"
    ],
    mustNot: [
      "Removes the downstream checks while the type stays a plain string"
    ],
    tags: ["real-world", "lost-proof"]
  },
  {
    id: "new-variant-shipped-and-two-places-forgot",
    bundle: "typescript-coding-standards",
    rule: "exhaustive-narrowing",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "How do I make sure I got every place? I am adding a fourth status and the last person who added one missed two call sites.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/exhaustive-narrowing.md"],
    expectedSecondary: [],
    must: [
      "Makes the compiler fail at each site that has to change",
      "Removes the default branch that absorbs the new variant"
    ],
    mustNot: [
      "Relies on searching for the type name",
      "Adds a runtime warning for unhandled variants"
    ],
    tags: ["real-world", "missed-callsites"]
  },
  {
    id: "default-branch-that-quietly-does-nothing",
    bundle: "typescript-coding-standards",
    rule: "exhaustive-narrowing",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why did nothing happen for this order? The switch has a default that returns without doing anything, and the order was in a state added last month.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/exhaustive-narrowing.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Treats the silent default as what hid the new state",
      "Makes an unhandled variant fail rather than pass"
    ],
    mustNot: [
      "Adds the new case and leaves the silent default"
    ],
    tags: ["real-world", "silent-default"]
  },
  {
    id: "three-names-for-the-same-thing",
    bundle: "typescript-coding-standards",
    rule: "naming-and-semantic-center",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "What should we call this? The same concept is `account`, `profile` and `customerRecord` in three modules, and a new module has to talk to all three.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/naming-and-semantic-center.md"],
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Settles one name for the concept and says where translation happens",
      "Treats the drift as a cost paid at every boundary between the three"
    ],
    mustNot: [
      "Introduces a fourth name for the new module"
    ],
    tags: ["real-world", "vocabulary-drift"]
  },
  {
    id: "manager-that-does-not-say-what-it-manages",
    bundle: "typescript-coding-standards",
    rule: "naming-and-semantic-center",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Rename this for me. It is called `DataManager`, it has eleven methods, and new people ask what it is for every time.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/naming-and-semantic-center.md"],
    expectedSecondary: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    must: [
      "Names it after the decision or policy it owns",
      "Notices that an unnameable unit may be holding more than one thing"
    ],
    mustNot: [
      "Picks a different generic word",
      "Renames without asking what it is responsible for"
    ],
    tags: ["real-world", "generic-name"]
  },
  {
    id: "everything-in-here-is-a-class",
    bundle: "typescript-coding-standards",
    rule: "functions-vs-classes",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Add a discount calculation to this package. Everything in here is a class with a constructor that takes nothing and one public method.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/functions-vs-classes.md"],
    expectedSecondary: ["typescript-coding-standards/rules/abstraction-and-local-reasoning.md"],
    must: [
      "Uses a function where there is no state to hold",
      "Declines to copy the surrounding shape when nothing justifies it"
    ],
    mustNot: [
      "Adds another empty-constructor class for consistency"
    ],
    tags: ["real-world", "utility-class", "follow-the-local-pattern"]
  },
  {
    id: "class-because-it-holds-a-pool",
    bundle: "typescript-coding-standards",
    rule: "functions-vs-classes",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Should this be a function instead? It holds a connection pool, hands out leases and has to close them all on shutdown.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/functions-vs-classes.md"],
    expectedSecondary: ["typescript-async"],
    must: [
      "Keeps the object where lifecycle and identity are real"
    ],
    mustNot: [
      "Converts it to a function and loses the teardown"
    ],
    tags: ["near-miss", "real-lifecycle"]
  },
  {
    id: "old-and-new-payment-paths-both-live",
    bundle: "typescript-coding-standards",
    rule: "cutovers",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "How do I finish this migration? Both payment paths have been live for eight months behind a flag that is permanently on.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/cutovers.md"],
    expectedSecondary: ["typescript-configs/rules/feature-decisions.md"],
    must: [
      "Removes the old path rather than leaving the flag on",
      "Gives the removal an owner and a condition"
    ],
    mustNot: [
      "Leaves both paths because the flag makes it safe"
    ],
    tags: ["real-world", "stalled-migration"]
  },
  {
    id: "barrel-file-that-imports-the-world",
    bundle: "typescript-coding-standards",
    rule: "imports-and-module-graph",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why is the cold start so slow? The entry file imports one barrel, and that barrel re-exports every module in the package.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/imports-and-module-graph.md"],
    expectedSecondary: [],
    must: [
      "Connects the barrel re-export to what actually loads at startup",
      "Imports from the module that owns the thing rather than the barrel"
    ],
    mustNot: [
      "Adds lazy imports without addressing the barrel"
    ],
    tags: ["real-world", "barrel", "cold-start"]
  },
] satisfies EvalScenario[];

export default scenarios;
