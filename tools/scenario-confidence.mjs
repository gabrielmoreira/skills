#!/usr/bin/env node
/**
 * How much a scenario's result is worth believing.
 *
 *   node tools/scenario-confidence.mjs [--skill <name>] [--rule <name>] [--low]
 *
 * A failing scenario says one of two things and the report cannot tell them
 * apart on its own: the rule is weak, or the scenario is. Scoring the scenario
 * before the run means a failure arrives with the question already answered.
 *
 * Five components, each traceable to something visible in the file. Nothing here
 * is a model's opinion, so a score can be argued with.
 *
 *   asks        the prompt opens with a request rather than a description
 *   short       under 36 words, which is where narration starts
 *   fixture     code is present, so grading is on the change and not the prose
 *   distinct    the prompt does not repeat the gate row's vocabulary
 *   guarded     the rule also has a near miss, so over-firing is tested
 *
 * A low-confidence failure is a finding about the scenario. A high-confidence
 * failure is a finding about the rule. That is the whole point of the number.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i < 0 ? null : argv[i + 1]; };
const ONLY_SKILL = arg("--skill");
const ONLY_RULE = arg("--rule");
const LOW_ONLY = argv.includes("--low");

const ROOT = process.env.SKILL_COLLECTION_ROOT ?? "skills";

const ASKS = /^(re)?(add|fix|implement|write|view|review|factor|refactor|improve|make|check|delete|remove|move|rename|split|simplify|explain|clean|tidy|extract|harden|cover|document|test|name|update|migrate|port|why|what|where|which|when|how|should|can |could |would |is this|does this|do we|i need|i want|help|ok to|any )/i;

const STOP = new Set("about after against already always another anything because before being between could every first found their there these thing think those three under where which while would".split(" "));
const terms = (s) => new Set((s.toLowerCase().match(/[a-z][a-z-]{4,}/g) ?? []).filter((w) => !STOP.has(w)));

/** Gate rows, mapped from the rule they point at to the signal beside it. */
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

function* units(root) {
  for (const d of readdirSync(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = join(root, d.name);
    if (existsSync(join(dir, "evals"))) yield [d.name, dir];
    // A multi-topic skill keeps its scenarios under each topic.
    for (const t of readdirSync(dir, { withFileTypes: true })) {
      if (!t.isDirectory()) continue;
      const sub = join(dir, t.name);
      if (existsSync(join(sub, "evals"))) yield [`${d.name}/${t.name}`, sub];
    }
  }
}

const rows = [];
for (const [name, dir] of units(ROOT)) {
  if (ONLY_SKILL && !name.includes(ONLY_SKILL)) continue;
  const evalsDir = join(dir, "evals");
  const gate = rowsFor(dir);
  const files = readdirSync(evalsDir).filter((f) => /\.scenarios\.(mjs|ts)$/.test(f));
  const all = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(evalsDir, f)).href);
    all.push(...(mod.default ?? []));
  }
  const guarded = new Set(
    all.filter((s) => s.mode === "bypass" || (s.tags ?? []).some((t) => /near-miss|collision/.test(t))).map((s) => s.rule),
  );
  for (const s of all) {
    if (typeof s.prompt !== "string") continue;
    if (ONLY_RULE && s.rule !== ONLY_RULE) continue;
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
    const score = Object.values(parts).reduce((a, b) => a + b, 0);
    rows.push({ unit: name, id: s.id, rule: s.rule, score, parts, words, shared });
  }
}

const band = (n) => (n >= 5 ? "high" : n >= 3 ? "medium" : "low");
const counts = { high: 0, medium: 0, low: 0 };
for (const r of rows) counts[band(r.score)]++;

console.log(`${rows.length} scenarios scored out of 6\n`);
console.log(`  high    ${counts.high}   a failure here is a finding about the rule`);
console.log(`  medium  ${counts.medium}`);
console.log(`  low     ${counts.low}   a failure here is a finding about the scenario`);

const missing = (k) => rows.filter((r) => !r.parts[k]).length;
console.log(`\nwhat is holding the scores down`);
for (const k of ["fixture", "distinct", "asks", "short", "guarded"]) {
  console.log(`  ${k.padEnd(9)} missing on ${String(missing(k)).padStart(3)} of ${rows.length}`);
}

const show = LOW_ONLY ? rows.filter((r) => band(r.score) === "low") : rows;
if (show.length && show.length <= 60) {
  console.log(`\n${LOW_ONLY ? "low confidence" : "every scenario"}`);
  for (const r of show.sort((a, b) => a.score - b.score)) {
    const have = Object.entries(r.parts).filter(([, v]) => v).map(([k]) => k).join(" ");
    console.log(`  ${String(r.score)}/6  ${r.id.slice(0, 46).padEnd(48)} ${have}`);
  }
}
