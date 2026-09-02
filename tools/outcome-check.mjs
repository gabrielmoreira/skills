#!/usr/bin/env node
/**
 * Does the skill make the artifact better, or only the answer better?
 *
 *   node tools/outcome-check.mjs --case assertions-on-mock-calls [--samples 2]
 *   node tools/outcome-check.mjs --list
 *   node tools/outcome-check.mjs --case <name> --baseline-only
 *
 * Every other measurement in this repository grades what the agent said. A
 * judge model reads the answer against must/mustNot and decides whether it
 * agrees. That is the right instrument for most of these skills, because most
 * of them have no mechanical oracle -- there is no program that can tell you
 * whether a document was placed correctly or whether a boundary was drawn in
 * the right place.
 *
 * Some skills do have one, and for those, grading prose is leaving evidence on
 * the table. A skill about tests that cannot lie can be checked by mutating the
 * code under test and counting which mutants the agent's tests now catch. The
 * number owes nothing to a judge.
 *
 * Measured on the first case before this tool existed: the fixture's three
 * passing tests killed 0 of 8 mutants. Every one survived, including the two
 * that make the function return the opposite of what it computed. Three green
 * tests that detect nothing is the exact defect the skill claims to prevent,
 * which makes it the honest place to ask whether the skill prevents it.
 *
 * The baseline is printed with every run and is the reason the number means
 * anything: without it, "killed 5 of 8" could be the fixture's own doing.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync, spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { OVERLAYS, pinnedRoles, degraded } from "./run-activation.mjs";

const CASES = resolve("evals/outcomes");
const SKILLS = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const has = (k) => argv.includes(k);

const args = {
  case: arg("--case", null),
  samples: Number(arg("--samples", 2)),
  model: arg("--model", "openai-codex/gpt-5.6-terra"),
  thinking: arg("--thinking", "high"),
  profile: arg("--profile", null),
  maxTime: Number(arg("--max-time", 300)),
  baselineOnly: has("--baseline-only"),
  keep: has("--keep"),
};

// --------------------------------------------------------------- the oracle

/**
 * One mutant, applied to a pristine copy, judged by whether the suite goes red.
 *
 * A mutant that the original code already fails to compile or that no test
 * exercises at all is not evidence about the tests, so a case declares its own
 * mutants rather than having them generated: a hand-written set is small, every
 * entry is a real behaviour change, and the case author can say why each one
 * matters. Generated mutants would be more of them and less signal.
 */
function score(workspace, spec, pristine) {
  const target = join(workspace, spec.file);
  if (!existsSync(target)) return { died: 0, total: spec.mutants.length, absent: true };
  const orig = readFileSync(target, "utf8");
  // The mutants are literal substitutions into this exact source. An agent that
  // rewrote it has invalidated every one of them, and the run would report the
  // missing patterns as survivors: a worse score for a file that may be better.
  // Refused rather than scored, because a number nobody can interpret is worse
  // than no number.
  if (pristine !== undefined && orig !== pristine) {
    return { died: 0, total: spec.mutants.length, rewritten: true };
  }
  let died = 0;
  const survivors = [];
  for (const m of spec.mutants) {
    if (!orig.includes(m.from)) { survivors.push(`${m.name} (pattern gone)`); continue; }
    writeFileSync(target, orig.replace(m.from, m.to));
    let red = false;
    try { execSync(spec.test ?? "node --test", { cwd: workspace, stdio: "pipe", timeout: 120_000 }); }
    catch { red = true; }
    if (red) died++; else survivors.push(m.name);
  }
  writeFileSync(target, orig);
  return { died, total: spec.mutants.length, survivors };
}

/**
 * A suite that does not pass on the untouched code cannot be scored: every
 * mutant would "die" for the wrong reason and the arm would look perfect.
 * Checked before scoring rather than after, because a green-looking number from
 * a broken suite is the failure this whole repository keeps finding in itself.
 */
