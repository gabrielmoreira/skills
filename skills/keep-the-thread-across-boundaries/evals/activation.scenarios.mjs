/**
 * Activation scenarios for keep-the-thread-across-boundaries.
 *
 * The hard part of this skill is that its moments are short. A decision, a
 * constraint, or an approval arrives inside a sentence about something else,
 * and the prompt that carries it rarely looks like a request to record
 * anything. So the positives here are mostly ordinary working sentences, and
 * the negatives are the things that resemble them most: a fact worth keeping
 * somewhere else, a decision that has earned a durable home, and steering that
 * settles nothing at all.
 *
 * Prompts are written the way a developer types one, and name no skill or rule.
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "choice-made-between-two-approaches",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "keep-the-thread-across-boundaries",
    difficulty: "obvious",
    prompt: "right, let's go with the queue then. the cron thing is too fragile with the retries",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Records the choice together with the option it rejected and the reason",
      "Writes it now rather than at the end of the work",
      "Writes an entry that makes sense without the preceding turn",
    ],
    mustNot: [
      "Records only the chosen option, losing what it beat",
      "Defers recording until the work is finished",
    ],
    tags: ["activation", "positive", "decision"],
  },
  {
    id: "constraint-stated-in-passing",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "keep-the-thread-across-boundaries",
    difficulty: "mixed",
    prompt: "whatever we do here i don't want another dependency added for it",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Treats a constraint as a decision with an open scope and records it",
      "Captures it as something that governs later work rather than only this turn",
    ],
    mustNot: [
      "Treats it as passing commentary that needs no record",
    ],
    tags: ["activation", "positive", "constraint"],
  },
  {
    id: "approval-given-as-a-bare-yes",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "keep-the-thread-across-boundaries",
    difficulty: "hard",
    prompt: "yeah go with the second one",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes out what was approved rather than recording the agreement itself",
      "Produces an entry that a cold reader could understand without the previous turn",
      "Marks it as an approval, which does not survive a boundary the way a decision does",
    ],
    mustNot: [
      "Records a bare acknowledgement whose subject is not stated",
      "Treats the approval as permanently valid",
    ],
    tags: ["activation", "positive", "approval", "anaphora"],
  },
  {
    id: "objective-replaced-mid-flight",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    skillMode: "keep-the-thread-across-boundaries",
    difficulty: "mixed",
    prompt: "actually leave the migration for now, the export is broken in prod and that matters more",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Parks the migration with where it stopped rather than dropping it silently",
      "Makes the new objective the one in hand",
    ],
    mustNot: [
      "Abandons the first item with no record of its state",
    ],
    tags: ["activation", "positive", "objective-change"],
  },
  {
    id: "second-request-arrives-mid-work",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    skillMode: "keep-the-thread-across-boundaries",
    difficulty: "mixed",
    prompt: "while you're in there, can you also figure out why the audit logs are coming through empty",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Classifies the second request before acting on it",
      "Parks the first with its state only if the second genuinely interrupts it",
    ],
    mustNot: [
      "Switches to the second request leaving no trace of the first",
      "Records a frame for something that neither interrupts nor carries state worth restoring",
    ],
    tags: ["activation", "positive", "stacking"],
  },
  {
    id: "resuming-from-a-summary",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "keep-the-thread-across-boundaries",
    difficulty: "obvious",
    prompt: "picking this back up after a break, what were we in the middle of",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Reads the record before acting",
      "Says what was promoted into the current turn and what was left as background",
      "Treats prior approvals as pending again while prior decisions still stand",
    ],
    mustNot: [
      "Reconstructs the state from recollection instead of the record",
      "Treats a prior approval as still valid",
    ],
    tags: ["activation", "positive", "resume"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "a-fact-worth-keeping-somewhere-else",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "hard",
    prompt: "worth noting the api returns 204 rather than 200 when the result set is empty. cost me an hour to find that",
    nearMiss:
      "It arrives in the same shape as a decision, mid-sentence and worth keeping, and the phrase worth noting invites recording; but it is a fact with evidence rather than a choice between options, it has no rejected alternative, and it belongs wherever this host already keeps learnings.",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Keeps the fact where facts with their evidence already live",
      "Preserves the evidence that established it",
    ],
    mustNot: [
      "Files a fact as a decision in the in-flight record",
      "Stores it in two places",
    ],
    tags: ["activation", "negative", "collision", "fact"],
  },
  {
    id: "decision-that-has-earned-a-durable-home",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "hard",
    prompt: "this one we should write up properly so the rest of the team stops re-proposing the other approach every quarter",
    nearMiss:
      "Every word matches: a decision, an alternative people keep re-proposing, and a wish for it to stop being re-argued; but the ask is for a durable record a later reader relies on, which is a documentation decision about placement and permanence rather than in-flight state.",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Treats this as written material that needs a home and a form",
      "Places it where a later reader would look",
    ],
    mustNot: [
      "Leaves it only in the in-flight record, which is not written for a later reader",
    ],
    tags: ["activation", "negative", "collision", "durable"],
  },
  {
    id: "steering-that-settles-nothing",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "bypass",
    skillMode: "none",
    difficulty: "mixed",
    prompt: "keep going, that direction looks right",
    nearMiss:
      "It is approving in tone and arrives at exactly the moment an approval would; but nothing is chosen and nothing is rejected, so an entry written from it could not stand alone, and recording it would fill the record with turns rather than decisions.",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Continues the work without recording anything",
    ],
    mustNot: [
      "Writes an entry whose subject cannot be stated without the previous turn",
    ],
    tags: ["activation", "negative", "steering"],
  },
  {
    id: "asking-for-a-plan-not-a-record",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P2",
    mode: "bypass",
    skillMode: "none",
    difficulty: "mixed",
    prompt: "can you break the migration down into steps before we start on it",
    nearMiss:
      "Breaking work into steps produces something that looks like the in-progress half of a record; but nothing has settled yet, so there is no decision, no constraint and no approval to hold, and planning intended work is a different job.",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: false, forbiddenRoutes: [] },
    must: [
      "Produces the breakdown that was asked for",
    ],
    mustNot: [
      "Records planned steps as though they were settled decisions",
    ],
    tags: ["activation", "negative", "planning"],
  },
];

export default scenarios;
