#!/usr/bin/env node
/**
 * Build a copy of the collection with one skill's rules folded into its index,
 * so the two shapes can be run against the same scenarios.
 *
 *   node tools/fold-variant.mjs --skill evidence-backed-review --out <dir>
 *
 * The arithmetic says a hop costs more than the tokens it saves, and that the
 * loss is not in the rule but in reaching it. Both claims are predictions. This
 * builds the other arm so they can be tested instead of argued: same rules, same
 * scenarios, same model, one hop fewer.
 *
 * Nothing here touches the real collection. The variant is written elsewhere and
 * the runner is pointed at it with SKILL_COLLECTION_ROOT, so a failed experiment
 * costs a directory rather than a revert.
 *
 * The fold keeps each rule's own heading, which is what lets the grader see that
 * the guidance was delivered by the index rather than by a file that no longer
 * exists.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, cpSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const SKILL = arg("--skill", "evidence-backed-review");
const OUT = arg("--out", null);
if (!OUT) { console.error("--out <dir> is required"); process.exit(2); }

/**
 * A recursive delete takes whatever it is handed, and this one was handed a
 * command-line argument with nothing between the two. `--out skills` would have
 * removed the collection; `--out .` the repository. The argument being present
 * was the only check.
 *
 * So the target has to prove it is disposable before anything is removed: a
 * temporary directory, or one this script previously built and left its marker
 * in. Anything else is refused with the reason, and a path that does not exist
 * yet is fine — there is nothing there to lose.
 */
const MARKER = ".fold-variant";
const target = resolve(OUT);
const inTemp = target.toLowerCase().startsWith(resolve(tmpdir()).toLowerCase());
const oursAlready = existsSync(join(target, MARKER));
if (existsSync(target) && !inTemp && !oursAlready) {
  console.error(`refusing to delete ${target}`);
  console.error(`  it is neither under ${tmpdir()} nor a directory this script built`);
  console.error(`  pass a path inside the temp directory, or a new one that does not exist yet`);
  process.exit(2);
}
if (target === resolve("skills") || target === resolve(".")) {
  console.error(`refusing to use ${target}: that is the collection itself`);
  process.exit(2);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
writeFileSync(join(target, MARKER), "built by tools/fold-variant.mjs; safe to delete\n");
cpSync("skills", OUT, { recursive: true });

const dir = join(OUT, SKILL);

/**
 * One index, and the rules directory beside it, folded together.
 *
 * Returns what it absorbed so the caller can report a total across a tree.
 */
function foldInto(indexPath, rulesDir) {
  let body = readFileSync(indexPath, "utf8");
  const nl2 = body.includes("\r\n") ? "\r\n" : "\n";
  body = body.split("\r\n").join("\n");
  const rules = readdirSync(rulesDir).filter((f) => f.endsWith(".md")).sort();
  const parts = [];
  let folded = 0, tokens = 0;
  for (const f of rules) {
    const rawRule = readFileSync(join(rulesDir, f), "utf8").split("\r\n").join("\n");
    const text = rawRule.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
    const name = f.replace(/\.md$/, "");
    const shifted = text.replace(/^(#{1,5})\s/gm, (_, h) => `${h}## `.slice(0, h.length + 2) + " ").replace(/^#+ /m, "");
    parts.push(`\n## ${name}\n\n${shifted.replace(/^#\s/gm, "### ")}\n`);
    folded++;
    tokens += Math.round(text.length / 4);
  }
  // A route may name the rule from the skill root or from beside the index, and
  // both become a section of this file.
  body = body.replace(/`(?:skill:\/\/[a-z0-9/-]*?\/)?rules\/([a-z0-9-]+)\.md`/g, (_, n) => `the **${n}** section below`);
  body += `\n\n---\n\n# Rules\n${parts.join("")}`;
  writeFileSync(indexPath, body.split("\n").join(nl2));
  rmSync(rulesDir, { recursive: true, force: true });
  return { folded, tokens, after: Math.round(body.length / 4) };
}

// A three-level tree keeps its rules inside each topic, so that is where the
// fold happens. Detected rather than declared: a topic is a directory with an
// INDEX.md and a rules/ beside it.
const topics = existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, "INDEX.md")) && existsSync(join(dir, d.name, "rules")))
      .map((d) => d.name)
  : [];

if (topics.length) {
  let totalRules = 0, totalTokens = 0;
  for (const t of topics) {
    const r = foldInto(join(dir, t, "INDEX.md"), join(dir, t, "rules"));
    totalRules += r.folded;
    totalTokens += r.tokens;
    console.log(`  ${t}: ${r.folded} rules folded, index now ${r.after} tokens`);
  }
  console.log(`\nfolded ${totalRules} rules into ${topics.length} topic indexes of ${SKILL}`);
  console.log(`  ${totalTokens} tokens of rules absorbed; the third hop is gone`);
  console.log(`\nrun the other arm with:`);
  console.log(`  SKILL_COLLECTION_ROOT=${OUT} node tools/run-activation.mjs --skill ${SKILL} ...`);
  process.exit(0);
}

const rulesDir = join(dir, "rules");
if (!existsSync(rulesDir)) { console.error(`${SKILL} has no rules to fold`); process.exit(2); }

const index = join(dir, "SKILL.md");
let body = readFileSync(index, "utf8");
const nl = body.includes("\r\n") ? "\r\n" : "\n";
body = body.split("\r\n").join("\n");

const rules = readdirSync(rulesDir).filter((f) => f.endsWith(".md")).sort();
const parts = [];
let folded = 0, tokens = 0;
for (const f of rules) {
  const raw = readFileSync(join(rulesDir, f), "utf8").split("\r\n").join("\n");
  // Frontmatter belongs to a file, not to a section of one.
  const text = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
  const name = f.replace(/\.md$/, "");
  // The heading carries the rule's own name so delivery stays checkable, and the
  // levels are pushed down one so the index keeps a single top-level structure.
  const shifted = text.replace(/^(#{1,5})\s/gm, (_, h) => `${h}## `.slice(0, h.length + 2) + " ").replace(/^#+ /m, "");
  parts.push(`\n## ${name}\n\n${shifted.replace(/^#\s/gm, "### ")}\n`);
  folded++;
  tokens += Math.round(text.length / 4);
}

// The routing table now points at sections of this file rather than at files.
body = body.replace(/`rules\/([a-z0-9-]+)\.md`/g, (_, n) => `the **${n}** section below`);
body += `\n\n---\n\n# Rules\n${parts.join("")}`;

writeFileSync(index, body.split("\n").join(nl));
rmSync(rulesDir, { recursive: true, force: true });

const before = Math.round(readFileSync(join("skills", SKILL, "SKILL.md"), "utf8").length / 4);
const after = Math.round(body.length / 4);
console.log(`folded ${folded} rules into ${SKILL}/SKILL.md`);
console.log(`  index ${before} -> ${after} tokens (${tokens} tokens of rules absorbed)`);
console.log(`  rules/ removed; the routing table now names sections`);
console.log(`\nrun the other arm with:`);
console.log(`  SKILL_COLLECTION_ROOT=${OUT} node tools/run-activation.mjs --skill ${SKILL} ...`);
