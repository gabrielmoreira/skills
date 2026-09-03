#!/usr/bin/env node
/**
 * What real work sessions say, against what the eval harness assumed.
 *
 *   node tools/work-sessions.mjs [--root <dir>] [--max-mb 200] [--limit N]
 *
 * The depth analysis rests on two numbers taken from synthetic eval runs: a
 * 34,064-token cached context, 6.7 turns a scenario, and a 36% per-hop
 * follow-through measured once at n=11. Real sessions can confirm or destroy
 * all three, and they are the only place the question can be settled, because
 * they are where the skills are actually used.
 *
 * Nothing here loads a session. Files reach 2 GB with a handful of enormous
 * lines, so each line is scanned as raw text for the few fields that matter and
 * discarded. Only counters survive, and no session content is printed.
 *
 * Coverage is reported rather than assumed: files above --max-mb are skipped
 * and counted, because a denominator quietly smaller than the set is the
 * failure this project keeps finding in its own tooling.
 */
import { readdirSync, statSync, createReadStream } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { homedir } from "node:os";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const ROOT = arg("--root", join(homedir(), ".agent-sessions", "agent", "sessions"));
const MAX_BYTES = Number(arg("--max-mb", 200)) * 1024 * 1024;
const LIMIT = Number(arg("--limit", Infinity));
// Practice changed over the months these cover, models, skills, habits, so a
// pooled average across all of it describes a person who no longer exists.
const SINCE = arg("--since", null);
const dateOf = (f) => (f.match(/(\d{4}-\d{2}-\d{2})T/) ?? [])[1] ?? null;

// ------------------------------------------------------------------ patterns

const USAGE = /"usage":\{"input":(\d+),"output":(\d+),"cacheRead":(\d+),"cacheWrite":(\d+)/;
const MODEL = /"model":"([^"]+)"/;
// A read of a skill: omp writes them as skill://<bundle>[/...] in the argument.
const SKILL_READ = /skill:\/\/([a-z0-9-]+)((?:\/[^"\\]+)?)/g;

// -------------------------------------------------------------------- walking

function* files(dir) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) yield* files(p);
    else if (d.name.endsWith(".jsonl")) yield p;
  }
}

const turns = { n: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
const models = new Map();
/**
 * Depth reached, per bundle per session. Pooling 'opened something underneath'
 * answered the wrong question twice: it scored bundles that have no rules at
 * 0% -- nothing to follow to is not a failure to follow -- and it counted a
 * topic index as a rule, so a three-level tree looked fully traversed when the
 * session had only reached level two.
 *
 *   depth 1  skill://bundle
 *   depth 2  skill://bundle/rules/x.md  or  skill://bundle/topic/INDEX.md
 *   depth 3  skill://bundle/topic/rules/x.md
 */
const reached = new Map();
const sessionTurns = [];
let scanned = 0, skipped = 0, skippedBytes = 0, longLines = 0, tooOld = 0;
let firstDay = null, lastDay = null;

// Follow-through is a within-session question: having opened a bundle, did the
// session go on to open something beneath it? Counted per session per bundle,
// so a session that reads one rule ten times counts once.
let followNum = 0, followDen = 0;

for (const f of files(ROOT)) {
  if (scanned >= LIMIT) break;
  const day = dateOf(f);
  if (SINCE && day && day < SINCE) { tooOld++; continue; }
  if (day) { if (!firstDay || day < firstDay) firstDay = day; if (!lastDay || day > lastDay) lastDay = day; }
  const size = statSync(f).size;
  if (size > MAX_BYTES) { skipped++; skippedBytes += size; continue; }
  scanned++;

  const deepest = new Map();
  let tHere = 0;

  const rl = createInterface({ input: createReadStream(f, { encoding: "utf8" }), crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.length > 40_000_000) { longLines++; continue; }

    const u = USAGE.exec(line);
    if (u) {
      tHere++;
      turns.n++;
      turns.input += +u[1]; turns.output += +u[2];
      turns.cacheRead += +u[3]; turns.cacheWrite += +u[4];
      const m = MODEL.exec(line);
      if (m) models.set(m[1], (models.get(m[1]) ?? 0) + 1);
    }

    SKILL_READ.lastIndex = 0;
    let s;
    while ((s = SKILL_READ.exec(line))) {
      const bundle = s[1];
      const rest = (s[2] ?? "").replace(/^[/]/, "");
      const segs = rest ? rest.split("/") : [];
      // rules/x.md and topic/INDEX.md are both one hop from the bundle;
      // topic/rules/x.md is two.
      const level = segs.length === 0 ? 1 : segs.length <= 2 ? 2 : 3;
      deepest.set(bundle, Math.max(deepest.get(bundle) ?? 0, level));
    }
  }

  if (tHere) sessionTurns.push(tHere);
  for (const [b, lvl] of deepest) {
    const r = reached.get(b) ?? { 1: 0, 2: 0, 3: 0 };
    for (let k = 1; k <= lvl; k++) r[k]++;
    reached.set(b, r);
  }
}

// --------------------------------------------------------------------- report

const per = (k) => (turns.n ? Math.round(turns[k] / turns.n) : 0);
const median = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : 0);

