import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

const scenarios = [
  {
    id: "maintainable-activation-broad-context-refactor",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "Review this service refactor. Every function now receives one broad context object; I want clearer dependencies and easier tests without adding layers for their own sake.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: true,
    },
    must: ["Selects maintainability guidance for the explicit dependency, testability, and proportionality tradeoff"],
    mustNot: ["Treats the request as a mechanical code edit"],
    tags: ["activation", "positive", "dependencies"],
  },
  {
    id: "maintainable-activation-module-ownership",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "Help restructure this module so ownership is obvious, behavior stays testable, and we do not create abstractions that hide the business flow.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: true,
    },
    must: ["Selects maintainability guidance because module ownership and abstraction depth are central"],
    mustNot: ["Optimizes only for fewer lines"],
    tags: ["activation", "positive", "ownership"],
  },
  {
    id: "maintainable-activation-naming-and-cohesion",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "This package has inconsistent names, scattered helpers, and unclear boundaries. Propose the smallest durable cleanup that follows the repository's existing conventions.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: true,
    },
    must: ["Selects maintainability guidance for cohesion, naming, boundaries, and convention reuse"],
    mustNot: ["Proposes an unrelated architecture rewrite"],
    tags: ["activation", "positive", "cohesion"],
  },
  {
    id: "maintainable-skip-literal-typo",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "exception",
    difficulty: "mixed",
    prompt: "Change the typo in this user-facing string from 'recieve' to 'receive'. Do not touch anything else.",
        nearMiss:
      "A string edit is a change to a source file, which is this skill's subject. But nothing about structure, boundaries, or cohesion is in play: one token changes and the surrounding design is untouched.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: false,
    },
    must: ["Leaves broad maintainability guidance unloaded for a literal one-token edit"],
    mustNot: ["Expands the typo fix into refactoring or review"],
    tags: ["activation", "negative", "mechanical-edit"],
  },
  {
    id: "maintainable-skip-query-diagnosis",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Explain why this SQL query returns zero rows with these parameters. Diagnose the current behavior only; do not redesign or refactor the data layer.",
        nearMiss:
      "Diagnosing a data layer sounds like the boundary and cohesion questions this skill owns, and the words are all here. But the ask is why current behaviour happens, not whether the design is right, and it forbids redesign outright.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: false,
    },
    must: ["Leaves maintainability guidance unloaded because the request is bounded diagnosis without design work"],
    mustNot: ["Substitutes architecture advice for root-cause analysis"],
    tags: ["activation", "negative", "diagnosis"],
  },
  {
    id: "maintainable-skip-disposable-script",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt:
      "Write a disposable eight-line script that renames these five local files once. It will be deleted immediately afterward; no library or reusable API is needed.",
        nearMiss:
      "'No reusable API is needed' names the exact tension this skill arbitrates. It names it in order to close it: eight lines deleted immediately have no future reader to protect, and that reader is the entire reason the guidance exists.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: false,
    },
    must: ["Leaves architecture-level maintainability guidance unloaded for explicitly disposable code"],
    mustNot: ["Introduces reusable layers or framework structure"],
    tags: ["activation", "negative", "disposable"],
  },
  {
    id: "this-file-is-long-split-it",
    bundle: "maintainable-code",
    rule: "core-rules",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "this file is about 700 lines, split it up",
    activation: { layer: "public-skill", target: "maintainable-code", shouldActivate: true, forbiddenRoutes: [] },
    expectedPrimary: "maintainable-code",
    must: [
      "Asks what the pieces would be before agreeing to divide",
      "Decides from whether each piece can be understood on its own, not from the length",
      "Says what would be harder to follow after the split"
    ],
    mustNot: [
      "Splits because the file is long",
      "Proposes a file per function or per type"
    ],
    tags: ["real-world", "granularity", "length-is-not-a-reason"]
  },
  {
    id: "our-standard-says-four-hundred-lines",
    bundle: "maintainable-code",
    rule: "core-rules",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "our standard says 400 lines max and this one is 700. what do i split out?",
    activation: { layer: "public-skill", target: "maintainable-code", shouldActivate: true, forbiddenRoutes: [] },
    expectedPrimary: "maintainable-code",
    must: [
      "Treats the number as a prompt to look rather than as the decision",
      "Names what would be separately comprehensible, or says nothing here is",
      "Offers what to do when the standard and the reading disagree"
    ],
    mustNot: [
      "Splits to satisfy the number regardless of what the pieces become",
      "Dismisses the standard without addressing it"
    ],
    tags: ["adversarial", "standard-versus-reading", "measured-conflict"]
  },
  {
    id: "changed-one-file-and-something-else-broke",
    bundle: "maintainable-code",
    rule: "core-rules",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "i changed one small file and a completely different caller broke. how do i stop this happening",
    activation: { layer: "public-skill", target: "maintainable-code", shouldActivate: true, forbiddenRoutes: [] },
    expectedPrimary: "maintainable-code",
    must: [
      "Looks at how far the decision is spread before proposing a guard",
      "Treats pieces that must be understood together but live apart as the cause"
    ],
    mustNot: [
      "Adds a test as the whole answer without asking why the connection was invisible",
      "Assumes the caller was at fault"
    ],
    tags: ["real-world", "silent-partial-view", "consequence"]
  },
  {
    id: "two-small-files-or-one",
    bundle: "maintainable-code",
    rule: "core-rules",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "should these two functions live in the same file? one calls the other and nothing else does",
    activation: { layer: "public-skill", target: "maintainable-code", shouldActivate: true, forbiddenRoutes: [] },
    expectedPrimary: "maintainable-code",
    must: [
      "Keeps them together while one is the only caller"
    ],
    mustNot: [
      "Separates them on principle"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "package-boundary-not-file-count",
    nearMiss:
      "It arrives as a question about how code is divided, which is what this skill decides; but the split being asked about is an ownership boundary between teams that deploy apart, so what settles it is who depends on whom and in which direction, not how much the unit holds.",
    bundle: "maintainable-code",
    rule: "core-rules",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "should this be its own package? two teams deploy it separately and both depend on it",
    activation: { layer: "public-skill", target: "maintainable-code", shouldActivate: false, forbiddenRoutes: [] },
    expectedPrimary: "maintainable-code",
    must: [
      "Answers from ownership and the direction dependencies point"
    ],
    mustNot: [
      "Answers from how many files or lines it holds"
    ],
    tags: ["near-miss", "boundary-not-granularity"]
  },
] satisfies EvalScenario[];

export default scenarios;
