#!/usr/bin/env node
// Lightweight manifest validator/summarizer for next-generation eval scenarios.
// Usage: node evals/lib/report.ts typescript-configs/evals/configs.scenarios.ts

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { summarizeScenarioControls } from "../control-matrix.ts";
import { summarizeScenarios, validateScenarios } from "./schema.ts";

async function loadScenarioModule(path) {
  const mod = await import(pathToFileURL(resolve(path)).href);
  return mod.default ?? mod.scenarios;
}

function printSummary(path, scenarios) {
  const summary = summarizeScenarios(scenarios);
  const controlSummary = summarizeScenarioControls(scenarios.map((scenario) => scenario.id));
  console.log(`\n${path}`);
  console.log(`  scenarios: ${summary.total}`);
  console.log(`  by tier: ${JSON.stringify(summary.byTier)}`);
  console.log(`  by mode: ${JSON.stringify(summary.byMode)}`);
  console.log(`  by difficulty: ${JSON.stringify(summary.byDifficulty)}`);
  console.log(`  by bundle: ${JSON.stringify(summary.byBundle)}`);
  console.log(`  control scenarios: ${controlSummary.scenarioCount}`);
  console.log(`  control variants: ${JSON.stringify(controlSummary.byVariant)}`);
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("Usage: node evals/lib/report.ts <scenario-module...>");
  process.exit(2);
}

let failed = false;
for (const path of paths) {
  const scenarios = await loadScenarioModule(path);
  const failures = validateScenarios(scenarios);

  if (failures.length) {
    failed = true;
    console.log(`\n${path}`);
    for (const failure of failures) {
      console.log(`  FAIL ${failure.id}`);
      for (const error of failure.errors) console.log(`    - ${error}`);
    }
    continue;
  }

  printSummary(path, scenarios);
}

process.exit(failed ? 1 : 0);
