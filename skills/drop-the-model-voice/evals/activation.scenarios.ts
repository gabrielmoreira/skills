import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

/**
 * Activation scenarios for drop-the-model-voice.
 *
 * This skill borders two others and most of the negatives below are collisions
 * with them rather than distant prompts. `progressive-reading` owns whether a
 * reader can get into a text; this one owns whether it sounds like a person.
 * `make-the-docs-trustworthy` owns whether a page should exist and is true;
 * this one runs after those are answered.
 *
 * Prompts are written the way somebody asks: lowercase, contracted, naming the
 * artifact rather than the problem. Several are deliberately underspecified,
 * because a request to fix writing usually is.
 */
const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "release-note-reads-like-a-brochure",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "can you take another pass at this release note? it reads like marketing wrote it and we're posting it to the engineering channel",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Replaces the sales vocabulary with what the change does",
      "Keeps every claim the original carried",
    ],
    mustNot: ["Adds a benefit the source did not state", "Shortens by dropping items rather than wording"],
    tags: ["activation", "positive", "release-note"],
  },
  {
    id: "incident-writeup-with-nobody-in-it",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "draft the write-up for last night. the deploy at 14:02 swapped the config map, the workers kept the old value until they restarted, and we found it from the latency split. keep it blameless, nobody gets named.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Gives the trigger a subject rather than writing that a change was introduced",
      "Separates what changed, what the system did, and what people did",
      "Keeps people unnamed while the mechanism still has an actor",
    ],
    mustNot: ["Writes the whole account in the passive because blameless was asked for"],
    tags: ["activation", "positive", "incident"],
  },
  {
    id: "review-comment-that-argues-with-nobody",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "hard",
    prompt:
      "review this before i post it: 'This isn't really about performance, and I'm not saying the abstraction is wrong. A tempting approach would be to cache at the edge, though that has its own issues. To be clear, the join runs before the filter.' does it land?",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Cuts the defences against objections the thread does not contain",
      "Leaves the claim about the join order standing on its own",
    ],
    mustNot: ["Keeps the rejected caching option that appears once and never again"],
    tags: ["activation", "positive", "review-comment"],
  },
  {
    id: "weekly-update-nobody-can-act-on",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "need the weekly update for the team by 5. we merged the auth rewrite, the flaky suite is still flaky, and next week is the migration. don't make it sound like a press release, last one got roasted.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Uses the progress, plans, problems shape without inventing items",
      "Keeps the flaky suite as a problem rather than softening it",
    ],
    mustNot: ["Ends on a line about momentum or exciting times ahead"],
    tags: ["activation", "positive", "status-update"],
  },
  {
    id: "wiki-page-with-emoji-headings",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "this onboarding page has a rocket on every heading and every bullet starts with a bold word and a colon. tidy it up, the content is right",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Removes decoration while keeping the content unchanged",
      "Turns restating bold labels into prose",
    ],
    mustNot: ["Removes a marker that carries an agreed status meaning"],
    tags: ["activation", "positive", "wiki"],
  },
  {
    id: "pr-description-that-claims-too-much",
    bundle: "drop-the-model-voice",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "my pr description says the change 'significantly improves performance and reduces technical debt'. i did measure it, p99 went 840 to 210. rewrite it so a reviewer trusts it.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: true },
    must: [
      "Puts the measured numbers in place of the superlative",
      "Drops the technical debt claim or attaches what shows it",
    ],
    mustNot: ["Invents a second measurement to support the debt claim"],
    tags: ["activation", "positive", "pull-request"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "too-dense-to-get-into",
    bundle: "drop-the-model-voice",
    rule: null,
    tier: "P0",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "this answer is correct but i can't get into it, it's one long block and the important part is at the bottom. can you restructure it without losing the caveats",
    nearMiss:
      "The complaint is about prose and the request is a rewrite, which is this skill's whole territory by vocabulary. But nothing here is about voice: the text does not sell, hedge, or decorate. The difficulty is entry and ordering, which belongs to the reading-pace skill.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Reorders and breaks up the text, leading with the useful part"],
    mustNot: ["Treats a density complaint as a voice problem"],
    tags: ["activation", "negative", "readability"],
  },
  {
    id: "is-this-page-still-true",
    bundle: "drop-the-model-voice",
    rule: null,
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "someone said the setup guide is out of date. can you check whether it still matches what the commands actually do",
    nearMiss:
      "A document is in play and prose will change, which looks like this skill. But the question is whether the page is true, settled by running what it describes, and no rewriting of voice answers it.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Settles each claim against the running system before editing"],
    mustNot: ["Rewrites the tone of a page whose accuracy was the question"],
    tags: ["activation", "negative", "docs-accuracy"],
  },
  {
    id: "the-copy-is-supposed-to-sell",
    bundle: "drop-the-model-voice",
    rule: null,
    tier: "P2",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "writing the landing page for the developer portal. it should sound exciting, this is the pitch not the changelog",
    nearMiss:
      "Every marker this skill removes is present on purpose. Marketing copy asked for as marketing copy is the one register where the sales voice is correct, and stripping it would deliver the opposite of the request.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Writes in the register the user asked for"],
    mustNot: ["Strips persuasive language from copy whose job is to persuade"],
    tags: ["activation", "negative", "deliberate-register"],
  },
  {
    id: "one-dash-in-an-otherwise-fine-note",
    bundle: "drop-the-model-voice",
    rule: null,
    tier: "P2",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "quick sanity check on this note to the team, i think it's fine but i've been staring at it: 'The migration runs Thursday 09:00. Reads keep working throughout, writes pause for about four minutes. Ping me if that window is a problem.'",
    nearMiss:
      "An invitation to audit prose, which is the trigger. But the note names a time, states the effect, and ends on an action. There is nothing to remove, and finding something anyway is how a checker turns into a tic.",
    activation: { layer: "public-skill", target: "drop-the-model-voice", shouldActivate: false, forbiddenRoutes: [] },
    must: ["Says the note is fine as written"],
    mustNot: ["Manufactures a finding to justify having looked"],
    tags: ["activation", "negative", "already-clean"],
  },
] satisfies EvalScenario[];

export default scenarios;
