/**
 * Negative controls for scenario-manifest validation, not skill behavior.
 * Each case corrupts structured scenario data and must fail its named invariant.
 * Wording-pinning mutations were removed with the corresponding checks.
 * Run: node evals/mutations.mjs. No model, provider or private fixture executes.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const EVALS = path.dirname(fileURLToPath(import.meta.url));
const SKILL = path.dirname(EVALS);
const FILE = "change-review.scenarios.mjs";
const original = (await import(pathToFileURL(path.join(EVALS, FILE)).href)).default;
const MUTATIONS = [
  {
    inv: "INV-11",
    what: "a primary route names a missing rule",
    apply: (cases) => { cases[0].expectedPrimary = "rules/no-such-rule.md"; },
  },
  {
    inv: "INV-11",
    what: "expectedAll names a missing rule",
    apply: (cases) => { cases[0].expectedAll.push("rules/no-such-rule.md"); },
  },
  {
    inv: "INV-13",
    what: "an expectedAll-only route is also forbidden",
    apply: (cases) => {
      const c = cases.find((s) => s.skillMode === "standard" && !s.expectedAll);
      const route = "rules/defects-in-the-change.md";
      c.expectedAll = [route];
      c.activation.forbiddenRoutes = [route];
    },
  },
  {
    inv: "INV-18",
    what: "depth uses an unsupported value",
    apply: (cases) => { cases[0].skillMode = "unknown"; },
  },
  {
    inv: "INV-18",
    what: "scope uses an unsupported value",
    apply: (cases) => { cases[0].reviewScope = "unknown"; },
  },
  {
    inv: "INV-18",
    what: "complete depth silently omits a category",
    apply: (cases) => { cases[0].expectedAll.pop(); },
  },
];

const work = fs.mkdtempSync(path.join(os.tmpdir(), "review-manifest-"));
const run = (dir) => {
  const result = spawnSync(process.execPath, [path.join(dir, "evals/invariants.mjs")], {
    encoding: "utf8", cwd: dir,
  });
  if (result.error) throw result.error;
  return { exit: result.status, out: (result.stdout ?? "") + (result.stderr ?? "") };
};
const copy = (name) => {
  // Each case owns a fresh parent; the leaf keeps the real skill name, since
  // the leak check reads it from the directory. Foreign pointers stay unchecked.
  const dir = path.join(work, name, path.basename(SKILL));
  fs.cpSync(SKILL, dir, { recursive: true });
  return dir;
};

try {
  const baseline = run(copy("baseline"));
  if (baseline.exit !== 0) throw new Error(`Baseline failed; mutations cannot be interpreted.\n${baseline.out}`);
  console.log("Baseline: scenario and structure checks pass in an isolated skill copy.");
  const problems = [];
  for (const [i, mutation] of MUTATIONS.entries()) {
    const cases = structuredClone(original);
    mutation.apply(cases);
    const dir = copy(`case-${i}`);
    fs.writeFileSync(path.join(dir, "evals", FILE), `export default ${JSON.stringify(cases, null, 2)};\n`);
    const result = run(dir);
    const failed = [...result.out.matchAll(/FAIL\s+(INV-\d+)\b/g)].map((m) => m[1]);
    if (result.exit !== 0 && failed.length === 1 && failed[0] === mutation.inv) {
      console.log(`CAUGHT ${mutation.inv}: ${mutation.what}`);
    } else {
      problems.push(`${mutation.what}: exit=${result.exit}, failed=${failed.join(", ") || "none"}\n${result.out}`);
    }
  }
  if (problems.length) throw new Error(problems.join("\n"));
  console.log(`${MUTATIONS.length}/${MUTATIONS.length} manifest mutations caught by the intended invariant only.`);
  console.log("No behavioral or review-quality claim follows from these checks.");
} finally {
  fs.rmSync(work, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}
