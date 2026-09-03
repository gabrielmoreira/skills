import type { EvalScenario } from "../../evals/evals.types.ts";

/**
 * Scenarios derived from a measured source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "a-value-ops-can-change-in-a-warm-runtime",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    source: "repo-debt",
    sourceNote:
      "Measured across 18 packages that read the environment in one service monorepo: 10 read it once at module load. In a warm runtime that makes a redeploy invisible until the process restarts, and half the fleet behaves one way while half behaves the other. Domain changed from a financial service monorepo to a rate limiter, and the divergence became a single service under a warm host.",
    prompt:
      "ops wants to move the burst limit without waiting for us. it lives in src/limits.ts and src/gate.ts reads it on every request. two things: do not touch src/gate.ts, someone else has a change in flight there, and only src/limits.ts is in scope. the host keeps warm instances alive for up to an hour and we cannot force a restart, that needs a change window nobody has this week. what would you look at before wiring a new source in?",
    expectedPrimary: "typescript-composition",
    expectedSecondary: ["typescript-configs"],
    must: [
      "Reads src/limits.ts before proposing anything",
      "Names when the current value is read, and what that means while an instance stays warm",
      "Says what two instances started at different times would each serve",
      "Proposes a scope for the value rather than only a new source for it",
    ],
    mustNot: [
      "Adds a configuration source without saying when the value is read",
      "Treats a restart as available after being told it is not",
      "Edits src/gate.ts",
    ],
    tags: ["derived", "repo-debt", "dependency-scope", "warm-runtime"],
  },
] satisfies EvalScenario[];

export default scenarios;
