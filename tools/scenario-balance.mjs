#!/usr/bin/env node
/**
 * How much of each skill's scenario set proves it works, and how much proves it
 * stays quiet.
 *
 *   node tools/scenario-balance.mjs [--skill <name>]
 *
 * Both halves are needed and they answer different questions. A set that is
 * mostly negatives says a great deal about over-firing and almost nothing about
 * whether the skill does its job; a set with no negatives cannot tell a skill
 * that helps from one that fires on everything.
 *
 * The asymmetry that makes this worth counting: a positive needs the arm without
 * the skill to fail, so it can produce a verdict about worth. A negative passes
 * for free in that arm, because a skill that was never loaded cannot fire. Only
 * positives can show the gap.
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
  let pos = 0, neg = 0;
  for (const f of readdirSync(join(dir, "evals")).filter((x) => /\.scenarios\.(mjs|ts)$/.test(x))) {
    const mod = await import(pathToFileURL(join(dir, "evals", f)).href);
    for (const s of mod.default ?? []) {
      if (typeof s.prompt !== "string") continue;
      const negative = s.activation?.shouldActivate === false || s.mode === "bypass";
      if (negative) neg++; else pos++;
    }
  }
  if (pos + neg) rows.push({ name, pos, neg });
}

rows.sort((a, b) => a.pos / (a.pos + a.neg) - b.pos / (b.pos + b.neg));

console.log("skill".padEnd(34) + "positive   negative    positive share");
for (const r of rows) {
  const share = Math.round((100 * r.pos) / (r.pos + r.neg));
  const flag = share < 35 ? "  <- little proof it works" : share > 90 ? "  <- no proof it stays quiet" : "";
  console.log(r.name.padEnd(34) + String(r.pos).padStart(6) + String(r.neg).padStart(11) + String(share + "%").padStart(14) + flag);
}

const P = rows.reduce((a, r) => a + r.pos, 0);
const N = rows.reduce((a, r) => a + r.neg, 0);
console.log(`\n${P + N} scenarios: ${P} positive, ${N} negative (${Math.round((100 * P) / (P + N))}% positive)`);
console.log("Only a positive can show the gap: a negative passes for free in the arm without the skill.");
