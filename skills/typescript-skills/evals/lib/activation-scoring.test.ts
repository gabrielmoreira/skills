import assert from "node:assert/strict";
import test from "node:test";
import { scoreActivationDecisions } from "./activation-scoring.ts";
import { validateScenario } from "./schema.ts";

const scenario = (id, activation, expectedPrimary) => ({
  id,
  bundle: "activation",
  rule: "activation",
  tier: "P1",
  mode: "router",
  difficulty: "mixed",
  prompt: id,
  expectedPrimary,
  must: ["Routes correctly"],
  mustNot: [],
  activation,
});

test("classifies public skill activation as TP, TN, FP, and FN", () => {
  const scenarios = [
    scenario("tp", { layer: "public-skill", target: "progressive-reading", shouldActivate: true }),
    scenario("tn", { layer: "public-skill", target: "maintainable-code", shouldActivate: false }),
    scenario("fp", { layer: "public-skill", target: "typescript-skills", shouldActivate: false }),
    scenario("fn", { layer: "public-skill", target: "progressive-reading", shouldActivate: true }),
  ];
  const decisions = [
    { scenarioId: "tp", selectedSkills: ["progressive-reading"] },
    { scenarioId: "tn", selectedSkills: [] },
    { scenarioId: "fp", selectedSkills: ["typescript-skills"] },
    { scenarioId: "fn", selectedSkills: [] },
  ];

  const report = scoreActivationDecisions(scenarios, decisions);

  assert.deepEqual(report.publicSkills.confusion, { tp: 1, tn: 1, fp: 1, fn: 1 });
  assert.equal(report.publicSkills.precision, 0.5);
  assert.equal(report.publicSkills.recall, 0.5);
  assert.equal(report.publicSkills.falsePositiveRate, 0.5);
  assert.deepEqual(
    report.results.map(({ scenarioId, outcome }) => ({ scenarioId, outcome })),
    [
      { scenarioId: "tp", outcome: "TP" },
      { scenarioId: "tn", outcome: "TN" },
      { scenarioId: "fp", outcome: "FP" },
      { scenarioId: "fn", outcome: "FN" },
    ],
  );
});

test("scores exact internal routes and exposes forbidden owners", () => {
  const scenarios = [
    scenario(
      "route-exact",
      {
        layer: "internal-route",
        target: "typescript-skills",
        shouldActivate: true,
        forbiddenRoutes: ["typescript-error-handling"],
      },
      "typescript-async",
    ),
    scenario(
      "route-stolen",
      {
        layer: "internal-route",
        target: "typescript-skills",
        shouldActivate: true,
        forbiddenRoutes: ["typescript-error-handling"],
      },
      "typescript-async",
    ),
  ];
  const decisions = [
    {
      scenarioId: "route-exact",
      selectedSkills: ["typescript-skills"],
      primaryRoute: "typescript-async",
      secondaryRoutes: [],
    },
    {
      scenarioId: "route-stolen",
      selectedSkills: ["typescript-skills"],
      primaryRoute: "typescript-error-handling",
      secondaryRoutes: ["typescript-async"],
    },
  ];

  const report = scoreActivationDecisions(scenarios, decisions);

  assert.deepEqual(report.internalRoutes, {
    total: 2,
    exactPrimary: 1,
    exactPrimaryRate: 0.5,
    forbiddenViolations: 1,
  });
  assert.deepEqual(report.results[1].forbiddenSelected, ["typescript-error-handling"]);
});

test("reports missing decisions separately and rejects duplicates", () => {
  const scenarios = [
    scenario("missing", { layer: "public-skill", target: "progressive-reading", shouldActivate: true }),
  ];

  const missingReport = scoreActivationDecisions(scenarios, []);
  assert.deepEqual(missingReport.missingDecisions, ["missing"]);
  assert.deepEqual(missingReport.publicSkills.confusion, { tp: 0, tn: 0, fp: 0, fn: 0 });

  assert.throws(
    () =>
      scoreActivationDecisions(scenarios, [
        { scenarioId: "missing", selectedSkills: [] },
        { scenarioId: "missing", selectedSkills: ["progressive-reading"] },
      ]),
    /duplicate activation decision: missing/,
  );
});

test("validates activation expectations before scoring", () => {
  assert.deepEqual(
    validateScenario(
      scenario("invalid-public", {
        layer: "public-skill",
        target: "",
        shouldActivate: "yes",
        forbiddenRoutes: ["typescript-async"],
      }),
    ),
    [
      "activation.target is required",
      "activation.shouldActivate must be boolean",
      "public-skill activation must not define forbiddenRoutes",
    ],
  );

  assert.deepEqual(
    validateScenario(
      scenario("invalid-route", {
        layer: "internal-route",
        target: "typescript-skills",
        shouldActivate: false,
      }),
    ),
    [
      "internal-route activation requires shouldActivate=true",
      "internal-route activation requires expectedPrimary",
    ],
  );
});
