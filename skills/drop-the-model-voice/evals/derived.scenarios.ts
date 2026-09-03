import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

/**
 * Scenarios derived from a real source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "it-does-not-sound-like-me-and-they-know-me",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "session",
    sourceNote:
      "Shape borrowed from the investigation openings in the session corpus, which end in a finding somebody has to send to a third party, and from a pull request corpus row where a reviewer asked whether a change had been written or generated. Domain changed from a mobile SDK header to a payments gateway signature, and the recipient changed from an internal reviewer to a vendor who knows the sender.",
    prompt:
      "this goes to the gateway's integration team in the morning. i wrote the findings down and had the wording built around them, and it reads like something a company sends, not like me. these people have had mail from me for two years and they will notice. i am on a train and i cannot dig out an old thread for you. every file and line reference has to survive exactly, i cannot soften what i found about the missing nonce because that is the whole reason i am writing, and do not make it longer. what would you change?",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Names what in the draft reads as generated, pointing at the words",
      "Says what it is matching the voice against, having been told no sample is coming",
      "Keeps every finding, reference and number the draft carries",
      "Leaves the finding about the nonce as blunt as it was",
    ],
    mustNot: [
      "Softens the finding while making the tone friendlier",
      "Invents a personal register and presents it as the sender's own",
      "Asks for a writing sample after being told none is available",
      "Adds a fact, a number or a name the draft did not contain",
      "Replaces one flagged word and leaves the shape that produced it",
    ],
    tags: ["derived", "session", "outbound-finding", "voice-match"],
  },
] satisfies EvalScenario[];

export default scenarios;