function suiteIsGreen(workspace, spec) {
  let out;
  try { out = execSync(spec.test ?? "node --test", { cwd: workspace, stdio: "pipe", timeout: 120_000 }); }
  catch { return { green: false, tests: 0 }; }
  // Exit zero is not enough. Measured: a directory whose test file has been
  // deleted exits zero, so an agent that removed the suite would be recorded
  // as "green, caught 0 of 8", which is exactly the reading a bad rewrite
  // gets. The runner reports how many tests it actually ran, and a run of
  // nothing has to be told apart from a run that found nothing.
  const m = String(out).match(/^.\s*tests (\d+)/m) ?? String(out).match(/# tests (\d+)/m);
  const tests = m ? Number(m[1]) : 0;
  return { green: true, tests };
}

/**
 * Whether the agent touched the workspace at all.
 *
 * The first run of this tool reported 0/8 for both arms and the number was
 * uninterpretable: a suite nobody edited scores exactly the same as a rewrite
 * that did not help, and those two say opposite things about the skill. The
 * task is phrased the way a developer asks, which invites an answer rather than
 * an edit, so "did anything change" has to be reported beside the score.
 */
function snapshot(dir) {
  const files = new Map();
  const walk = (d, rel = "") => {
    for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name === "node_modules" || e.name.startsWith(".")) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p, `${rel}${e.name}/`);
      else files.set(`${rel}${e.name}`, readFileSync(p, "utf8"));
    }
  };
  walk(dir);
  return files;
}

/** What the agent actually did to the tree, named rather than counted. */
function changes(before, after) {
  const touched = [], added = [], removed = [];
  for (const [f, v] of after) {
    if (!before.has(f)) added.push(f);
    else if (before.get(f) !== v) touched.push(f);
  }
  for (const f of before.keys()) if (!after.has(f)) removed.push(f);
  return { touched, added, removed, any: touched.length + added.length + removed.length > 0 };
}

// ----------------------------------------------------------------- the runs

function overlayFor(arm, dir) {
  const roles = pinnedRoles(args.model, args.thinking);
  const p = join(dir, `${arm}.yml`);
  writeFileSync(p, arm === "with" ? OVERLAYS.with(SKILLS, roles) : OVERLAYS.without(SKILLS, roles));
  return p;
}

