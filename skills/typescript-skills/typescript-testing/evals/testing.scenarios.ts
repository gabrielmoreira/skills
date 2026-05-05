import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "testing-bootstrap-import-for-handler-behavior",
    bundle: "typescript-testing",
    rule: "composition-root-tests",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "My Lambda handler test does `vi.resetModules(); const { resolveCreateNoteUsecase } = await import('../bootstrap/request')` to get a fresh instance per test. The tests pass and isolation works. Is this fine?",
    expectedPrimary: "typescript-testing",
    expectedSecondary: ["typescript-composition"],
    must: [
      "Distinguishes handler behavior tests from bootstrap infra tests",
      "Recommends testing handler behavior through the handler factory with explicit deps",
      "Allows dynamic import plus module reset only for bootstrap infra tests or legacy migration cases",
      "Does not treat passing tests as enough justification for bootstrap import in behavior tests"
    ],
    mustNot: [
      "Blesses dynamic bootstrap import for ordinary handler behavior tests",
      "Treats module reset as the default isolation strategy",
      "Uses composition tests to compensate for missing focused behavior tests"
    ],
    tags: ["composition-root-tests", "bootstrap", "handler", "calibration"]
  },
  {
    id: "testing-coverage-target-brittle-structure-assertion",
    bundle: "typescript-testing",
    rule: "contracts-and-characterization",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A test adds `expect(buildReceiptEmail.name).toBe('buildReceiptEmail')` and checks a helper import path to raise coverage after a refactor. The author says the behavior is already covered elsewhere, but coverage needs a boost. Is this acceptable?",
    expectedPrimary: "typescript-testing",
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Rejects helper-name, import-path, or similar structure assertions when they are not the public contract",
      "Treats coverage as guidance rather than a reason for brittle tests",
      "Prefers caller-visible behavior, failure shape, side effects, or boundary contracts as the test target",
      "Allows temporary characterization only when it protects risky legacy behavior and includes a removal or revisit condition"
    ],
    mustNot: [
      "Approves brittle structure assertions just to raise coverage",
      "Treats harmless refactor breakage as acceptable test strictness here",
      "Rejects characterization tests absolutely even when legacy behavior is uncertain"
    ],
    tags: ["contracts-and-characterization", "coverage", "brittle", "calibration"]
  },
  {
    id: "testing-local-style-behavior-first-naming",
    bundle: "typescript-testing",
    rule: "local-test-style",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A package already uses behavior-first names around handler tests. A new PR adds `test('works')` with full `// Given // When // Then` sections even though setup is one line, and the author wants to introduce a different style guide at the same time. Is that a good change?",
    expectedPrimary: "typescript-testing",
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Starts from nearby local test style and seam before introducing a new model",
      "Requires behavior-first naming instead of vague names like `works`",
      "Uses Given/When/Then only when it improves readability rather than by default",
      "Keeps the test seam narrow and tied to the changed behavior"
    ],
    mustNot: [
      "Approves drive-by replacement of local test culture without need",
      "Treats extra comments or a new style guide as an automatic improvement",
      "Treats vague test names as acceptable if the assertion body is correct"
    ],
    tags: ["local-test-style", "behavior-first", "given-when-then", "calibration"]
  },
  {
    id: "testing-process-env-mutation-for-ordinary-behavior",
    bundle: "typescript-testing",
    rule: "config-in-tests",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A service test mutates `process.env.API_KEY` and `process.env.TIMEOUT_MS` in each case to exercise ordinary email-sending behavior. The module could accept typed config directly, but the author says env mutation is closer to production. Is that the right test style?",
    expectedPrimary: "typescript-testing",
    expectedSecondary: ["typescript-configs"],
    must: [
      "Prefers injecting typed config directly for ordinary behavior tests when the API allows it",
      "Limits `process.env` mutation to config-boundary tests or isolated legacy characterization",
      "Requires full snapshot and restore if env mutation is still necessary",
      "Separates testing config parsing from testing the unit's behavior"
    ],
    mustNot: [
      "Treats env mutation as the default for normal behavior tests",
      "Treats production similarity alone as enough reason to avoid config injection",
      "Leaves env state shared across tests or dependent on order"
    ],
    tags: ["config-in-tests", "process-env", "config-boundary", "calibration"]
  }
] satisfies EvalScenario[];

export default scenarios;
