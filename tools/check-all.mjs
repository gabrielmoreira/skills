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
import { interval } from "./run-activation.mjs";

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

// Three tables route to these skills and they drift. One shipped with a row in
// two of them and none in the third, so an agent reading that file alone could
// not reach the skill at all.
const routing = run("check-routing-parity.mjs", []);
const routingLine = routing.out.trim().split("\n").at(-1) ?? "not measured";
if (!routing.ok) failed++;

// Do the TypeScript fixtures compile, and would Node run them? The one that
// existed did not, and nothing here had ever compiled a fixture.
const fixtureTypes = run("check-fixture-types.mjs", []);
const fixtureTypesLine = fixtureTypes.out.trim().split("\n").find((l) => /compiles|error\(s\)|skipped|no TypeScript/.test(l)) ?? "not measured";
if (!fixtureTypes.ok) failed++;

// How much of the scenario set is derived from real sources vs invented.
const provenance = run("scenario-provenance.mjs", []);
const provenanceLine = provenance.out.trim().split("\n").find((l) => l.includes("scenarios:") && l.includes("invented,")) ?? "not measured";
if (!provenance.ok) failed++;

/**
 * Behaviour is read from the committed baseline rather than measured here: a
 * run costs minutes and a network, and this suite has to stay something you can
 * run on every save. Reporting the baseline's age is what stops a stale one
 * from passing for a current one.
 */
function behaviourLine(collectionSize) {
  let base;
  try {
    base = JSON.parse(readFileSync(join(ROOT, "evals/baseline.json"), "utf8"));
  } catch {
    return "never run; node tools/run-activation.mjs --backend omp --write-baseline";
  }
  // Near misses are counted apart. A skill that was never loaded cannot fire
  // wrongly, so every negative passes the control for free, and folding them in
  // credits the skill with work the absence of the skill did.
  // Pooled samples, not per-scenario verdicts. At three samples a scenario
  // whose true rate is near 60% reports UNSTABLE most runs and PASS about one
  // in five, so counting verdicts tracks the sampling and not the collection.
  const on = (r) => r.arm === "with" || r.arm === "gated";
  const pool = (rows) => rows.reduce((a, r) => ({ p: a.p + r.passes, n: a.n + r.samples }), { p: 0, n: 0 });
  const pct = ({ p, n }) => (n ? `${Math.round((100 * p) / n)}% ${interval(p, n)}` : "n/a");
  const pos = base.results.filter((r) => !r.negative);
  const withS = pool(pos.filter(on));
  const without = pool(pos.filter((r) => !on(r)));
  const neg = pool(base.results.filter((r) => r.negative && on(r)));
  const days = Math.floor((Date.now() - Date.parse(base.ranAt)) / 86400000);
  const age = days === 0 ? "today" : `${days}d old`;
  const shutPart = neg.n ? `, ${pct(neg)} stayed shut` : "";

  // Age was reported and coverage was not, so a baseline built from one skill
  // read as a statement about fourteen. Both are ways a baseline stops standing
  // for the collection, and the narrower one is the harder to notice: the
  // interval widens with small samples, but nothing in the line says which
  // scenarios were never in it.
  const ids = new Set(base.results.map((r) => r.id));
  const skills = [...new Set(base.results.map((r) => r.skill))];
  const scope = collectionSize
    ? `${ids.size}/${collectionSize} scenarios`
    : `${ids.size} scenarios`;
  const reach = skills.length === 1 ? `${skills[0]} only` : `${skills.length} skills`;
  return `${pct(withS)} with the skills, ${pct(without)} without${shutPart}, ${base.model}, ${age}, ${scope} across ${reach}`;
}

/**
 * Whether anything fired on work no skill in the collection covers. Near misses
 * live inside each skill and test where its boundary sits; these test whether a
 * description is greedy in general, which is the cost a reader pays for a file
 * that had nothing to say.
 */
