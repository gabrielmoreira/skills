#!/usr/bin/env node
// Score local grade JSON files against scenario manifests.
// This intentionally does not call subagents or LLMs.
// Usage: node evals/lib/score-local.ts --scenarios typescript-configs/evals/configs.scenarios.ts --grades evals/workspace/runs/pilot-001/gold/grades.json

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { deriveScore, validateGrade } from "./grading.ts";
import { validateScenarios } from "./schema.ts";

function parseArgs(argv) {
  const args = { scenarios: [], grades: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--scenarios") args.scenarios.push(argv[++i]);
    else if (arg === "--grades") args.grades.push(argv[++i]);
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

async function loadModule(path) {
  const mod = await import(pathToFileURL(resolve(path)).href);
  return mod.default ?? mod.scenarios;
}

async function loadGrades(path) {
  const parsed = JSON.parse(await readFile(path, "utf8"));
  return Array.isArray(parsed) ? parsed : [parsed];
}

const args = parseArgs(process.argv.slice(2));
if (args.scenarios.length === 0 || args.grades.length === 0) {
  console.error("Usage: node evals/lib/score-local.ts --scenarios <module> [--scenarios <module>] --grades <json> [--grades <json>]");
  process.exit(2);
}

const scenarios = (await Promise.all(args.scenarios.map(loadModule))).flat();
const scenarioFailures = validateScenarios(scenarios);
if (scenarioFailures.length) {
  console.error("Scenario validation failed:");
  for (const failure of scenarioFailures) console.error(`  ${failure.id}: ${failure.errors.join("; ")}`);
  process.exit(1);
}

const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
const grades = (await Promise.all(args.grades.map(loadGrades))).flat();

let failed = false;
let total = 0;
let scoreSum = 0;
let fatalCount = 0;
const byTier = {};

for (const grade of grades) {
  total += 1;
  const scenario = scenarioById.get(grade.scenarioId);
  if (!scenario) {
    failed = true;
    console.log(`FAIL ${grade.scenarioId ?? "<missing-id>"}: no matching scenario`);
    continue;
  }

  const errors = validateGrade({ scenario, grade });
  if (errors.length) {
    failed = true;
    console.log(`FAIL ${grade.scenarioId}: ${errors.join("; ")}`);
    continue;
  }

  const derivedScore = deriveScore({ scenario, grade });
  const mismatch = derivedScore !== grade.score;
  if (mismatch) failed = true;

  scoreSum += derivedScore;
  if (grade.fatal) fatalCount += 1;
  byTier[scenario.tier] ??= { total: 0, scoreSum: 0, fatal: 0 };
  byTier[scenario.tier].total += 1;
  byTier[scenario.tier].scoreSum += derivedScore;
  if (grade.fatal) byTier[scenario.tier].fatal += 1;

  const status = mismatch ? "FAIL" : "PASS";
  console.log(`${status} ${grade.scenarioId}: score=${derivedScore}/5 tier=${scenario.tier} mode=${scenario.mode}`);
  if (mismatch) console.log(`  grade.score=${grade.score}, derivedScore=${derivedScore}`);
}

console.log("\nSummary");
console.log(`  graded: ${total}`);
console.log(`  mean: ${total ? (scoreSum / total).toFixed(2) : "0.00"}/5`);
console.log(`  fatal: ${fatalCount}`);
for (const [tier, stats] of Object.entries(byTier).sort()) {
  console.log(`  ${tier}: n=${stats.total}, mean=${(stats.scoreSum / stats.total).toFixed(2)}/5, fatal=${stats.fatal}`);
}

process.exit(failed ? 1 : 0);
