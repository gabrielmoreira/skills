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
      "A file puts small helpers first and the exported `processOrder` orchestration at the bottom. Reviewers keep scrolling up and down because `processOrder` calls `validateOrder`, `persistOrder`, and `notifyOrder`, and same-depth helpers are not in the order the reader encounters them. The author says function order inside a module is personal preference as long as the names are clear. Should we reorder it?",
    expectedPrimary: "typescript-coding-standards",
    expectedSecondary: [],
    must: [
      "Prefers a top-down or step-down layout with the outer orchestration first and deeper helpers below when practical",
      "Keeps same-depth helpers in the order the reader encounters them from the caller",
      "Frames this as a readability and local-reasoning default rather than an absolute law",
      "Allows exceptions for cases like recursion, required export order, or tightly-related tiny helpers"
    ],
    mustNot: [
      "Treats function order inside a file as irrelevant personal preference",
      "Demands perfect call-graph sorting even when it hurts local comprehension or required structure",
      "Reduces the issue to naming or line count instead of reading flow"
    ],
    tags: ["vertical-discipline", "step-down", "top-down", "ordering", "calibration"]
  },
] satisfies EvalScenario[];

export default scenarios;
