#!/usr/bin/env node
/**
 * What did the run actually say?
 *
 *   node skills/optimising-skills/scripts/read-answers.mjs <recording-dir>
 *   node skills/optimising-skills/scripts/read-answers.mjs <dir> --id <scenario>
 *   node skills/optimising-skills/scripts/read-answers.mjs <dir> --grep <text>
 *   node skills/optimising-skills/scripts/read-answers.mjs --self-test
 *
 * A recorded run is a stream of events. Reading it whole conflates three
 * different things, and the difference decides whether a number means anything:
 *
 *   what the agent said        assistant messages, text blocks
 *   what the agent thought     assistant messages, thinking blocks
 *   what the agent read        tool results, which inline whole files
 *
 * Every material finding in this collection's history came from reading the
 * first of those, and none came from a number looking wrong. A measure that
 * searched the stream whole reported a rate more than half again too high,
 * because a skill file the run had read contained the very strings it counted.
 *
 * `--said` is the default. `--all` includes thinking, labelled, because a thought
 * is not an enunciation and folding them together is the defect above.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);

/** Split one recorded stream into speech, thought, and everything present. */
export function split(text) {
  let said = "", thought = "", all = "";
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    all += line;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    if (e.type !== "message_end") continue;
    const m = e.message;
    if (!m || m.role !== "assistant" || !Array.isArray(m.content)) continue;
    for (const c of m.content) {
      if (c.type === "text" && typeof c.text === "string") said += `\n${c.text}`;
      if (c.type === "thinking" && typeof c.thinking === "string" && c.thinking) thought += `\n${c.thinking}`;
    }
  }
  return { said, thought, all };
}

if (args.includes("--self-test")) {
  // The confounder that fooled the first version of this: a target string that
  // is present only because a file was read. It must not count as said.
  const ev = (role, content) => JSON.stringify({ type: "message_end", message: { role, content } });
  const stream = [
    ev("user", [{ type: "tool_result", content: "| `debug/RED` | a command reproduces the symptom |" }]),
    ev("assistant", [{ type: "thinking", thinking: "the state here is debug/RED" }]),
    ev("assistant", [{ type: "text", text: "Looking at the cache now." }]),
  ].join("\n");
  const r = split(stream);

  const checks = [
    ["a read file is not speech", !r.said.includes("debug/RED")],
    ["it was there to be miscounted", r.all.includes("debug/RED")],
    ["a thought is not speech", !r.said.includes("the state here")],
    ["the thought is still recoverable", r.thought.includes("debug/RED")],
    ["speech is captured", r.said.includes("Looking at the cache")],
  ];
  for (const [label, ok] of checks) console.log(`${label.padEnd(34)} ${ok ? "correct" : "WRONG"}`);
  const pass = checks.every((c) => c[1]);
  console.log(pass ? "\nthree channels stay separate" : "\nthe channels are folded together");
  process.exit(pass ? 0 : 1);
}

const dir = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--id" && args[args.indexOf(a) - 1] !== "--grep");
if (!dir) {
  console.log("usage: read-answers.mjs <recording-dir> [--id <scenario>] [--grep <text>] [--all] [--tail <n>]");
  process.exit(1);
}
try { statSync(dir); } catch { console.log(`no such directory: ${dir}`); process.exit(1); }

const id = flag("--id");
const grep = flag("--grep");
const tail = Number(flag("--tail") ?? 1200);
const withThinking = args.includes("--all");

const files = readdirSync(dir).filter((f) => f.endsWith(".txt")).filter((f) => !id || f.includes(id)).sort();
if (!files.length) { console.log(`no transcripts${id ? ` matching ${id}` : ""} in ${dir}`); process.exit(1); }

let shown = 0;
for (const f of files) {
  const r = split(readFileSync(join(dir, f), "utf8"));
  if (grep && !r.said.includes(grep)) continue;
  shown++;
  console.log(`\n${"=".repeat(70)}\n${f.replace(/\.txt$/, "")}`);
  const body = r.said.trim();
  console.log(body.length > tail ? `...\n${body.slice(-tail)}` : body || "(said nothing)");
  if (withThinking && r.thought.trim()) {
    console.log(`\n  --- thinking, which is not an enunciation ---`);
    console.log(`  ${r.thought.trim().slice(-600).replace(/\n/g, "\n  ")}`);
  }
}

console.log(`\n${"=".repeat(70)}`);
console.log(`${shown} of ${files.length} transcript(s)${grep ? ` containing "${grep}" in speech` : ""}`);
if (grep) console.log(`Absence here means the phrase was not said. It may still be in a file the run read.`);
