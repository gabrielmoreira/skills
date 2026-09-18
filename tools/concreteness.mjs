#!/usr/bin/env node
/**
 * The concreteness counterpart to the C-07 size budget, answered by Jev.
 *
 * C-07 pushes prose down. Nothing pushed back when a tightening pass traded a
 * named action or a concrete example for word count -- the failure this tool
 * exists for, caught by hand on 2026-09-18 after a trim turned "Name what the
 * test needs to run" into "Check the chosen seam is the least that could
 * observe the behaviour": every deterministic check stayed green while the
 * line got worse for the reader.
 *
 * The reader here is the model that loads the skill, and that decides the
 * question. Generic wording is not the defect; the defect is a revision that
 * drops a specific, named fact an agent would act on -- an example, an entity,
 * a quantity, a named action. What any competent model already knows (that
 * databases are local dependencies) counts as not lost; the procedure step
 * "name what it needs before choosing" is not something the model can infer
 * was being asked of it.
 *
 *   node tools/concreteness.mjs --skill <name> [--against <ref>]   multi-axis review
 *   node tools/concreteness.mjs --skill <name> --gauge             per-line dual reader
 *   node tools/concreteness.mjs --validate
 *
 * The review mode judges each reworded line on four defect axes -- concrete
 * loss, human clarity, agent precision, semantic drift -- plus one improvement
 * axis, the loss axis asked in both line orders to catch position bias. A
 * WORSE verdict names its axis; a drift flag on an intentional change is the
 * instrument doing its job, telling the reviewer the demand changed. Run it
 * before committing a skill edit: the commit is where the judgement becomes
 * history. Known bias, measured on the trim commit 833b44b: the cuttable
 * triage repeatedly points at why-clauses -- the rationale a reader needs --
 * even when instructed not to, so treat every cuttable suggestion as a lead
 * to argue with, and never as permission. The WORSE axes separated real
 * degradations from benign compressions on the same run, including two
 * over-trims the editing pass had judged harmless.
 *
 * Every judgement is asked twice with the lines swapped; a pair whose verdicts
 * disagree is reported as unstable rather than counted. Report-only: this
 * never blocks a commit alone. It is the other side of the C-07 gate -- size
 * says too big, this says too thin -- and a flag is a place to look, exactly
 * like every other Jev instrument in this collection. Known noise, measured on
 * its first corpus run: a pure grammar rewrite ("reserve it for" to "reserved
 * for") flagged at 0.71, one false positive in nine pairs. Read before
 * reverting; the flag narrows the reading, it does not do it.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const KEY = process.env.TYPESAFE_AI_API_KEY || process.env.TYPESAFE_API_KEY;
if (!KEY) { console.error("needs TYPESAFE_AI_API_KEY (or TYPESAFE_API_KEY)"); process.exit(1); }
const MODEL = arg("--jev-model", "jev-latest");

async function ask(state, questions) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state, model: MODEL, questions }),
    });
    if (res.status === 429 || res.status === 529) { await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`typesafe ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).answers;
  }
  throw new Error("gave up after 3 attempts");
}

// Per reworded line: five axes, the loss axis asked in both line orders, the
// rest in one. One typesafe call per pair.
const AXES = (a, b, order) => {
  const first = order === "ab" ? a : b, second = order === "ab" ? b : a;
  return {
    loss: { type: "noul", instructions: `Line ${order === "ab" ? "A" : "B"}: ${first}\nLine ${order === "ab" ? "B" : "A"}: ${second}\nThe second line loses concrete guidance the first line gave: a specific example, entity, quantity, or named action. Two readers depend on it: an agent following the line would act differently without the specific fact, and the human directing the agent would no longer recognise from the line alone what it is about. General knowledge any competent model already has does not count as lost` },
    human: { type: "noul", instructions: `Line ${order === "ab" ? "A" : "B"}: ${first}\nLine ${order === "ab" ? "B" : "A"}: ${second}\nThe second line is harder for a human developer to understand than the first; recognising what situation it covers now takes more effort` },
    agent: { type: "noul", instructions: `Line ${order === "ab" ? "A" : "B"}: ${first}\nLine ${order === "ab" ? "B" : "A"}: ${second}\nAn agent following the second line would act less precisely than one following the first; the revision removed a distinction the agent used` },
    drift: { type: "noul", instructions: `Line ${order === "ab" ? "A" : "B"}: ${first}\nLine ${order === "ab" ? "B" : "A"}: ${second}\nThe second line changes what the line demands, not just its wording; a reader following both would do different things` },
  };
};
const BETTER = (a, b) => ({
  type: "noul",
  instructions: `Line A: ${a}\nLine B: ${b}\nLine B is an improvement over line A: clearer for a human to read and at least as actionable for an agent`,
});

const suffixed = (axes) => Object.fromEntries(Object.keys(axes).map((k) => [`ba_${k}`, axes[k]]));

async function reviewPair(a, b) {
  const state = `A trimming edit to a skill rule file. The line before:\n${a}\n\nThe line after:\n${b}`;
  const clauses = b.split(/;\s*|\s+—\s*|,\s+(?=[a-z])/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length >= 6);
  const questions = { ...AXES(a, b, "ab"), ...suffixed(AXES(a, b, "ba")), better: BETTER(a, b) };
  if (clauses.length) {
    const options = [...clauses, "none"];
    questions.compress = {
      type: "choice",
      instructions: `Line B: ${b}\nLine B contains a clause that could be cut without changing what an agent following it does or what a human directing them recognises; pick that clause, or none if every clause is load-bearing. A clause explaining why the rule exists, or naming the concrete case it covers, is load-bearing and never the answer`,
      options,
      criteria: Object.fromEntries(options.map((o) => [o, o === "none" ? "every clause is load-bearing" : "this clause could be cut without changing what the line demands"])),
    };
  }
  const ans = await ask(state, questions);
  const g = (k) => (ans[`ab_${k}`] ?? ans[k]);
  const h = (k) => (ans[`ba_${k}`] ?? ans[k]);
  const avg = (k) => (g(k).noul + h(k).noul) / 2;
  const axes = { loss: avg("loss"), human: avg("human"), agent: avg("agent"), drift: avg("drift") };
  const stable = Object.entries(axes).every(([k, v]) => Math.abs(g(k).noul - h(k).noul) < 0.3);
  const worseAxis = Object.entries(axes).filter(([, v]) => v >= 0.6).map(([k]) => k);
  const better = ans.better.noul >= 0.6 && !worseAxis.length;
  const compress = ans.compress?.choice && ans.compress.choice !== "none" ? ans.compress.choice : null;
  const verdict = worseAxis.length ? "WORSE" : better ? "BETTER" : "neutral";
  return { verdict, axes, worseAxis, stable, better, compress };
}

async function judgePair(a, b) {
  const state = `Skill guidance line, before a trimming edit:\n${a}\n\nThe same line after the edit:\n${b}`;
  const [ab, ba] = await Promise.all([
    ask(state, { q: AXES(a, b, "ab").loss }),
    ask(state, { q: AXES(a, b, "ba").loss }),
  ]);
  const p1 = ab.q.noul, p2 = ba.q.noul;
  return { p: (p1 + p2) / 2, stable: Math.abs(p1 - p2) < 0.3, p1, p2 };
}

// ------------------------------------------------------------- validation set
// The real degradations this session produced by hand, plus their restorations
// and the benign compressions that must stay clear. If the instrument cannot
// separate these, it is not pointing at anything.
const VALIDATION = [
  { name: "DEGRADED: naming action dropped", a: "Name what the test needs to run, and check it is the least that could observe the behaviour.", b: "Check the chosen seam is the least that could observe the behaviour.", expect: "loss" },
  { name: "DEGRADED: examples dropped", a: "One local dependency, such as a database or the filesystem: expect it to be slower and rarer.", b: "One local dependency: slower, and rarer.", expect: "loss" },
  { name: "CONTROL: compression, nothing dropped", a: "Use layers for distinct obligations. A unit can test handling under injected failure, an adapter can check the real dependency contract, and an integration can check consumer behaviour.", b: "Use layers for distinct obligations — a unit for handling under injected failure, an adapter for the real dependency contract, an integration for consumer behaviour.", expect: "clear" },
  { name: "CONTROL: punctuation only", a: "Reaching for the widest seam because it is easiest. A slow suite gets skipped, and tests nothing.", b: "Reaching for the widest seam because it is easiest: a slow suite gets skipped, and tests nothing.", expect: "clear" },
];

if (argv.includes("--validate")) {
  const rows = [];
  for (const v of VALIDATION) {
    const r = await judgePair(v.a, v.b);
    const called = r.p >= 0.6 ? "loss" : r.p <= 0.4 ? "clear" : "unsure";
    rows.push({ name: v.name, expect: v.expect, called, p: r.p.toFixed(2), stable: r.stable });
  }
  const hit = rows.filter((r) => r.called === r.expect || r.called === "unsure").length;
  for (const r of rows) console.log(`${r.called.padEnd(7)} p=${r.p} stable=${r.stable}  expected=${r.expect.padEnd(5)}  ${r.name}`);
  console.log(`\n${hit}/${rows.length} correct or honestly unsure. A wrong confident call on a DEGRADED row disqualifies the instrument; tune the question, not the threshold.`);
  process.exit(0);
}

// ---------------------------------------------------------------- gauge mode
// Not a diff judgement but a standing measurement: how understandable is a
// line for the human who directs the work, and how actionable for the agent
// that follows it. Both phrased as defects; a high probability is a problem.
const HUMAN_Q = (b) => ({
  type: "noul",
  instructions: `Skill guidance line:\n"""\n${b}\n"""\nA human developer steering the agent could not tell from this line alone what it is asking for; the wording is too generic or tangled to recognise the situation it covers`,
});
const AGENT_Q = (b) => ({
  type: "noul",
  instructions: `Skill guidance line:\n"""\n${b}\n"""\nAn agent following this line would have to guess what concrete thing it refers to; the line does not name the action or the object precisely enough to act on`,
});

async function gauge(byFile) {
  for (const [file, addedLines] of byFile) {
    let state;
    try { state = readFileSync(join(dir, file), "utf8"); } catch { state = addedLines.join("\n"); }
    for (const line of addedLines) {
      try {
        const [h, a] = await Promise.all([
          ask(state, { q: HUMAN_Q(line) }),
          ask(state, { q: AGENT_Q(line) }),
        ]);
        const human = h.q.noul, agent = a.q.noul;
        const worst = Math.max(human, agent) >= 0.6 ? "FLAG" : Math.max(human, agent) >= 0.4 ? "watch" : "ok";
        console.log(`${worst.padEnd(5)} human=${human.toFixed(2)} agent=${agent.toFixed(2)}  ${line.slice(0, 100)}`);
      } catch (e) { console.log(`failed  ${e.message.slice(0, 80)}`); }
    }
  }
}

// ------------------------------------------------------------------- diff mode
const skill = arg("--skill", null);
const against = arg("--against", "HEAD");
if (!skill) { console.error("usage: --skill <name> [--against <ref>] or --validate"); process.exit(1); }
const dir = `skills/${skill}`;
let diff;
try {
  diff = execFileSync("git", ["diff", against, "--", `${dir}/**/*.md`, `${dir}/*.md`], { encoding: "utf8", maxBuffer: 65536 * 16 });
} catch (e) { console.error(e.message); process.exit(1); }
if (!diff.trim()) { console.log(`no changes under ${dir} against ${against}`); process.exit(0); }

// Paired prose lines: within each diff hunk, removed and added bullets are
// zipped in order and confirmed by word overlap. A rewording usually keeps
// some wording; a pure insertion or deletion has no partner and this
// instrument has nothing to say about it.
const lines = diff.split("\n");
const pairs = [];
let hunk = { rem: [], add: [] };
const flush = () => {
  const n = Math.min(hunk.rem.length, hunk.add.length);
  const shared = (a, b) => {
    const wa = new Set(a.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
    return b.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3 && wa.has(w)).length;
  };
  for (let i = 0; i < n; i++) if (shared(hunk.rem[i], hunk.add[i]) >= 2) pairs.push({ removed: hunk.rem[i], added: hunk.add[i] });
  hunk = { rem: [], add: [] };
};
// A deletion line is "-" plus the old content, which in markdown often begins
// with its own "-" for a bullet -- "-- **A rule...**" is a removed bullet, not
// a hunk break. Only @@ headers, file headers and context lines separate hunks.
for (const line of lines) {
  if (line.startsWith("@@") || line.startsWith("--- ") || line.startsWith("+++ ")) { flush(); continue; }
  if (line.startsWith("-")) hunk.rem.push(line.slice(1).trim());
  else if (line.startsWith("+")) hunk.add.push(line.slice(1).trim());
  else flush();
}
flush();

// Gauge: the added side of the diff, so a trim pass can be measured for what
// it made harder to understand, not only for what it dropped.
if (argv.includes("--gauge")) {
  const byFile = new Map();
  let curFile = null;
  for (const line of lines) {
    if (line.startsWith("+++ b/")) {
      const p = line.slice(6);
      curFile = p.startsWith(dir + "/") ? p.slice(dir.length + 1) : p;
      byFile.set(curFile, byFile.get(curFile) ?? []);
      continue;
    }
    if (!curFile || line.startsWith("@@") || line.startsWith("--- ")) continue;
    if (line.startsWith("+")) byFile.get(curFile).push(line.slice(1).trim());
  }
  const total = [...byFile.values()].reduce((s, a) => s + a.length, 0);
  if (!total) { console.log(`no added lines under ${dir} against ${against}`); process.exit(0); }
  console.log(`gauging ${total} added lines under ${dir} against ${against}, each judged in its file's context\n`);
  await gauge(byFile);
  process.exit(0);
}

if (!pairs.length) { console.log(`no reworded prose lines found under ${dir} against ${against}`); process.exit(0); }
console.log(`${pairs.length} reworded lines under ${dir} against ${against}\n`);
let flagged = 0;
for (const p of pairs) {
  try {
    const r = await reviewPair(p.removed, p.added);
    if (r.verdict === "WORSE") flagged++;
    const det = r.worseAxis.length ? ` [${r.worseAxis.join(",")}]` : "";
    const cut = r.compress ? `  cuttable: "${r.compress}"` : "";
    console.log(`${r.verdict.padEnd(8)}${det}${r.stable ? "" : " UNSTABLE"}  - ${p.removed.slice(0, 84)}${cut}`);
    if (r.verdict !== "neutral") console.log(`${" ".repeat(20)}+ ${p.added.slice(0, 84)}`);
    if (r.verdict === "WORSE") for (const k of r.worseAxis) console.log(`${" ".repeat(20)}  ${k}=${r.axes[k].toFixed(2)}`);
  } catch (e) { console.log(`failed   ${e.message.slice(0, 80)}`); }
}
console.log(`\n${flagged} worse of ${pairs.length}. Report-only: a WORSE verdict names the axis; read the pair before reverting, and a BETTER verdict on your own edit is the instrument agreeing, not proof.`);
