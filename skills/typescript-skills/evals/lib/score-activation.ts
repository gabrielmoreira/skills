#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { ActivationDecision, EvalScenario } from "../evals.types.ts";
import { scoreActivationDecisions } from "./activation-scoring.ts";
import { validateScenarios } from "./schema.ts";

function parseArgs(argv: string[]) {
  const args = { scenarios: [] as string[], decisions: [] as string[] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--scenarios") args.scenarios.push(argv[++index]);
    else if (argument === "--decisions") args.decisions.push(argv[++index]);
    else throw new Error(`unknown argument: ${argument}`);
  }
  return args;
}

async function loadScenarioModule(path: string): Promise<readonly EvalScenario[]> {
  // Scenario modules are CLI inputs, so their specifiers are only known at runtime.
  const module = await import(pathToFileURL(resolve(path)).href);
  return module.default ?? module.scenarios;
}

async function loadDecisions(path: string): Promise<ActivationDecision[]> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!Array.isArray(parsed)) throw new Error(`decisions must be an array: ${path}`);
  return parsed;
}

const args = parseArgs(process.argv.slice(2));
if (args.scenarios.length === 0 || args.decisions.length === 0) {
  console.error(
    "Usage: node evals/lib/score-activation.ts --scenarios <module> [--scenarios <module>] --decisions <json> [--decisions <json>]",
  );
  process.exit(2);
}

const scenarios = (await Promise.all(args.scenarios.map(loadScenarioModule))).flat();
const scenarioFailures = validateScenarios(scenarios);
if (scenarioFailures.length > 0) {
  for (const failure of scenarioFailures) {
    console.error(`FAIL ${failure.id}: ${failure.errors.join("; ")}`);
  }
  process.exit(1);
}

const decisions = (await Promise.all(args.decisions.map(loadDecisions))).flat();
const report = scoreActivationDecisions(scenarios, decisions);
const percentage = (value: number | null) => (value === null ? "n/a" : `${(value * 100).toFixed(1)}%`);

console.log("Public skill activation");
console.log(`  TP=${report.publicSkills.confusion.tp} TN=${report.publicSkills.confusion.tn} FP=${report.publicSkills.confusion.fp} FN=${report.publicSkills.confusion.fn}`);
console.log(`  precision=${percentage(report.publicSkills.precision)}`);
console.log(`  recall=${percentage(report.publicSkills.recall)}`);
console.log(`  false-positive-rate=${percentage(report.publicSkills.falsePositiveRate)}`);
console.log("Internal routing");
console.log(`  exact-primary=${report.internalRoutes.exactPrimary}/${report.internalRoutes.total} (${percentage(report.internalRoutes.exactPrimaryRate)})`);
console.log(`  forbidden-route-violations=${report.internalRoutes.forbiddenViolations}`);

for (const result of report.results) {
  const routeStatus =
    result.layer === "internal-route"
      ? ` exact=${result.exactPrimary} forbidden=${result.forbiddenSelected.join(",") || "none"}`
      : "";
  console.log(`  ${result.scenarioId}: ${result.outcome}${routeStatus}`);
}
if (report.missingDecisions.length > 0) {
  console.log(`  missing=${report.missingDecisions.join(",")}`);
}
if (report.unexpectedDecisions.length > 0) {
  console.log(`  unexpected=${report.unexpectedDecisions.join(",")}`);
}

const failed =
  report.publicSkills.confusion.fp > 0 ||
  report.publicSkills.confusion.fn > 0 ||
  report.internalRoutes.exactPrimary !== report.internalRoutes.total ||
  report.internalRoutes.forbiddenViolations > 0 ||
  report.missingDecisions.length > 0 ||
  report.unexpectedDecisions.length > 0;
process.exit(failed ? 1 : 0);
