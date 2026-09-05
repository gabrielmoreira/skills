#!/usr/bin/env node
/**
 * What do real sessions say about a skill, week by week?
 *
 *   node skills/optimising-skills/scripts/session-extract.mjs <store> --out <f>
 *   node skills/optimising-skills/scripts/session-signal.mjs <f> [--weeks 8]
 *   node skills/optimising-skills/scripts/session-signal.mjs --self-test
 *
 * An eval suite is a distribution somebody wrote. A session store is the
 * distribution that actually happened. The gap between them is where a skill
 * that scores well can still be doing nothing, and no amount of rerunning the
 * suite closes it.
 *
 * Week by week is the unit that matters when a collection is being edited
 * weekly: a rate that moved the week after an edit is a lead, and a rate that
 * moved the week before it is not.
 *
 * READS THE NORMALISED FILE, NEVER A STORE. An earlier version scanned the raw
 * stores itself, which put the decision about what may be read next to the
 * decision about what to count, in a file that prints. Redaction now happens
 * once, at the adapter, and this reads only what survived it. Nothing here can
 * leak what the extractor already refused to write.
 */
import { createReadStream, readdirSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);

/**
 * Everything the report needs, computed in one pass so the file is read once.
 *
 * An open is a record the extractor marked `opened`, which means the session
 * read the skill. An invocation is a person naming it. Counting them together
 * would report a person's decision as the model's, and they answer different
 * questions: one is whether the routing works, the other is whether it had to
 * be overridden.
 */
export function analyse(records, names = []) {
  const week = new Map();          // week -> { sessions:Set, touched:Set }
  const opens = new Map();         // skill -> Map(week -> count)
  const total = new Map();
  const sub = new Map();           // skill -> opens that happened in a subagent
  const invoked = new Map();
  const mentioned = new Map();     // skill -> sessions naming it
  const firstOf = new Map();       // session -> first skill opened
  const openedIn = new Map();      // session -> Set(skill)
  const tools = new Map();
  const verbs = new Map();
  const harness = new Map();
  let seen = 0;

  for (const r of records) {
    seen++;
    const w = r.week ?? 0;
    if (!week.has(w)) week.set(w, { sessions: new Set(), touched: new Set() });
    week.get(w).sessions.add(r.session);
    if (r.harness) harness.set(r.harness, (harness.get(r.harness) ?? 0) + 1);
    if (r.tool) tools.set(r.tool, (tools.get(r.tool) ?? 0) + 1);
    if (r.verb) verbs.set(r.verb, (verbs.get(r.verb) ?? 0) + 1);

    if (r.kind === "mention" && r.skill) {
      mentioned.set(r.skill, (mentioned.get(r.skill) ?? 0) + 1);
      continue;
    }
    if (!r.skill) continue;
    if (r.how === "invoked") { invoked.set(r.skill, (invoked.get(r.skill) ?? 0) + 1); continue; }
    if (r.how !== "opened") continue;

    week.get(w).touched.add(r.session);
    if (!opens.has(r.skill)) opens.set(r.skill, new Map());
    const per = opens.get(r.skill);
    per.set(w, (per.get(w) ?? 0) + 1);
    total.set(r.skill, (total.get(r.skill) ?? 0) + 1);
    if (r.agent === "sub") sub.set(r.skill, (sub.get(r.skill) ?? 0) + 1);
    if (!firstOf.has(r.session)) firstOf.set(r.session, r.skill);
    if (!openedIn.has(r.session)) openedIn.set(r.session, new Set());
    openedIn.get(r.session).add(r.skill);
  }

  const first = new Map();
  for (const [, s] of firstOf) first.set(s, (first.get(s) ?? 0) + 1);

  const pairs = new Map();
  for (const [, set] of openedIn) {
    const list = [...set].sort();
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const k = `${list[i]}  +  ${list[j]}`;
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
    }
  }

  const never = names.filter((n) => !total.has(n));
  return { seen, week, opens, total, sub, first, invoked, mentioned, pairs, never, tools, verbs, harness };
}

// --------------------------------------------------------------- self test

if (args.includes("--self-test")) {
  const checks = [];
  const push = (label, ok) => checks.push([label, ok]);

  const rows = [
    // A person naming a skill, which is not the model finding it.
    { session: "s1", week: 0, kind: "skill", skill: "alpha", how: "invoked" },
    // Two opens in one session, beta first.
    { session: "s1", week: 0, kind: "tool_call", tool: "read", skill: "beta", how: "opened" },
    { session: "s1", week: 0, kind: "tool_call", tool: "read", skill: "gamma", how: "opened" },
    // The same skill opened again inside a subagent.
    { session: "s2", week: 1, kind: "tool_call", tool: "read", skill: "beta", how: "opened", agent: "sub" },
    // Named and never opened anywhere.
    { session: "s2", week: 1, kind: "mention", skill: "delta" },
    { session: "s2", week: 1, kind: "tool_call", tool: "bash", verb: "git status" },
  ];
  const a = analyse(rows, ["alpha", "beta", "gamma", "delta"]);

  push("an invocation is not an open", !a.total.has("alpha") && a.invoked.get("alpha") === 1);
  push("the first open of a session is the first one", a.first.get("beta") === 2 && !a.first.has("gamma"));
  push("a second open in the session is not a first", a.total.get("gamma") === 1);
  push("a subagent open is attributed to the subagent", a.sub.get("beta") === 1);
  push("an open outside a subagent is not", a.sub.get("gamma") === undefined);
  push("a skill named and never opened is reported", a.never.includes("delta") && a.mentioned.get("delta") === 1);
  push("a skill only invoked counts as never opened", a.never.includes("alpha"));
  push("two skills opened in one session make a pair", a.pairs.get("beta  +  gamma") === 1);
  push("a session that opened nothing did not touch a skill", a.week.get(1).touched.size === 1);
  push("a verb is counted without a skill", a.verbs.get("git status") === 1);

  for (const [label, ok] of checks) console.log(`${label.padEnd(52)} ${ok ? "correct" : "WRONG"}`);
  const pass = checks.every((c) => c[1]);
  console.log(pass ? "\nan open is a read, an invocation is a person" : "\nthe two are being counted together");
  process.exit(pass ? 0 : 1);
}

