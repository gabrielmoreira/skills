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
      "Measured across four repositories: three distinct ways to read one value from the environment inside a single monorepo, and five ways across the four. Domain changed from environment reads in sibling services to output paths in sibling report generators, and the count reduced from eighteen packages to four so the divergence fits in one prompt. The first version of this prompt enumerated all four mechanisms, which is the measurement transcribed rather than a situation: a context-free reader quoted the enumeration back as the finding. The enumeration is now what the agent has to go and discover.",
    prompt:
      "a new operator ran all four report generators under src/reports last week and got output in three different places. i need them landing in one by default, without breaking the two that are scheduled, whose invocation cannot change. do not add a package for this, and src/paths.ts is shared with the exporters so treat it as read-only. what is the smallest change that gets there?",
    expectedPrimary: "maintainable-code",
    must: [
      "Opens the four generators and says how each resolves its output path today",
      "Names one seam the four converge on, rather than four edits",
      "Keeps the two scheduled invocations working unchanged",
      "Says what stays different on purpose, if anything does",
    ],
    mustNot: [
      "Rewrites all four to one new abstraction that changes how they are invoked",
      "Adds a configuration package after being told not to",
      "Picks one of the four existing ways without having read the other three",
      "Edits src/paths.ts",
    ],
    tags: ["derived", "repo-debt", "convergence", "sibling-divergence"],
  },
] satisfies EvalScenario[];

export default scenarios;
