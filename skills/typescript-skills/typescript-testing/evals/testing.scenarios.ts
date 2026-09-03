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
      "Is this a good change? The package already uses behaviour-first test names around handler tests. A new PR adds `test('works')` with full Given/When/Then sections even though setup is one line, and the author wants to introduce a different style guide at the same time.",
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
  },
  {
    id: "cover-this-before-i-change-it",
    bundle: "typescript-testing",
    rule: "contracts-and-characterization",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Cover this before I change it. Nobody knows what half of these branches are for, the function has been here six years, and I only need to change one of them.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/contracts-and-characterization.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Pins the behaviour that exists before changing any of it",
      "Scopes the characterisation to what the change can reach"
    ],
    mustNot: [
      "Writes tests asserting what the code ought to do",
      "Tries to characterise all six years before touching anything"
    ],
    tags: ["real-world", "legacy", "characterisation"]
  },
  {
    id: "business-branches-with-no-test-between-them",
    bundle: "typescript-testing",
    rule: "contracts-and-characterization",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Which of these need tests? The pricing function has nine business branches, three added last quarter, and coverage says the file is at 80%.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/contracts-and-characterization.md"],
    expectedSecondary: [],
    must: [
      "Chooses by what each branch decides rather than by the coverage number",
      "Names branches whose failure would be silent"
    ],
    mustNot: [
      "Accepts 80% as the answer",
      "Requires a test for every branch regardless of consequence"
    ],
    tags: ["real-world", "business-ifs", "coverage-theatre"]
  },
  {
    id: "test-reads-worse-than-the-code",
    bundle: "typescript-testing",
    rule: "local-test-style",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Improve this test. It builds its fixture through four helpers, and to know what is being asserted you have to open all of them.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/local-test-style.md"],
    expectedSecondary: [],
    must: [
      "Puts the premise in front of the reader even at the cost of repetition",
      "Distinguishes plumbing that may be extracted from the premise that may not"
    ],
    mustNot: [
      "Extracts more helpers to shorten the test"
    ],
    tags: ["real-world", "damp"]
  },
  {
    id: "one-test-fails-only-in-the-full-run",
    bundle: "typescript-testing",
    rule: "local-test-style",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why does this only fail in the full run? On its own it passes every time.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/local-test-style.md"],
    expectedSecondary: ["typescript-composition"],
    must: [
      "Looks for state shared between tests rather than for a flaky assertion",
      "Names what would make each test independent"
    ],
    mustNot: [
      "Reorders the suite to make it pass",
      "Retries the test"
    ],
    tags: ["real-world", "shared-state"]
  },
  {
    id: "everything-needs-a-mock-to-test",
    bundle: "typescript-testing",
    rule: "composition-root-tests",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Make this testable. To exercise one function I have to stub the database, the clock, the feature flags and two clients, and it constructs all of them itself.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/composition-root-tests.md"],
    expectedSecondary: ["typescript-composition"],
    must: [
      "Moves construction out of the unit rather than mocking more",
      "Treats the mock count as a signal about the shape"
    ],
    mustNot: [
      "Adds a mocking helper to make the stubbing shorter"
    ],
    tags: ["real-world", "construction-inside"]
  },
  {
    id: "should-the-wiring-itself-have-a-test",
    bundle: "typescript-testing",
    rule: "composition-root-tests",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Should the wiring have its own test? Everything it assembles is already covered, but a bad wire has taken us down twice.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/composition-root-tests.md"],
    expectedSecondary: [],
    must: [
      "Distinguishes testing the parts from testing that they were connected",
      "Keeps the wiring test about assembly rather than behaviour"
    ],
    mustNot: [
      "Says the unit tests already cover it"
    ],
    tags: ["real-world", "assembly"]
  },
  {
    id: "tests-need-the-real-env-file",
    bundle: "typescript-testing",
    rule: "config-in-tests",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why do the tests need the real env file? They fail on a fresh clone until you copy it, and half of what is in there is unrelated to the tests.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/config-in-tests.md"],
    expectedSecondary: ["typescript-configs"],
    must: [
      "Gives the test the values it needs without the whole environment",
      "Treats a fresh clone failing as the defect"
    ],
    mustNot: [
      "Commits a filled env file to make the clone work"
    ],
    tags: ["real-world", "fresh-clone"]
  },
  {
    id: "is-it-ok-to-set-process-env-in-a-test",
    bundle: "typescript-testing",
    rule: "config-in-tests",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "OK to set `process.env` in the test? It is one variable, the module reads it at import, and changing that module is a bigger job than this ticket.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/config-in-tests.md"],
    expectedSecondary: [],
    must: [
      "Allows it as a contained measure while naming what it hides",
      "Says what would remove the need"
    ],
    mustNot: [
      "Blesses it as the pattern",
      "Demands the module be rewritten inside this ticket"
    ],
    tags: ["adversarial", "earned-exception"]
  },
  {
    id: "what-should-this-test-be-called",
    bundle: "typescript-testing",
    rule: "local-test-style",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "What should this test be called? It checks that an expired token is rejected.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/local-test-style.md"],
    expectedSecondary: [],
    must: [
      "Names the behaviour rather than the function under test"
    ],
    mustNot: [
      "Suggests a name built from the implementation"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "coverage-dropped-so-the-build-is-red",
    bundle: "typescript-testing",
    rule: "contracts-and-characterization",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "How do I get the build green? Coverage fell below the gate after I deleted a dead branch nobody could reach.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/contracts-and-characterization.md"],
    expectedSecondary: [],
    must: [
      "Treats the number falling for a good reason as a threshold question"
    ],
    mustNot: [
      "Adds a test for deleted code to lift the number"
    ],
    tags: ["near-miss", "metric-not-behaviour"]
  },
  {
    id: "testing-skip-parsing-env-defaults",
    bundle: "typescript-testing",
    rule: "config-in-tests",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "we need the database timeout to default to 5000ms when DB_TIMEOUT is missing from the environment, where should the zod schema set that default?",
    nearMiss:
      "It touches environment variables and default configuration, which this topic covers under config-in-tests. But the code being changed is the application's runtime config schema parser rather than a test setup, which this topic's own Edges hand to configs.",
    activation: {
      layer: "topic",
      target: "typescript-testing",
      shouldActivate: false,
      forbiddenRoutes: [],
    },
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/INDEX.md"],
    must: ["Places the configuration default in the environment parsing schema"],
    mustNot: ["Treats configuration schema defaults as a test suite harness concern"],
    tags: ["activation", "negative", "edge-to-configs"],
  },
  {
    id: "testing-skip-caller-error-taxonomy",
    bundle: "typescript-testing",
    rule: "contracts-and-characterization",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "should our auth middleware return a 401 Unauthorized or a 403 Forbidden when a token has expired?",
    nearMiss:
      "It asks about contract expectations that tests would assert against. But what is being decided is failure taxonomy and outward HTTP status semantics, which this topic's own Edges hand to error handling.",
    activation: {
      layer: "topic",
      target: "typescript-testing",
      shouldActivate: false,
      forbiddenRoutes: [],
    },
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/INDEX.md"],
    must: ["Evaluates the failure classification based on caller distinguishability and auth semantics"],
    mustNot: ["Treats the choice between 401 and 403 as a test style or characterization question"],
    tags: ["activation", "negative", "edge-to-error-handling"],
  },
] satisfies EvalScenario[];

export default scenarios;