function farMissLine() {
  let base;
  try {
    base = JSON.parse(readFileSync(join(ROOT, "evals/far-miss.json"), "utf8"));
  } catch {
    return "never run; node tools/run-activation.mjs --backend omp --kind far-miss --write-baseline";
  }
  const quiet = base.results.filter((r) => r.verdict === "PASS").length;
  const noisy = base.results.filter((r) => r.verdict !== "PASS");
  const days = Math.floor((Date.now() - Date.parse(base.ranAt)) / 86400000);
  const who = noisy.length ? `; opened: ${[...new Set(noisy.flatMap((r) => r.opened ?? []))].join(", ")}` : "";
  return `${quiet}/${base.results.length} stayed quiet${who}, ${days === 0 ? "today" : `${days}d old`}`;
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
// The held-out half, reported on every run. A description tuned against the
// whole set passes its own exam, and the only thing that catches that is
// knowing which scenarios took no part in the tuning.
let collectionSize = 0;
const splitLine = await (async () => {
  try {
    const { loadScenarios } = await import("./split-activation.mjs");
    const s = await loadScenarios();
    collectionSize = s.length;
    const n = (set, pos) => s.filter((x) => x.set === set && x.positive === pos).length;
    const pct = (a, b) => (a + b ? Math.round((b / (a + b)) * 100) : 0);
    const tr = n("train", true) + n("train", false);
    const va = n("validation", true) + n("validation", false);
    return s.length + " activation scenarios: " + tr + " train, " + va + " validation ("
      + pct(n("train", true), n("validation", true)) + "% of positives, "
      + pct(n("train", false), n("validation", false)) + "% of negatives held out)";
  } catch (e) {
    return "not computed: " + e.message;
  }
})();

console.log(`  skills            ${rows.length}`);
console.log(`  invariants        ${totals.inv} passed, ${totals.invFail} failed`);
console.log(`  mutations         ${fast ? "skipped" : `${totals.mut} of ${totals.mutTotal} caught`}`);
console.log(`  shape             ${totals.shape} of ${totals.files} files inside every target`);
console.log(`  frontmatter       ${paritySkipped ? "built-in check only, no full parser installed" : parity.out.trim().split("\n").pop()}`);
console.log(`  graders           ${graders.ok ? "passed" : "FAILED"}`);
console.log(`  local paths       ${paths.ok ? "none committed" : "FOUND"}`);
console.log(`  scenarios         ${baselineLine}`);
console.log(`  split             ${splitLine}`);
console.log(`  routing tables    ${routingLine}`);
console.log(`  fixture types     ${fixtureTypesLine}`);
console.log(`  provenance        ${provenanceLine}`);
console.log(`  behaviour         ${behaviourLine(collectionSize)}`);
console.log(`  far misses        ${farMissLine()}`);

if (!reportOnly) {
  for (const r of rows.filter((x) => x.bad)) {
    console.log(`\n=== ${r.name} ===`);
    for (const line of r.detail.v.out.split("\n")) if (/^\s*(FAIL|\s{8})/.test(line)) console.log(line);
    if (r.detail.m && !r.detail.m.ok) {
      for (const line of r.detail.m.out.split("\n")) if (/PROBLEM|baseline/.test(line)) console.log(line);
    }
    if (r.sIn < r.sAll) {
      const lines = r.detail.s.out.split("\n");
      for (const line of lines) if (line.includes("!")) console.log(`  shape  ${line.trim()}`);
      // The flagged row says which dimension; the why block says by how much.
      const w = lines.findIndex((l) => l.startsWith("why:"));
      if (w >= 0) for (const line of lines.slice(w + 1)) {
        if (/files inside/.test(line)) break;
        if (line.trim()) console.log(`  shape  ${line.trim()}`);
      }
    }
  }
  if (!parity.ok && !paritySkipped) console.log(`\n=== frontmatter parity ===\n${parity.out}`);
}

console.log("");
if (reportOnly) process.exit(0);
console.log(failed === 0 ? "collection clean\n" : `${failed} with findings\n`);
process.exit(failed === 0 ? 0 : 1);
