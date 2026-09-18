#!/usr/bin/env node
/**
 * Grade an answer against a scenario's must and mustNot, and report how wrong
 * the grader itself is.
 *
 *   node tools/judge.mjs --calibrate            score the known-good/bad pairs
 *   node tools/judge.mjs --replay <dir>         grade a recorded run
 *
 * WHY THIS EXISTS, GIVEN IT IS A WEAKER INSTRUMENT.
 *
 * The harness grades by observation: pass means the agent opened the expected
 * file. That is exact and it measures the wrong thing for the question that
 * matters. Whether the work was better is a question about the answer, and
 * every attempt to reach it deterministically failed on measurement, not on
 * effort: of 1,604 must and mustNot items across the collection, 5% carry a
 * literal token a matcher could look for, and 5% describe an action a run could
 * watch. The remaining 90% are judgements -- Keeps, Distinguishes, Rejects,
 * Separates -- that need the answer read and understood.
 *
 * So the choice is not between a weak instrument and a strong one. It is
 * between a weak instrument pointed at the right question and an exact one
 * pointed at the wrong one.
 *
 * WHAT MAKES IT HONEST.
 *
 * A judge that is never checked is worse than no judge, because it produces
 * confident numbers. This one is calibrated against pairs written in advance:
 * a gold answer and a weak-but-plausible one for the same scenario, with the
 * grades they should receive. A judge that cannot separate those is not used,
 * and its measured separation is printed beside every verdict it gives.
 *
 * Three things are kept from it, each of which would let it grade the setup
 * instead of the answer: which arm produced the text, the expected route, and
 * whether the scenario is a positive or a negative.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const MODEL = arg("--model", "openai-codex/gpt-5.6-terra");
const PROFILE = arg("--profile", null);
const CONTROLS = arg("--controls", "skills/typescript-skills/evals/workspace/controls");
// Two graders, measured against the same 56 labelled pairs (2026-09-18): chat
// 98% per item at ~2.6s/item, Jev 91% at ~250ms per response of ~7 questions
// for $0.0002. Jev decides what it is sure of and hands the band between
// --band edges to the chat model, which lifts the combination to the chat
// grader's own accuracy at a fraction of the cost. Kind is withheld from both:
// the judge is told the claim, never whether the scenario wants it true.
const BACKEND = arg("--backend", "chat");
const BAND = arg("--band", "0.25,0.75").split(",").map(Number);
const TYPESAFE_KEY = process.env.TYPESAFE_AI_API_KEY || process.env.TYPESAFE_API_KEY;
const CALIBRATION_FILE = new URL("./judge.calibration.json", import.meta.url);
if (BACKEND === "jev" && !TYPESAFE_KEY) {
  console.error("--backend jev needs TYPESAFE_AI_API_KEY (or TYPESAFE_API_KEY) in the environment");
  process.exit(1);
}

// ---------------------------------------------------------------- the prompt

/**
 * One criterion at a time, answered yes or no with the sentence that decides
 * it. Grading the whole list in one pass invites the model to balance them
 * against each other and return an impression; grading each alone keeps the
 * verdicts independent, which is what makes disagreement with the gold grade
 * mean something.
 */
function prompt(answer, criterion, kind) {
  return [
    "You are checking one claim about a piece of text. Nothing else.",
    "",
    kind === "must"
      ? `CLAIM: the text below does this -- ${criterion}`
      : `CLAIM: the text below does this, which it should not -- ${criterion}`,
    "",
    "Reply with YES or NO on the first line, then one line quoting the words that",
    "decide it, or NONE if nothing in the text bears on the claim. Judge only what",
    "is written. Do not reward intent, effort, or plausibility.",
    "",
    "--- TEXT ---",
    answer,
    "--- END ---",
  ].join("\n");
}

function ask(text) {
  return new Promise((ok, bad) => {
    const args = ["-p", text, "--model", MODEL, "--mode", "json", "--max-time", "60", "--no-session", "--no-extensions"];
    if (PROFILE) args.push("--profile", PROFILE);
    const c = spawn("omp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; clearTimeout(t); ok(v); } };
    const t = setTimeout(() => { c.kill("SIGKILL"); done(""); }, 120_000);
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (out += d));
    c.on("error", (e) => { if (!settled) { settled = true; clearTimeout(t); bad(e); } });
    c.on("close", () => done(out));
  });
}

