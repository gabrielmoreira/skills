#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { summarizeScenarioControls } from "./control-matrix.ts";
import { discoverScenarioModulePaths } from "./discover-scenarios.ts";
import { summarizeScenarios, validateScenarios } from "./lib/schema.ts";
import { runInvariants } from "./check-invariants.ts";

async function loadScenarioModule(path: string) {
  const mod = await import(pathToFileURL(resolve(path)).href);
  return mod.default ?? mod.scenarios;
}

// Discover from the parent skills/ folder so sibling skills
// (maintainable-code, progressive-reading) are validated too.
const cliPaths = process.argv.slice(2);
const scenarioPaths = cliPaths.length ? cliPaths : await discoverScenarioModulePaths(resolve(".."));
let failed = false;
for (const path of scenarioPaths) {
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
const ok = await runInvariants();
process.exit(failed || !ok ? 1 : 0);
