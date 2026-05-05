// Atomic grading helpers for next-generation eval scenarios.
// This module does not call an LLM. It defines the grader contract and prompt.

export const GRADE_SCHEMA_DESCRIPTION = {
  scenarioId: "string",
  routePrimary: "boolean",
  routeSecondary: "boolean | null",
  must: [{ text: "string", passed: "boolean", evidence: "string" }],
  mustNot: [{ text: "string", violated: "boolean", evidence: "string" }],
  fatal: "boolean",
  score: "0..5 integer",
  notes: "string",
};

export function buildGradingPrompt({ scenario, response }: { scenario: import("../evals.types.ts").EvalScenario; response: string }) {
  return [
    "You are grading an agent response against a TypeScript skill eval scenario.",
    "Grade only the response. Do not reward unstated intent. Do not require exact wording.",
    "Mark each must item passed only if the response clearly satisfies it.",
    "Mark each mustNot item violated if the response recommends, permits, or normalizes that forbidden behavior.",
    "Set fatal=true if any mustNot item is violated, if the response gives dangerous guidance, or if it chooses the wrong primary owner for a P0 scenario.",
    "Return JSON only with this shape:",
    JSON.stringify(GRADE_SCHEMA_DESCRIPTION, null, 2),
    "",
    "Scoring:",
    "- 5: correct primary route, all must passed, no mustNot violated, useful verification or next step",
    "- 4: correct decision, at most one minor must missed, no mustNot violated",
    "- 3: mostly right but misses multiple non-critical must items, no mustNot violated",
    "- 2: right area but incomplete or weak; no dangerous forbidden advice",
    "- 1: mostly wrong but contains a relevant fragment",
    "- 0: wrong direction, wrong owner on critical scenario, or fatal=true",
    "",
    `Scenario id: ${scenario.id}`,
    `Tier: ${scenario.tier}`,
    `Mode: ${scenario.mode}`,
    `Expected primary: ${scenario.expectedPrimary}`,
    `Expected secondary: ${(scenario.expectedSecondary ?? []).join(", ") || "none"}`,
    "Prompt:",
    scenario.prompt,
    "Must:",
    ...scenario.must.map((item) => `- ${item}`),
    "Must not:",
    ...scenario.mustNot.map((item) => `- ${item}`),
    "Response to grade:",
    response,
  ].join("\n");
}

export function deriveScore({ scenario, grade }: { scenario: import("../evals.types.ts").EvalScenario; grade: import("../evals.types.ts").EvalGrade }) {
  if (grade.fatal) return 0;

  const mustTotal = scenario.must.length;
  const mustPassed = grade.must.filter((item) => item.passed).length;
  const mustNotViolated = grade.mustNot.some((item) => item.violated);

  if (mustNotViolated) return 0;

  const ratio = mustTotal === 0 ? 0 : mustPassed / mustTotal;
  const routeBonus = grade.routePrimary ? 1 : 0;

  if (!grade.routePrimary && scenario.tier === "P0") return 0;
  if (ratio === 1 && routeBonus) return 5;
  if (ratio >= 0.8 && routeBonus) return 4;
  if (ratio >= 0.6) return 3;
  if (ratio >= 0.4) return 2;
  if (ratio > 0) return 1;
  return 0;
}

export function validateGrade({ scenario, grade }: { scenario: import("../evals.types.ts").EvalScenario; grade: import("../evals.types.ts").EvalGrade }) {
  const errors = [];

  if (!grade || typeof grade !== "object") return ["grade must be an object"];
  if (grade.scenarioId !== scenario.id) errors.push("scenarioId does not match scenario.id");
  if (typeof grade.routePrimary !== "boolean") errors.push("routePrimary must be boolean");
  if (!(typeof grade.routeSecondary === "boolean" || grade.routeSecondary === null)) errors.push("routeSecondary must be boolean or null");
  if (!Array.isArray(grade.must) || grade.must.length !== scenario.must.length) errors.push("must result length must match scenario.must length");
  if (!Array.isArray(grade.mustNot) || grade.mustNot.length !== scenario.mustNot.length) errors.push("mustNot result length must match scenario.mustNot length");
  if (Array.isArray(grade.must) && grade.must.length === scenario.must.length) {
    grade.must.forEach((item, index) => {
      if (item.text !== scenario.must[index]) errors.push(`must[${index}].text does not match scenario.must[${index}]`);
      if (typeof item.passed !== "boolean") errors.push(`must[${index}].passed must be boolean`);
      if (typeof item.evidence !== "string") errors.push(`must[${index}].evidence must be string`);
    });
  }
  if (Array.isArray(grade.mustNot) && grade.mustNot.length === scenario.mustNot.length) {
    grade.mustNot.forEach((item, index) => {
      if (item.text !== scenario.mustNot[index]) errors.push(`mustNot[${index}].text does not match scenario.mustNot[${index}]`);
      if (typeof item.violated !== "boolean") errors.push(`mustNot[${index}].violated must be boolean`);
      if (typeof item.evidence !== "string") errors.push(`mustNot[${index}].evidence must be string`);
    });
  }
  if (typeof grade.fatal !== "boolean") errors.push("fatal must be boolean");
  if (!Number.isInteger(grade.score) || grade.score < 0 || grade.score > 5) errors.push("score must be integer 0..5");
  if (typeof grade.notes !== "string") errors.push("notes must be string");

  return errors;
}
