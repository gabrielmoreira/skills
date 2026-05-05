#!/usr/bin/env node
// Generate grader prompt files from saved local responses.
// This intentionally does not call subagents or LLMs.
// Usage: node evals/lib/prepare-grading.ts --scenarios typescript-configs/evals/configs.scenarios.ts --responses evals/workspace/runs/pilot-001/gold/responses.json --out evals/workspace/runs/pilot-001/prompts

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildGradingPrompt } from "./grading.ts";
import { validateScenarios } from "./schema.ts";

function parseArgs(argv) {
  const args = { scenarios: [], responses: [], out: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--scenarios") args.scenarios.push(argv[++i]);
    else if (arg === "--responses") args.responses.push(argv[++i]);
    else if (arg === "--out") args.out = argv[++i];
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

async function loadModule(path) {
  const mod = await import(pathToFileURL(resolve(path)).href);
  return mod.default ?? mod.scenarios;
}

async function loadResponses(path) {
  const parsed = JSON.parse(await readFile(path, "utf8"));
  return Array.isArray(parsed) ? parsed : [parsed];
}

function safeFileName(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

const args = parseArgs(process.argv.slice(2));
if (args.scenarios.length === 0 || args.responses.length === 0 || !args.out) {
  console.error("Usage: node evals/lib/prepare-grading.ts --scenarios <module> [--scenarios <module>] --responses <json> [--responses <json>] --out <dir>");
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
const responses = (await Promise.all(args.responses.map(loadResponses))).flat();
await mkdir(args.out, { recursive: true });

let failed = false;
let written = 0;
for (const response of responses) {
  if (!response || typeof response !== "object") {
    console.log("FAIL <unknown>: response entry must be an object");
    failed = true;
    continue;
  }
  if (!response.scenarioId || typeof response.scenarioId !== "string") {
    console.log("FAIL <missing-id>: response.scenarioId is required");
    failed = true;
    continue;
  }
  if (!response.response || typeof response.response !== "string") {
    console.log(`FAIL ${response.scenarioId}: response.response string is required`);
    failed = true;
    continue;
  }

  const scenario = scenarioById.get(response.scenarioId);
  if (!scenario) {
    console.log(`FAIL ${response.scenarioId}: no matching scenario`);
    failed = true;
    continue;
  }

  const prompt = buildGradingPrompt({ scenario, response: response.response });
  const path = join(args.out, `${safeFileName(response.scenarioId)}.prompt.txt`);
  await writeFile(path, prompt, "utf8");
  console.log(`WRITE ${path}`);
  written += 1;
}

console.log(`\nPrepared ${written} grading prompt file(s).`);
process.exit(failed ? 1 : 0);
