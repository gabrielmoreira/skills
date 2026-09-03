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
 * `forbiddenRoutes` stays empty on every positive. This skill is entered at the
 * matched index row and then follows the loop states in order, so a sibling rule
 * is not forbidden, it is simply read later, when its state is reached. The
 * claim under test is which rule is entered first, not which rules stay unread.
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
      forbiddenRoutes: [],
    },
    must: [
      "Runs the project's declared test command itself and quotes the output line that shows the failure before offering any explanation",
      "Counts a set of runs and reports how many went red as a fraction, instead of repeating 'sometimes'",
      "Treats pinning the clock, the seed, and the run's own directory or port as work separate from having a failing run at all",
      "Says which stage of the investigation it is in and that nothing yet permits naming a cause",
    ],
    mustNot: [
      "Proposes a fix, or edits code, before a command it ran has printed the failure",
      "Calls the failure intermittent with no counted rate attached",
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
      forbiddenRoutes: [],
    },
    must: [
      "States plainly that nothing it has run shows the symptom yet, and treats that as the current status rather than a preamble",
      "Spends its effort on getting one command to go red, narrowing to the failing surface and feeding it the input shape the failed requests carry",
      "Keeps the symptom in the user's own words beside any restatement of it",
      "If it still cannot get a failing run, reports what it tried and what observation would produce one",
    ],
    mustNot: [
      "Names a cause from having read the handler",
      "Proposes a fix while no command has produced the failure",
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
      "Lists the setup steps, inputs, collaborators and assertions as separate elements before cutting anything",
      "Removes one element per run, re-runs, and keeps the cut only while the run stays red",
      "Puts back anything whose removal turns the run green and marks it required",
      "States the element count before and after",
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
      forbiddenRoutes: [],
    },
    must: [
      "Writes three to five competing explanations spread across the changed code, its inputs, its dependencies, the environment, and the failing run itself",
      "Attaches to each explanation the observation that would kill it",
      "Checks first the one whose killing observation is cheapest to make, not the one the user named",
      "Discards any explanation nothing could disprove, and says which one it discarded and why",
    ],
    mustNot: [
      "Goes straight at the cache because the user named it",
      "Flushes anything or edits code before a command it ran has shown the short total",
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
      "Splits the candidates so a single observation can separate them, instead of listing several wordings of one idea",
      "Orders the candidates by how cheaply each can be disproved and says which order it picked",
      "Points out that 'restarting helps' fits more than one candidate and narrows nothing on its own",
    ],
    mustNot: [
      "Starts measuring memory because the user said leak",
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
      "Asks which prediction the output is meant to test, and names the explanation it belongs to, before writing any line",
      "Gives every inserted line one token unique to this run so a single search finds them all again",
      "Prints the value together with its type, and its identity where sharing could matter",
      "Changes one thing per run, the input or the instrument, never both at once",
    ],
    mustNot: [
      "Leaves an inserted line in the tree once the question it answered is settled",
      "Writes a line that alters a return value, reorders a call, or swallows an error",
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
      forbiddenRoutes: [],
    },
    must: [
      "Walks backward one hop at a time from the failing line, citing file and line at each hop, until it reaches the line that first produced the zero",
      "Puts the change where the wrong value is produced and states the hop count from there to the symptom",
      "Asks what else that same producer feeds, and lists the other consumers it found",
      "Removes the guards the old symptom motivated once they can no longer be reached",
    ],
    mustNot: [
      "Adds the guard at the failing line and calls that the fix while the producer sits inside this repository",
      "Loosens a type or a check so that zero becomes a legal value",
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
      "Reads the two earlier patches as evidence the change was made where the symptom showed rather than where the value is made",
      "Traces back to the single line that produces the wrong date, recording each hop at file and line",
      "Changes it once at that line instead of once per screen, and names the other consumers downstream of it",
      "Labels a change made where the value enters from outside as containment, and names the outside source",
    ],
    mustNot: [
      "Adds a third patch on the third screen",
      "Names the producing line from reading alone, with no run that shows the wrong date",
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
      "Names the call site the bug happens at with file and line, and picks the closest test point that actually runs it",
      "Asserts what the caller sees, the value returned, the row written, the message emitted, not an internal call count or a log line",
      "Carries the inputs from the shrunken failing run into the test",
      "Takes the fix back out, runs the new test, records the failure output, restores the fix and runs it again",
    ],
    mustNot: [
      "Tests the private helper because the real path is inconvenient to set up",
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
      forbiddenRoutes: [],
    },
    must: [
      "Stops writing fixes and presents the three attempts as the result",
      "Records each attempt as three fields: the change at file and line, the check that went red, and what that pairing says about the structure",
      "Names the structural change the three attempts point at, the boundary in the wrong place, or two jobs living in one unit",
      "Keeps the count where it is rather than resetting it because an attempt was reverted",
    ],
    mustNot: [
      "Tries the fourth idea",
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
      "Names the missing observation plainly, the one action that would produce it, and who or what could take that action",
      "Stops there instead of continuing the chain past the point it cannot observe",
      "Marks everything downstream of that point as not established by the evidence it has",
      "Keeps what the surviving rows do show separate from what they do not",
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
    must: [
      "Reviews the change that exists and reports what it finds against it",
      "Says, if it says anything about failures, only what the project's own checks actually reported",
    ],
    mustNot: [
      "Tries to build a failing run for a change nobody reported failing",
      "Withholds the review until something goes red",
    ],
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
    must: [
      "Makes the edit the message already points at and re-runs the build to confirm it is clear",
    ],
    mustNot: [
      "Opens a ranked list of competing explanations for an error whose message is already complete",
      "Adds temporary output to code whose defect the compiler has already located",
    ],
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
    must: [
      "Reads the code and explains the behaviour directly, in the order the flow runs",
    ],
    mustNot: [
      "Goes hunting for a failing run nobody reported",
      "Answers with findings and a status line instead of an explanation",
    ],
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
    must: [
      "Adds logging designed to stay, at the levels and boundaries the project already uses elsewhere",
    ],
    mustNot: [
      "Tags the lines as temporary, or plans their removal, when the user asked for them to stay",
      "Demands a failing run before adding logging that was never meant to be temporary",
    ],
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
      "Choosing a test point that exercises the real call site rather than a convenient helper is precisely the seam question. But that question only opens once a cause has been explained and a fix written, and the user says outright that nothing is failing.",
    activation: {
      layer: "public-skill",
      target: "debugging-by-evidence",
      shouldActivate: false,
      forbiddenRoutes: ["rules/regression-seam.md"],
    },
    must: [
      "Writes tests over the module's current behaviour at the test points that already exist",
    ],
    mustNot: [
      "Waits for a failing run before writing any test",
      "Reports an investigation status instead of tests",
    ],
    tags: ["activation", "negative", "collision", "coverage-work"],
  },
];

export default scenarios;
