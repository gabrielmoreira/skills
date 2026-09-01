#!/usr/bin/env node
/**
 * How much of this collection is content, and how much is the same content
 * again.
 *
 *   node tools/compression-headroom.mjs [--skill <name>]
 *
 * "Compress it hard" is a decision that needs a ceiling before it needs a plan,
 * and the ceiling is measurable rather than a matter of taste. Three things take
 * up room and only one of them is the guidance:
 *
 *   scaffolding   frontmatter, headings, the section skeleton every rule repeats
 *   duplication   sentences and phrases that already appear in another file
 *   content       what is left, and the only part a reader could not get elsewhere
 *
 * The first two are recoverable without losing anything a reader needs. The
 * third is where compression starts costing meaning, so it is reported apart
 * rather than folded into one optimistic number.
 *
 * Duplication is counted on shingles -- overlapping runs of words -- because
 * whole-line matching misses a sentence rewritten with two words changed, which
 * is the common case in a collection written by one person over months.
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const ONLY = arg("--skill", null);
const SHINGLE = 8;

const tok = (s) => Math.round(s.length / 4);

function* mdFiles(dir) {
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) { if (d.name !== "evals") yield* mdFiles(p); }
    else if (d.name.endsWith(".md")) yield p;
  }
}

const files = [];
for (const d of readdirSync("skills", { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  if (ONLY && d.name !== ONLY) continue;
  for (const f of mdFiles(join("skills", d.name))) files.push(f);
}

// ------------------------------------------------------------- what is there

let total = 0, frontmatter = 0, headings = 0, listMarkers = 0, prose = 0;
const shingles = new Map();          // shingle -> how many files carry it
const perFile = [];

for (const f of files) {
  const raw = readFileSync(f, "utf8").split("\r\n").join("\n");
  total += tok(raw);
  const fm = raw.match(/^---\n[\s\S]*?\n---\n/);
  if (fm) frontmatter += tok(fm[0]);
  const body = fm ? raw.slice(fm[0].length) : raw;

  let h = 0, m = 0;
  for (const line of body.split("\n")) {
    if (/^#{1,6}\s/.test(line)) h += tok(line);
    else if (/^\s*[-*]\s|^\s*\d+\.\s/.test(line)) m += tok(line.match(/^\s*([-*]|\d+\.)\s/)[0]);
  }
  headings += h; listMarkers += m;
  const words = body.replace(/```[\s\S]*?```/g, " ").replace(/[^A-Za-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean);
  prose += tok(body);

  const seen = new Set();
  for (let i = 0; i + SHINGLE <= words.length; i++) {
    const s = words.slice(i, i + SHINGLE).join(" ").toLowerCase();
    if (!seen.has(s)) { seen.add(s); shingles.set(s, (shingles.get(s) ?? 0) + 1); }
  }
  perFile.push({ f, tokens: tok(raw), shingles: seen });
}

// A shingle in more than one file is text a reader could have met already.
const repeated = new Set([...shingles].filter(([, n]) => n > 1).map(([s]) => s));
let dupTokens = 0;
for (const p of perFile) {
  const rep = [...p.shingles].filter((s) => repeated.has(s)).length;
  if (!p.shingles.size) continue;
  dupTokens += Math.round(p.tokens * (rep / p.shingles.size));
}

// --------------------------------------------------------------------- report

const pct = (n) => `${Math.round((100 * n) / total)}%`;
console.log(`${files.length} files, ${total.toLocaleString()} tokens${ONLY ? ` in ${ONLY}` : " across the collection"}\n`);
console.log("what the tokens are");
console.log(`  frontmatter                 ${String(frontmatter).padStart(7)}  ${pct(frontmatter).padStart(4)}`);
console.log(`  headings                    ${String(headings).padStart(7)}  ${pct(headings).padStart(4)}`);
console.log(`  list markers                ${String(listMarkers).padStart(7)}  ${pct(listMarkers).padStart(4)}`);
console.log(`  text appearing in >1 file   ${String(dupTokens).padStart(7)}  ${pct(dupTokens).padStart(4)}   (${SHINGLE}-word runs)`);

const recoverable = frontmatter + headings + listMarkers + dupTokens;
const irreducible = total - recoverable;
console.log(`\n  recoverable without losing a reader anything   ${String(recoverable).padStart(7)}  ${pct(recoverable)}`);
console.log(`  the guidance itself                           ${String(irreducible).padStart(7)}  ${pct(irreducible)}`);

console.log(`\nWhat "compress hard" can mean, and what each would cost a reader`);
console.log(`  lossless      strip scaffolding and repeats only       -> ${pct(recoverable)} smaller`);
console.log(`  aggressive    the above, plus one sentence per rule
                where three now make the same point         -> around ${Math.round((100 * (recoverable + irreducible * 0.3)) / total)}% smaller, some nuance goes`);
console.log(`  destructive   keep the decision, drop the reasoning    -> around ${Math.round((100 * (recoverable + irreducible * 0.6)) / total)}% smaller, the why is gone`);
console.log(`
The third is not a compression, it is a different artefact: a rule whose reason
is removed is a rule an agent applies where it does not fit, and nobody can tell
because the check still passes.`);
