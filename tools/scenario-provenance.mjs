#!/usr/bin/env node
/**
 * How much of each skill's scenario set is derived from real sources, and how
 * much was imagined by an author.
 *
 *   node tools/scenario-provenance.mjs [--skill <name>]
 *
 * Scenarios declare a `source` field: "session", "repo-debt", "pr-review",
 * "incident", or "invented". If unspecified, it is treated as "invented".
 *
 * A scenario nobody can trace to a real source is invented, and counting that
 * honestly is the baseline number every later validity phase moves.
 */
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const ONLY = arg("--skill");
const ROOT = process.env.SKILL_COLLECTION_ROOT ?? "skills";

function* units(root) {
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = join(root, d.name);
    if (existsSync(join(dir, "evals"))) yield [d.name, dir];
    for (const t of readdirSync(dir, { withFileTypes: true })) {
      if (!t.isDirectory()) continue;
      const sub = join(dir, t.name);
      if (existsSync(join(sub, "evals"))) yield [`${d.name}/${t.name}`, sub];
    }
  }
}

const rows = [];
for (const [name, dir] of units(ROOT)) {
  if (ONLY && !name.includes(ONLY)) continue;
  let total = 0;
  const sources = {};
  const evalsDir = join(dir, "evals");
  if (!existsSync(evalsDir)) continue;
  for (const f of readdirSync(evalsDir).filter((x) => /\.scenarios\.(mjs|ts)$/.test(x))) {
    const mod = await import(pathToFileURL(join(evalsDir, f)).href);
    for (const s of mod.default ?? []) {
      if (typeof s.prompt !== "string") continue;
      total++;
      const src = s.source || "invented";
      sources[src] = (sources[src] || 0) + 1;
    }
  }
  if (total > 0) {
    const invented = sources["invented"] || 0;
    const derived = total - invented;
    rows.push({ name, total, invented, derived, sources });
  }
}

rows.sort((a, b) => (b.derived / b.total) - (a.derived / a.total) || a.name.localeCompare(b.name));

const w = Math.max(34, ...rows.map((r) => r.name.length));
console.log("skill".padEnd(w) + "  invented   derived    sources");
for (const r of rows) {
  const flag = r.derived === 0 ? "  <- all invented" : "";
  const sourceBreakdown = Object.entries(r.sources)
    .filter(([k]) => k !== "invented")
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
  const detail = sourceBreakdown ? `  (${sourceBreakdown})` : flag;
  console.log(
    r.name.padEnd(w) +
    String(r.invented).padStart(10) +
    String(r.derived).padStart(10) +
    detail
  );
}

const T = rows.reduce((a, r) => a + r.total, 0);
const I = rows.reduce((a, r) => a + r.invented, 0);
const D = rows.reduce((a, r) => a + r.derived, 0);
const allInventedRows = rows.filter((r) => r.derived === 0);
const allSkills = [...new Set(rows.map((r) => r.name.split("/")[0]))];
// A skill is entirely invented only when nothing anywhere under it is derived.
//
// Taking the skill names off the all-invented rows is not the same question,
// and it answers it wrongly for the one skill with topics. `typescript-skills`
// has its own scenario file and nine topic files; its root row can hold zero
// derived scenarios while a topic holds several, and the skill would still be
// reported as entirely invented. Phase C derives repo-debt scenarios into
// `typescript-configs` and `typescript-composition`, so this fires on the next
// phase rather than in some hypothetical future.
const skillsWithDerived = new Set(rows.filter((r) => r.derived > 0).map((r) => r.name.split("/")[0]));
const allInventedSkills = allSkills.filter((s) => !skillsWithDerived.has(s));

const derivedSources = {};
for (const r of rows) {
  for (const [k, v] of Object.entries(r.sources)) {
    if (k !== "invented") derivedSources[k] = (derivedSources[k] || 0) + v;
  }
}
const breakdownParts = Object.entries(derivedSources).map(([k, v]) => `${v} ${k}`).join(", ");
const breakdown = breakdownParts ? ` (${breakdownParts})` : "";

console.log(`\n${T} scenarios: ${I} invented, ${D} derived${breakdown}; ${allInventedSkills.length} of ${allSkills.length} skills entirely invented`);

if (allInventedRows.length > 0) {
  console.log(`\nSkills where every scenario is invented (${allInventedSkills.length} of ${allSkills.length}):`);
  for (const name of allInventedSkills) {
    console.log(`  - ${name}`);
  }
}
