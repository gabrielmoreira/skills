#!/usr/bin/env node
/**
 * The whole suite, over every skill in the collection.
 *
 *   node tools/check-all.mjs              everything; exits non-zero on failure
 *   node tools/check-all.mjs --report     the numbers only; always exits zero
 *   node tools/check-all.mjs --fast       skip mutations, which are the slow part
 *   node tools/check-all.mjs <skill> ...  limit to named skills
 *
 * What runs, and what each part is for:
 *
 *   verify      structural invariants, frontmatter validation included
 *   mutate      proves each invariant fires for its own reason
 *   shape       prose share, bullets, bold, clause density, longest paragraph
 *   parity      the built-in frontmatter parser against a full YAML one
 *
 * `--report` is the continuous-improvement view: it prints totals that can be
 * compared between runs, so a collection getting better is visible as a number
 * rather than as a feeling.
 */
import { readdir, stat } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const TOOLS = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOLS, "..");
const SKILLS = join(ROOT, "skills");

const argv = process.argv.slice(2);
const reportOnly = argv.includes("--report");
const fast = argv.includes("--fast");
const named = argv.filter((a) => !a.startsWith("--"));

const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

const run = (script, args) => {
  try {
    const out = execFileSync("node", [join(TOOLS, script), ...args], { encoding: "utf8", stdio: "pipe" });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
};

/**
 * A skill may carry its own invariants on top of the portable ones, the way a
 * language skill checks things only it can check. Whatever it is written in, it
 * runs from here, so there is one command rather than one per skill.
 */
const OWN_SUITES = ["invariants.mjs", "check-invariants.ts", "invariants.ts", "check-invariants.mjs"];

async function ownSuite(dir) {
  for (const f of OWN_SUITES) {
    const p = join(dir, "evals", f);
    if (await exists(p)) return p;
  }
  return null;
}

/** Every directory under skills/ that carries an entry file. */
async function discover() {
  const out = [];
  for (const e of await readdir(SKILLS, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (named.length && !named.includes(e.name)) continue;
    const dir = join(SKILLS, e.name);
    if ((await exists(join(dir, "SKILL.md"))) || (await exists(join(dir, "INDEX.md")))) out.push(dir);
  }
  return out.sort();
}

const num = (s, re) => { const m = s.match(re); return m ? Number(m[1]) : 0; };
/** Sum a capture across every match, since a multi-topic skill reports per topic. */
const sum = (s, re, group = 1) =>
  [...s.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`))]
    .reduce((a, m) => a + Number(m[group]), 0);

const skills = await discover();
if (!skills.length) {
  console.error(`no skills found under ${SKILLS}`);
  process.exit(2);
}

const rows = [];
let failed = 0;

for (const dir of skills) {
  const name = basename(dir);

  const v = run("verify-skill.mjs", [dir]);
  const vPass = sum(v.out, /(\d+) passed, \d+ failed/);
  const vFail = sum(v.out, /\d+ passed, (\d+) failed/);

  const m = fast ? null : run("mutate-skill.mjs", [dir]);
  const mCaught = m ? sum(m.out, /(\d+)\/\d+ caught/) : 0;
  const mTotal = m ? sum(m.out, /\d+\/(\d+) caught/) : 0;
  const mBad = m ? !m.ok : false;

  const s = run("readability.mjs", ["--skill", dir]);
  const sIn = num(s.out, /(\d+)\/\d+ files inside/);
  const sAll = num(s.out, /\d+\/(\d+) files inside/);

  const suite = await ownSuite(dir);
  let o = null, oPass = 0, oFail = 0;
  if (suite) {
    try {
      const out = execFileSync("node", [suite], { encoding: "utf8", stdio: "pipe", cwd: dir });
      o = { ok: true, out };
    } catch (e) {
      o = { ok: false, out: (e.stdout ?? "") + (e.stderr ?? "") };
    }
    oPass = sum(o.out, /(\d+) passed, \d+ failed/);
    oFail = sum(o.out, /\d+ passed, (\d+) failed/);
  }

  const bad = vFail > 0 || mBad || sIn < sAll || oFail > 0 || (o && !o.ok);
  if (bad) failed++;

  rows.push({ name, vPass, vFail, mCaught, mTotal, sIn, sAll, oPass, oFail, hasOwn: !!suite, bad, detail: { v, m, s, o } });
}

const parity = run("check-yaml-parity.mjs", []);
const paritySkipped = parity.out.startsWith("SKIPPED");
if (!parity.ok) failed++;

// The graders decide what counts as a pass, so they are the one piece of this
// repository where a defect reports a number that merely looks measured.
const graders = run("tests/grading.test.mjs", []);
if (!graders.ok) failed++;

// The behaviour runner writes results built from absolute paths. This is what
// makes forgetting to strip them impossible rather than merely discouraged.
const paths = run("tests/no-local-paths.test.mjs", []);
if (!paths.ok) failed++;

// How many scenarios a router with no understanding already solves. Not a gate:
// a giveaway scenario is weak evidence, not a broken file.
const baseline = run("route-baseline.mjs", []);
const baselineLine = baseline.out.trim().split("\n").find((l) => l.includes("routed scenarios:")) ?? "not measured";

/**
 * Behaviour is read from the committed baseline rather than measured here: a
 * run costs minutes and a network, and this suite has to stay something you can
 * run on every save. Reporting the baseline's age is what stops a stale one
 * from passing for a current one.
 */
function behaviourLine() {
  let base;
  try {
    base = JSON.parse(readFileSync(join(ROOT, "evals/baseline.json"), "utf8"));
  } catch {
    return "never run; node tools/run-activation.mjs --backend omp --write-baseline";
  }
  const rows = base.results.filter((r) => r.arm === "with" || r.arm === "gated");
  const pass = rows.filter((r) => r.verdict === "PASS").length;
  const control = base.results.filter((r) => r.arm === "without" || r.arm === "blind");
  const controlPass = control.filter((r) => r.verdict === "PASS").length;
  const days = Math.floor((Date.now() - Date.parse(base.ranAt)) / 86400000);
  const age = days === 0 ? "today" : `${days}d old`;
  return `${pass}/${rows.length} with the skills, ${controlPass}/${control.length} without, ${base.model}, ${age}`;
}

// ---------------------------------------------------------------- output

const w = Math.max(12, ...rows.map((r) => r.name.length));
console.log("");
console.log(`${"skill".padEnd(w)}  portable     mutations   shape     own checks`);
console.log("-".repeat(w + 48));
for (const r of rows) {
  const inv = r.vFail ? `${r.vPass} ok ${r.vFail} FAIL` : `${r.vPass} ok`;
  const mut = fast ? "skipped" : r.mTotal ? `${r.mCaught}/${r.mTotal}` : "none";
  const shp = `${r.sIn}/${r.sAll}`;
  const own = !r.hasOwn ? "-" : r.oFail ? `${r.oPass} ok ${r.oFail} FAIL` : `${r.oPass} ok`;
  console.log(`${r.name.padEnd(w)}  ${inv.padEnd(12)} ${mut.padEnd(11)} ${shp.padEnd(9)} ${own}${r.bad ? "  <-" : ""}`);
}

const totals = rows.reduce((a, r) => ({
  inv: a.inv + r.vPass,
  invFail: a.invFail + r.vFail,
  mut: a.mut + r.mCaught,
  mutTotal: a.mutTotal + r.mTotal,
  shape: a.shape + r.sIn,
  files: a.files + r.sAll,
}), { inv: 0, invFail: 0, mut: 0, mutTotal: 0, shape: 0, files: 0 });

console.log("");
console.log(`  skills            ${rows.length}`);
console.log(`  invariants        ${totals.inv} passed, ${totals.invFail} failed`);
console.log(`  mutations         ${fast ? "skipped" : `${totals.mut} of ${totals.mutTotal} caught`}`);
console.log(`  shape             ${totals.shape} of ${totals.files} files inside every target`);
console.log(`  frontmatter       ${paritySkipped ? "built-in check only, no full parser installed" : parity.out.trim().split("\n").pop()}`);
console.log(`  graders           ${graders.ok ? "passed" : "FAILED"}`);
console.log(`  local paths       ${paths.ok ? "none committed" : "FOUND"}`);
console.log(`  scenarios         ${baselineLine}`);
console.log(`  behaviour         ${behaviourLine()}`);

if (!reportOnly) {
  for (const r of rows.filter((x) => x.bad)) {
    console.log(`\n=== ${r.name} ===`);
    for (const line of r.detail.v.out.split("\n")) if (/^\s*(FAIL|\s{8})/.test(line)) console.log(line);
    if (r.detail.m && !r.detail.m.ok) {
      for (const line of r.detail.m.out.split("\n")) if (/PROBLEM|baseline/.test(line)) console.log(line);
    }
    if (r.sIn < r.sAll) {
      for (const line of r.detail.s.out.split("\n")) if (line.includes("!")) console.log(`  shape  ${line.trim()}`);
    }
  }
  if (!parity.ok && !paritySkipped) console.log(`\n=== frontmatter parity ===\n${parity.out}`);
}

console.log("");
if (reportOnly) process.exit(0);
console.log(failed === 0 ? "collection clean\n" : `${failed} with findings\n`);
process.exit(failed === 0 ? 0 : 1);
