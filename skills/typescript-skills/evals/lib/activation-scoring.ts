import type { ActivationDecision, EvalScenario } from "../evals.types.ts";

const rate = (numerator: number, denominator: number) =>
  denominator === 0 ? null : numerator / denominator;

export function scoreActivationDecisions(
  scenarios: readonly EvalScenario[],
  decisions: readonly ActivationDecision[],
) {
  const decisionByScenario = new Map<string, ActivationDecision>();
  for (const decision of decisions) {
    if (decisionByScenario.has(decision.scenarioId)) {
      throw new Error(`duplicate activation decision: ${decision.scenarioId}`);
    }
    if (!Array.isArray(decision.selectedSkills)) {
      throw new Error(`selectedSkills must be an array: ${decision.scenarioId}`);
    }
    decisionByScenario.set(decision.scenarioId, decision);
  }

  const activationScenarios = scenarios.filter((scenario) => scenario.activation);
  const activationIds = new Set(activationScenarios.map((scenario) => scenario.id));
  const missingDecisions: string[] = [];
  const unexpectedDecisions = decisions
    .filter((decision) => !activationIds.has(decision.scenarioId))
    .map((decision) => decision.scenarioId);
  const results = [];
  const confusion = { tp: 0, tn: 0, fp: 0, fn: 0 };
  const internalRoutes = {
    total: 0,
    exactPrimary: 0,
    exactPrimaryRate: null as number | null,
    forbiddenViolations: 0,
  };

  for (const scenario of activationScenarios) {
    const expectation = scenario.activation!;
    const decision = decisionByScenario.get(scenario.id);
    if (!decision) {
      missingDecisions.push(scenario.id);
      continue;
    }

    const activated = decision.selectedSkills.includes(expectation.target);
    const outcome = expectation.shouldActivate
      ? activated
        ? "TP"
        : "FN"
      : activated
        ? "FP"
        : "TN";

    if (expectation.layer === "public-skill") {
      confusion[outcome.toLowerCase()] += 1;
      results.push({
        scenarioId: scenario.id,
        layer: expectation.layer,
        target: expectation.target,
        outcome,
        activated,
        forbiddenSelected: [],
      });
      continue;
    }

    const selectedRoutes = [decision.primaryRoute, ...(decision.secondaryRoutes ?? [])].filter(
      (route): route is string => typeof route === "string",
    );
    const forbiddenSelected = (expectation.forbiddenRoutes ?? []).filter((route) =>
      selectedRoutes.includes(route),
    );
    const exactPrimary = decision.primaryRoute === scenario.expectedPrimary;

    internalRoutes.total += 1;
    if (exactPrimary) internalRoutes.exactPrimary += 1;
    if (forbiddenSelected.length > 0) internalRoutes.forbiddenViolations += 1;
    results.push({
      scenarioId: scenario.id,
      layer: expectation.layer,
      target: expectation.target,
      outcome,
      activated,
      expectedPrimary: scenario.expectedPrimary,
      actualPrimary: decision.primaryRoute,
      exactPrimary,
      forbiddenSelected,
    });
  }

  internalRoutes.exactPrimaryRate = rate(internalRoutes.exactPrimary, internalRoutes.total);

  return {
    publicSkills: {
      confusion,
      precision: rate(confusion.tp, confusion.tp + confusion.fp),
      recall: rate(confusion.tp, confusion.tp + confusion.fn),
      falsePositiveRate: rate(confusion.fp, confusion.fp + confusion.tn),
    },
    internalRoutes,
    missingDecisions,
    unexpectedDecisions,
    results,
  };
}
