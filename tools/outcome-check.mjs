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
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, rmSync, readdirSync } from "node:fs";
import { execSync, spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { OVERLAYS, pinnedRoles } from "./run-activation.mjs";

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
function score(workspace, spec) {
  const target = join(workspace, spec.file);
  if (!existsSync(target)) return { died: 0, total: spec.mutants.length, absent: true };
  const orig = readFileSync(target, "utf8");
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
  try { execSync(spec.test ?? "node --test", { cwd: workspace, stdio: "pipe", timeout: 120_000 }); return true; }
  catch { return false; }
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
if (!suiteIsGreen(base, spec)) {
  console.error("  the untouched suite is not green; every mutant would die for the wrong reason");
  process.exit(2);
}
const b = score(base, spec);
console.log(`  baseline (untouched)   ${b.died}/${b.total} mutants caught`);
if (b.survivors?.length) console.log(`    survives: ${b.survivors.join(", ")}`);
if (args.baselineOnly) { if (!args.keep) rmSync(tmp, { recursive: true, force: true }); process.exit(0); }

const conf = join(tmp, "conf");
mkdirSync(conf, { recursive: true });
const overlays = { with: overlayFor("with", conf), without: overlayFor("without", conf) };

const results = { with: [], without: [] };
console.log("");
for (const arm of ["with", "without"]) {
  for (let i = 0; i < args.samples; i++) {
    const ws = fresh(arm);
    const r = await runAgent(spec.task, ws, overlays[arm]);
    if (r.killed || r.failed) { console.log(`  ${arm} #${i + 1}  lost (${r.killed ? "deadline" : "spawn failed"})`); continue; }
    // A rewrite that leaves the suite red is not an improvement, however good
    // its assertions look. Recorded as its own outcome rather than as a zero,
    // because the two say different things about the skill.
    if (!suiteIsGreen(ws, spec)) { console.log(`  ${arm} #${i + 1}  left the suite RED`); results[arm].push(null); continue; }
    const s = score(ws, spec);
    results[arm].push(s.died);
    console.log(`  ${arm} #${i + 1}  ${s.died}/${s.total} caught${s.survivors?.length ? `   survives: ${s.survivors.slice(0, 3).join(", ")}` : ""}`);
  }
}

const mean = (a) => { const v = a.filter((x) => x !== null); return v.length ? (v.reduce((x, y) => x + y, 0) / v.length).toFixed(1) : "-"; };
console.log(`\n  baseline ${b.died}/${b.total}   without ${mean(results.without)}/${b.total}   with ${mean(results.with)}/${b.total}`);
console.log("  the gap between the last two is what the skill is worth on this case.");
if (!args.keep) rmSync(tmp, { recursive: true, force: true });