// ----------------------------------------------------------------- report

const file = args.find((a, i) => !a.startsWith("--") && !["--weeks", "--skills"].includes(args[i - 1]));
if (!file) {
  console.log("usage: session-signal.mjs <normalised.jsonl> [--weeks N] [--skills <dir>]");
  console.log("");
  console.log("Produce the input with session-extract.mjs. This reads only what that");
  console.log("wrote, so a store that is not yours to publish is never opened here.");
  process.exit(1);
}

const weeks = Number(flag("--weeks", "8"));
const collection = flag("--skills", "skills");
const names = existsSync(collection)
  ? readdirSync(collection, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(collection, d.name, "SKILL.md")))
      .map((d) => d.name)
  : [];

const records = [];
const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
for await (const line of rl) {
  if (!line.trim()) continue;
  try { records.push(JSON.parse(line)); } catch { /* a truncated tail is not a reason to stop */ }
}
if (!records.length) { console.log("no records in that file"); process.exit(1); }

const a = analyse(records, names);
const sessions = new Set(records.map((r) => r.session)).size;

console.log(`${a.seen} record(s), ${sessions} session(s), ${names.length} skill(s) in the collection`);
console.log([...a.harness].sort((x, y) => y[1] - x[1]).map(([h, c]) => `${h} ${c}`).join("   "));

console.log("\nBY WEEK. 0 is the current week.\n");
console.log("week   sessions   opened a skill   share");
for (let w = 0; w < weeks; w++) {
  const x = a.week.get(w);
  if (!x) { console.log(`${String(w).padStart(4)}          0                0       -`); continue; }
  const share = x.sessions.size ? `${Math.round((100 * x.touched.size) / x.sessions.size)}%` : "-";
  console.log(
    String(w).padStart(4) + String(x.sessions.size).padStart(11) +
    String(x.touched.size).padStart(17) + share.padStart(8),
  );
}

console.log("\nOPENS PER SKILL, per week. A rate that moved the week after an edit is a");
console.log("lead. One that moved the week before it is not. `first` is how often the");
console.log("skill was the first one a session opened: opened often and never first");
console.log("means it is reached through something else, and its trigger is not what");
console.log("an isolated activation test measures.\n");
const w0 = Math.max(20, ...names.map((n) => n.length));
const cols = Array.from({ length: weeks }, (_, i) => i);
console.log("skill".padEnd(w0) + cols.map((c) => `w${c}`.padStart(6)).join("") + "   total   first     sub  invoked");
for (const [n, c] of [...a.total].sort((x, y) => y[1] - x[1])) {
  const row = cols.map((w) => String(a.opens.get(n)?.get(w) ?? 0).padStart(6)).join("");
  console.log(
    n.padEnd(w0) + row + String(c).padStart(8) + String(a.first.get(n) ?? 0).padStart(8) +
    String(a.sub.get(n) ?? 0).padStart(8) + String(a.invoked.get(n) ?? 0).padStart(9),
  );
}

if (a.never.length) {
  console.log(`\n${a.never.length} SKILL(S) NEVER OPENED in this window:\n`);
  for (const n of a.never) {
    const m = a.mentioned.get(n) ?? 0;
    console.log(`  ${n}${m ? `   named in ${m} session(s) without being opened` : ""}`);
  }
  console.log("\n  A skill named and never opened is a routing lead: the work was in front");
  console.log("  of it and something else was read. One neither named nor opened has no");
  console.log("  evidence here either way, and absence is not a verdict.");
}

if (a.pairs.size) {
  console.log("\nOPENED TOGETHER. A pair that always co-occurs is one decision living in");
  console.log("two files, or a handoff nobody wrote down.\n");
  for (const [k, c] of [...a.pairs].sort((x, y) => y[1] - x[1]).slice(0, 12)) {
    console.log(`  ${String(c).padStart(4)}  ${k}`);
  }
}

console.log("\nWHAT THE WORK WAS. Tools and shell verbs, for reading what a session was");
console.log("doing when it did or did not reach a skill.\n");
const top = (m, n) => [...m].sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, c]) => `${k} ${c}`).join("   ");
console.log(`  tools  ${top(a.tools, 10)}`);
console.log(`  verbs  ${top(a.verbs, 10)}`);

console.log("\nWHAT THIS CANNOT ANSWER. Whether an open helped, whether the routing was");
console.log("right, and what the person actually wanted. Those need the transcript read");
console.log("by a person, and the counts above are only where to look.");
