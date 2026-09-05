/**
 * Activation scenarios for optimising-skills.
 *
 * Every negative here is a collision with `authoring-verifiable-skills` or with
 * a review, because those are the only places this skill can be confused for.
 * A negative that shares no vocabulary would test nothing: the whole difficulty
 * is that "change this skill" is the sentence for both writing one and tuning
 * one, and only the presence of an existing skill plus evidence separates them.
 *
 * The balance is deliberate. Five positives against four negatives, because the
 * collection's own coverage audit found a suite at 4.5 positives per negative
 * and the imbalance is what produces a skill that fires on everything.
 *
 * Prompts are written the way a developer types one: lowercase, contracted,
 * naming no skill file and no rule.
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "negatives-fire-and-the-urge-is-to-reword",
    bundle: "optimising-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "optimising-skills",
    difficulty: "obvious",
    prompt: "the review skill opens on stuff its own description says it excludes. three of its four negatives fire. what do i change",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Checks whether the number and the instrument behind it hold before proposing any change",
      "Names the failure class from what the run did rather than from the score",
      "Says what would send the change back, before the change runs",
    ],
    mustNot: [
      "Rewrites the description as the first move",
      "Treats a score as established without asking what produced it",
    ],
    tags: ["activation", "positive", "precision"],
  },
  {
    id: "about-to-cut-instructions-for-a-newer-model",
    bundle: "optimising-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "optimising-skills",
    difficulty: "mixed",
    prompt: "the new model is a lot better so i want to strip out maybe half the instructions in my tdd skill that were only there for the old one. how do i know whats safe to take out",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Makes the coverage of the existing suite the precondition rather than a later step",
      "Removes one group at a time against the same scenarios",
      "Separates the smallest set that still works from the shortest file",
    ],
    mustNot: [
      "Treats an unchanged score as proof the instruction did nothing",
      "Cuts by length target",
    ],
    tags: ["activation", "positive", "subtraction"],
  },
  {
    id: "a-rate-moved-and-nothing-checked-the-measure",
    bundle: "optimising-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "optimising-skills",
    difficulty: "hard",
    prompt: "my eval says the docs skill went from 60 percent to 72 after my edit. is that real or am i fooling myself",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Asks what the measure would return on input built to fool it, before reading the delta",
      "Names the sample size and the spread rather than the two point values alone",
      "Reads what the runs produced rather than the score alone",
    ],
    mustNot: [
      "Accepts the improvement because the numbers differ",
      "Proposes a further change before the number is established",
    ],
    tags: ["activation", "positive", "instrument"],
  },
  {
    id: "read-the-rule-and-did-it-anyway",
    bundle: "optimising-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "optimising-skills",
    difficulty: "hard",
    source: "session",
    sourceNote:
      "Taken from a measured run in this collection: an agent opened a skill, opened four of its own rules including the one that forbids the behaviour, announced a state, and produced the forbidden output anyway. The situation is kept and the class is not named in the prompt, so the answer has to find it.",
    prompt: "the skill got opened, i can see it read four of its own rules, and it still did the exact thing one of those rules says never to do. do not tell me to reword the rule, and only tell me what class of failure this is",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Separates a compliance failure from a routing failure using what the run opened",
      "Chooses the form of any fix from the failure class rather than from habit",
    ],
    mustNot: [
      "Treats this as the skill not being found",
      "Proposes stronger wording of the same rule as the answer",
    ],
    tags: ["activation", "positive", "compliance", "derived"],
  },
  {
    id: "result-came-back-inside-the-noise",
    bundle: "optimising-skills",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    skillMode: "optimising-skills",
    difficulty: "mixed",
    prompt: "changed the wording and reran it, went from 0 of 3 to 1 of 3. do i keep it",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Compares the result against the noise floor at that sample size before calling it a gain",
      "Reports it as unproven rather than as a small improvement",
    ],
    mustNot: [
      "Reads one of three as movement",
      "Keeps the change on the strength of the direction alone",
    ],
    tags: ["activation", "positive", "noise-floor"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "skip-write-a-skill-that-does-not-exist",
    bundle: "optimising-skills",
    rule: null,
    tier: "P0",
    mode: "bypass",
    difficulty: "hard",
    prompt: "i keep hitting flaky ci in a way nobody has written down anywhere. i want a skill for it",
    nearMiss:
      "It is a skill and it is about making the collection better, which is the shared vocabulary. But nothing exists yet, so there is no evidence of underperformance to doubt and no before-number to change against. Writing one is a different decision and it belongs to the authoring skill.",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Treats this as writing a skill that does not exist rather than tuning one that does"],
    mustNot: ["Asks for a baseline number for a skill that has never run"],
    tags: ["activation", "negative", "collision", "authoring"],
  },
  {
    id: "skip-split-a-skill-that-grew-two-decisions",
    bundle: "optimising-skills",
    rule: null,
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt: "this rule file has clearly turned into two separate decisions and its over the word budget. split it",
    nearMiss:
      "Changing an existing skill, which is this skill's whole subject. But the reason is structural and visible on reading, with no measurement involved and nothing to predict. Structure is owned by the authoring skill, and running an experiment on a split would buy nothing.",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Treats the split as a structural decision that needs no experiment"],
    mustNot: ["Demands a before-number before a file can be split"],
    tags: ["activation", "negative", "collision", "structure"],
  },
  {
    id: "skip-review-the-change-i-just-made",
    bundle: "optimising-skills",
    rule: null,
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt: "have a look at the edit i just made to the debugging skill and tell me if its any good",
    nearMiss:
      "An existing skill and a change to it, which is two thirds of the trigger. But the change has already been made and the ask is a judgement on it, not a decision about what to change or how to measure it. Judging an existing change is a review.",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Judges the change that exists rather than designing an experiment"],
    mustNot: ["Requires a registered prediction before commenting on work already done"],
    tags: ["activation", "negative", "collision", "review"],
  },
  {
    id: "skip-a-structural-check-is-failing",
    bundle: "optimising-skills",
    rule: null,
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt: "the verify script is red on my skill, says 190 lines against a limit of 160",
    nearMiss:
      "A number about a skill, which is the surface pattern this skill matches on. But it is a structural gate reporting a fact about the file, not evidence about behaviour, and there is no instrument to doubt and no experiment to run. Structure belongs to the authoring skill.",
    activation: { layer: "public-skill", target: "optimising-skills", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Treats a structural gate as a fact about the file rather than a behavioural measurement"],
    mustNot: ["Opens an experiment to decide whether a line count is real"],
    tags: ["activation", "negative", "collision", "structural"],
  },
];

export default scenarios;
