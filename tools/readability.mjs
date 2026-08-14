#!/usr/bin/env node
/**
 * Shape metrics for a skill file.
 *
 *   node readability.mjs <file> [<file> ...]
 *   node readability.mjs --skill <skill-dir>     (SKILL.md plus every rule)
 *
 * Vocabulary was never the problem. Measured against the two most-used
 * reference collections, this collection already used shorter words, fewer
 * long words and fewer abstract nouns. It still read as heavier, and these
 * are the four numbers that showed why.
 *
 * Targets, taken from those references rather than invented:
 *
 *   prose share      under 40%   they run 14 to 41; a paragraph is the
 *                                slowest way to carry a list
 *   bullets          40+ per router file, 12+ per rule
 *   bold spans       20+ per router file, 4+ per rule; bold is how a
 *                                skimmer gets the spine without reading
 *   clauses/sentence under 1.2   commas, semicolons and colons per sentence;
 *                                theirs sit at 1.04 to 1.12
 *   longest paragraph under 60 words
 */
import fs from "node:fs";
import path from "node:path";

const TARGET = { prose: 40, clauses: 1.2, maxPara: 60 };

export function shape(raw) {
  const body = raw.replace(/^---[\s\S]*?---/, "");
  const noFence = body.replace(/```[\s\S]*?```/g, "");

  // A paragraph is a run of consecutive lines that are not list items, headings,
  // table rows, or block labels. Splitting on blank lines instead made the layout
  // decide the score: a file that puts a blank line between bullet groups
  // measured as almost no prose, while the same content written with the label
  // glued to its bullets measured as one 164-word paragraph. That is the layout
  // being scored, not the writing.
  // A list item starts with "- ", "* " or "1. ". A line opening with **bold** is
  // still prose: an earlier filter dropped those, so a bold lead-in scored as
  // zero prose rather than as prose that had been made scannable.
  const LABEL = /^(?:Decision|Use when|Do|Avoid|Exceptions|Example[^:]*|Verify):\s*/;
  const paras = [];
  let run = [];
  const flush = () => { if (run.length) { paras.push(run.join(" ")); run = []; } };
  for (const line of noFence.split(/\r?\n/)) {
    const isList = /^\s*(?:[-*]\s|\d+\.\s)/.test(line);
    const isOther = !line.trim() || line.trimStart().startsWith("#") || line.trimStart().startsWith("|");
    if (isList || isOther) { flush(); continue; }
    // A bare block label is structure. A label carrying its statement on the
    // same line keeps that statement and drops only the label.
    const text = line.replace(LABEL, "").trim();
    if (!text) { flush(); continue; }
    run.push(text);
  }
  flush();

  const paraWords = paras.map((p) => p.split(/\s+/).length);
  const words = noFence.split(/\s+/).filter(Boolean).length;

  // A block label and a standalone bold line end a unit of text. Without this
  // the splitter glues "Use when:" to every bullet under it and reports one
  // 60-word sentence carrying five clause marks, which is a measurement
  // artefact rather than a sentence anyone has to read.
  const sents = noFence
    .replace(/^\|.*$/gm, "")
    .replace(/^#.*$/gm, "")
    .replace(/^(Decision|Use when|Do|Avoid|Exceptions|Example[^\n]*|Verify):\s*$/gm, "")
    .replace(/^\s*\*\*[^*]+\*\*\.?\s*$/gm, "")
    .split(/(?<=[.!?])\s+|\n\s*\n|\n\s*[-*]\s|\n\s*\d+\.\s/)
    .filter((s) => s.trim().length > 15);
  const marks = sents.reduce((a, s) => a + (s.match(/[,;:]/g) ?? []).length, 0);

  return {
    words,
    bullets: (noFence.match(/^\s*[-*]\s/gm) ?? []).length,
    bold: (noFence.match(/\*\*[^*]+\*\*/g) ?? []).length,
    headings: (body.match(/^#{2,3} /gm) ?? []).length,
    fences: (body.match(/```/g) ?? []).length / 2,
    avgPara: paraWords.length ? Math.round(paraWords.reduce((a, b) => a + b, 0) / paraWords.length) : 0,
    maxPara: paraWords.length ? Math.max(...paraWords) : 0,
    clauses: sents.length ? +(marks / sents.length).toFixed(2) : 0,
    prose: words ? Math.round((paraWords.reduce((a, b) => a + b, 0) / words) * 100) : 0,
  };
}

const args = process.argv.slice(2);
let files = [];
if (args[0] === "--skill") {
  const dir = args[1];
  const rules = path.join(dir, "rules");
  const entry = fs.existsSync(path.join(dir, "SKILL.md")) ? "SKILL.md" : "INDEX.md";
  files = [path.join(dir, entry)];
  if (fs.existsSync(rules)) files.push(...fs.readdirSync(rules).map((f) => path.join(rules, f)));
} else {
  files = args;
}

/**
 * The router thresholds assume a gate table plus discriminators over many rules.
 * A flat skill has no rules directory, so it is one unit of decisions and is held
 * to the per-rule counts instead. Judging it as a router would demand forty
 * bullets from a file that correctly has one topic.
 */
const isFlatEntry = (f) => {
  if (/[\\/]rules[\\/]/.test(f)) return false;
  return !fs.existsSync(path.join(path.dirname(f), "rules"));
};

const flag = (v, limit, over) => (over ? v > limit : v < limit) ? "  " : " !";

console.log("\nfile".padEnd(34) + "words bull bold  avgP maxP  cl/s prose%");
let bad = 0;
for (const f of files) {
  const perUnit = /[\\/]rules[\\/]/.test(f) || isFlatEntry(f);
  const s = shape(fs.readFileSync(f, "utf8"));
  const wantBul = perUnit ? 12 : 40;
  const wantBold = perUnit ? 4 : 20;
  const marks =
    flag(s.bullets, wantBul, true) + flag(s.bold, wantBold, true) +
    flag(s.maxPara, TARGET.maxPara, false) + flag(s.clauses, TARGET.clauses, false) +
    flag(s.prose, TARGET.prose, false);
  if (marks.includes("!")) bad++;
  console.log(
    f.split(/[\\/]/).pop().replace(/\.md$/, "").padEnd(34) +
      String(s.words).padStart(5) + String(s.bullets).padStart(5) + String(s.bold).padStart(5) +
      String(s.avgPara).padStart(6) + String(s.maxPara).padStart(5) +
      String(s.clauses).padStart(6) + String(s.prose).padStart(7) + "  " + marks,
  );
}
console.log(`\n${files.length - bad}/${files.length} files inside every target\n`);
process.exit(bad === 0 ? 0 : 1);
