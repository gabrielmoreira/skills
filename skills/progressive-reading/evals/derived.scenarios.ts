import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

/**
 * Scenarios derived from a real source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "five-answers-and-nowhere-to-start",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "session",
    sourceNote:
      "Shape borrowed from the two longest genuine opening turns in the session corpus, both investigations: numbered sub-questions about a third party integration, named artifacts, and an explicit demand for exact code and exact file and line. Both ask the agent to find out rather than to change something, which no scenario in the collection did. Domain changed from a mobile authentication SDK to a payments gateway signature, and the answer being read is now the thing under review.",
    prompt:
      "you answered all five of my questions about how the gateway builds its signature and i think you are right. i have read it three times and i still cannot hold it in my head long enough to act on it. i have to send this to their integration team tomorrow and they will never read two pages. keep every file and line reference exactly as it is, that is the whole point of the thing, and do not drop the part about what happens when the nonce is missing, that is what they will argue about. what can you do with it?",
    activation: { layer: "public-skill", target: "progressive-reading", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Puts what the reader has to act on before the reasoning that established it",
      "Keeps every file and line reference and the nonce caveat exactly as written",
      "Makes it enterable at any of the five answers rather than only from the top",
      "Says what it removed, so the omission is a decision rather than a gap",
    ],
    mustNot: [
      "Shortens by dropping one of the five answers",
      "Rewrites a quoted identifier, path, or line number",
      "Turns the argument into a list of disconnected facts",
    ],
    tags: ["derived", "session", "investigation-report", "dense-but-correct"],
  },
] satisfies EvalScenario[];

export default scenarios;
