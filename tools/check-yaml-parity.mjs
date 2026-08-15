#!/usr/bin/env node
/**
 * Differential test: the strict subset parser in verify-skill.mjs against a real
 * YAML implementation, over every frontmatter block in the collection.
 *
 *   node tools/check-yaml-parity.mjs [root]
 *
 * Hand-rolling a parser is only defensible while it agrees with one that
 * implements the whole spec. A disagreement is a bug here, not there.
 *
 * The `yaml` package is not a dependency of this collection, which installs and
 * checks itself with bare node. When it is absent this reports SKIPPED and exits
 * clean, because an unavailable cross-check is not a failing one.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.argv[2] ?? join(HERE, ".."));

let YAML;
try {
  YAML = (await import("yaml")).default;
} catch {
  console.log("SKIPPED  the `yaml` package is not installed, so parity was not checked");
  console.log("         install it anywhere on the module path to run this");
  process.exit(0);
}

const SKIP_DIRS = new Set([".git", "node_modules", ".local", "workspace"]);
const FM = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

async function markdownFiles(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await markdownFiles(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// verify-skill.mjs runs its driver on import, so the parser is lifted out as
// source text and loaded on its own.
const src = (await readFile(join(HERE, "verify-skill.mjs"), "utf8")).split("\r\n").join("\n");
const from = src.indexOf("function parseYamlFrontmatter");
const to = src.indexOf("/** Back-compatible accessor");
if (from < 0 || to < 0 || to <= from) {
  console.error("FAIL  could not lift parseYamlFrontmatter out of verify-skill.mjs");
  console.error("      the anchors this script slices on have moved");
  process.exit(1);
}
const mod = `${src.slice(from, to)}\nexport { parseYamlFrontmatter };\n`;
const { parseYamlFrontmatter } = await import(
  `data:text/javascript;base64,${Buffer.from(mod).toString("base64")}`
);

const files = await markdownFiles(ROOT);
const shown = (p) => relative(ROOT, p).split(sep).join("/");

let compared = 0, agreed = 0;
const disagreements = [];

for (const p of files) {
  const text = (await readFile(p, "utf8")).split("\r\n").join("\n");
  if (!text.startsWith("---")) continue;
  compared++;

  const m = text.match(FM);
  let realOk = false, realErr = "block is not closed by a --- line";
  if (m) {
    try { YAML.parse(m[1]); realOk = true; realErr = ""; }
    catch (e) { realErr = e.message.split("\n")[0]; }
  }

  const r = parseYamlFrontmatter(text);
  if (r.ok === realOk) { agreed++; continue; }
  disagreements.push({
    file: shown(p),
    ours: r.ok ? "accepted" : `rejected at line ${r.line}: ${r.error}`,
    real: realOk ? "accepted" : `rejected: ${realErr}`,
  });
}

for (const d of disagreements) {
  console.log(`DISAGREE  ${d.file}`);
  console.log(`   ours:  ${d.ours}`);
  console.log(`   yaml:  ${d.real}`);
}
console.log(`\n${compared} frontmatter blocks compared, ${agreed} agreed, ${disagreements.length} disagreed`);
process.exit(disagreements.length ? 1 : 0);
