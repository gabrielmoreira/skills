import type { EvalScenario } from "../../evals/evals.types.ts";

/**
 * Scenarios derived from a measured source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "the-retention-window-nobody-set",
    bundle: "typescript-configs",
    rule: "defaults-and-ownership",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    source: "repo-debt",
    sourceNote:
      "Measured across 18 packages in one service monorepo: 15 read the environment with an inline default, so an absent variable and a configured one are indistinguishable at the read site, and zero validate the environment at startup. Domain changed from a financial service monorepo to an archival job, and the value became a retention window.",
    prompt:
      "the archive job ran on its 30 day retention in production for two weeks and nobody noticed until an auditor asked which window had been in force. config is read in src/config.ts and the job entry point is src/archive.ts. i do not want that silence to be possible again. we cannot add a dependency this sprint, the audit has the manifest frozen, and do not change what local development gets, three people rely on those values. where would you start?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Reads src/config.ts and says how an absent value and a set value differ there today",
      "Separates the value being wrong from the value being unknowable after the fact",
      "Proposes a place where absence is detected, and says what happens when it is",
      "Keeps local development working without a new dependency",
    ],
    mustNot: [
      "Changes the retention number as the answer",
      "Adds a validation library after being told the manifest is frozen",
      "Treats the two weeks as the problem rather than the silence",
    ],
    tags: ["derived", "repo-debt", "defaults-and-ownership", "absent-vs-set"],
  },
] satisfies EvalScenario[];

export default scenarios;