function runAgent(prompt, cwd, overlay) {
  return new Promise((ok) => {
    const a = [
      "-p", prompt,
      "--model", args.model,
      "--thinking", args.thinking,
      "--config", overlay,
      "--cwd", cwd,
      "--mode", "json",
      "--max-time", String(args.maxTime),
      "--no-session", "--no-extensions", "--no-rules",
    ];
    if (args.profile) a.push("--profile", args.profile);
    const child = spawn("omp", a, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let settled = false;
    const done = (v) => { if (settled) return; settled = true; clearTimeout(t); ok(v); };
    // The child's --max-time is a request. A model that accepts the connection
    // and never answers would otherwise hold this forever.
    const t = setTimeout(() => { try { child.kill("SIGKILL"); } catch {} done({ out, killed: true }); }, (args.maxTime * 2 + 30) * 1000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", () => done({ out, failed: true }));
    child.on("close", () => done({ out }));
  });
}

// -------------------------------------------------------------------- main

const list = () => (existsSync(CASES) ? readdirSync(CASES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []);

if (has("--list") || (!args.case && !args.baselineOnly)) {
  const names = list();
  console.log(names.length ? "cases:\n  " + names.join("\n  ") : `no cases yet under ${CASES}`);
  process.exit(0);
}

const dir = join(CASES, args.case);
if (!existsSync(dir)) { console.error(`no case at ${dir}`); process.exit(2); }
const spec = JSON.parse(readFileSync(join(dir, "case.json"), "utf8"));
const source = join(dir, "workspace");

const tmp = join(tmpdir(), `outcome-${process.pid}`);
mkdirSync(tmp, { recursive: true });
const fresh = (tag) => { const p = join(tmp, `${tag}-${randomUUID().slice(0, 8)}`); cpSync(source, p, { recursive: true }); return p; };

console.log(`case ${args.case}   ${spec.mutants.length} mutants on ${spec.file}`);
console.log(`  task: ${spec.task.slice(0, 100)}${spec.task.length > 100 ? "..." : ""}\n`);

const base = fresh("base");
const baseRun = suiteIsGreen(base, spec);
if (!baseRun.green) {
  console.error("  the untouched suite is not green; every mutant would die for the wrong reason");
  process.exit(2);
}
if (!baseRun.tests) {
  console.error("  the untouched suite runs no tests at all; there is nothing to compare against");
  process.exit(2);
}
const b = score(base, spec, undefined);
console.log(`  baseline (untouched)   ${b.died}/${b.total} mutants caught, ${baseRun.tests} tests`);
if (b.survivors?.length) console.log(`    survives: ${b.survivors.join(", ")}`);
if (args.baselineOnly) { if (!args.keep) rmSync(tmp, { recursive: true, force: true }); process.exit(0); }

const conf = join(tmp, "conf");
mkdirSync(conf, { recursive: true });
const overlays = { with: overlayFor("with", conf), without: overlayFor("without", conf) };

const results = { with: [], without: [] };
// A fatal degradation ends the whole run, not one arm: a number averaged over
// samples the provider refused to serve is a number no model produced.
let stop = false;
console.log("");
for (const arm of ["with", "without"]) {
  if (stop) break;
  for (let i = 0; i < args.samples; i++) {
    const ws = fresh(arm);
    const before = snapshot(ws);
    const pristine = before.get(spec.file.split("/").join("/"));
    const r = await runAgent(spec.task, ws, overlays[arm]);
    const diff = changes(before, snapshot(ws));
    if (r.killed || r.failed) { console.log(`  ${arm} #${i + 1}  lost (${r.killed ? "deadline" : "spawn failed"})`); continue; }
    // A quota wall answers nothing and edits nothing, which is indistinguishable
    // from a model that chose not to edit. Reported as its own outcome and fatal
    // to the run, because averaging over samples the provider refused to serve
    // produces a number no model produced.
    const bad = degraded(r.out);
    if (bad) {
      console.log(`  ${arm} #${i + 1}  ${bad.fatal ? "DEGRADED" : "lost"}: ${bad.why}`);
      if (bad.fatal) { stop = true; break; }
      continue;
    }
    // A rewrite that leaves the suite red is not an improvement, however good
    // its assertions look. Recorded as its own outcome rather than as a zero,
    // because the two say different things about the skill.
    const what = [
      diff.touched.length ? `edited ${diff.touched.join(", ")}` : null,
      diff.added.length ? `added ${diff.added.join(", ")}` : null,
      diff.removed.length ? `REMOVED ${diff.removed.join(", ")}` : null,
    ].filter(Boolean).join("; ");
    if (!diff.any) { console.log(`  ${arm} #${i + 1}  answered without editing anything`); results[arm].push(null); continue; }
    const run = suiteIsGreen(ws, spec);
    if (!run.green) { console.log(`  ${arm} #${i + 1}  left the suite RED   (${what})`); results[arm].push(null); continue; }
    if (!run.tests) { console.log(`  ${arm} #${i + 1}  VOID: the suite now runs no tests   (${what})`); results[arm].push(null); continue; }
    const s = score(ws, spec, pristine);
    if (s.rewritten) { console.log(`  ${arm} #${i + 1}  VOID: rewrote ${spec.file}, so the mutants no longer apply   (${what})`); results[arm].push(null); continue; }
    results[arm].push(s.died);
    console.log(`  ${arm} #${i + 1}  ${s.died}/${s.total} caught, ${run.tests} tests   (${what})`);
    if (s.survivors?.length) console.log(`      survives: ${s.survivors.join(", ")}`);
  }
}

const mean = (a) => { const v = a.filter((x) => x !== null); return v.length ? (v.reduce((x, y) => x + y, 0) / v.length).toFixed(1) : "-"; };
console.log(`\n  baseline ${b.died}/${b.total}   without ${mean(results.without)}/${b.total}   with ${mean(results.with)}/${b.total}`);
console.log("  the gap between the last two is what the skill is worth on this case.");
if (!args.keep) rmSync(tmp, { recursive: true, force: true });
