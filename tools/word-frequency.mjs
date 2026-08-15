#!/usr/bin/env node
/**
 * What the collection actually says, counted.
 *
 * A word cloud is trivia. These four views are not, because each one names a
 * defect it would expose:
 *
 *   ubiquitous    a word in nearly every rule is house style or it is filler,
 *                 and the difference is whether removing it loses anything
 *   distinctive   a rule whose top words are the corpus average has no subject
 *                 of its own, which is what a rule with no decision looks like
 *   twins         two rules whose vocabularies overlap heavily are candidates
 *                 for one decision written twice, which no demarcation check
 *                 can see
 *   hedges        words that soften an instruction until it stops instructing
 *
 * Usage:
 *   node tools/word-frequency.mjs
 *   node tools/word-frequency.mjs --skill evidence-backed-review
 *   node tools/word-frequency.mjs --top 40
 */
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";

const STOP = new Set(
  ("a an the and or but nor for so yet of to in on at by with from as is are was were be been being do does did done have has had " +
    "it its this that these those there here when where which who whom whose what why how all any both each few more most other some " +
    "such no not only own same than too very can will just should now if then else than into over under again further once you your " +
    "they them their we our us i me my he she his her one two three ")
    .trim()
    .split(/\s+/),
);

// Softeners that genuinely weaken an instruction. "rather" and "prefer" were in
// this list and had to come out: "X rather than Y" is a contrast, not a hedge,
// and it was 74 of the 78 hits, which made the collection look evasive when it
// is not.
const HEDGES = ["probably", "generally", "usually", "typically", "often", "sometimes", "maybe", "perhaps", "consider", "try", "ideally", "somewhat", "fairly", "quite", "appropriate", "reasonable", "sensible", "clean enough", "good enough", "nice", "simply"];

// The block headers every rule carries. Counting them measures the template.
// One line, "Example (one instance, not the set):", put instance, set and
// example into 88 of 107 files and near the top of the frequency table.
const TEMPLATE = /^(Decision|Use when|Do|Avoid|Verify|Exceptions|Example[^\n:]*):/gm;

/** Prose only: frontmatter, template headers, code and markdown syntax removed. */
export function prose(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(TEMPLATE, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>|]/g, " ");
}

export function words(text) {
  return (prose(text).toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []).filter((w) => !STOP.has(w));
}

const count = (list) => {
  const m = new Map();
  for (const w of list) m.set(w, (m.get(w) ?? 0) + 1);
  return m;
};

