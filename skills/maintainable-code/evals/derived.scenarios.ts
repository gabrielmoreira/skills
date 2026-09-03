import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

/**
 * Scenarios derived from a measured source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "four-generators-four-answers",
    bundle: "maintainable-code",
    rule: "convergence-under-constraint",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    source: "repo-debt",
    sourceNote:
      "Measured across four repositories: three distinct ways to read one value from the environment inside a single monorepo, and five ways across the four. Domain changed from environment reads in sibling services to output paths in sibling report generators, and the count reduced from eighteen packages to four so the divergence fits in one prompt.",
    prompt:
      "four report generators sit under src/reports and each finds its output directory differently. one takes a --out flag, one reads an env var with a fallback, one has a constant near the top, one calls a helper in src/paths.ts. a new operator ran all four last week and got output in three places. i need them agreeing, but two of them are scheduled and their invocation cannot change, and do not add a package for this. what is the smallest change that gets there?",
    expectedPrimary: "maintainable-code",
    must: [
      "Reads the four call sites before proposing a shape",
      "Names one seam the four converge on, rather than four edits",
      "Keeps the two scheduled invocations working unchanged",
      "Says what stays different on purpose, if anything does",
    ],
    mustNot: [
      "Rewrites all four to one new abstraction that changes how they are invoked",
      "Adds a configuration package after being told not to",
      "Picks one of the four existing ways without saying why it wins",
    ],
    tags: ["derived", "repo-debt", "convergence", "sibling-divergence"],
  },
] satisfies EvalScenario[];

export default scenarios;