console.log(`scanned ${scanned} session files spanning ${firstDay ?? "?"} to ${lastDay ?? "?"}`);
console.log(`  skipped ${skipped} over ${Math.round(MAX_BYTES / 1024 / 1024)} MB (${(skippedBytes / 1024 ** 3).toFixed(2)} GB unread)${tooOld ? `, ${tooOld} before ${SINCE}` : ""}`);
if (longLines) console.log(`  ${longLines} individual lines too long to scan`);

console.log(`\nTOKEN PROFILE, ${turns.n.toLocaleString()} model turns of real work`);
console.log(`  input        ${per("input").toLocaleString().padStart(9)}`);
console.log(`  cache read   ${per("cacheRead").toLocaleString().padStart(9)}`);
console.log(`  cache write  ${per("cacheWrite").toLocaleString().padStart(9)}`);
console.log(`  output       ${per("output").toLocaleString().padStart(9)}`);
console.log(`  the eval harness assumed 1,536 / 34,064 / 0 / 279`);

console.log(`\nTURNS PER SESSION over ${sessionTurns.length} sessions`);
console.log(`  median ${median(sessionTurns)}, mean ${Math.round(sessionTurns.reduce((a, b) => a + b, 0) / (sessionTurns.length || 1))}, max ${Math.max(0, ...sessionTurns)}`);
console.log(`  the eval harness assumed 6.7`);

console.log(`\nMODELS, by turn`);
[...models].sort((a, b) => b[1] - a[1]).slice(0, 8)
  .forEach(([m, n]) => console.log(`  ${String(Math.round((100 * n) / turns.n)).padStart(3)}%  ${m}  (${n.toLocaleString()} turns)`));

console.log("");
console.log("DEPTH REACHED, per bundle, sessions that got there");
console.log("  bundle".padEnd(38) + "  L1    L2  L1->L2     L3  L2->L3");
const rows = [...reached].filter(([, r]) => r[1] >= 8).sort((a, b) => b[1][1] - a[1][1]);
let n12 = 0, d12 = 0, n23 = 0, d23 = 0;
for (const [b, r] of rows) {
  if (!r[2]) { console.log("  " + b.padEnd(36) + String(r[1]).padStart(4) + "     -  nothing deeper was ever opened"); continue; }
  d12 += r[1]; n12 += r[2];
  let tail = "";
  if (r[3]) { d23 += r[2]; n23 += r[3]; tail = String(r[3]).padStart(7) + String(Math.round((100 * r[3]) / r[2])).padStart(6) + "%"; }
  console.log("  " + b.padEnd(36) + String(r[1]).padStart(4) + String(r[2]).padStart(6) + String(Math.round((100 * r[2]) / r[1])).padStart(7) + "%" + tail);
}
console.log("");
console.log("per-hop follow-through, pooled over bundles with a level to reach");
console.log("  level 1 -> 2   " + n12 + "/" + d12 + " = " + (d12 ? Math.round((100 * n12) / d12) : 0) + "%");
console.log("  level 2 -> 3   " + n23 + "/" + d23 + " = " + (d23 ? Math.round((100 * n23) / d23) : 0) + "%");
console.log("  the depth analysis assumed 36% per hop, from n=11 of synthetic evals");
