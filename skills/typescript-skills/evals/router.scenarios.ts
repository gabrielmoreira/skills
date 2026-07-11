import type { EvalScenario } from "./evals.types.ts";

/**
 * Tree-level scenarios owned by the router itself: gap detection and
 * cross-bundle routing pressure that no single bundle owns.
 */
const scenarios = [
  {
    id: "silent-on-streams-backpressure",
    bundle: "typescript-skills",
    rule: "router",
    tier: "P1",
    mode: "router",
    difficulty: "hard",
    prompt:
      "We're piping a large CSV export through a Node Transform stream into S3 and memory keeps climbing - I think we're not handling backpressure right. Do our standards have a canonical rule for stream backpressure handling?",
    expectedPrimary: "typescript-skills",
    must: [
      "Acknowledges the standards do not have a canonical rule for Node stream backpressure",
      "Gives honest general guidance (respect highWaterMark, await drain, or use stream.pipeline)",
      "May point to the closest adjacent skill (cleanup/cancellation) while staying clear it does not own streams"
    ],
    mustNot: [
      "Invents a rule or claims an existing rule file covers stream backpressure"
    ],
    tags: ["gap-detection", "honesty", "streams"]
  }
] satisfies EvalScenario[];

export default scenarios;
