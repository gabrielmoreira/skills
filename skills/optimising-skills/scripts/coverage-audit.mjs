#!/usr/bin/env node
/**
 * Does the scenario suite cover what you are about to trust it for?
 *
 *   node skills/optimising-skills/scripts/coverage-audit.mjs
 *   node skills/optimising-skills/scripts/coverage-audit.mjs --skill <name>
 *   node skills/optimising-skills/scripts/coverage-audit.mjs --self-test
 *
 * Run from the collection root.
 *
 * Subtracting an instruction against a suite that never exercised it removes
 * something load-bearing while the score stays green. This reports the axes
 * that decide whether a green result means anything, and it reports facts
 * rather than a verdict: no threshold is asserted and none should be added.
 *
 * WHAT IS EXACT AND WHAT IS A READING
 *
 * Exact: how many positives and negatives a skill has, whether a fixture
 * directory exists for a scenario, what provenance a scenario declares, and
 * which rules have no scenario at all.
 *
 * A reading: whether a prompt refers to a state the workspace lacks. That is
 * not a regex, so the prompt is printed for a person rather than classified.
 * Guessing it would be the proxy this collection has already thrown away twice.
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const only = args.includes("--skill") ? args[args.indexOf("--skill") + 1] : null;

/** Every unit that owns scenarios: a skill, or a topic inside a multi-topic skill. */
function* units(root) {
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = join(root, d.name);
    if (existsSync(join(dir, "evals"))) yield [d.name, dir];
    for (const t of readdirSync(dir, { withFileTypes: true })) {
      if (!t.isDirectory()) continue;
      const sub = join(dir, t.name);
      if (existsSync(join(sub, "evals"))) yield [d.name, sub];
    }
  }
}

/** The rules a skill owns, so a rule with no scenario can be named. */
function rulesOf(skill) {
  const found = new Set();
  const base = join("skills", skill);
  const walk = (dir, prefix) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isDirectory() && e.name === "rules") {
        for (const f of readdirSync(join(dir, "rules"))) {
          if (f.endsWith(".md")) found.add(prefix + f.replace(/\.md$/, ""));
        }
      } else if (e.isDirectory() && !["evals", "references", "node_modules", "scripts"].includes(e.name)) {
        walk(join(dir, e.name), `${e.name}/`);
      }
    }
  };
  walk(base, "");
  return found;
}

if (args.includes("--self-test")) {
  // The measure must refuse a case built to fool it. Here the confounder is a
  // scenario that has a fixture directory whose name merely starts with the
  // scenario id: a prefix match would count it as present.
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const root = mkdtempSync(join(tmpdir(), "cov-selftest-"));
  mkdirSync(join(root, "evals", "fixtures", "alpha-scenario-extended"), { recursive: true });
  const has = (id) => existsSync(join(root, "evals", "fixtures", id));

  const checks = [
    ["a prefix is not a fixture", has("alpha-scenario") === false],
    ["the real directory is found", has("alpha-scenario-extended") === true],
  ];
  rmSync(root, { recursive: true, force: true });
  for (const [label, ok] of checks) console.log(`${label.padEnd(30)} ${ok ? "correct" : "WRONG"}`);
  const pass = checks.every((c) => c[1]);
  console.log(pass ? "\nfixture presence is exact, not a prefix match" : "\nthe check is fooled");
  process.exit(pass ? 0 : 1);
}

const bySkill = new Map();
for (const [skill, dir] of units("skills")) {
  if (only && skill !== only) continue;
  const evals = join(dir, "evals");
  for (const f of readdirSync(evals).filter((x) => /\.scenarios\.(mjs|ts)$/.test(x))) {
    const mod = await import(pathToFileURL(join(evals, f)).href);
    for (const s of mod.default ?? []) {
      if (!s.id) continue;
      if (!bySkill.has(skill)) bySkill.set(skill, { pos: [], neg: [], derived: 0, rules: new Set(), noFixture: [] });
      const b = bySkill.get(skill);
      const negative = s.activation?.shouldActivate === false;
      (negative ? b.neg : b.pos).push(s.id);
      if (s.source && s.source !== "invented") b.derived++;
      if (s.rule) b.rules.add(s.rule);
      if (!existsSync(join(evals, "fixtures", s.id))) b.noFixture.push({ id: s.id, prompt: s.prompt ?? "", negative });
    }
  }
}