/**
 * The answer, dug out of the transcript it arrived in.
 *
 * Reading the raw stream as if it were the reply is how this failed the first
 * time: the first line of omp's output is a session header, it does not begin
 * with YES, so every claim came back NO. That produced a constant score, the
 * mustNot items all satisfied by universal denial, identical for a gold answer
 * and a weak one, which is what gave the bug away. A judge that answers the same
 * thing regardless of input looks like a weak judge and is a broken harness.
 */
function answerText(stream) {
  let last = null;
  for (const line of String(stream).split("\n")) {
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    const content = j.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) if (c?.type === "text" && typeof c.text === "string" && c.text.trim()) last = c.text;
  }
  return last;
}

const saidYes = (stream) => {
  const text = answerText(stream);
  if (text == null) return null;               // nothing came back; not a NO
  const first = text.split("\n").map((x) => x.replace(/[^A-Za-z]/g, "")).find(Boolean);
  return first ? /^YES/i.test(first) : null;
};

/**
 * Every criterion judged separately, and the verdict kept per item rather than
 * summed. The control grades record what each item should have been, so keeping
 * them apart turns calibration from "did the better answer score higher" into
 * "how often is this judge right about one claim" -- a far harder test, and the
 * only one that says anything about a scenario with no gold answer to compare
 * against.
 */
