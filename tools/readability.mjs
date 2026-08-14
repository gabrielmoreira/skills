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

  const paras = noFence
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    // A list item starts with "- ", "* " or "1. ". A paragraph opening with
    // **bold** also starts with an asterisk and is still a paragraph: the
    // first version of this filter dropped those, so a bold lead-in scored
    // as zero prose instead of as prose that had been made scannable.
    .filter((p) => p && !p.startsWith("#") && !p.startsWith("|") && !/^(-\s|\*\s|\d+\.\s)/.test(p));

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
  files = [path.join(dir, "SKILL.md"), ...fs.readdirSync(path.join(dir, "rules")).map((f) => path.join(dir, "rules", f))];
} else {
  files = args;
}

const flag = (v, limit, over) => (over ? v > limit : v < limit) ? "  " : " !";

console.log("\nfile".padEnd(34) + "words bull bold  avgP maxP  cl/s prose%");
let bad = 0;
for (const f of files) {
  const isRule = /[\\/]rules[\\/]/.test(f);
  const s = shape(fs.readFileSync(f, "utf8"));
  const wantBul = isRule ? 12 : 40;
  const wantBold = isRule ? 4 : 20;
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
