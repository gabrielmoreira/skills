/**
 * Activation + routing scenarios for the debugging-by-evidence skill.
 *
 * Schema matches the `EvalScenario` shape used by the sibling routing packages:
 *   id, bundle, rule, tier, mode, difficulty, prompt,
 *   expectedPrimary, expectedSecondary, activation, must, mustNot, tags
 *
 * Deviations from that shape, both additive and documented here:
 *   - plain `.mjs` instead of `.ts`, so the suite runs with bare `node` and no
 *     toolchain inside the skill directory;
 *   - `nearMiss` on negative scenarios: one or two sentences naming the word or
 *     shape that makes the prompt look like a match, plus the correct behaviour.
 *
 * Pointers use the skill's own relative notation (`rules/<rule>.md`), which is
 * the notation SKILL.md and INDEX.md already use, not an absolute URI scheme.
 *
 * `forbiddenRoutes` stays empty on every positive. The matched question selects
 * an entry rule; independent questions may need other rules at different layers.
 * The claim under test is the initial route, not a mandatory sequence of states
 * or a requirement to leave every other rule unread.
 * Forbidden routes appear only on the negatives that collide with a specific
 * rule, where the claim is that the rule must not be reached at all.
 *
 * Prompts are written in English, the way a developer actually types one:
 * lowercase, contracted, sometimes unfinished, and naming no skill, rule, file,
 * or concept word the skill invented.
 *
 * @typedef {"P0"|"P1"|"P2"} Tier
 * @typedef {"router"|"apply"|"bypass"|"exception"|"complexity"|"simplification"} Mode
 * @typedef {"obvious"|"mixed"|"hard"} Difficulty
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "flaky-failures-after-my-change-no-idea-which",
    bundle: "debugging-by-evidence",
    rule: "runnable-signal",
    tier: "P0",
    mode: "router",
    skillMode: "debugging-by-evidence",
    difficulty: "obvious",
    prompt:
      "tests fail after my change, no idea which one, and it only happens sometimes",
    expectedPrimary: "rules/runnable-signal.md",
    expectedSecondary: ["rules/minimising.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: ["rules/probing.md"],
    },
    must: [
      "Uses the reported failure and available records to select a relevant reproduction or controlled experiment",
      "Distinguishes a reported intermittent failure from a measured rate, without demanding a fixed run count",
      "Explains which input, dependency outcome or schedule the next check would control and what result would matter",
      "Keeps proposed hypotheses separate from causes established by evidence",
    ],
    mustNot: [
      "Applies an unsupported production fix instead of testing the relevant handling or obtaining missing evidence",
      "Treats a local passing run as proof the reported failure did not occur",
    ],
    tags: ["activation", "positive", "intermittent", "signal"],
  },
  {
    id: "breaks-for-customers-but-not-locally",
    bundle: "debugging-by-evidence",
    rule: "runnable-signal",
    tier: "P0",
    mode: "router",
    skillMode: "debugging-by-evidence",
    difficulty: "hard",
    prompt:
      "checkout falls over for some customers but locally everything's green. i've been reading the handler for an hour and nothing jumps out at me. we've got the failed request bodies if that helps",
    expectedPrimary: "rules/runnable-signal.md",
    expectedSecondary: ["rules/rival-hypotheses.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: ["rules/probing.md"],
    },
    must: [
      "Keeps the recorded customer failures separate from the local passing runs",
      "Uses the failed inputs and source to choose replay or a justified controlled experiment at a useful layer",
      "Keeps the symptom in the user's own words beside any restatement of it",
      "If the needed observation is inaccessible, names the gap without forbidding independent supported investigation",
    ],
    mustNot: [
      "Claims a historical cause merely because reading the handler suggested it",
      "Requires reproducing the entire customer environment before testing a justified handling hypothesis",
    ],
    tags: ["activation", "positive", "no-signal", "environment-gap"],
  },
  {
    id: "one-assert-red-only-under-the-full-run",
    bundle: "debugging-by-evidence",
    rule: "minimising",
    tier: "P1",
    mode: "apply",
    skillMode: "debugging-by-evidence",
    difficulty: "mixed",
    prompt:
      "one assert around the totals is red, but the only way i can get it to go red is the full end-to-end run. thirty-odd setup steps across a pile of files, takes forever, and i can't tell what actually matters",
    expectedPrimary: "rules/minimising.md",
    expectedSecondary: ["rules/runnable-signal.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Identifies setup that may be irrelevant to the demonstrated defect",
      "Keeps a reduction only while the same relevant contract violation remains",
      "Preserves required ordering and distinguishes evidence from an intermittent pass",
      "Stops reducing when the check is clear enough to support the decision",
    ],
    mustNot: [
      "Drops several elements in one run and reads a still-red result as evidence about all of them",
      "Deletes the failing assertion to make the run smaller",
    ],
    tags: ["activation", "positive", "oversized-loop"],
  },
  {
    id: "its-the-cache-it-always-is",
    bundle: "debugging-by-evidence",
    rule: "rival-hypotheses",
    tier: "P0",
    mode: "router",
    skillMode: "debugging-by-evidence",
    difficulty: "mixed",
    prompt:
      "what should we test first: cart total in src/discounts.js comes out short on some orders. it's the discount cache, it always is. want me to just flush it and see?",
    expectedPrimary: "rules/rival-hypotheses.md",
    expectedSecondary: ["rules/probing.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: ["rules/fix-at-the-source.md"],
    },
    must: [
      "Names plausible explanations that could change the decision without filling a fixed quota",
      "Attaches a discriminating observation to each explanation",
      "Chooses an experiment for relevance, discriminating power and cost rather than the user's confidence",
      "Labels unsupported claims and revises candidates when new evidence warrants it",
    ],
    mustNot: [
      "Goes straight at the cache because the user named it",
      "Flushes state or applies a repair without evidence and authority for that action",
    ],
    tags: ["activation", "positive", "anchoring", "candidates"],
  },
  {
    id: "worker-stalls-gotta-be-a-leak",
    bundle: "debugging-by-evidence",
    rule: "rival-hypotheses",
    tier: "P1",
    mode: "complexity",
    skillMode: "debugging-by-evidence",
    difficulty: "hard",
    prompt:
      "queue worker stops picking up jobs after a few hours. restarting it buys us another few hours. gotta be a leak somewhere right",
    expectedPrimary: "rules/rival-hypotheses.md",
    expectedSecondary: ["rules/runnable-signal.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Keeps the leak theory as one candidate among several rather than as the starting point",
      "Identifies observations that distinguish candidates while allowing several causes to coexist",
      "Chooses a useful next observation by relevance, discriminating power and cost",
      "Recognises that restarting helps does not identify a leak by itself",
    ],
    mustNot: [
      "Treats the user's leak theory or one memory measurement as an established cause",
      "Keeps a candidate that no result could contradict",
    ],
    tags: ["activation", "positive", "slow-degradation", "candidates"],
  },
  {
    id: "want-to-drop-log-lines-in-the-total-calc",
    bundle: "debugging-by-evidence",
    rule: "probing",
    tier: "P1",
    mode: "apply",
    skillMode: "debugging-by-evidence",
    difficulty: "mixed",
    prompt:
      "i want to drop some log lines inside the total calculation and see what the values look like on the way through. where should they go",
    expectedPrimary: "rules/probing.md",
    expectedSecondary: ["rules/rival-hypotheses.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Names the prediction and the information needed to test it before placing instrumentation",
      "Makes temporary instrumentation identifiable and removes it after preserving its evidence",
      "Records the values or identities needed for the prediction rather than logging indiscriminately",
      "Keeps observation separate from a labelled controlled intervention and avoids confounded changes",
    ],
    mustNot: [
      "Leaves an inserted line in the tree once the question it answered is settled",
      "Silently changes production handling while claiming to be observing it",
    ],
    tags: ["activation", "positive", "instrumentation"],
  },
  {
    id: "guard-right-before-the-division",
    bundle: "debugging-by-evidence",
    rule: "fix-at-the-source",
    tier: "P0",
    mode: "router",
    skillMode: "debugging-by-evidence",
    difficulty: "mixed",
    prompt:
      "how should we fix this: calculateFreightRate in src/shipping.js throws division by zero when total weight arrives as 0. can we put a guard right before the division?",
    expectedPrimary: "rules/fix-at-the-source.md",
    expectedSecondary: ["rules/regression-seam.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: ["rules/minimising.md"],
    },
    must: [
      "Traces the zero through the relevant boundaries and checks their contracts before deciding whether it is invalid input or valid input handled incorrectly",
      "Locates the first supported contract violation and proposes the repair there without inventing code locations absent from the supplied evidence",
      "Finds affected consumers and records their changed, unaffected or unverified contracts",
      "Removes old guards only when the contracts they protect are shown to be obsolete",
    ],
    mustNot: [
      "Adds a guard and calls the problem fixed without establishing whether it corrects the violated contract or merely suppresses the symptom",
      "Loosens a contract merely to make the failing value acceptable",
    ],
    tags: ["activation", "positive", "propagation", "guard-temptation"],
  },
  {
    id: "same-bad-date-patched-twice-already",
    bundle: "debugging-by-evidence",
    rule: "fix-at-the-source",
    tier: "P1",
    mode: "complexity",
    skillMode: "debugging-by-evidence",
    difficulty: "hard",
    prompt:
      "the same wrong date keeps turning up on different screens. we patched it twice in two different places and now it's back on a third one. honestly i'm tired of this",
    expectedPrimary: "rules/fix-at-the-source.md",
    expectedSecondary: ["rules/stopping-and-escalating.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Uses the earlier patches to investigate a shared cause without treating repeated symptoms alone as proof of where the defect lies",
      "Traces the date through relevant boundaries to locate the first supported contract violation",
      "Proposes the repair at the responsible code and checks affected consumers rather than patching each screen",
      "Distinguishes correcting owned handling of valid external input from containment that leaves an upstream defect unresolved",
    ],
    mustNot: [
      "Adds a third patch on the third screen",
      "Claims the producing line is the cause without evidence supporting that mechanism",
    ],
    tags: ["activation", "positive", "repeat-symptom", "propagation"],
  },
  {
    id: "fix-works-now-stop-it-coming-back",
    bundle: "debugging-by-evidence",
    rule: "regression-seam",
    tier: "P0",
    mode: "apply",
    skillMode: "debugging-by-evidence",
    difficulty: "mixed",
    prompt:
      "ok i found it and the fix works. now i want something that stops it coming back. only easy place to test is a private helper though, the real path needs a whole lot of setup",
    expectedPrimary: "rules/regression-seam.md",
    expectedSecondary: ["rules/minimising.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Names the violated contract and chooses the narrowest test point that exercises its real handling",
      "Asserts what that layer's caller observes, not a mock echo or an incidental call count",
      "Preserves relevant conditions, including justified injected failures or schedules",
      "Observes the defect without the fix and its correction with the fix, preserving existing work",
    ],
    mustNot: [
      "Uses an implementation detail or impossible input and claims it proves the real caller's behaviour",
      "Claims the test holds the bug down without having watched it fail with the fix removed",
    ],
    tags: ["activation", "positive", "test-placement"],
  },
  {
    id: "third-fix-third-new-breakage",
    bundle: "debugging-by-evidence",
    rule: "stopping-and-escalating",
    tier: "P0",
    mode: "router",
    skillMode: "debugging-by-evidence",
    difficulty: "hard",
    prompt:
      "third time now. i fix the expiry thing and eviction goes red, i move it and stale reads go red, i bypass the whole thing and something else breaks. i've got one more idea, worth a shot?",
    expectedPrimary: "rules/stopping-and-escalating.md",
    expectedSecondary: ["rules/fix-at-the-source.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: ["rules/regression-seam.md"],
    },
    must: [
      "Pauses unsupported patching and examines which contracts the attempts broke",
      "Preserves the attempts and their observed regressions",
      "Separates evidence against the repairs from an unproven architectural explanation",
      "Names the observation that could inform another approach or justify stopping",
    ],
    mustNot: [
      "Tries another unsupported fix or treats the attempt count alone as proof the architecture is wrong",
      "Presents the stop as having failed to find anything instead of as a finding",
    ],
    tags: ["activation", "positive", "attempt-budget"],
  },
  {
    id: "bad-rows-from-last-month-and-the-logs-are-gone",
    bundle: "debugging-by-evidence",
    rule: "stopping-and-escalating",
    tier: "P0",
    mode: "exception",
    skillMode: "debugging-by-evidence",
    difficulty: "hard",
    prompt:
      "we found a batch of bad rows written about a month ago. whatever wrote them isn't running anymore, that machine's gone and the logs rolled off ages ago. how do we work out what happened",
    expectedPrimary: "rules/stopping-and-escalating.md",
    expectedSecondary: ["rules/rival-hypotheses.md"],
    activation: {
      layer: "internal-route",
      target: "debugging-by-evidence",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Names which historical observations are missing and whether any surviving evidence could answer the question",
      "Stops historical attribution at the evidence gap while allowing independently justified contract checks",
      "Does not turn assumptions about the missing writer into confirmed causal links",
      "Keeps what the surviving rows show separate from what they cannot establish",
    ],
    mustNot: [
      "Substitutes a plausible assumption for the missing observation and carries on to a cause",
      "Recommends a change built on the step it never observed",
    ],
    tags: ["activation", "positive", "unobservable", "gap"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "skip-look-over-what-i-changed-before-i-commit",
    bundle: "debugging-by-evidence",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "before i commit, go through what i changed and tell me if anything's wrong with it. it's four files, mostly the cart total and the bit that formats it",
    nearMiss:
      "'Anything's wrong with it' is the same phrase people reach for when something is failing, and it points at real code in a real working tree. But nothing has failed: this is judgement on a change that already exists, which belongs to a change-review pass, and there is no symptom to reproduce and no cause to establish.",
    activation: {
      layer: "public-skill",
      target: "debugging-by-evidence",
      shouldActivate: false,
      forbiddenRoutes: ["rules/runnable-signal.md"],
    },
    tags: ["activation", "negative", "collision", "change-review"],
  },
  {
    id: "skip-build-error-already-names-file-line-and-cause",
    bundle: "debugging-by-evidence",
    rule: "activation-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "mixed",
    prompt:
      "build's broken. the error gives me the file, the line, and says i'm passing a string where it wants a number. just sort it out",
    nearMiss:
      "A broken build is a real failing signal and reads like the front of an investigation. But the message already names the file, the line and the cause, so there is nothing left to establish, the ranking, instrumenting and shrinking would cost more than the edit itself.",
    activation: {
      layer: "public-skill",
      target: "debugging-by-evidence",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "self-locating-error"],
  },
  {
    id: "skip-explain-how-the-retry-behaviour-works",
    bundle: "debugging-by-evidence",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "walk me through how the retry behaviour in the queue worker actually works. never touched that bit and i need to understand it before monday",
    nearMiss:
      "Retries around a worker are the classic home of intermittent trouble, and people usually only ask about that code when it has misbehaved. But nothing is failing here, so there is no symptom to put in front of a command and nothing for competing explanations to compete about.",
    activation: {
      layer: "public-skill",
      target: "debugging-by-evidence",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "explanation-only"],
  },
  {
    id: "skip-add-permanent-logging-to-the-worker",
    bundle: "debugging-by-evidence",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "add decent logging around the queue worker so we can actually see what it's doing once it's deployed. this should stay in, it's not a one-off",
    nearMiss:
      "Inserting log lines into live code is exactly the mechanic the instrumentation path owns, down to the wording. But these lines are a durable feature meant to survive, not tagged temporary output placed to settle one prediction, and no failure is under investigation for them to settle.",
    activation: {
      layer: "public-skill",
      target: "debugging-by-evidence",
      shouldActivate: false,
      forbiddenRoutes: ["rules/probing.md"],
    },
    tags: ["activation", "negative", "collision", "durable-logging"],
  },
  {
    id: "skip-add-tests-to-an-untested-module",
    bundle: "debugging-by-evidence",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "mixed",
    prompt:
      "the payments module has basically no tests. can you add some? nothing's broken, i just don't trust it and i want cover before we touch it again",
    nearMiss:
      "Choosing a test seam is relevant, but no defect is under investigation. This is coverage of existing behaviour, not a regression investigation; the user says outright that nothing is failing.",
    activation: {
      layer: "public-skill",
      target: "debugging-by-evidence",
      shouldActivate: false,
      forbiddenRoutes: ["rules/regression-seam.md"],
    },
    tags: ["activation", "negative", "collision", "coverage-work"],
  },
];

export default scenarios;
