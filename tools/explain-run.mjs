#!/usr/bin/env node
/**
 * Triage a run against the confidence of the scenarios that produced it.
 *
 *   node tools/explain-run.mjs [evals/last-run.json]
 *
 * A failing scenario says one of two things and the numbers cannot separate
 * them: the rule did not reach, or the scenario could never have shown that it
 * did. Reading the two together separates them mechanically, so a red result
 * arrives already sorted into work on the rule and work on the test.
 *
 * Nothing here re-runs anything. It reads what the run wrote and what the
 * scenarios are, which costs nothing and can be repeated after every edit.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const file = process.argv[2] ?? "evals/last-run.json";
if (!existsSync(file)) { console.error(`no run at ${file}`); process.exit(1); }
const run = JSON.parse(readFileSync(file, "utf8"));

const ROOT = process.env.SKILL_COLLECTION_ROOT ?? "skills";
const ASKS = /^(re)?(add|fix|implement|write|view|review|factor|refactor|improve|make|check|delete|remove|move|rename|split|simplify|explain|clean|tidy|extract|harden|cover|document|test|name|update|migrate|port|why|what|where|which|when|how|should|can |could |would |is this|does this|do we|i need|i want|help|ok to|any )/i;
const STOP = new Set("about after against already always another anything because before being between could every first found their there these thing think those three under where which while would".split(" "));
const terms = (s) => new Set((s.toLowerCase().match(/[a-z][a-z-]{4,}/g) ?? []).filter((w) => !STOP.has(w)));

function rowsFor(dir) {
  const out = new Map();
  for (const entry of ["SKILL.md", "INDEX.md"]) {
    const p = join(dir, entry);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      if (!line.trimStart().startsWith("|")) continue;
      const m = line.match(/rules\/([a-z0-9-]+)\.md/);
      if (m) out.set(m[1], line.split("|")[1] ?? "");
    }
  }
  return out;
}

// Every scenario in the collection, keyed by id, with its confidence.
const scored = new Map();
function* units(root) {
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = join(root, d.name);
    if (existsSync(join(dir, "evals"))) yield dir;
    for (const t of readdirSync(dir, { withFileTypes: true })) {
      if (!t.isDirectory()) continue;
      const sub = join(dir, t.name);
      if (existsSync(join(sub, "evals"))) yield sub;
    }
  }
}
for (const dir of units(ROOT)) {
  const evalsDir = join(dir, "evals");
  const gate = rowsFor(dir);
  const all = [];
  for (const f of readdirSync(evalsDir).filter((x) => /\.scenarios\.(mjs|ts)$/.test(x))) {
    const mod = await import(pathToFileURL(join(evalsDir, f)).href);
    all.push(...(mod.default ?? []));
  }
  const guarded = new Set(
    all.filter((s) => s.mode === "bypass" || (s.tags ?? []).some((t) => /near-miss|collision/.test(t))).map((s) => s.rule),
  );
  for (const s of all) {
    if (typeof s.prompt !== "string") continue;
    const words = s.prompt.trim().split(/\s+/).length;
    const p = terms(s.prompt);
    const row = terms(gate.get(s.rule) ?? "");
    const shared = row.size ? [...row].filter((w) => p.has(w)).length / row.size : 0;
    const parts = {
      asks: ASKS.test(s.prompt.trim()) ? 1 : 0,
      short: words < 36 ? 1 : 0,
      fixture: existsSync(join(evalsDir, "fixtures", s.id)) ? 2 : 0,
      distinct: row.size >= 2 && shared < 0.25 ? 1 : 0,
      guarded: guarded.has(s.rule) ? 1 : 0,
    };
    scored.set(s.id, { score: Object.values(parts).reduce((a, b) => a + b, 0), parts, rule: s.rule });
  }
}

const band = (n) => (n >= 5 ? "high" : n >= 3 ? "medium" : "low");
const withArm = run.results.filter((r) => r.arm === "with" || r.arm === "gated");
const without = new Map(run.results.filter((r) => r.arm === "without").map((r) => [r.id, r]));

console.log(`${file}`);
console.log(`  ${run.model}  ${run.backend}${run.replayed ? "  (replayed)" : ""}  ${run.ranAt}`);
console.log(`  ${withArm.length} scenarios, ${run.samples} samples each\n`);

const rowsOut = [];
for (const r of withArm) {
  const c = scored.get(r.id) ?? { score: 0, parts: {}, rule: r.rule ?? "?" };
  const o = without.get(r.id);
  const passed = r.passes === r.samples;
  rowsOut.push({ ...r, conf: c, o, passed });
}

const failed = rowsOut.filter((r) => !r.passed);
const byBand = { high: [], medium: [], low: [] };
for (const r of failed) byBand[band(r.conf.score)].push(r);

console.log("failures, sorted by how much they are worth believing\n");
for (const b of ["high", "medium", "low"]) {
  if (!byBand[b].length) continue;
  const verdict = b === "high"
    ? "look at the rule"
    : b === "low"
      ? "look at the scenario first; it could not have shown much"
      : "read the trace before deciding which";
  console.log(`  ${b} confidence — ${verdict}`);
  for (const r of byBand[b]) {
    const missing = Object.entries(r.conf.parts).filter(([, v]) => !v).map(([k]) => k).join(", ");
    console.log(`    ${r.conf.score}/6  ${r.id}`);
    console.log(`          rule ${r.conf.rule}, with ${r.passes}/${r.samples}, without ${r.o?.passes ?? "?"}/${r.o?.samples ?? "?"}`);
    if (missing) console.log(`          missing: ${missing}`);
  }
  console.log("");
}

const passedRows = rowsOut.filter((r) => r.passed);
const bothWays = passedRows.filter((r) => r.o && r.o.passes === r.o.samples);
console.log(`passed with the skill      ${passedRows.length}/${rowsOut.length}`);
console.log(`  of those, also without   ${bothWays.length}   the rule was not what did it`);
if (bothWays.length) for (const r of bothWays) console.log(`    ${r.id}`);
