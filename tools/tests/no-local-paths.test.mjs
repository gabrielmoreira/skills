#!/usr/bin/env node
/**
 * No file in this repository may name the machine that produced it.
 *
 * The behaviour runner writes results, and results come from paths: a working
 * directory, a skills directory, a fixture. Every one of those is absolute and
 * personal. Remembering to strip them is a discipline, and a discipline that
 * has to be remembered on every run is one that fails on the run nobody was
 * watching. So this fails the suite instead.
 *
 * It reads tracked files only. Anything ignored by git is the author's own
 * business and never reaches a clone.
 */
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SELF = "tools/tests/no-local-paths.test.mjs";

// Each pattern is split so that this file does not match itself.
const PATTERNS = [
  { name: "a unix home directory", re: new RegExp(`/${"Users"}/[A-Za-z0-9._-]+/`) },
  { name: "a linux home directory", re: new RegExp(`/${"home"}/[A-Za-z0-9._-]+/`) },
  { name: "a windows user directory", re: new RegExp(`[A-Za-z]:[\\\\/]${"Users"}[\\\\/]`, "i") },
  { name: "a wsl mount", re: new RegExp(`/${"mnt"}/[a-z]/`, "i") },
  { name: "an expanded home", re: new RegExp(`${"AppData"}[\\\\/]Local`, "i") },
];

const BINARY = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|woff2?|ttf)$/i;

const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((f) => f && f !== SELF && !BINARY.test(f));

const findings = [];
for (const file of tracked) {
  let text;
  try {
    text = await readFile(join(ROOT, file), "utf8");
  } catch {
    continue;
  }
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    for (const p of PATTERNS) {
      if (!p.re.test(lines[i])) continue;
      findings.push(`${file}:${i + 1}  ${p.name}\n    ${lines[i].trim().slice(0, 120)}`);
    }
  }
}

console.log(`scanned ${tracked.length} tracked files`);
if (findings.length) {
  console.log(`\n${findings.length} local paths would be committed:\n`);
  for (const f of findings) console.log(`  ${f}`);
  console.log("\nDerive the path at runtime, or redact it before writing the file.");
  process.exit(1);
}
console.log("no local paths");
