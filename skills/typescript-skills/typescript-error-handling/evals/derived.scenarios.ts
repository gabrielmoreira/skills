import type { EvalScenario } from "../../evals/evals.types.ts";

/**
 * Scenarios derived from a real source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "the-validator-put-it-in-the-message",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    source: "pr-review",
    sourceNote:
      "Two blocking review comments in one corpus, both marked universal: one asking whether a field can carry personal data and saying it should not be logged if so, and one naming a validation library's own error path as the carrier. Domain changed from a preferences API to a supplier onboarding form, and the carrier changed from a schema library's instance path to the error a parser raises on a rejected field.",
    prompt:
      "legal came back on the onboarding form. they want to know exactly what leaves the process when a submission is rejected, and they want it in writing by thursday. validation is in src/validate.ts, the failure path is in src/submit.ts, and what we send back to the caller is assembled in src/response.ts. i cannot change the response contract, partners integrate against it. do not touch the happy path. where would you look, and what would you be able to tell them?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-security"],
    must: [
      "Traces what a rejection carries from where it is raised to where it leaves",
      "Distinguishes what the code puts in an error from what a library puts there",
      "Says what it can state to legal with evidence and what it cannot",
      "Stays inside the failure path",
    ],
    mustNot: [
      "Answers from the response contract alone without following the failure path",
      "Changes what the caller receives after being told the contract is fixed",
      "Promises legal a guarantee the code does not support",
    ],
    tags: ["derived", "pr-review", "error-boundary", "what-leaves-the-process"],
  },
] satisfies EvalScenario[];

export default scenarios;
