#!/usr/bin/env node
/**
 * Three tables route to these skills, and they drift.
 *
 *   node tools/check-routing-parity.mjs
 *
 * `AGENTS.md` is what an agent reads with no repository in front of it.
 * `README.md` is what a person reads before installing anything. And
 * `skills/using-gabrielmoreira-skills/SKILL.md` is the router that resolves
 * what a matched skill leaves open.
 *
 * A skill missing from one of them is not a cosmetic gap. `drop-the-model-voice`
 * shipped in two commits with a row in the README and the router and none in
 * AGENTS.md, so an agent reading that file alone could not reach it. A skill
 * nothing routes to is a skill that does not exist.
 *
 * Two skills are deliberately absent from the public tables and are declared
 * here rather than inferred, so that adding a third has to be a decision.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// `managing-tools-with-mise` is local and experimental. `using-gabrielmoreira-skills`
// is the router itself, and a router does not route to itself.
const NOT_ROUTED = new Set(["managing-tools-with-mise", "using-gabrielmoreira-skills"]);

// Each file promises something different, so each is checked against its own
// promise. AGENTS.md and the router carry a routing table: one row per skill,
// naming it in backticks. The README carries a section per skill instead, since
// inlining the table there made a third copy of it and the third copy is the one
// that drifted.
const TABLES = [
  ["AGENTS.md", "AGENTS.md"],
  ["the router", "skills/using-gabrielmoreira-skills/SKILL.md"],
];

const installed = readdirSync("skills", { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join("skills", d.name, "SKILL.md")))
  .map((d) => d.name);

const expected = installed.filter((s) => !NOT_ROUTED.has(s)).sort();

// A row routes when it names the skill inside backticks in a table row. Prose
// mentioning a skill is not routing, and counting it would let a table pass on
// a paragraph.
const rowsIn = (text) => {
  const named = new Set();
  for (const line of text.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    for (const m of line.matchAll(/`([a-z][a-z0-9-]+)`/g)) named.add(m[1]);
  }
  return named;
};

let failed = 0;
const report = [];

for (const [label, path] of TABLES) {
  let text;
  try { text = readFileSync(path, "utf8"); } catch { report.push(`  ${label}: missing at ${path}`); failed++; continue; }
  const routed = rowsIn(text);
  const missing = expected.filter((s) => !routed.has(s));
  const extra = [...routed].filter((s) => installed.includes(s) && NOT_ROUTED.has(s));
  if (missing.length) { report.push(`  ${label} routes ${expected.length - missing.length} of ${expected.length}, missing: ${missing.join(", ")}`); failed++; }
  else if (extra.length) { report.push(`  ${label} routes a skill declared not routed: ${extra.join(", ")}`); failed++; }
  else report.push(`  ${label} routes all ${expected.length}`);
}

// The README's promise is a section per skill, each linking to the skill it
// describes. A skill with no section is one a reader cannot find out about
// without opening the directory.
const readme = readFileSync("README.md", "utf8");
const sectioned = new Set([...readme.matchAll(/^###\s+\[`([a-z][a-z0-9-]+)`\]/gm)].map((m) => m[1]));
const unsectioned = expected.filter((s) => !sectioned.has(s));
if (unsectioned.length) { report.push(`  README has no section for: ${unsectioned.join(", ")}`); failed++; }
else report.push(`  README describes all ${expected.length}`);

// And the README should not carry a third copy of the table. It did, and that
// copy is the one that fell behind.
const readmeRows = rowsIn(readme);
const duplicated = expected.filter((s) => readmeRows.has(s));
if (duplicated.length > expected.length / 2) {
  report.push(`  README carries a routing table again: ${duplicated.length} of ${expected.length} skills in table rows`);
  failed++;
}

console.log(`${installed.length} installed, ${expected.length} expected in every routing table\n`);
console.log(report.join("\n"));
console.log(failed ? `\n${failed} table(s) out of step` : "\nevery routing table agrees");
process.exit(failed ? 1 : 0);
