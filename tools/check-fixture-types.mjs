#!/usr/bin/env node
/**
 * Do the TypeScript fixtures compile, and would Node run them?
 *
 *   node tools/check-fixture-types.mjs
 *
 * The skill that owns what a value may be was tested almost entirely in a
 * language with no types, and the one fixture that did use them did not run.
 * Its suite failed with ERR_MODULE_NOT_FOUND on extensionless imports, and no
 * gate noticed, because nothing here had ever compiled a fixture.
 *
 * Two flags in tsconfig.json do the work that a plain `strict` would not.
 *
 *   erasableSyntaxOnly    Node strips types rather than compiling them, so an
 *                         enum, a namespace or a parameter property passes tsc
 *                         and then crashes at run time. This makes the checker
 *                         agree with the runtime.
 *   verbatimModuleSyntax  Under strip mode a type-only name imported as a value
 *                         leaves a real import of a binding that does not exist.
 *                         It fired three times on the one fixture we had, and
 *                         each was a runtime failure rather than a preference.
 *
 * Skips with a stated reason when node_modules is absent, because a fresh clone
 * has not installed yet and a check that cannot run must say so rather than
 * pass.
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// The compiler's own entry point, run with node.
//
// The .bin shim was tried first and returns no output through execFileSync on
// Windows, which made this check report zero errors and a non-zero exit at the
// same time. A check that cannot see the tool's output is worse than none: it
// passed a planted type error.
const TSC = "node_modules/typescript/bin/tsc";

if (!existsSync("node_modules")) {
  console.log("skipped: node_modules is absent, so typescript is not installed here");
  console.log("         run the install first; this check does not pass by default");
  process.exit(0);
}
if (!existsSync(TSC)) {
  console.log("skipped: typescript is a declared devDependency but not present");
  process.exit(0);
}


// Count what is being checked, so a config that includes nothing cannot report
// success. An empty include is the failure mode this line exists to catch.
function* tsFixtures(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* tsFixtures(p);
    else if (e.name.endsWith(".ts")) yield p;
  }
}

const files = [];
for (const skill of readdirSync("skills", { withFileTypes: true })) {
  if (!skill.isDirectory()) continue;
  for (const dir of [join("skills", skill.name), ...readdirSync(join("skills", skill.name), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join("skills", skill.name, d.name))]) {
    const fx = join(dir, "evals", "fixtures");
    if (existsSync(fx)) files.push(...tsFixtures(fx));
  }
}

if (!files.length) {
  console.log("no TypeScript fixtures found, which is itself worth knowing");
  process.exit(0);
}

let out = "";
let ok = true;
try {
  out = execFileSync(process.execPath, [TSC, "--noEmit"], { encoding: "utf8", stdio: "pipe" });
} catch (err) {
  ok = false;
  out = `${err.stdout ?? ""}${err.stderr ?? ""}`;
}

const errors = out.split("\n").filter((l) => /error TS\d+/.test(l));
const byFile = new Map();
for (const line of errors) {
  const f = line.split("(")[0];
  byFile.set(f, (byFile.get(f) ?? 0) + 1);
}

console.log(`${files.length} TypeScript fixture file(s) across the collection`);
if (ok && !errors.length) {
  console.log("every one compiles under strict, erasable-syntax and verbatim-module rules");
  process.exit(0);
}

console.log(`${errors.length} error(s) in ${byFile.size} file(s):\n`);
for (const [f, n] of [...byFile].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${f}`);
console.log("");
for (const line of errors.slice(0, 12)) console.log(`  ${line.trim()}`);
if (errors.length > 12) console.log(`  ... and ${errors.length - 12} more`);
process.exit(1);
