#!/usr/bin/env node
/**
 * The half the traversal numbers cannot see: sessions where a skill should have
 * fired and did not.
 *
 *   node tools/missed-activation.mjs [--root <dir>] [--max-mb 150]
 *
 * Every measurement so far has been conditional on the skill being opened —
 * how deep it went, how far it got. That silently studies only the successes.
 * A skill that never fires on work squarely in its domain loses quality with no
 * trace anywhere in those numbers, and it is the larger failure of the two.
 *
 * Two corrections make the rates mean anything.
 *
 * A skill cannot fire before it exists. Most of this collection landed on
 * 2026-08-14 while the sessions run from March, so dividing activations by all
 * sessions understated the recent skills by an order of magnitude. Each skill is
 * scored only over sessions after the commit that added it.
 *
 * And a skill should only fire on work in its domain. Domain is inferred from
 * what the session actually touched — file extensions in tool arguments — which
 * is coarse but observable, unlike intent.
 *
 * WHAT THIS STILL CANNOT SEE. It measures whether guidance arrived, never
 * whether the work was better for it. A session that opened every right file
 * and produced poor code scores identically to one that produced good code.
 * Quality needs the arm where the skill is absent, and a session log has no
 * such arm; only the eval harness does.
 */
import { readdirSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const ROOT = arg("--root", join(homedir(), ".agent-sessions", "agent", "sessions"));
const MAX_BYTES = Number(arg("--max-mb", 150)) * 1024 * 1024;

// ------------------------------------------------------------ eligible window

/** The commit that added each skill; before it, an activation was impossible. */
function addedOn(name) {
  try {
    const out = execFileSync("git", ["log", "--diff-filter=A", "--format=%ad", "--date=short", "--", `skills/${name}`], { encoding: "utf8" });
    const days = out.trim().split("\n").filter(Boolean);
    return days[days.length - 1] ?? null;
  } catch { return null; }
}
const MINE = readdirSync("skills", { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const since = new Map(MINE.map((n) => [n, addedOn(n)]));

/**
 * What a session touched, and which skill that implies. Coarse on purpose: a
 * narrower rule would need to know the intent, which is not in the log.
 */
const DOMAIN = {
  // Both languages, because more than half this bundle's rules never mention a
  // TypeScript construct: what a failure means, who owns a promise, what a test
  // proves, where a dependency is constructed. A bundle named for one language
  // is unreachable from work in its sibling, and whether that costs anything is
  // a measurement rather than an opinion.
  "typescript-skills": /\.(tsx?|jsx?|mjs|cjs)["'\s]/,
};

// -------------------------------------------------------------------- walking

function* files(dir) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) yield* files(p);
    else if (d.name.endsWith(".jsonl")) yield p;
  }
}

const dateOf = (f) => (f.match(/(\d{4}-\d{2}-\d{2})T/) ?? [])[1] ?? null;

/**
 * A delegated sub-agent run, not a session someone started. 1,498 of 1,807 files
 * are these: the parent already routed, the child gets a narrow task, and it has
 * no business opening a skill. Counting them as sessions deflated every
 * activation rate roughly six-fold and would have turned a working skill into a
 * failing one on paper.
 */
const SEP = "[\\\\/]";
const isSub = (f) => new RegExp(`${SEP}\\d{4}-\\d{2}-\\d{2}T[^\\\\/]*${SEP}[^\\\\/]+\\.jsonl$`).test(f);
const SKILL_READ = /skill:\/\/([a-z0-9-]+)/g;

const byMonth = new Map();
const eligible = new Map(MINE.map((n) => [n, 0]));
const fired = new Map(MINE.map((n) => [n, 0]));
/**
 * The router landed on 2026-08-15. Every skill that predates it has months in
 * its window when nothing was steering activation, which drags its rate down
 * for a reason that has nothing to do with the skill. Comparing an old skill to
 * a new one over different windows compares two eras, so both are also scored
 * over the window they share.
 */
const ROUTER_DAY = "2026-08-15";
const eligibleR = new Map(MINE.map((n) => [n, 0]));
const firedR = new Map(MINE.map((n) => [n, 0]));
const inDomain = new Map(Object.keys(DOMAIN).map((n) => [n, 0]));
const firedInDomain = new Map(Object.keys(DOMAIN).map((n) => [n, 0]));
let scanned = 0, skipped = 0, subs = 0;

for (const f of files(ROOT)) {
  const day = dateOf(f);
  if (statSync(f).size > MAX_BYTES) { skipped++; continue; }
  if (isSub(f)) { subs++; continue; }
  scanned++;
  byMonth.set(day?.slice(0, 7) ?? "?", (byMonth.get(day?.slice(0, 7) ?? "?") ?? 0) + 1);

  const opened = new Set();
  const domains = new Set();
  const rl = createInterface({ input: createReadStream(f, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.length > 40_000_000) continue;
    SKILL_READ.lastIndex = 0;
    let m;
    while ((m = SKILL_READ.exec(line))) opened.add(m[1]);
    for (const [name, re] of Object.entries(DOMAIN)) if (!domains.has(name) && re.test(line)) domains.add(name);
  }

  for (const n of MINE) {
    const s = since.get(n);
    if (s && day && day < s) continue;   // could not have fired
    eligible.set(n, eligible.get(n) + 1);
    if (opened.has(n)) fired.set(n, fired.get(n) + 1);
    if (day && day >= ROUTER_DAY) {
      eligibleR.set(n, eligibleR.get(n) + 1);
      if (opened.has(n)) firedR.set(n, firedR.get(n) + 1);
    }
  }
  for (const n of domains) {
    const s = since.get(n);
    if (s && day && day < s) continue;
    inDomain.set(n, (inDomain.get(n) ?? 0) + 1);
    if (opened.has(n)) firedInDomain.set(n, (firedInDomain.get(n) ?? 0) + 1);
  }
}

// --------------------------------------------------------------------- report

console.log(`scanned ${scanned} top-level sessions; ${subs} delegated sub-agent runs excluded; ${skipped} skipped over ${Math.round(MAX_BYTES / 1024 / 1024)} MB\n`);
console.log("sessions per month");
[...byMonth].sort().forEach(([m, n]) => console.log(`  ${m}  ${String(n).padStart(5)}`));

console.log(`\nACTIVATION, over sessions where the skill already existed`);
console.log("  skill".padEnd(38) + "added        eligible   fired    rate      since the router");
for (const n of MINE.sort((a, b) => (fired.get(b) ?? 0) - (fired.get(a) ?? 0))) {
  const e = eligible.get(n), fr = fired.get(n);
  if (!e) continue;
  const eR = eligibleR.get(n), fR = firedR.get(n);
  const tail = eR ? `${String(fR).padStart(10)}/${eR}  ${String(Math.round((100 * fR) / eR)).padStart(3)}%` : "";
  console.log(`  ${n.padEnd(36)}${(since.get(n) ?? "unknown").padEnd(13)}${String(e).padStart(8)}${String(fr).padStart(8)}${String(Math.round((100 * fr) / e)).padStart(7)}%${tail}`);
}

console.log(`\nMISSED ACTIVATION: sessions that touched the domain and never opened the skill`);
for (const [n, d] of inDomain) {
  const f2 = firedInDomain.get(n) ?? 0;
  console.log(`  ${n}: ${f2}/${d} fired = ${d ? Math.round((100 * f2) / d) : 0}%, so ${d - f2} sessions did the work without it`);
}
console.log(`
Domain here is only "the session touched a file with that extension", which
over-counts: reading one .ts file is not a TypeScript decision. Treat the miss
count as an upper bound and the direction as the finding.`);
