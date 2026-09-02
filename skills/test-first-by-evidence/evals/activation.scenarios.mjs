/**
 * Activation and routing scenarios for the test-first-by-evidence skill.
 *
 * Schema matches the sibling skills:
 *   id, bundle, rule, tier, mode, difficulty, prompt,
 *   expectedPrimary, expectedSecondary, activation, must, mustNot, tags
 *
 * Plain `.mjs`, so the suite runs with bare node and no toolchain.
 * `nearMiss` on every negative names the word or shape that makes the prompt
 * look like a match, then says what should happen instead.
 *
 * Prompts are written the way a developer actually types one: lowercase,
 * contracted, and naming no rule or concept this skill invented.
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "about-to-add-a-feature",
    bundle: "test-first-by-evidence",
    rule: "watch-it-fail",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt: "add retry with backoff to the payment client, three attempts should be enough",
    expectedPrimary: "rules/watch-it-fail.md",
    expectedSecondary: ["rules/smallest-green.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes one failing test before any implementation",
      "Runs it and quotes the failure output rather than predicting it",
      "Confirms the failure is about the missing retry, not a typo or a bad import",
      "Says which phase it is in and what that permits next",
    ],
    mustNot: [
      "Writes the retry implementation before a red run exists",
      "Treats a test that errors as a red",
    ],
    tags: ["activation", "positive", "feature"],
  },
  {
    id: "test-passed-on-first-run",
    bundle: "test-first-by-evidence",
    rule: "watch-it-fail",
    tier: "P0",
    mode: "router",
    difficulty: "mixed",
    prompt: "wrote the test for the new validator and it passed straight away, guess we're good",
    expectedPrimary: "rules/watch-it-fail.md",
    expectedSecondary: ["rules/code-written-first.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Treats a first-run pass as a sign the test describes existing behaviour",
      "Refuses to accept it as evidence the test can catch anything",
      "Either changes the test or establishes whether the code predates it",
    ],
    mustNot: ["Accepts the green as proof the behaviour is covered"],
    tags: ["activation", "positive", "false-green"],
  },
  {
    id: "implementation-already-written",
    bundle: "test-first-by-evidence",
    rule: "code-written-first",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    prompt: "i already built the whole parser this afternoon, can you just add tests for it now",
    expectedPrimary: "rules/code-written-first.md",
    expectedSecondary: ["rules/watch-it-fail.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Says that a test written against finished code passes immediately and proves nothing",
      "Offers deleting and reimplementing from red as the path that produces confidence",
      "Names the sunk time as already spent either way",
      "Distinguishes the author's own untested code from inherited code, which gets pinned instead",
    ],
    mustNot: [
      "Writes tests against the existing parser and calls the work covered",
      "Suggests keeping the code aside as reference while writing the tests",
    ],
    tags: ["activation", "positive", "after-the-fact"],
  },
  {
    id: "bug-report-with-a-trace",
    bundle: "test-first-by-evidence",
    rule: "bug-fix-starts-red",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt: "users can sign up with an empty email, here's the trace from the handler. fix it",
    expectedPrimary: "rules/bug-fix-starts-red.md",
    expectedSecondary: ["rules/where-the-test-goes.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes a test that reproduces the defect and fails for that reason before touching the code",
      "Places the test where the defect originates rather than where it surfaced",
      "Confirms the failure matches the reported symptom",
      "Keeps the test after the fix as the regression guard",
    ],
    mustNot: [
      "Applies the fix first and adds a test behind it",
      "Asserts the current buggy output so the suite goes green",
    ],
    tags: ["activation", "positive", "bugfix"],
  },
  {
    id: "assertions-on-mock-calls",
    bundle: "test-first-by-evidence",
    rule: "tests-that-cannot-lie",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt: "these tests all check that the mock got called with the right args, is that fine",
    expectedPrimary: "rules/tests-that-cannot-lie.md",
    expectedSecondary: [],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Asks what production change would make each test fail",
      "Moves assertions onto observable results rather than call counts",
      "Allows interaction assertions only where the interaction is itself the behaviour",
    ],
    mustNot: ["Accepts call-count assertions as adequate across the board"],
    tags: ["activation", "positive", "assertion-quality"],
  },
  {
    id: "no-obvious-place-for-the-test",
    bundle: "test-first-by-evidence",
    rule: "where-the-test-goes",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt: "not sure if this should be a unit test or one of the end to end ones, it touches the db",
    expectedPrimary: "rules/where-the-test-goes.md",
    expectedSecondary: ["rules/hard-to-test-is-a-signal.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Chooses the narrowest seam that can observe the behaviour",
      "Decides by what the test needs to run rather than by a label",
      "Looks at a neighbouring test to find the seam this repository already uses",
    ],
    mustNot: ["Recommends the widest seam because it is easiest to write"],
    tags: ["activation", "positive", "placement"],
  },
  {
    id: "everything-needs-mocking",
    bundle: "test-first-by-evidence",
    rule: "hard-to-test-is-a-signal",
    tier: "P1",
    mode: "router",
    difficulty: "hard",
    prompt: "to test this i have to mock six things and freeze the clock, the setup is longer than the test",
    expectedPrimary: "rules/hard-to-test-is-a-signal.md",
    expectedSecondary: ["rules/tests-that-cannot-lie.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Reads the difficulty as a design report rather than a testing problem",
      "Maps the symptom to the specific design fix, such as passing the clock in",
      "Shows that the change improves the caller and not only the test",
    ],
    mustNot: [
      "Adds a test-only hook to production code",
      "Moves to a heavier seam to escape the design problem",
    ],
    tags: ["activation", "positive", "design-signal"],
  },
  {
    id: "red-exists-now-implement",
    bundle: "test-first-by-evidence",
    rule: "smallest-green",
    tier: "P1",
    mode: "router",
    difficulty: "obvious",
    prompt: "test is failing the way we want, go ahead and make it pass",
    expectedPrimary: "rules/smallest-green.md",
    expectedSecondary: [],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes the least code that satisfies the assertion",
      "Runs the whole suite rather than only the new test",
      "Refactors only from green and changes shape rather than behaviour",
      "Takes any further behaviour as the next red instead of adding it here",
    ],
    mustNot: [
      "Adds untested generality such as configurable backoff while making the test pass",
      "Refactors while the suite is red",
    ],
    tags: ["activation", "positive", "green"],
  },

  // ------------------------------------------------------- multi-rule, vague
  //
  // `expectedAll` claims every listed rule must open, not just the first.
  // The prompt is deliberately under-specified: it is a plain feature request
  // that mentions no test, no phase, and no cycle. A prompt that spelled those
  // out would prove nothing, because the routing would have been handed over.
  {
    id: "expired-token-handling",
    bundle: "test-first-by-evidence",
    rule: "watch-it-fail",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt: "login should cope with a token that already expired instead of blowing up",
    expectedPrimary: "rules/watch-it-fail.md",
    expectedAll: ["rules/watch-it-fail.md", "rules/smallest-green.md"],
    expectedSecondary: ["rules/where-the-test-goes.md"],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes a failing test for the expired token before any implementation",
      "Runs it and quotes the failure rather than predicting it",
      "Then writes the least code that satisfies it, and runs the whole suite",
      "Does not stop after the red: the green half is reached in the same pass",
    ],
    mustNot: [
      "Implements the handling first and adds a test behind it",
      "Reports only the failing test and treats the task as finished",
      "Adds refresh, rotation, or retry behaviour that no test asked for",
    ],
    tags: ["activation", "positive", "multi-rule", "under-specified"],
  },
  {
    id: "flaky-signup-suite-after-a-fix",
    bundle: "test-first-by-evidence",
    rule: "bug-fix-starts-red",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt: "signup broke for a customer yesterday, we patched it directly in code this morning and it works now, how do we add the regression guard",
    expectedPrimary: "rules/bug-fix-starts-red.md",
    expectedAll: ["rules/bug-fix-starts-red.md", "rules/code-written-first.md"],
    expectedSecondary: [],
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Notices the fix landed with no red behind it",
      "Removes the fix, watches a test go red, and restores it, rather than adding a test that passes on its first run",
      "Keeps the resulting test as the regression guard",
    ],
    mustNot: [
      "Accepts a test written against the patched code as sufficient",
      "Suggests discarding the patch without asking",
    ],
    tags: ["activation", "positive", "multi-rule", "under-specified"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "review-the-tests-in-this-pr",
    bundle: "test-first-by-evidence",
    rule: null,
    tier: "P0",
    mode: "bypass",
    difficulty: "hard",
    prompt: "have a look at this branch before i open it, particularly whether the tests are any good",
    nearMiss:
      "Test quality is named directly, which is this skill's subject, and the words line up almost exactly with the honest-tests rule. But the change already exists and is being judged rather than written, and reporting findings on a diff without editing belongs to the review skill.",
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: false, forbiddenRoutes: ["rules/tests-that-cannot-lie.md"] },
    must: ["Hands off to the change-review skill"],
    mustNot: ["Starts writing tests, or applies edits to a branch under review"],
    tags: ["activation", "negative", "collision", "review"],
  },
  {
    id: "why-is-this-failing",
    bundle: "test-first-by-evidence",
    rule: null,
    tier: "P0",
    mode: "bypass",
    difficulty: "hard",
    prompt: "the checkout suite goes red about one run in five and nobody knows why",
    nearMiss:
      "A failing test is on screen, so the vocabulary matches. But nothing is being implemented: the ask is to establish the cause of an intermittent failure, which is the debugging skill's subject. This skill only takes over once a fix is being written.",
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: false, forbiddenRoutes: ["rules/watch-it-fail.md"] },
    must: ["Hands off to the debugging skill"],
    mustNot: ["Writes a new test before the cause of the flake is established"],
    tags: ["activation", "negative", "collision", "debugging"],
  },
  {
    id: "which-test-framework",
    bundle: "test-first-by-evidence",
    rule: null,
    tier: "P1",
    mode: "bypass",
    difficulty: "mixed",
    prompt: "should we move from jest to vitest for this repo",
    nearMiss:
      "It is entirely about testing, and the runner is something this skill tells you to establish before writing anything. But establishing which runner a project uses is not the same as choosing one, and the choice is a project decision this skill explicitly does not own.",
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Answers on the merits without opening a rule"],
    mustNot: ["Applies the test-first cycle to a tooling decision"],
    tags: ["activation", "negative", "scope-edge"],
  },
  {
    id: "explain-what-tdd-is",
    bundle: "test-first-by-evidence",
    rule: null,
    tier: "P2",
    mode: "bypass",
    difficulty: "obvious",
    prompt: "explain red green refactor to someone who has never done it",
    nearMiss:
      "The cycle this skill enforces is named outright. But nothing is being built: the request is to teach a concept, and no code, test, or repository is in play for a rule to apply to.",
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Explains it directly"],
    mustNot: ["Opens rules, or demands a red run before answering"],
    tags: ["activation", "negative", "explain"],
  },
  {
    id: "coverage-number-dropped",
    bundle: "test-first-by-evidence",
    rule: null,
    tier: "P2",
    mode: "bypass",
    difficulty: "hard",
    prompt: "ci says coverage fell below eighty percent, can you get the number back up",
    nearMiss:
      "Coverage and tests travel together, and the fix does involve writing tests. But the ask is to move a metric, and writing tests to raise a number is the behaviour this skill's honest-test rule exists to prevent. The right response reframes toward behaviour that is genuinely untested.",
    activation: { layer: "public-skill", target: "test-first-by-evidence", shouldActivate: false, forbiddenRoutes: ["rules/tests-that-cannot-lie.md"] },
    must: ["Reframes from the number toward behaviour nothing currently proves"],
    mustNot: ["Writes assertions chosen to touch uncovered lines"],
    tags: ["activation", "negative", "metric-chasing"],
  },
];

export default scenarios;
