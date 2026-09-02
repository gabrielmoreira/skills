/**
 * Activation scenarios for the personal router.
 *
 * This skill is unusual in the collection, and its scenarios have to carry that
 * weight: it resolves what the others left open, so it fires on questions about
 * placement, precedence and defaults, and stays shut on the work itself.
 *
 * The negatives matter more here than anywhere else. A router that answers
 * domain questions becomes a second copy of every skill it routes to, which is
 * the failure its own scope warns against.
 */
const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "where-does-this-note-go",
    bundle: "using-gabrielmoreira-skills",
    rule: "activation-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "obvious",
    prompt: "i worked out why the runtime kept failing, where should i write that down so it isn't lost",
    activation: { layer: "public-skill", target: "using-gabrielmoreira-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Decides between the repository and the machine by asking whether a colleague cloning it would hit the same thing",
      "Reports the path chosen and whether it is tracked",
    ],
    mustNot: ["Invents a location this file does not name", "Writes the note without saying where it went"],
    tags: ["activation", "positive", "placement"],
  },
  {
    id: "two-skills-both-look-right",
    bundle: "using-gabrielmoreira-skills",
    rule: "activation-boundary",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt: "the install command is failing and i can't tell if that's a bug to debug or something else entirely",
    activation: { layer: "public-skill", target: "using-gabrielmoreira-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Uses the precedence table to separate a failure in the change from a failure of the tooling",
      "Names which skill owns it and opens that one",
    ],
    mustNot: ["Answers the technical question itself", "Opens both skills and reconciles them by hand"],
    tags: ["activation", "positive", "precedence"],
  },
  {
    id: "is-the-ceremony-wanted-here",
    bundle: "using-gabrielmoreira-skills",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "review",
    difficulty: "hard",
    prompt: "it's a one line change to a constant, do i really need the whole procedure for that",
    activation: { layer: "public-skill", target: "using-gabrielmoreira-skills", shouldActivate: true, forbiddenRoutes: [] },
    must: ["Answers from the stated preference rather than from the procedure's own defence"],
    mustNot: ["Re-argues the procedure", "Invents a threshold this file does not state"],
    tags: ["activation", "positive", "ceremony"],
  },

  // ----------------------------------------- negative, graded on the answer
  //
  // This skill's description instructs that it be read at the start of every
  // session, so "was it opened" is settled before the scenario begins and a
  // read-based verdict can only ever fail. What can still fail is answering
  // for the skill that owns the work, which is a judgement about the reply.
  // gradeOn: "answer" says so, and the observed runner reports these as graded
  // elsewhere rather than failing them for an instructed read.
  {
    id: "just-do-the-work",
    bundle: "using-gabrielmoreira-skills",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    gradeOn: "answer",
    prompt: "add a retry with backoff to the payment client, three attempts is enough",
    nearMiss:
      "Ordinary work that several skills in this collection do claim, so a router that answers it would be answering for them; the request names no placement, no precedence and no default, so there is nothing here to resolve.",
    activation: { layer: "public-skill", target: "using-gabrielmoreira-skills", shouldActivate: false },
    must: ["Leaves the work to the skill that owns it"],
    mustNot: ["Resolves a question nobody asked", "Restates another skill's procedure"],
    tags: ["activation", "negative", "work-not-resolution"],
  },
  {
    id: "how-do-i-write-a-skill",
    bundle: "using-gabrielmoreira-skills",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    gradeOn: "answer",
    prompt: "i want to add a new skill to this collection, what shape does it need",
    nearMiss:
      "About the collection itself, which sounds like this file's subject; but shape, anatomy and checks belong to the authoring skill, and this one holds preferences rather than conventions.",
    activation: { layer: "public-skill", target: "using-gabrielmoreira-skills", shouldActivate: false },
    must: ["Sends the question to the authoring skill"],
    mustNot: ["Describes rule anatomy or the invariants"],
    tags: ["activation", "negative", "authoring-not-preference"],
  },
];

export default scenarios;
