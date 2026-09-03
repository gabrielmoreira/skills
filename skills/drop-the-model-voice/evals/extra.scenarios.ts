import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

/**
 * The override cases.
 *
 * This skill removes things, and the failure it can produce that costs most is
 * removing a voice somebody chose. Both scenarios below are situations where
 * the right answer is to open the skill and then not apply most of it.
 */
const scenarios = [
  {
    id: "match-the-voice-i-pasted",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "write the migration announcement in my voice, here's one i sent in march so you can see how i write: 'Thursday 09:00. Reads stay up. Writes pause, four minutes, maybe five if the index rebuild is slow. I'll be in the channel. If that window breaks something for you tell me today, not Thursday.' same register, the facts are: cutover sunday 06:00, reads unaffected, writes down about twenty minutes, rollback is a config flip.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Takes sentence length, punctuation and openings from the sample rather than from the skill",
      "Keeps the four facts given and adds none",
      "Keeps the short clipped rhythm the sample uses",
    ],
    mustNot: [
      "Smooths the fragments into even mid-length sentences",
      "Adds a closing line about the team or the migration going well",
    ],
    tags: ["activation", "positive", "voice-match", "override"],
  },
  {
    id: "the-tone-was-asked-for",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "draft the deprecation notice for the old endpoint, and keep it formal and slightly ceremonial, this goes to partners not to the team. do not make it chatty.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Writes in the formal register asked for",
      "Still names dates, versions and what a reader must do",
    ],
    mustNot: [
      "Strips the formality because a rule prefers plainer wording",
      "Reports the result as cleaned up without saying which rule was set aside",
    ],
    tags: ["activation", "positive", "register", "override"],
  },
] satisfies EvalScenario[];

export default scenarios;
