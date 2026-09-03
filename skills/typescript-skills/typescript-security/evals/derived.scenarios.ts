import type { EvalScenario } from "../../evals/evals.types.ts";

/**
 * Scenarios derived from a real source rather than imagined.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "the-redaction-that-was-already-shipped",
    bundle: "typescript-security",
    rule: "redaction",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    source: "pr-review",
    sourceNote:
      "A blocking review comment marked humano-judgment and universal, on a redaction that had already been reviewed once and accepted: it covered one spelling of the key and the interface accepted others, so values still reached error details and logs. Domain changed from a customer account key to a shipment tracking reference, and the escape changed from letter case to a second field the same value arrives in.",
    prompt:
      "we shipped redaction on the parcel service two weeks ago and it was reviewed and approved. support just sent me a log line from friday with a customer reference in it. redaction lives in src/redact.ts and the log call is in src/dispatch.ts. i cannot reproduce it, the support export only has the rendered line and not the payload that made it. do not widen this into a logging rewrite, and only src/redact.ts is in scope. what would you check first?",
    expectedPrimary: "typescript-security",
    expectedSecondary: ["typescript-observability"],
    must: [
      "Reads src/redact.ts and says which inputs it covers and which it does not",
      "Works from the rendered line back to what could have produced it, given no payload",
      "Names a way to tell whether friday's line was one case or a class",
      "Treats a passed review as evidence about the reviewer, not about the coverage",
    ],
    mustNot: [
      "Adds a second redaction call in src/dispatch.ts",
      "Concludes the redaction is correct because it was reviewed and approved",
      "Asks for the original payload after being told it does not exist",
    ],
    tags: ["derived", "pr-review", "redaction", "partial-coverage"],
  },
] satisfies EvalScenario[];

export default scenarios;