/** Cosine similarity over term counts, so length does not decide the answer. */
function similarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const keys = new Set([...a.keys(), ...b.keys()]);
  for (const k of keys) {
    const x = a.get(k) ?? 0;
    const y = b.get(k) ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

async function collect(root, only) {
  const units = [];
  for (const e of await readdir(root, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (only && e.name !== only) continue;
    const skill = join(root, e.name);
    for (const [dir, label] of [[skill, "entry"], [join(skill, "rules"), "rule"]]) {
      let files = [];
      try {
        files = await readdir(dir);
      } catch {
        continue;
      }
      for (const f of files) {
        if (!f.endsWith(".md")) continue;
        if (label === "entry" && !["SKILL.md", "INDEX.md"].includes(f)) continue;
        const text = (await readFile(join(dir, f), "utf8")).split("\r\n").join("\n");
        units.push({ skill: e.name, kind: label, name: `${e.name}/${f.replace(/\.md$/, "")}`, counts: count(words(text)) });
      }
    }
    // Topic indexes and their rules, for a multi-topic skill.
    for (const d of await readdir(skill, { withFileTypes: true })) {
      if (!d.isDirectory() || ["evals", "references", "rules", "node_modules", "fixtures"].includes(d.name)) continue;
      for (const sub of [join(skill, d.name), join(skill, d.name, "rules")]) {
        let files = [];
        try {
          files = await readdir(sub);
        } catch {
          continue;
        }
        for (const f of files) {
          if (!f.endsWith(".md")) continue;
          const text = (await readFile(join(sub, f), "utf8")).split("\r\n").join("\n");
          units.push({ skill: e.name, kind: sub.endsWith("rules") ? "rule" : "entry", name: `${e.name}/${d.name}/${f.replace(/\.md$/, "")}`, counts: count(words(text)) });
        }
      }
    }
  }
  return units;
}

async function main() {
  const argv = process.argv.slice(2);
  const only = argv.includes("--skill") ? argv[argv.indexOf("--skill") + 1] : null;
  const top = argv.includes("--top") ? Number(argv[argv.indexOf("--top") + 1]) : 25;
  const root = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");

  const units = await collect(root, only);
  const rules = units.filter((u) => u.kind === "rule");
  const total = new Map();
  const docsWith = new Map();
  for (const u of units) {
    for (const [w, n] of u.counts) {
      total.set(w, (total.get(w) ?? 0) + n);
      docsWith.set(w, (docsWith.get(w) ?? 0) + 1);
    }
  }
  const allWords = [...units].reduce((a, u) => a + [...u.counts.values()].reduce((x, y) => x + y, 0), 0);

  console.log(`${units.length} files, ${rules.length} rules, ${allWords} words after stop-list\n`);

  console.log(`most frequent (share of all words)`);
  for (const [w, n] of [...total].sort((a, b) => b[1] - a[1]).slice(0, top)) {
    const pct = ((100 * n) / allWords).toFixed(2);
    console.log(`  ${w.padEnd(18)} ${String(n).padStart(4)}  ${pct}%  in ${docsWith.get(w)}/${units.length} files`);
  }

  console.log(`\nin most files, which is house style or filler`);
  for (const [w, d] of [...docsWith].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
    if (d / units.length < 0.5) break;
    console.log(`  ${w.padEnd(18)} ${d}/${units.length} files, ${total.get(w)} times`);
  }

  console.log(`\nhedges, which soften an instruction until it stops instructing`);
  const found = HEDGES.map((h) => [h, total.get(h) ?? 0, docsWith.get(h) ?? 0]).filter(([, n]) => n > 0);
  if (!found.length) console.log("  none");
  for (const [w, n, d] of found.sort((a, b) => b[1] - a[1])) console.log(`  ${w.padEnd(18)} ${String(n).padStart(4)} times in ${d} files`);

  // Two rules inside one skill share a subject, so overlap there is expected and
  // only extreme values mean anything. Two rules in different skills sharing a
  // vocabulary is the finding: it is one decision written twice, in two places
  // that do not know about each other.
  const pairs = [];
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      pairs.push({ a: rules[i].name, b: rules[j].name, s: similarity(rules[i].counts, rules[j].counts), same: rules[i].skill === rules[j].skill });
    }
  }
  console.log(`\nclosest across skills, where overlap is not explained by a shared subject`);
  for (const p of pairs.filter((p) => !p.same).sort((x, y) => y.s - x.s).slice(0, 8)) {
    console.log(`  ${p.s.toFixed(2)}  ${p.a}  vs  ${p.b}`);
  }
  console.log(`\nclosest inside one skill, where some overlap is expected`);
  for (const p of pairs.filter((p) => p.same).sort((x, y) => y.s - x.s).slice(0, 6)) {
    console.log(`  ${p.s.toFixed(2)}  ${p.a}  vs  ${p.b.split("/").pop()}`);
  }

  console.log(`\nrules with the least distinctive vocabulary`);
  const idf = (w) => Math.log(units.length / (docsWith.get(w) ?? 1));
  const scored = rules.map((r) => {
    const n = [...r.counts.values()].reduce((a, b) => a + b, 0) || 1;
    const score = [...r.counts].reduce((a, [w, c]) => a + (c / n) * idf(w), 0);
    return { name: r.name, score };
  });
  for (const r of scored.sort((a, b) => a.score - b.score).slice(0, 8)) {
    console.log(`  ${r.score.toFixed(3)}  ${r.name}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
