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
      "you answered all five of my questions about how the gateway builds its signature and i think you are right. i have read it three times and i still cannot hold it in my head long enough to act on it. their integration team reads about a screen before they stop, i have watched them do it, and this is two pages. keep every file and line reference exactly as it is, and do not drop the part about what happens when the nonce is missing, that is what they will argue about. those two alone are most of a screen. what can you do with it?",
    activation: { layer: "public-skill", target: "progressive-reading", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Says what will not fit and decides what goes, rather than compressing everything evenly",
      "Keeps every file and line reference and the nonce caveat exactly as written",
      "Makes it enterable at any of the five answers rather than only from the top",
      "Names the omission out loud, so what was cut is a decision the sender can overrule",
    ],
    mustNot: [
      "Silently drops one of the five answers to make the length work",
      "Rewrites a quoted identifier, path, or line number",
      "Reports it as fitting a screen without saying what was left out",
      "Turns the argument into a list of disconnected facts",
    ],
    tags: ["derived", "session", "investigation-report", "dense-but-correct"],
  },
] satisfies EvalScenario[];

export default scenarios;
