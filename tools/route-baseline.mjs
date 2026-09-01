#!/usr/bin/env node
/**
 * The deterministic control arm.
 *
 * Every activation scenario claims that a gate routes a prompt to a rule. The
 * claim is only interesting if the routing needed the gate. This script asks
 * the opposite question: would a router with no understanding at all, matching
 * shared words and nothing else, already land on the same rule?
 *
 * Where it would, the scenario proves nothing about the skill. It proves that
 * the prompt and the row share vocabulary, which is a property of the words,
 * not of the writing.
 *
 * No model, no network, no key. This runs everywhere and always, and it is the
 * difficulty meter for the scenario set rather than a pass or fail gate: a
 * scenario the naive router misses may be well written or may be unroutable,
 * and only a real run tells those apart.
 *
 * Usage:
 *   node tools/route-baseline.mjs                 every skill in the collection
 *   node tools/route-baseline.mjs skills/foo      one skill
 *   node tools/route-baseline.mjs --verbose       name every scenario
 */
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

const STOP = new Set(
  "about after against already always another anything because before being between could every first found their there these thing think those three under where which while would".split(" "),
);

/** Distinctive words only: five letters or more, minus a small stop list. */
export const terms = (s) =>
  new Set((s.toLowerCase().match(/[a-z][a-z-]{4,}/g) ?? []).filter((w) => !STOP.has(w)));

const exists = (p) => readdir(p).then(() => true, () => readFile(p).then(() => true, () => false));

/**
 * Gate rows, read from an entry file. A row is a table line naming exactly one
 * target, so the signal column is everything the gate offers to match against.
 */
export function gateRows(entryText) {
  const rows = [];
  for (const line of entryText.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const m = line.match(/(?:([a-z0-9-]+)\/)?(?:rules\/([a-z0-9-]+)\.md|([a-z0-9-]+)\/INDEX\.md)/);
    if (!m) continue;
    const target = m[2] ? `rules/${m[2]}.md` : `${m[3]}/INDEX.md`;
    const signal = line.split("|")[1] ?? "";
    // A tie-breaker table lists the same target twice. Both rows are signal.
    rows.push({ target, signal, terms: terms(signal) });
  }
  return rows;
}

/**
 * The naive router: rank rows by how many distinctive words they share with the
 * prompt, break ties by the share of the row that matched, and refuse to guess
 * when nothing matches at all.
 */
export function naiveRoute(rows, prompt) {
  const p = terms(prompt);
  const scored = rows
    .map((r) => {
      const shared = [...r.terms].filter((w) => p.has(w));
      return { target: r.target, count: shared.length, ratio: r.terms.size ? shared.length / r.terms.size : 0, shared };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || b.ratio - a.ratio);
  if (!scored.length) return { target: null, tied: [], shared: [] };
  const best = scored[0];
  const tied = scored.filter((r) => r.count === best.count && r.ratio === best.ratio).map((r) => r.target);
  return { target: best.target, tied: [...new Set(tied)], shared: best.shared };
}

/** Reduce a deep expectation to the granularity the entry file routes at. */
function atEntryGranularity(expected, rows) {
  const clean = String(expected).replace(/^skill:\/\/[^/]+\//, "");
  if (rows.some((r) => r.target === clean)) return clean;
  const topic = clean.match(/^([a-z0-9-]+)\/rules\//);
  if (topic && rows.some((r) => r.target === `${topic[1]}/INDEX.md`)) return `${topic[1]}/INDEX.md`;
  const bare = clean.match(/rules\/[a-z0-9-]+\.md$/);
  return bare ? bare[0] : clean;
}

async function scenariosIn(skillDir) {
  const evalsDir = join(skillDir, "evals");
  let files = [];
  try {
    files = (await readdir(evalsDir)).filter((f) => /\.scenarios\.(mjs|ts)$/.test(f));
  } catch {
    return [];
  }
  const out = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(evalsDir, f)).href);
    for (const s of mod.default ?? mod.scenarios ?? []) out.push(s);
  }
  return out;
}

async function entryText(skillDir) {
  for (const name of ["SKILL.md", "INDEX.md"]) {
    try {
      return (await readFile(join(skillDir, name), "utf8")).split("\r\n").join("\n");
    } catch {}
  }
  return null;
}

export async function measure(skillDir) {
  const text = await entryText(skillDir);
  if (!text) return null;
  const rows = gateRows(text);
  const all = await scenariosIn(skillDir);
  const routed = all.filter((s) => s.expectedPrimary && typeof s.prompt === "string");
  const results = routed.map((s) => {
    // A topic scenario names its bundle in expectedPrimary and its rule in
    // expectedAll. The gate rows point at rules, so the second is the one
    // that can match; taking the first made every topic report zero.
    const claim = Array.isArray(s.expectedAll) && s.expectedAll.length ? s.expectedAll[0] : s.expectedPrimary;
    const expected = atEntryGranularity(claim, rows);
    const got = naiveRoute(rows, s.prompt);
    const verdict = !got.target
      ? "missed"
      : got.target === expected && got.tied.length === 1
        ? "solved"
        : got.tied.includes(expected)
          ? "tie"
          : "missed";
    return { id: s.id, expected, got: got.target, tied: got.tied, shared: got.shared, verdict };
  });
  return {
    skill: basename(skillDir),
    rows: rows.length,
    scenarios: all.length,
    routed: routed.length,
    negatives: all.length - routed.length,
    solved: results.filter((r) => r.verdict === "solved").length,
    tie: results.filter((r) => r.verdict === "tie").length,
    missed: results.filter((r) => r.verdict === "missed").length,
    results,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes("--verbose");
  const given = args.filter((a) => !a.startsWith("--"));
  const root = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");
  const dirs = given.length
    ? given.map((d) => resolve(d))
    : (await readdir(root, { withFileTypes: true }))
        .filter((d) => d.isDirectory())
        .map((d) => join(root, d.name));

  // A multi-topic skill keeps its scenarios beside each topic, and each topic
  // carries its own gate. Measuring only the root left the larger half of the
  // collection unmeasured by the one instrument that says a prompt is a
  // giveaway.
  if (!given.length) {
    for (const dir of [...dirs]) {
      let subs = [];
      try { subs = await readdir(dir, { withFileTypes: true }); } catch { continue; }
      for (const s of subs) {
        if (!s.isDirectory()) continue;
        if (await exists(join(dir, s.name, "evals"))) dirs.push(join(dir, s.name));
      }
    }
  }

  let solved = 0;
  let tie = 0;
  let missed = 0;
  for (const dir of dirs) {
    const m = await measure(dir);
    if (!m || !m.routed) continue;
    solved += m.solved;
    tie += m.tie;
    missed += m.missed;
    const pct = Math.round((m.solved / m.routed) * 100);
    console.log(
      `${m.skill.padEnd(28)} ${String(m.solved).padStart(3)}/${String(m.routed).padEnd(3)} solved by word overlap (${pct}%), ${m.tie} tied, ${m.negatives} negatives not measured`,
    );
    if (!verbose) continue;
    for (const r of m.results.filter((r) => r.verdict !== "missed")) {
      console.log(`    ${r.verdict.padEnd(6)} ${r.id}  ->  ${r.got}  [${r.shared.join(", ")}]`);
    }
  }
  const total = solved + tie + missed;
  if (!total) {
    console.log("no routed scenarios found");
    return;
  }
  console.log(
    `\n${total} routed scenarios: ${solved} solved without understanding (${Math.round((solved / total) * 100)}%), ${tie} tied, ${missed} need more than word overlap`,
  );
  console.log("A solved scenario is a giveaway. It measures shared vocabulary, not the gate.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
