#!/usr/bin/env node
/**
 * What each rule carries, counted.
 *
 *   node tools/rule-anatomy.mjs [--skill <name>] [--worst]
 *
 * A rule that only states a decision leaves the reader to supply the hard parts.
 * Three components make it worth its words, and only the first is reliably
 * present across this collection:
 *
 *   smell        the trigger list, so the reader knows it applies
 *   consequence  what the prohibition costs, so it is an argument not a taste
 *   technique    an escalation with the condition that ends it
 *
 * A fourth column is the cheapest fix available: a name the industry already
 * uses, cited in frontmatter and never used in the body, where it would do the
 * work of thirty words.
 *
 * Deterministic, no model, no network. Run it after every edit.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const ONLY = arg("--skill");
const WORST = argv.includes("--worst");
const ROOT = process.env.SKILL_COLLECTION_ROOT ?? "skills";

/** A skill's own rules, and a multi-topic skill's, which sit under each topic. */
function unitsOf(dir) {
  const out = [];
  if (existsSync(join(dir, "rules"))) out.push(dir);
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (d.isDirectory() && existsSync(join(dir, d.name, "rules"))) out.push(join(dir, d.name));
  }
  return out;
}

const COST = /\b(so |because|which |leaves|breaks|hides|loses|costs|fails|silently|then |turns |stops )/i;
const LADDER = /\n {2}- \*\*|first step|escalat|ladder|stop at the first/i;

const rows = [];
for (const s of readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  if (ONLY && !s.name.includes(ONLY)) continue;
  for (const unit of unitsOf(join(ROOT, s.name))) {
    for (const f of readdirSync(join(unit, "rules")).filter((x) => x.endsWith(".md"))) {
      const text = readFileSync(join(unit, "rules", f), "utf8");
      const body = text.slice(Math.max(0, text.indexOf("# ")));
      const avoid = body.slice(body.indexOf("Avoid:"), body.indexOf("Verify:"));
      const useWhen = body.slice(body.indexOf("Use when:"), body.indexOf("Do:"));

      const refs = (text.match(/^references: \[(.*)\]$/m)?.[1] ?? "")
        .split(",").map((x) => x.trim().replace(/\s*\(.*\)$/, "")).filter((x) => x.length > 3);
      const lower = body.toLowerCase();

      rows.push({
        id: unit.split(/[\\/]/).slice(1).join("/") + "/" + f.replace(/\.md$/, ""),
        smell: useWhen.split("\n").filter((l) => l.trim().startsWith("- ")).length,
        cost: avoid.split("\n").filter((l) => COST.test(l)).length,
        avoid: avoid.split("\n").filter((l) => l.trim().startsWith("- ")).length,
        ladder: LADDER.test(text),
        namesUnused: refs.filter((r) => !lower.includes(r.toLowerCase())).length,
        namesTotal: refs.length,
      });
    }
  }
}

const has = (f) => rows.filter(f).length;
console.log(`${rows.length} rules\n`);
console.log(`  smell, three or more triggers   ${has((r) => r.smell >= 3)}`);
console.log(`  consequence, two or more        ${has((r) => r.cost >= 2)}`);
console.log(`  technique, an escalation        ${has((r) => r.ladder)}`);
console.log(`  all three                       ${has((r) => r.smell >= 3 && r.cost >= 2 && r.ladder)}`);
console.log(`\n  cite a name they never use      ${has((r) => r.namesTotal && r.namesUnused === r.namesTotal)}`);
console.log(`  names sitting unused            ${rows.reduce((a, r) => a + r.namesUnused, 0)}`);

if (WORST) {
  const worst = rows.filter((r) => r.cost < 2 && !r.ladder).sort((a, b) => a.cost - b.cost);
  console.log(`\nneither consequence nor technique (${worst.length})`);
  for (const r of worst) {
    console.log(`  avoid ${r.avoid}, of which ${r.cost} say the cost   ${r.id}`);
  }
}
