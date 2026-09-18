#!/usr/bin/env node
/**
 * Deterministic checks over the eval scenarios themselves, before any model
 * sees them. The judges measure whether an answer is good; this measures
 * whether the question is honest. Everything here runs offline in milliseconds
 * and reports a finding per defect, so an author fixes the scenario instead of
 * a run grading a broken one.
 *
 *   node tools/lint-scenarios.mjs [--strict] [--min-run n]
 *
 * Rules
 *   answer-in-prompt       a 6+-word run copied from a must item into the
 *                          prompt: the scenario is graded by word overlap, not
 *                          understanding, and a model that parrots passes it
 *   criterion-echoes-rule  a must item shares a 6+-word run with the rule it
 *                          routes to: the grader ends up scoring wording, and
 *                          rewording the rule silently breaks the scenario
 *   prompt-names-target    the prompt contains the routed rule slug, so the
 *                          router can match lexically and never read meaning
 *   prompt-too-thin        under --min-run-thin characters of state: not
 *                          enough to judge understanding at all
 *   positive-unguarded     a positive router scenario with no forbiddenRoutes:
 *                          nothing distinguishes right routing from lexicon
 *   negative-with-criteria a negative scenario carrying must/mustNot: the
 *                          judge refuses to grade negatives, so they are dead
 *                          weight that only looks like coverage
 *   contradictory-routes   expectedPrimary also listed in forbiddenRoutes
 *   mustless-positive      a positive scenario requiring nothing
 *   duplicate-id           the same id twice in one file
 *   local-content          a prompt carrying a machine path or an email: the
 *                          collection promises no private project content
 *
 * Report-only by default; --strict exits 1 on any finding. Thresholds live in
 * the flags, not in taste: when a rule floods, tighten the constant, not the
 * rule's meaning.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
function arg(k, d) { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; }
const LEAK_RUN = Number(arg("--min-run", 4));   // words copied from a must into the prompt
const ECHO_RUN = Number(arg("--min-echo", 6));  // words shared between a criterion and its rule
const THIN = Number(arg("--min-thin", 120));    // characters of prompt state

const words = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s./_-]/g, " ").split(/\s+/).filter(Boolean);
/** Every run of `n` consecutive words, as normalized keys. */
function runs(text, n) {
  const w = words(text), out = new Map();
  for (let i = 0; i + n <= w.length; i++) {
    const key = w.slice(i, i + n).join(" ");
    if (!out.has(key)) out.set(key, i);
  }
  return out;
}
const NEGATORS = new Set(["not", "no", "never", "without", "dont", "doesnt", "isnt", "cant", "cannot", "wont"]);
/** The first `n`-word run `a` shares with `b`, or null. A run one of the texts
 * negates is not a leak: "do our standards have a canonical rule" asks what
 * "acknowledges the standards do not have a canonical rule" answers. */
function sharedRunKey(a, b, n) {
  const aw = words(a), bw = words(b);
  const bset = runs(b, n);
  for (const [key, i] of runs(a, n)) {
    if (!bset.has(key)) continue;
    const j = bset.get(key);
    const negated = [aw.slice(Math.max(0, i - 2), i), bw.slice(Math.max(0, j - 2), j)]
      .some((before) => before.some((w) => NEGATORS.has(w)));
    if (!negated) return key;
  }
  return null;
}

const findings = [];
const add = (file, id, rule, evidence) => findings.push({ file, id, rule, evidence });

for (const skill of readdirSync("skills", { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const ev = join("skills", skill.name, "evals");
  let files = [];
  try { files = readdirSync(ev).filter((f) => /\.scenarios\.(ts|mjs)$/.test(f)); } catch { continue; }
  for (const f of files) {
    const file = join("skills", skill.name, "evals", f);
    let scenarios = [];
    try {
      const m = await import(pathToFileURL(file).href);
      scenarios = m.default ?? [];
    } catch (e) {
      add(file, "-", "unimportable", String(e.message).slice(0, 120));
      continue;
    }
    const seen = new Map();
    for (const s of scenarios) {
      if (seen.has(s.id)) add(file, s.id, "duplicate-id", `first seen as ${seen.get(s.id)}`);
      seen.set(s.id, f);
      const pos = s.activation?.shouldActivate !== false;
      const neg = !pos;
      const must = (s.must ?? []).filter(Boolean);
      const mustNot = (s.mustNot ?? []).filter(Boolean);
      const forb = s.activation?.forbiddenRoutes ?? [];

      if (neg && (must.length || mustNot.length)) add(file, s.id, "negative-with-criteria", `${must.length} must, ${mustNot.length} mustNot on a scenario the judge refuses to grade`);
      if (pos && s.mode === "router" && !forb.length) add(file, s.id, "positive-unguarded", "no forbiddenRoutes, so right routing is indistinguishable from lexicon");
      if (s.expectedPrimary && forb.includes(s.expectedPrimary)) add(file, s.id, "contradictory-routes", `${s.expectedPrimary} is both the answer and forbidden`);
      if (pos && !must.length) add(file, s.id, "mustless-positive", "requires nothing");
      if ((s.prompt ?? "").length < THIN) add(file, s.id, "prompt-too-thin", `${(s.prompt ?? "").length} chars of state`);
      if (/\/Users\/|[A-Za-z]:\\Users|\b[\w.+-]+@[\w-]+\.[A-Za-z]{2,}\b/.test(s.prompt ?? "")) add(file, s.id, "local-content", "machine path or email in the prompt");

      if (s.expectedPrimary) {
        const slug = s.expectedPrimary.split("/").pop().replace(/\.md$/, "").replace(/-/g, " ");
        if ((s.prompt ?? "").toLowerCase().includes(slug)) add(file, s.id, "prompt-names-target", slug);
        // The rule the scenario routes to, read once per rule.
        const rulePath = join("skills", skill.name, s.expectedPrimary);
        let ruleText = null;
        try { ruleText = readFileSync(rulePath, "utf8"); } catch { /* reference-only entries name no local file */ }
        if (ruleText) {
          const rset = runs(ruleText, ECHO_RUN);
          for (const [kind, list] of [["must", must], ["mustNot", mustNot]]) {
            for (const c of list) {
              const cw = runs(c, ECHO_RUN);
              for (const key of cw.keys()) {
                if (rset.has(key)) {
                  add(file, s.id, "criterion-echoes-rule", `${kind} shares "${key}" with ${s.expectedPrimary}`);
                  break;
                }
              }
            }
          }
        }
      }
      // The overlap that matters most: the prompt handing the answer back.
      for (const c of must) {
        const key = sharedRunKey(s.prompt ?? "", c, LEAK_RUN);
        if (key) add(file, s.id, "answer-in-prompt", `prompt and must share "${key}"`);
      }
    }
  }
}

if (!findings.length) { console.log("no findings across every scenario file"); process.exit(0); }
const byRule = {};
for (const f of findings) byRule[f.rule] = (byRule[f.rule] ?? 0) + 1;
for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(4)}  ${rule}`);
console.log("");
for (const f of findings) console.log(`${f.file}:${f.id}  ${f.rule}  ${f.evidence ?? ""}`);
console.log(`\n${findings.length} findings. Report-only; --strict turns any finding into exit 1.`);
if (argv.includes("--strict")) process.exit(1);
