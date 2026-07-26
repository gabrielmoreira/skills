import { ACTIVATION_LAYERS, DIFFICULTIES, MODES, TIERS } from "../evals.types.ts";

export function validateScenario(scenario: import("../evals.types.ts").EvalScenario) {
  const errors = [];

  if (!scenario || typeof scenario !== "object") errors.push("scenario must be an object");
  if (!scenario.id || typeof scenario.id !== "string") errors.push("id is required");
  if (!TIERS.includes(scenario.tier)) errors.push(`tier must be one of ${TIERS.join(", ")}`);
  if (!MODES.includes(scenario.mode)) errors.push(`mode must be one of ${MODES.join(", ")}`);
  if (scenario.difficulty !== undefined && !DIFFICULTIES.includes(scenario.difficulty)) {
    errors.push(`difficulty must be one of ${DIFFICULTIES.join(", ")}`);
  }
  if (!scenario.bundle || typeof scenario.bundle !== "string") errors.push("bundle is required");
  if (!scenario.prompt || typeof scenario.prompt !== "string") errors.push("prompt is required");
  if (!Array.isArray(scenario.must) || scenario.must.length === 0) errors.push("must must be a non-empty array");
  if (!Array.isArray(scenario.mustNot)) errors.push("mustNot must be an array");

  if (scenario.activation !== undefined) {
    const activation = scenario.activation;
    if (!activation || typeof activation !== "object") {
      errors.push("activation must be an object");
    } else {
      if (!ACTIVATION_LAYERS.includes(activation.layer)) {
        errors.push(`activation.layer must be one of ${ACTIVATION_LAYERS.join(", ")}`);
      }
      if (typeof activation.target !== "string" || activation.target.trim() === "") {
        errors.push("activation.target is required");
      }
      if (typeof activation.shouldActivate !== "boolean") {
        errors.push("activation.shouldActivate must be boolean");
      }
      if (
        activation.forbiddenRoutes !== undefined &&
        (!Array.isArray(activation.forbiddenRoutes) ||
          activation.forbiddenRoutes.some((route) => typeof route !== "string" || route.trim() === ""))
      ) {
        errors.push("activation.forbiddenRoutes must contain route names");
      }
      if (activation.layer === "public-skill" && activation.forbiddenRoutes !== undefined) {
        errors.push("public-skill activation must not define forbiddenRoutes");
      }
      if (activation.layer === "internal-route") {
        if (activation.shouldActivate !== true) {
          errors.push("internal-route activation requires shouldActivate=true");
        }
        if (!scenario.expectedPrimary) {
          errors.push("internal-route activation requires expectedPrimary");
        }
      }
    }
  }

  return errors;
}

export function validateScenarios(scenarios: readonly import("../evals.types.ts").EvalScenario[]) {
  if (!Array.isArray(scenarios)) {
    return [{ id: "<module>", errors: ["default export must be an array of scenarios"] }];
  }

  const seen = new Set();
  const failures = [];

  for (const scenario of scenarios) {
    const errors = validateScenario(scenario);
    if (scenario?.id) {
      if (seen.has(scenario.id)) errors.push(`duplicate id: ${scenario.id}`);
      seen.add(scenario.id);
    }
    if (errors.length) failures.push({ id: scenario?.id ?? "<missing-id>", errors });
  }

  return failures;
}

export function summarizeScenarios(scenarios: readonly import("../evals.types.ts").EvalScenario[]) {
  const summary = {
    total: scenarios.length,
    byTier: Object.fromEntries(TIERS.map((tier) => [tier, 0])),
    byMode: Object.fromEntries(MODES.map((mode) => [mode, 0])),
    byDifficulty: Object.fromEntries(["unspecified", ...DIFFICULTIES].map((difficulty) => [difficulty, 0])),
    byBundle: {},
  };

  for (const scenario of scenarios) {
    if (scenario.tier in summary.byTier) summary.byTier[scenario.tier] += 1;
    if (scenario.mode in summary.byMode) summary.byMode[scenario.mode] += 1;
    summary.byBundle[scenario.bundle] = (summary.byBundle[scenario.bundle] ?? 0) + 1;
    summary.byDifficulty[scenario.difficulty ?? "unspecified"] += 1;
  }

  return summary;
}
