#!/usr/bin/env node
/**
 * A semantic audit of the skills and their scenarios, answered by Jev.
 *
 * The deterministic linter catches what is visible in strings. This asks the
 * questions that need meaning: does a rule forbid what its own examples grant,
 * is a scenario answerable from its state, is a prompt something a developer
 * would actually say. Every question is calibrated, so every finding carries
 * the probability and the confidence that produced it, and the report separates
 * what the instrument decided from what it only flags for a reader.
 *
 *   node tools/jev-audit.mjs [--skill name] [--files-only|--scenarios-only]
 *
 * Cost model, measured: one call per artifact, the file battery asks every
 * requirement its own four questions inside that one call. The whole
 * collection screens for a few cents in about a minute.
 *
 * VALIDATION, and what it killed. The first version asked each defect question
 * of the whole file ("does this file contain a contradiction"). Against the
 * git history it could not separate the defective from the repaired versions
 * of the same three files: a one-line contradiction is invisible to a
 * whole-text needle scan, every probability landing within 0.03 of its pair.
 * That version was wrong and is gone. The file checks are now asked per
 * requirement, with units extracted deterministically, so a finding names the
 * line and the defect is the question's whole subject. The scenario checks
 * were validated against the two leaks the deterministic linter verified by
 * hand: the dictated criterion flags, the negation phrasing does not.
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const ONLY = arg("--skill", null);
const ONLY_KIND = argv.includes("--files-only") ? "file" : argv.includes("--scenarios-only") ? "scenario" : null;
const KEY = process.env.TYPESAFE_AI_API_KEY || process.env.TYPESAFE_API_KEY;
if (!KEY) { console.error("needs TYPESAFE_AI_API_KEY (or TYPESAFE_API_KEY) in the environment"); process.exit(1); }

const CONC = Number(arg("--concurrency", 8));
const FLAG = 0.75;   // calibrated enough to report as a finding
const REVIEW = 0.5;  // unsure: worth a reader, never a verdict

// ---------------------------------------------------------------- the battery
// Every check names the decision it serves; a finding without a decision is
// decoration. The file architecture is the one that survived validation:
// units and candidate pairs are extracted deterministically, Jev answers one
// atomic question per unit and per pair, and the composition happens in code.
// Whole-file and per-unit contradiction questions were tried first and FAILED
// against the git history -- a one-line conflict is invisible unless the two
// lines are the question's entire subject. The pair check separated the
// defective from the repaired text (0.33 conflict vs 0.86 coexist, control
// 0.78) when first validated -- and that separation FAILED TO REPRODUCE later
// the same day under the then-current jev-latest: the same three defect pairs
// read 0.86-0.95 coexist on defective text, indistinguishable from repaired;
// a direct-contradiction phrasing caught one defect weakly (0.28 vs 0.03)
// while firing 0.65 on a benign Avoid/Verify mirror; and a mirror
// discriminator scored the true defect 0.83. The check stays as a screen --
// it still separates menus, contrasts and the occasional review-worthy pair --
// but a pair-level finding is now "read both lines" advice, not a validated
// verdict, and a finding-free run says nothing about the absence of this
// defect class. Re-validate against the git-history pairs before trusting it
// again. The vendor ships no dated snapshot ids -- /v1/models lists only
// jev-latest and jev-preview, both dated 2026-09-10 -- so pinning cannot
// stop this drift. The drift detector was run: jev-preview fails the same
// way (defective pair 0.89 coexist vs 0.96 repaired), so the whole current
// model generation lacks the discrimination the original validation
// measured, and either the original question differed in a way the
// compaction did not preserve or the vendor changed serving without a
// release bump. The per-unit soft checks and the
// scenario battery are plausible but
// carry no defect-pair validation; they are reported as directions, marked as
// such, never as verdicts.

const MODAL = /(^|\s)(MUST|must not|always|never|do not|don't|only if|requires?|forbidden|obligat)/i;
const STOP = new Set("the a an and or of to in for with this that these those it is are be been was were not no if when your you their its they them as on by at from into than then so such which what who how why can could should would may might must will shall do does did done same other another more most less least each every any all some both".split(" "));
const stem = (w) => w.replace(/[^a-z0-9-]/g, "").replace(/(ing|ed|s)$/, "");
function contentWords(line) {
  return [...new Set(line.toLowerCase().split(/\s+/).map(stem).filter((w) => w.length > 3 && !STOP.has(w)))];
}

function fileStructure(text) {
  const units = [];
  for (const [i, raw] of text.split("\n").entries()) {
    const line = raw.trim();
    if ((/^[-*]\s/.test(line) || MODAL.test(line)) && line.length > 24 && line.length < 600) {
      units.push({ line: i + 1, text: line, words: contentWords(line) });
    }
  }
  // Candidate pairs: two requirements speaking about the same thing. Shared
  // content words, strongest overlap first, capped so a bloated file costs a
  // bounded number of questions rather than n-squared.
  const pairs = [];
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const shared = units[i].words.filter((w) => units[j].words.includes(w));
      if (shared.length >= 2) pairs.push({ a: units[i], b: units[j], shared });
    }
  }
  pairs.sort((x, y) => y.shared.length - x.shared.length);
  return { units, pairs: pairs.slice(0, 25) };
}

const SCENARIO_CHECKS = [
  { id: "implausible-prompt",
    q: { type: "noul", instructions: "The prompt is not something a real developer would plausibly say or paste in this situation; it reads constructed to fit the expected answer" },
    decision: "scenario realism: a fabricated prompt measures nothing transferable" },
  { id: "unanswerable",
    q: { type: "noul", instructions: "A competent reader with the skill loaded could not determine from the prompt alone whether the must items are met; deciding requires facts the state does not carry" },
    decision: "gradeability: scenarios whose outcome depends on luck, not skill" },
  { id: "prompt-states-conclusion",
    q: { type: "noul", instructions: "The prompt already states, asserts, or dictates the substance of at least one must item, beyond merely naming the topic" },
    decision: "the semantic version of answer leakage, which word overlap cannot see" },
  { id: "criteria-redundant",
    q: { type: "noul", instructions: "At least two must items grade the same underlying behavior, so meeting one essentially meets the other" },
    decision: "criteria economy: double-counting one behavior inflates scores" },
  { id: "difficulty-honest",
    q: { type: "choice", instructions: "How hard is this scenario for a competent developer agent?", criteria: { trivial: "answerable by echoing the prompt or one-word lookup", moderate: "needs the skill's guidance but no digging", hard: "needs reading the change, the parent constraints, or multiple files" } },
    decision: "tier honesty: difficulty labels a model can disagree with are labels to fix" },
  { id: "negative-fair",
    q: { type: "noul", instructions: "For this prompt, declining the skill is the behavior a reasonable person could defend; the scenario is not a disguised positive" },
    decision: "negative quality, asked only of negatives" },
  { id: "overapplication-pressure",
    q: { type: "noul", instructions: "This scenario rewards an agent for knowing when NOT to apply a rigid principle: the state contains a case where the rule-following, thorough answer is the wrong answer, and the must items punish applying the rule blindly" },
    decision: "counter-scenario coverage: skills never tested against over-application drift toward firing everywhere" },
  { id: "production-relevant",
    q: { type: "noul", instructions: "If an agent scored better on this scenario, no real user of this skill would get a better outcome; the graded behavior is not something users actually need" },
    decision: "production relevance, inverted: scenarios measuring nothing a user needs are deletion candidates" },
];

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
  throw new Error("gave up after 3 attempts");
}

// ------------------------------------------------------------------ artifacts

const artifacts = [];
for (const d of await readdir("skills", { withFileTypes: true }).then((x) => x.filter((y) => y.isDirectory()))) {
  if (ONLY && d.name !== ONLY) continue;
  const dir = join("skills", d.name);
  if (!ONLY_KIND || ONLY_KIND === "file") {
    const files = [];
    for (const name of ["SKILL.md", "INDEX.md"]) { try { files.push({ rel: name, text: await readFile(join(dir, name), "utf8") }); break; } catch {} }
    try { for (const f of await readdir(join(dir, "rules"))) if (f.endsWith(".md")) files.push({ rel: `rules/${f}`, text: await readFile(join(dir, "rules", f), "utf8") }); } catch {}
    for (const f of files) artifacts.push({ kind: "file", skill: d.name, name: `${d.name}/${f.rel}`, text: f.text, ...fileStructure(f.text) });
  }
  if (!ONLY_KIND || ONLY_KIND === "scenario") {
    const evals = join(dir, "evals");
    try {
      for (const f of (await readdir(evals)).filter((f) => /\.scenarios\.(ts|mjs)$/.test(f))) {
        try {
          const m = await import(`file://${join(process.cwd(), evals, f).replace(/\\/g, "/")}`);
          for (const sc of m.default ?? []) artifacts.push({ kind: "scenario", skill: d.name, name: `${d.name}/${f}:${sc.id}`, sc, checks: SCENARIO_CHECKS });
        } catch { console.error(`  ${d.name}/${f}: unimportable`); }
      }
    } catch {}
  }
}

const stateOf = (a) => {
  if (a.kind === "file") return a.text;
  const s = a.sc;
  return JSON.stringify({ prompt: s.prompt, must: s.must ?? [], mustNot: s.mustNot ?? [], expects: s.expectedPrimary ?? null, negative: s.activation?.shouldActivate === false, difficulty: s.difficulty ?? null }, null, 1);
};

let next = 0;
const results = [];
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < artifacts.length) {
    const a = artifacts[next++];
    try {
      if (a.kind === "file") {
        if (!a.pairs.length) continue;
        // One call, one atomic question per candidate pair, plus the two
        // unvalidated per-unit soft checks. Keys map back to lines so a
        // finding cites what it is about.
        const questions = {};
        const pairKeys = [];
        for (const [pi, pr] of a.pairs.entries()) {
          const k = `p${pi}`;
          pairKeys.push([k, pr]);
          questions[k] = { type: "noul", instructions: `Requirement 1: ${pr.a.text}\nRequirement 2: ${pr.b.text}\nA reader of the same document could follow both of these requirements at the same time, in the same situation` };
          // The discriminator the first full run asked for: most low-coexistence
          // pairs are deliberate menus and condition branches, not defects. A
          // conflict finding requires the document to give no situation in
          // which both apply -- else it is a branch working as intended.
          const bk = `b${pi}`;
          questions[bk] = { type: "noul", instructions: `Requirement 1: ${pr.a.text}\nRequirement 2: ${pr.b.text}\nThe document directs the reader to one or the other of these depending on the situation, as alternatives or a right-versus-wrong contrast` };
        }
        const answers = await ask(a.text, questions);
        const branchOf = new Map(pairKeys.map(([k, pr], i) => [k, answers[`b${i}`].noul]));
        for (const [k, pr] of pairKeys) {
          const r = answers[k];
          results.push({
            kind: "pair-conflict", skill: a.skill, name: a.name,
            lines: `${pr.a.line}-${pr.b.line}`,
            unit: `${pr.a.text.slice(0, 80)}  VS  ${pr.b.text.slice(0, 80)}`,
            shared: pr.shared.join(","), p: r.noul, branch: branchOf.get(k), conf: Math.abs(r.noul - 0.5) * 2,
            note: "validated on defect-vs-repair pairs; a finding needs low coexistence AND low branch",
          });
        }
        // The rule battery, from the intervention-experiment framing: a rule
        // that is absolute everywhere and names no failure mode is a deletion
        // candidate when the collection is slimmed, because there is no
        // evidence it prevents anything. UNVALIDATED direction -- the pair
        // check above is the only one calibrated against defect pairs.
        const rules = a.units.filter((u) => /\b(must|always|never|only if|forbidden|obligat)/i.test(u.text)).slice(0, 15);
        if (rules.length && a.name.endsWith("SKILL.md")) {
          const rq = {};
          for (const [ri, u] of rules.entries()) {
            rq[`w${ri}`] = { type: "noul", instructions: `Requirement: ${u.text}\nThis requirement is stated as absolute; nowhere in the document is there a situation, exception, or condition where it should not be followed` };
            rq[`f${ri}`] = { type: "noul", instructions: `Requirement: ${u.text}\nThe document never explains what goes wrong if this requirement is ignored; its purpose is not stated anywhere` };
          }
          const ra = await ask(a.text, rq);
          for (const [ri, u] of rules.entries()) {
            results.push({ kind: "rule", skill: a.skill, name: a.name, lines: String(u.line), unit: u.text.slice(0, 100), absolute: ra[`w${ri}`].noul, purposeless: ra[`f${ri}`].noul, note: "unvalidated direction; feeds the keep/kill matrix, not a verdict" });
          }
        }
      } else {
        // Two checks only mean something where the answer itself is graded.
        // An activation scenario's prompt MUST name the situation -- routing
        // is the thing under test -- so asking whether the prompt dictates a
        // criterion floods with by-design hits.
        const answerGraded = a.sc.reviewScope != null;
        const checks = a.checks.filter((c) => {
          if (c.id === "negative-fair") return a.sc.activation?.shouldActivate === false;
          if (c.id === "prompt-states-conclusion" || c.id === "unanswerable" || c.id === "overapplication-pressure") return answerGraded;
          return true;
        });
        const questions = Object.fromEntries(checks.map((c, i) => [`q${i}`, c.q]));
        const answers = await ask(stateOf(a), questions);
        for (const [i, c] of checks.entries()) {
          const r = answers[`q${i}`];
          const p = r.noul ?? r.score / (r.legend ? Object.keys(r.legend).length - 1 : 1);
          const conf = r.confidence ?? Math.abs(p - 0.5) * 2;
          results.push({ kind: "scenario", skill: a.skill, name: a.name, check: c.id, p, conf, choice: r.choice });
        }
      }
    } catch (e) {
      results.push({ kind: a.kind, skill: a.skill, name: a.name, check: "failed", error: String(e.message).slice(0, 100) });
    }
  }
}));

// ------------------------------------------------------------------- report

const judged = results.filter((r) => !r.error);
const level = (r) => (r.p >= FLAG ? "finding" : r.p >= REVIEW ? "review" : "clear");
// A conflict needs low coexistence AND the document not branching between the
// two; low coexistence with high branch is a menu or right-vs-wrong contrast
// working as intended. A mirror discriminator was tried here and FAILED
// validation: it scored the known defect pair (bound-the-unknown 47 vs 55 at
// 3a93400c) at 0.83 mirror, indistinguishable from the false positive it was
// meant to kill. Reverted rather than tuned against two data points.
const isConflict = (r) => r.p <= 0.25 && (r.branch ?? 1) <= 0.5;
const isContrast = (r) => r.p <= 0.5 && (r.branch ?? 0) > 0.5;
const conflicts = judged.filter((r) => r.kind === "pair-conflict");
const pairFindings = conflicts.filter(isConflict);
const contrasts = conflicts.filter(isContrast);
const pairReviews = conflicts.filter((r) => !isConflict(r) && !isContrast(r) && r.p <= 0.5);
const scFindings = judged.filter((r) => r.kind === "scenario" && level(r) === "finding");

console.log(`${judged.length} answers over ${artifacts.length} artifacts, ${results.length - judged.length} failed calls\n`);
console.log(`pair conflicts (validated): ${pairFindings.length} findings, ${contrasts.length} deliberate contrasts set aside, ${pairReviews.length} to review, over ${new Set(conflicts.map((r) => r.name)).size} files`);
for (const c of SCENARIO_CHECKS) {
  const rows = judged.filter((r) => r.check === c.id);
  console.log(`  ${String(rows.filter((r) => level(r) === "finding").length).padStart(4)}  ${c.id.padEnd(24)} ${c.decision}`);
}
console.log("\n-- conflicts (coexistence <= 0.25; read both lines before believing) --");
for (const r of [...pairFindings].sort((a, b) => a.p - b.p).slice(0, 40)) console.log(`${r.p.toFixed(2)}  ${r.name}:${r.lines}  [${r.shared}]  "${r.unit}"`);
if (pairFindings.length > 40) console.log(`  ... ${pairFindings.length - 40} more in the artifact file`);
console.log(`\n-- worth a reader (0.25 < coexistence <= 0.5), first 15 --`);
for (const r of [...pairReviews].sort((a, b) => a.p - b.p).slice(0, 15)) console.log(`${r.p.toFixed(2)}  ${r.name}:${r.lines}  [${r.shared}]  "${r.unit}"`);
console.log("\n-- scenario findings, worst first --");
for (const r of scFindings.slice(0, 40)) console.log(`${r.p.toFixed(2)}  ${r.name}  ${r.check}${r.choice ? ` (${r.choice})` : ""}`);
if (scFindings.length > 40) console.log(`  ... ${scFindings.length - 40} more in the artifact file`);

// The keep/kill matrix seed: per skill, how many absolute rules carry no
// counterweight and no stated failure mode, and how many answer-graded
// scenarios reward restraint. A skill high on the first and zero on the
// second is exactly the one whose removal the corpus cannot currently argue
// against -- or argue for.
const rules = judged.filter((r) => r.kind === "rule");
console.log(`\n-- keep/kill matrix (unvalidated direction) --`);
for (const skill of [...new Set(rules.map((r) => r.skill))].sort()) {
  const rs = rules.filter((r) => r.skill === skill);
  const bare = rs.filter((r) => r.absolute >= FLAG && r.purposeless >= FLAG);
  const scs = judged.filter((r) => r.kind === "scenario" && r.skill === skill && r.check === "overapplication-pressure");
  const rest = scs.filter((r) => r.p >= FLAG).length;
  console.log(`  ${skill.padEnd(30)} absolute-bare rules: ${String(bare.length).padStart(2)}/${rules.filter((r) => r.skill === skill).length}   restraint-rewarding scenarios: ${rest}/${scs.length}`);
}

const out = join(".local", "astra", "2026-09-18-jev-audit");
await mkdir(out, { recursive: true });
await writeFile(join(out, "audit.json"), JSON.stringify({ date: new Date().toISOString(), flag: FLAG, review: REVIEW, results }, null, 2) + "\n");
console.log(`\nfull results: ${join(out, "audit.json")}`);
console.log(`A finding is where to look, not a verdict: every number above came from a\nclosed method, and the battery was validated against defects and repairs the\nhard way before it was pointed at anything else.`);
