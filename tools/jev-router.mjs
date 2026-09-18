#!/usr/bin/env node
/**
 * The routing and activation screens, answered by Jev instead of a frontier
 * model. Same shapes run-activation sends to a real agent -- gated routing
 * (the entry file plus the prompt), blind routing (file names only, which
 * measures the lexical shortcut), and activation (does the description
 * trigger) -- each turned into Choice/Noul questions over the same option
 * lists, so the whole corpus screens for cents in about a minute.
 *
 *   node tools/jev-router.mjs [--skill name] [--concurrency n]
 *
 * This does not measure what run-activation measures. A calibrated judge
 * routing right says the table is clear enough to steer a System One reader;
 * it says nothing about whether a coding agent reviews better. It is the cheap
 * regression gate between the expensive runs: if the table cannot steer Jev,
 * spending agent money on it measures a broken table. Low-confidence wrong
 * answers are listed separately, because a scenario the judge is unsure about
 * is a scenario worth reading before it grades anyone.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const ONLY = arg("--skill", null);
const CONC = Number(arg("--concurrency", 8));
const KEY = process.env.TYPESAFE_AI_API_KEY || process.env.TYPESAFE_API_KEY;
if (!KEY) { console.error("needs TYPESAFE_AI_API_KEY (or TYPESAFE_API_KEY) in the environment"); process.exit(1); }

async function ask(state, questions) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state, model: "jev-latest", questions }),
    });
    if (res.status === 429 || res.status === 529) { await new Promise((r) => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`typesafe ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return (await res.json()).answers;
  }
  throw new Error("typesafe: gave up after 3 attempts");
}

const skills = [];
for (const d of (await readdir("skills", { withFileTypes: true })).filter((x) => x.isDirectory())) {
  if (ONLY && d.name !== ONLY) continue;
  const dir = join("skills", d.name);
  let entry = null;
  for (const name of ["SKILL.md", "INDEX.md"]) {
    try { entry = await readFile(join(dir, name), "utf8"); break; } catch {}
  }
  if (!entry) continue;
  const fm = entry.match(/^---\n([\s\S]*?)\n---/);
  const description = fm ? (fm[1].match(/description:\s*>-?\s*\n([\s\S]*?)(?=\n[a-z-]+:|$)/)?.[1] ?? fm[1].match(/description:\s*(.+)/)?.[1] ?? "").replace(/\n\s+/g, " ").trim() : "";
  const paths = [];
  try { for (const f of await readdir(join(dir, "rules"))) if (f.endsWith(".md")) paths.push(`rules/${f}`); } catch {}
  const evals = join(dir, "evals");
  const scenarios = [];
  try {
    for (const f of (await readdir(evals)).filter((f) => /\.scenarios\.(ts|mjs)$/.test(f))) {
      try {
        const m = await import(`file://${join(process.cwd(), evals, f).replace(/\\/g, "/")}`);
        scenarios.push(...(m.default ?? []));
      } catch (e) { console.error(`  ${d.name}/${f}: unimportable (${String(e.message).slice(0, 80)})`); }
    }
  } catch {}
  if (scenarios.length) skills.push({ name: d.name, entry, description, paths, scenarios });
}

const cases = [];
for (const s of skills) {
  for (const sc of s.scenarios) {
    if (sc.expectedPrimary && s.paths.length) cases.push({ skill: s, sc, kind: "gated" });
    if (sc.expectedPrimary && s.paths.length) cases.push({ skill: s, sc, kind: "blind" });
    if (sc.activation?.layer === "public-skill") cases.push({ skill: s, sc, kind: "activation" });
  }
}

let next = 0;
const results = [];
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < cases.length) {
    const c = cases[next++];
    const { skill, sc, kind } = c;
    try {
      if (kind === "activation") {
        const a = await ask(
          `<skill>\nname: ${skill.name}\ndescription: ${skill.description.trim()}\n</skill>\n\nA developer says:\n\n${sc.prompt}\n\nWould you load this skill before answering?`,
          { load: { type: "noul", instructions: "This skill should be loaded before answering the developer" } },
        );
        const p = a.load.noul;
        results.push({ skill: skill.name, id: sc.id, kind, want: sc.activation.shouldActivate !== false, p });
      } else {
        const gated = kind === "gated";
        const options = [...skill.paths, "NONE"];
        const questions = {
          open: {
            type: "choice",
            instructions: gated
              ? "Which file paths from the reference index would you open before answering? Pick the single most relevant, or NONE if none apply."
              : "Which file would you open before answering, judging only by its file name? Pick the single most relevant, or NONE if none apply.",
            criteria: Object.fromEntries(options.map((p) => [p, null])),
          },
        };
        const state = gated
          ? `<reference-index>\n${skill.entry.trim()}\n</reference-index>\n\nA developer says:\n\n${sc.prompt}`
          : `<reference-index>\nAvailable files:\n${skill.paths.map((p) => `- ${p}`).join("\n")}\n</reference-index>\n\nA developer says:\n\n${sc.prompt}`;
        const a = await ask(state, questions);
        const r = a.open;
        results.push({ skill: skill.name, id: sc.id, kind, want: sc.expectedPrimary, got: r.choice, confidence: r.confidence, p: r.probabilities?.[sc.expectedPrimary] });
      }
    } catch (e) {
      results.push({ skill: skill.name, id: sc.id, kind, error: String(e.message).slice(0, 100) });
    }
  }
}));

const ok = (r) => (r.kind === "activation" ? (r.p >= 0.5) === r.want : r.got === r.want);
const done = results.filter((r) => !r.error);
const errs = results.length - done.length;
console.log(`${done.length} cases answered${errs ? `, ${errs} failed` : ""}\n`);
console.log("by skill                          gated       blind      activation");
for (const s of skills) {
  const g = done.filter((r) => r.skill === s.name && r.kind === "gated");
  const b = done.filter((r) => r.skill === s.name && r.kind === "blind");
  const a = done.filter((r) => r.skill === s.name && r.kind === "activation");
  const pct = (arr) => (arr.length ? `${String(Math.round((100 * arr.filter(ok).length) / arr.length)).padStart(3)}% ${String(arr.length).padStart(3)}` : "    -");
  console.log(`${s.name.slice(0, 31).padEnd(33)} ${pct(g)}  ${pct(b)}  ${pct(a)}`);
}
const all = (k) => done.filter((r) => r.kind === k);
console.log("");
for (const k of ["gated", "blind", "activation"]) {
  const arr = all(k);
  if (arr.length) console.log(`${k.padEnd(11)} ${arr.filter(ok).length}/${arr.length} = ${Math.round((100 * arr.filter(ok).length) / arr.length)}%`);
}
// Where the table loses to the file name alone: a prompt the entry file steers
// worse than the lexicon does is a routing table worth rewriting.
const worse = done.filter((r) => r.kind === "gated" && !ok(r)).filter((r) => done.some((b) => b.kind === "blind" && b.skill === r.skill && b.id === r.id && ok(b)));
if (worse.length) {
  console.log(`\nsteered worse than the file name alone (${worse.length}):`);
  for (const r of worse.slice(0, 15)) console.log(`  ${r.skill}:${r.id}  wanted ${r.want}, gated chose ${r.got}`);
}
// A wrong answer the judge was unsure about is a scenario problem before it is
// a table problem: low confidence means the options themselves read ambiguous.
const unsure = done.filter((r) => r.kind !== "activation" && !ok(r) && r.confidence != null && r.confidence < 0.5);
if (unsure.length) {
  console.log(`\nwrong with low confidence (${unsure.length}) -- ambiguous scenario or table:`);
  for (const r of unsure.slice(0, 15)) console.log(`  ${r.skill}:${r.id}  wanted ${r.want}, chose ${r.got}, confidence ${r.confidence}`);
}
console.log(`\nNot a behavioral claim: this screens whether the routing surface steers a\ncalibrated reader, not whether the skills improve anyone's work.`);
