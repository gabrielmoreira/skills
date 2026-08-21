/**
 * Activation scenarios for bound-the-unknown.
 *
 * This skill borders four others, and three of the four negatives below are
 * collisions with them rather than distant prompts. That is deliberate: a
 * negative that shares no vocabulary tests nothing, and the whole difficulty of
 * this skill is that unfamiliar ground looks like a bug, a placement question,
 * or a broken tool until someone checks whether a name has been established.
 *
 * Prompts are written the way a developer types one: lowercase, contracted,
 * often unfinished, and naming no skill or rule. Several are deliberately
 * underspecified, because a request made from unfamiliar ground usually is.
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "second-probe-still-no-shape",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "bound-the-unknown",
    difficulty: "obvious",
    prompt: "i've grepped twice and read the config and i still can't work out where that value is coming from",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Treats two probes without a named finding as the moment to bound the search rather than continue it",
      "States how far the next round of probing will go before running it",
      "Keeps the probing read-only",
    ],
    mustNot: [
      "Carries on probing without saying where it will stop",
      "Treats this as a defect with a known symptom",
    ],
    tags: ["activation", "positive", "countable-trigger"],
  },
  {
    id: "about-to-write-a-script-to-find-out",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    skillMode: "bound-the-unknown",
    difficulty: "mixed",
    prompt: "i want to know how many of our services still hit the v1 endpoint. was gonna write something to walk the repos and count",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes the extract to a file and queries the file rather than reading the material into the reply",
      "States the budget before running the search",
      "Closes on a finding with what was ruled out",
    ],
    mustNot: [
      "Pastes the full walk output back as the answer",
      "Leaves the search open-ended",
    ],
    tags: ["activation", "positive", "intermediate-to-disk"],
  },
  {
    id: "build-says-fine-but-artifact-missing",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    skillMode: "bound-the-unknown",
    difficulty: "mixed",
    prompt: "the file i expected to be generated isn't there but the build reports success. no idea what's actually happening in there",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Recognises there is no named symptom yet, only an expectation that did not hold",
      "Bounds the investigation before starting it",
      "Stops when the next decision no longer needs another probe",
    ],
    mustNot: [
      "Proposes a fix before the shape is established",
      "Investigates without a stated stopping point",
    ],
    tags: ["activation", "positive", "unexpected-read"],
  },
  {
    id: "placement-question-with-an-open-technical-unknown",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "bound-the-unknown",
    difficulty: "hard",
    prompt: "we want offline sync in the mobile app. not sure the storage layer we use can even do conflict resolution. where should this live?",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Answers the placement question only after the technical unknown is resolved",
      "Distinguishes a technical unknown from a structural one",
      "Proposes an isolated probe to settle whether the storage layer supports it",
    ],
    mustNot: [
      "Chooses a module boundary while it is still unknown whether the approach works",
      "Treats this as a pure structure question",
    ],
    tags: ["activation", "positive", "prove-before-place", "collision"],
  },
  {
    id: "already-forty-minutes-in-and-fuzzy",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    skillMode: "bound-the-unknown",
    difficulty: "mixed",
    prompt: "been poking around this for like 40 minutes across a load of files and it's still fuzzy to me",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Stops the open-ended search and states a bound for whatever comes next",
      "Reports what the time already spent established, including what it ruled out",
    ],
    mustNot: [
      "Simply continues the same unbounded search",
      "Reports only what was seen, with no decision",
    ],
    tags: ["activation", "positive", "unbounded-already"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "named-symptom-with-a-reproducing-signal",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "hard",
    prompt: "the checkout test started failing with a null pointer at line 88 right after my change. can you work out why",
    nearMiss:
      "It reads as unfamiliar ground because the cause is unknown, and the vocabulary of investigating overlaps almost entirely; but the symptom is named, a signal already reproduces it, and establishing a cause from a reproducing signal is a different job with its own loop.",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Starts from the command that already reproduces the failure",
      "Establishes the cause before proposing any fix",
    ],
    mustNot: [
      "Treats a named symptom as unfamiliar terrain with no task yet",
    ],
    tags: ["activation", "negative", "collision"],
  },
  {
    id: "knows-what-to-build-asks-only-where",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "hard",
    prompt: "adding a subscriptions feature, the api contract is agreed and i've built one of these before. where should the module sit in this repo?",
    nearMiss:
      "It is the same sentence shape as the positive about offline sync, and both end by asking where something goes; but nothing technical is open here, so the only unknown is structural and the placement can be decided directly.",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Answers the placement question directly, since no technical unknown is open",
      "Reasons about boundaries and the direction dependencies point",
    ],
    mustNot: [
      "Proposes probing before answering",
    ],
    tags: ["activation", "negative", "collision", "structural-only"],
  },
  {
    id: "registry-refuses-the-install",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "bypass",
    skillMode: "none",
    difficulty: "mixed",
    prompt: "install keeps dying with a 403 from our internal registry and i have no clue what changed",
    nearMiss:
      "The phrase no clue what changed reads as unfamiliar ground, and it will need probing; but the failure is in the tooling rather than in the change being made, and that has its own containment and its own budget.",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Treats the tooling failure as separate from the work it interrupted",
      "Bounds the investigation and reports a workaround as a finding rather than a fix",
    ],
    mustNot: [
      "Treats a broken tool as terrain to be surveyed before any task exists",
    ],
    tags: ["activation", "negative", "collision", "tooling"],
  },
  {
    id: "branch-ready-for-judgement",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "bypass",
    skillMode: "none",
    difficulty: "mixed",
    prompt: "not sure this holds up, can you go through what i changed before i put it up",
    nearMiss:
      "Not sure this holds up sounds like an open question about unfamiliar ground; but a change already exists and supplies the anchor, so the work is judging it rather than surveying anything.",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Resolves a base point and reads the range",
      "Reports findings against the change without editing it",
    ],
    mustNot: [
      "Surveys the repository as though no change existed",
    ],
    tags: ["activation", "negative", "collision", "review"],
  },
];

export default scenarios;