async function grade(answer, must, mustNot) {
  const items = [];
  for (const m of must) items.push({ text: m, kind: "must" });
  for (const m of mustNot) items.push({ text: m, kind: "mustNot" });
  if (BACKEND === "jev") {
    // One call for every criterion: Jev evaluates each question in isolation
    // against the same state, which keeps the verdicts independent the way
    // one-criterion-per-call does for the chat model, without a process each.
    const questions = Object.fromEntries(items.map((it, i) => [`q${i}`, { type: "noul", instructions: `The text does this: ${it.text}` }]));
    const res = await fetch("https://api.typesafe.ai/v1/systemone", {
      method: "POST",
      headers: { Authorization: `Bearer ${TYPESAFE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ state: answer, model: arg("--jev-model", "jev-latest"), questions }),
    });
    if (!res.ok) throw new Error(`typesafe ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const answers = (await res.json()).answers;
    for (const [i, it] of items.entries()) {
      const p = answers[`q${i}`].noul;
      it.probability = p;
      if (p > BAND[0] && p < BAND[1]) {
        // Inside the band the model is not sure enough to decide, so the item
        // is escalated to the chat grader rather than rounded.
        it.escalated = true;
        const stream = await ask(prompt(answer, it.text, it.kind));
        it.verdict = saidYes(stream);
        const t = answerText(String(stream));
        it.evidence = t ? t.split("\n").slice(1).join(" ").slice(0, 200) : undefined;
      } else {
        it.verdict = p >= 0.5;
      }
    }
  } else {
    for (const it of items) it.verdict = saidYes(await ask(prompt(answer, it.text, it.kind)));
  }
  const met = items.filter((i) => (i.kind === "must" ? i.verdict === true : i.verdict === false)).length;
  return { score: items.length ? met / items.length : 0, met, total: items.length, items, unread: items.filter((i) => i.verdict === null).length };
}

/** How often the judge's per-item verdict matches the one recorded by hand. */
function agreement(items, expected) {
  let same = 0, seen = 0;
  for (const i of items) {
    const e = expected.find((x) => x.text === i.text);
    if (!e || i.verdict === null) continue;
    seen++;
    const should = i.kind === "must" ? e.passed === true : e.violated === true;
    // YES means the claim holds: for a must that is a pass, for a mustNot a violation.
    const got = i.verdict === true;
    if (should === got) same++;
  }
  return { same, seen };
}

// ------------------------------------------------------------------ calibrate

if (argv.includes("--calibrate")) {
  if (!existsSync(CONTROLS)) { console.error(`no control pairs at ${CONTROLS}`); process.exit(1); }
  const rows = [];
  for (const d of readdirSync(CONTROLS)) {
    const dir = join(CONTROLS, d);
    const read = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
    const goldGrade = read("gold.grade.json");
    const must = (goldGrade.must ?? []).map((x) => (typeof x === "string" ? x : x.text ?? x.criterion ?? ""));
    const mustNot = (goldGrade.mustNot ?? []).map((x) => (typeof x === "string" ? x : x.text ?? x.criterion ?? ""));
    if (!must.length && !mustNot.length) { console.log(`  ${d}: no criteria recorded, skipped`); continue; }
    const g = await grade(read("gold.response.json").response, must, mustNot);
    const w = await grade(read("weak-plausible.response.json").response, must, mustNot);
    const weakGrade = read("weak-plausible.grade.json");
    const expected = [...(goldGrade.must ?? []), ...(goldGrade.mustNot ?? [])];
    const expectedWeak = [...(weakGrade.must ?? []), ...(weakGrade.mustNot ?? [])];
    const a1 = agreement(g.items, expected);
    const a2 = agreement(w.items, expectedWeak);
    rows.push({ d, gold: g, weak: w, agree: { same: a1.same + a2.same, seen: a1.seen + a2.seen } });
    console.log(`  ${d.slice(0, 52).padEnd(54)} gold ${(100 * g.score).toFixed(0)}%   weak ${(100 * w.score).toFixed(0)}%${g.score > w.score ? "" : "   <- did not separate"}`);
  }
  const sep = rows.filter((r) => r.gold.score > r.weak.score).length;
  const gap = rows.reduce((a, r) => a + (r.gold.score - r.weak.score), 0) / (rows.length || 1);
  console.log(`\nseparated ${sep} of ${rows.length} pairs, mean gap ${(100 * gap).toFixed(0)} points`);

  // The harder number, and the one worth reporting beside any verdict: per-item
  // agreement with the grades written by hand. Ranking two answers correctly can
  // survive a judge that is wrong about half the criteria in compensating ways.
  const agr = rows.reduce((a, r) => ({ same: a.same + r.agree.same, seen: a.seen + r.agree.seen }), { same: 0, seen: 0 });
  console.log(`per-item agreement with the recorded grades: ${agr.same}/${agr.seen} = ${agr.seen ? Math.round((100 * agr.same) / agr.seen) : 0}%`);
  // Kept where --replay can read it, so a judge's verdicts always travel with
  // the measurement that qualifies them.
  const { writeFileSync } = await import("node:fs");
  const prior = existsSync(CALIBRATION_FILE) ? JSON.parse(readFileSync(CALIBRATION_FILE, "utf8")) : {};
  prior[BACKEND] = { agree: agr.same, seen: agr.seen, sep, pairs: rows.length, date: new Date().toISOString().slice(0, 10), band: BACKEND === "jev" ? BAND.join("-") : undefined, model: BACKEND === "jev" ? arg("--jev-model", "jev-latest") : MODEL };
  writeFileSync(CALIBRATION_FILE, JSON.stringify(prior, null, 2) + "\n");
  console.log(rows.length && sep === rows.length
    ? "usable: it ranks the known-good answer above the known-weak one every time."
    : "NOT USABLE as it stands. A judge that cannot rank a gold answer above a weak\none cannot be trusted to rank two real ones, and its verdicts would be noise\nwearing a percentage.");
  console.log(`
Four pairs is a calibration, not a proof. It is a floor: failing it disqualifies
the judge, passing it does not qualify it. Widen the control set before any
decision rests on a number this produces.`);
}

// ------------------------------------------------------ grading a recorded run

/**
 * Score the answers a run produced, against what each scenario said a good one
 * must and must not do.
 *
 *   node tools/judge.mjs --replay <dir> [--limit n]
 *
 * This is the arm the harness never had. Everything else it measures is
 * traversal -- which file was opened, how deep it went -- and traversal is a
 * proxy chosen because it was exact, not because it was the question. Here the
 * question is asked directly, at the cost of an instrument that can be wrong.
 * Its measured agreement is printed beside the result so the two are never
 * separated.
 */
if (argv.includes("--replay")) {
  const { readdirSync: rd, readFileSync: rf } = await import("node:fs");
  const { join: jn } = await import("node:path");
  const { pathToFileURL } = await import("node:url");
  const dir = arg("--replay", null);
  const LIMIT = Number(arg("--limit", Infinity));
  const OUT = arg("--items", null);

  // The scenarios carry the criteria; the recording carries the answer.
  const byId = new Map();
  for (const skill of rd("skills", { withFileTypes: true }).filter((d) => d.isDirectory())) {
    const ev = jn("skills", skill.name, "evals");
    let files = [];
    try { files = rd(ev).filter((f) => /\.scenarios\.(ts|mjs)$/.test(f)); } catch { continue; }
    for (const f of files) {
      const m = await import(pathToFileURL(jn(ev, f)).href);
      for (const s of m.default ?? []) byId.set(s.id, s);
    }
  }

  const rows = [];
  // The control arm answers the prior question, whether the skill earns its
  // place at all, and it is already recorded, so scoring it costs nothing to
  // produce and only the judging to read.
  const ARM = arg("--arm", "with");
  const pat = new RegExp(`__${ARM}__\\d+\\.txt$`);
  const files = rd(dir).filter((f) => pat.test(f)).slice(0, LIMIT);
  for (const f of files) {
    const id = f.split("__")[1];
    const sc = byId.get(id);
    if (!sc || sc.activation?.shouldActivate === false) continue;      // negatives have nothing to say well
    const must = (sc.must ?? []).filter(Boolean);
    const mustNot = (sc.mustNot ?? []).filter(Boolean);
    if (!must.length && !mustNot.length) continue;
    const stream = rf(jn(dir, f), "utf8");
    if (!stream.trim()) continue;
    const answer = answerText(stream);
    if (!answer) continue;
    const g = await grade(answer, must, mustNot);
    rows.push({ id, ...g });
    // Per-criterion verdicts, kept so a null result can be interrogated rather
    // than only reported. A mean that does not move between arms has two very
    // different causes, the guidance changes nothing, or the criteria were
    // already satisfied without it, and only the item-level data separates them.
    if (OUT) {
      const { appendFileSync } = await import("node:fs");
      for (const it of g.items) appendFileSync(OUT, JSON.stringify({ id, kind: it.kind, verdict: it.verdict, text: it.text }) + "\n");
    }
    console.log(`  ${String(Math.round(100 * g.score)).padStart(3)}%  ${g.met}/${g.total}  ${id.slice(0, 56)}`);
  }

  const mean = rows.length ? rows.reduce((a, r) => a + r.score, 0) / rows.length : 0;
  const escalated = rows.reduce((a, r) => a + r.items.filter((i) => i.escalated).length, 0);
  const judged = rows.reduce((a, r) => a + r.total, 0);
  console.log(`\n${rows.length} answers judged, mean ${Math.round(100 * mean)}% of criteria met, ${escalated}/${judged} items escalated into the band`);
  // The agreement a calibration measured, not a number remembered: --calibrate
  // writes it, --replay reads it, and a backend with none on record says so
  // instead of printing a stale one.
  if (existsSync(CALIBRATION_FILE)) {
    const c = JSON.parse(readFileSync(CALIBRATION_FILE, "utf8"));
    const mine = c[BACKEND];
    if (mine) console.log(`judge agreement on its calibration set: ${mine.agree}/${mine.seen} = ${mine.seen ? Math.round((100 * mine.agree) / mine.seen) : 0}% per item, ${mine.sep} of ${mine.pairs} pairs separated (${mine.date}, band ${mine.band ?? "none"})`);
    else console.log(`no calibration on record for --backend ${BACKEND}: run --calibrate first`);
  } else console.log("no calibration on record: run --calibrate first");

  console.log(`A mean over ${rows.length} answers moves with the scenarios in the sample, so compare
arms on the same scenarios or not at all.`);
}