if (!bySkill.size) { console.log(`no scenarios found${only ? ` for ${only}` : ""}`); process.exit(1); }

const w = Math.max(12, ...[...bySkill.keys()].map((s) => s.length));
console.log("CLASS BALANCE. A suite that only tests when a skill should fire");
console.log("produces one that fires on everything, and the score will not say so.\n");
console.log("skill".padEnd(w) + "   positives   negatives   ratio   derived");
let P = 0, N = 0;
for (const [skill, b] of [...bySkill].sort((a, c) => c[1].pos.length / (c[1].neg.length || 0.5) - a[1].pos.length / (a[1].neg.length || 0.5))) {
  P += b.pos.length; N += b.neg.length;
  const ratio = b.neg.length ? (b.pos.length / b.neg.length).toFixed(1) : "none";
  console.log(
    skill.padEnd(w) + String(b.pos.length).padStart(12) + String(b.neg.length).padStart(12) +
    ratio.padStart(8) + String(b.derived).padStart(10),
  );
}
console.log(`\n${P} positives, ${N} negatives, ${N ? (P / N).toFixed(1) : "n/a"} to 1 overall`);

// Rules nothing points at. A rule with no scenario is declared, not proved.
console.log("\nRULES WITH NO SCENARIO. A rule nothing tests is declared, not proved.\n");
let orphans = 0;
for (const [skill, b] of [...bySkill].sort()) {
  const own = rulesOf(skill);
  if (!own.size) continue;
  const missing = [...own].filter((r) => ![...b.rules].some((c) => c === r || String(r).endsWith(`/${c}`) || String(c).endsWith(`/${r}`)));
  if (!missing.length) continue;
  orphans += missing.length;
  console.log(`${skill}  ${missing.length} of ${own.size}`);
  for (const m of missing.slice(0, 8)) console.log(`    ${m}`);
  if (missing.length > 8) console.log(`    ... and ${missing.length - 8} more`);
}
if (!orphans) console.log("every rule has at least one scenario naming it");

// The fixture question, printed rather than judged.
console.log("\nNO FIXTURE. Correct for a prompt that asks a question, wrong for one");
console.log("that refers to work already done. Read the prompt; this does not guess.\n");
let nf = 0, tot = 0;
for (const [, b] of bySkill) { nf += b.noFixture.length; tot += b.pos.length + b.neg.length; }
console.log(`${nf} of ${tot} scenarios run against an empty workspace (${Math.round((100 * nf) / tot)}%)\n`);
for (const [skill, b] of [...bySkill].sort()) {
  const shown = b.noFixture.filter((x) => /\b(I|we|my|our)\b|\balready\b|\bthese\b|\bthis one\b/.test(x.prompt)).slice(0, 3);
  if (!shown.length) continue;
  console.log(`${skill}`);
  for (const s of shown) console.log(`    ${s.negative ? "neg " : "pos "}${s.id}\n      ${s.prompt.slice(0, 110)}`);
}
console.log("\nThose are first-person or deictic prompts with no fixture, shown as candidates.");
console.log("Reading them is the check. The list is not a verdict.");

// Saturation, read from the committed baseline if one exists.
try {
  const base = JSON.parse(readFileSync("evals/baseline.json", "utf8"));
  const on = (r) => r.arm === "with" || r.arm === "gated";
  const pos = base.results.filter((r) => on(r) && !r.negative);
  const p = pos.reduce((a, r) => a + r.passes, 0), n = pos.reduce((a, r) => a + r.samples, 0);
  const covered = new Set(base.results.map((r) => r.skill)).size;
  console.log(`\nSATURATION. A suite near 100% measures regression, not capability.`);
  console.log(`  committed baseline  ${p}/${n} positives passing, ${covered} skills, ${base.ranAt?.slice(0, 10) ?? "undated"}`);
  if (n && p / n > 0.95) console.log("  near ceiling: this suite can report a loss and cannot report a gain");
} catch {
  console.log("\nSATURATION. No committed baseline, so nothing can be said about capability.");
}
