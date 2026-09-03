#!/usr/bin/env node
// Structural invariants for the evidence-backed-review skill.
//
//   node evals/invariants.mjs
//
// Exit 0 = every invariant holds. Non-zero = failures are listed above the
// summary. Runs with bare node, no dependencies, from any working directory.
//
// Layer 1 of the two-layer eval contract. Layer 2 is evals/activation.scenarios.mjs,
// which this script validates structurally but does not grade.

import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EVALS_DIR = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = resolve(EVALS_DIR, "..");
const SKILL_NAME = basename(SKILL_DIR);

const REQUIRED_FRONTMATTER = ["id", "owner", "canonical", "severity", "references"];
const MANDATED_BLOCKS = ["Decision:", "Use when:", "Do:", "Avoid:", "Verify:"];
const OPTIONAL_BLOCKS = ["Exceptions:", "Example:"];

// No size thresholds live here. `tools/verify-skill.mjs` owns them, and a
// second copy in this file drifted from the shared one three times.

// --- portability denylists -------------------------------------------------
// Sources a skill must never embed: one machine's layout, a private host, or a
// vendor whose presence would tie the skill to one shop's toolchain.

const PACKAGE_MANAGERS = [
  "npm", "pnpm", "yarn", "bun", "pip", "pipenv", "poetry", "conda", "cargo",
  "gradle", "maven", "composer", "nuget", "bundler", "rubygems", "apt-get",
  "homebrew", "chocolatey", "winget", "deno",
];

const CI_VENDORS = [
  "jenkins", "circleci", "circle ci", "travis ci", "teamcity", "buildkite",
  "github actions", "gitlab ci", "azure pipelines", "azure devops",
  "bitbucket pipelines", "appveyor", "spinnaker", "argocd", "argo cd",
  "drone ci", "codebuild", "codepipeline", "cloudbuild",
];

const COMPANY_NAMES = [
  "github", "gitlab", "bitbucket", "atlassian", "jira", "confluence", "slack",
  "notion", "linear.app", "asana", "trello", "google", "microsoft", "amazon",
  "aws", "azure", "meta", "facebook", "apple", "netflix", "uber", "airbnb",
  "spotify", "stripe", "shopify", "oracle", "salesforce", "vercel", "netlify",
  "cloudflare", "datadog", "sentry", "splunk", "newrelic", "pagerduty",
  "openai", "anthropic", "claude", "copilot", "cursor",
];

const ABSOLUTE_PATH_PATTERNS = [
  { label: "windows absolute path", re: /\b[A-Za-z]:[\\/](?:Users|Program|Windows)\b/i },
  { label: "posix home or system path", re: /(?:^|[\s"'`(])(?:\/(?:Users|home|opt|srv|mnt|var|etc)\/|~\/)/m },
];

const CORPORATE_SUFFIX =
  /\b[A-Z][A-Za-z0-9]+\s+(?:Inc\.?|LLC|Ltd\.?|GmbH|S\.A\.|Corp\.?|Corporation|Labs|Studio|Studios|Technologies|Holdings)\b/;

const AT_HANDLE = /(?:^|\s)@[A-Za-z][A-Za-z0-9_-]{2,}/;

// --- harness ---------------------------------------------------------------

const passes = [];
const failures = [];
const notes = [];

const pass = (name, detail) => passes.push({ name, detail });
const fail = (name, detail) => failures.push({ name, detail });
const note = (name, detail) => notes.push({ name, detail });

const read = (path) => readFile(path, "utf8");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function lineCount(text) {
  return text.replace(/\n$/, "").split("\n").length;
}

function stripFrontmatter(text) {
  // \r?\n, not \n: these files carry CRLF on a Windows checkout, and an
  // LF-only anchor reported every rule as having no frontmatter at all.
  // The check could then never pass and never discriminate, which is worse
  // than not having it: it was red for a reason that had nothing to do with
  // what it claims to measure.
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? text.slice(match[0].length) : text;
}

function stripFences(text) {
  return text.replace(/```[\s\S]*?```/g, "");
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const fields = {};
  // Split on the line ending, not on the newline alone. In JavaScript `.`
  // does not match a carriage return, so `(.*)$` fails on every CRLF line
  // and only the last field parsed: the one whose CR the block boundary had
  // already eaten. The check then reported every rule as missing its
  // frontmatter, which is red for a reason unrelated to what it measures.
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

/** Text of the `Decision:` block, where demarcation against a sibling belongs. */
function decisionBlock(text) {
  const start = text.search(/^Decision:/m);
  if (start < 0) return "";
  const rest = text.slice(start);
  const end = rest.search(/^Use when:/m);
  return end < 0 ? rest : rest.slice(0, end);
}

function rulePointers(text) {
  return [...new Set([...text.matchAll(/rules\/([a-z0-9-]+)\.md/g)].map((m) => m[1]))];
}

// --- discovery -------------------------------------------------------------

const rulesDir = join(SKILL_DIR, "rules");
const ruleNames = (await readdir(rulesDir))
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .sort();

const ruleText = new Map();
for (const name of ruleNames) ruleText.set(name, await read(join(rulesDir, `${name}.md`)));

const skillText = await read(join(SKILL_DIR, "SKILL.md"));
const indexText = skillText; // the gate table now lives in SKILL.md

const scenarioFiles = (await readdir(EVALS_DIR))
  .filter((f) => f.endsWith(".scenarios.mjs"))
  .map((f) => join(EVALS_DIR, f))
  .sort();

const scannedDocs = [
  ["SKILL.md", skillText],
  ...ruleNames.map((n) => [`rules/${n}.md`, ruleText.get(n)]),
];

// ---------------------------------------------------------------------------
// INV-01 frontmatter complete on every rule
// ---------------------------------------------------------------------------
{
  const bad = [];
  for (const name of ruleNames) {
    const fm = parseFrontmatter(ruleText.get(name));
    if (!fm) {
      bad.push(`rules/${name}.md has no frontmatter block`);
      continue;
    }
    const missing = REQUIRED_FRONTMATTER.filter((f) => !(f in fm) || fm[f] === "");
    if (missing.length) bad.push(`rules/${name}.md missing ${missing.join(", ")}`);
  }
  if (bad.length) fail("INV-01 rule frontmatter complete (id, owner, canonical, severity, references)", bad.join("\n        "));
  else pass("INV-01 rule frontmatter complete (id, owner, canonical, severity, references)", `${ruleNames.length} rules`);
}

// ---------------------------------------------------------------------------
// INV-02 ids unique, owner-prefixed, and matching the filename
// ---------------------------------------------------------------------------
{
  const bad = [];
  const seen = new Map();
  for (const name of ruleNames) {
    const fm = parseFrontmatter(ruleText.get(name)) ?? {};
    const id = fm.id ?? "";
    seen.set(id, (seen.get(id) ?? 0) + 1);
    if (!id.endsWith(`.${name}`)) bad.push(`rules/${name}.md id "${id}" does not end in ".${name}"`);
    if (fm.owner && !id.startsWith(`${fm.owner}.`)) bad.push(`rules/${name}.md id "${id}" is not prefixed by owner "${fm.owner}"`);
  }
  for (const [id, n] of seen) if (n > 1) bad.push(`duplicate id "${id}" (${n} rules)`);
  if (bad.length) fail("INV-02 rule ids unique and matching filename", bad.join("\n        "));
  else pass("INV-02 rule ids unique and matching filename", `${seen.size} ids`);
}

// ---------------------------------------------------------------------------
// INV-03 five mandated blocks, present and in order
// ---------------------------------------------------------------------------
{
  const bad = [];
  for (const name of ruleNames) {
    const text = ruleText.get(name);
    const at = (block) => text.search(new RegExp(`^${block.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
    const positions = MANDATED_BLOCKS.map((b) => [b, at(b)]);
    const missing = positions.filter(([, i]) => i < 0).map(([b]) => b);
    if (missing.length) {
      bad.push(`rules/${name}.md missing ${missing.join(", ")}`);
      continue;
    }
    for (let i = 1; i < positions.length; i++) {
      if (positions[i][1] < positions[i - 1][1]) {
        bad.push(`rules/${name}.md has ${positions[i][0]} before ${positions[i - 1][0]}`);
      }
    }
    const avoidAt = at("Avoid:");
    const verifyAt = at("Verify:");
    for (const optional of OPTIONAL_BLOCKS) {
      const i = at(optional);
      if (i >= 0 && (i < avoidAt || i > verifyAt)) {
        bad.push(`rules/${name}.md places ${optional} outside the Avoid…Verify window`);
      }
    }
  }
  if (bad.length) fail("INV-03 mandated blocks present and ordered (Decision/Use when/Do/Avoid/Verify)", bad.join("\n        "));
  else pass("INV-03 mandated blocks present and ordered (Decision/Use when/Do/Avoid/Verify)", `${ruleNames.length} rules`);
}

// ---------------------------------------------------------------------------
// INV-04 every rules/*.md pointer in INDEX.md resolves, and each rule is routed once
// ---------------------------------------------------------------------------
{
  const bad = [];
  const pointed = [];
  // Only the routing table routes. Prose under the table may name a rule as the
  // entry point without that counting as a second row.
  for (const row of indexText.split("\n").filter((l) => l.trimStart().startsWith("|"))) {
    for (const m of row.matchAll(/rules\/([a-z0-9-]+)\.md/g)) pointed.push(m[1]);
  }
  for (const name of pointed) {
    if (!(await exists(join(rulesDir, `${name}.md`)))) bad.push(`INDEX.md points at rules/${name}.md which does not exist`);
  }
  const counts = new Map();
  for (const name of pointed) counts.set(name, (counts.get(name) ?? 0) + 1);
  for (const [name, n] of counts) if (n > 1) bad.push(`INDEX.md routes rules/${name}.md ${n} times`);
  // Reachability, not table membership.
  //
  // A gate row fires on something visible in the diff. Some rules answer to an
  // absence instead, whether the pipeline covers this change, whether the
  // written standard says what you assume, and nothing in a diff announces
  // those. No wording of a left column reaches them, which is why rows of that
  // kind were opened zero times across ninety measured runs. They belong in the
  // coverage obligation, which names each as checked or not.
  //
  // So a rule outside the table must be named in prose that points at it. A
  // rule named in neither is unreachable and still fails.
  const obligation = new Set();
  for (const line of indexText.split("\n")) {
    if (line.trimStart().startsWith("|")) continue;
    for (const m of line.matchAll(/rules\/([a-z0-9-]+)\.md/g)) obligation.add(m[1]);
  }
  for (const name of ruleNames) {
    if (counts.has(name) || obligation.has(name)) continue;
    bad.push(`rules/${name}.md is in no gate row and no coverage obligation`);
  }
  const viaProse = ruleNames.filter((n) => !counts.has(n) && obligation.has(n)).length;
  if (bad.length) fail("INV-04 INDEX.md routes every rule exactly once and every pointer resolves", bad.join("\n        "));
  else pass("INV-04 INDEX.md routes every rule exactly once and every pointer resolves", `${counts.size} rows${viaProse ? `, ${viaProse} reached by coverage obligation` : ""}`);
}

// ---------------------------------------------------------------------------
// INV-05 every cross-reference inside a rule resolves
// ---------------------------------------------------------------------------
{
  const bad = [];
  let total = 0;
  for (const name of ruleNames) {
    for (const target of rulePointers(ruleText.get(name))) {
      total++;
      if (!(await exists(join(rulesDir, `${target}.md`)))) bad.push(`rules/${name}.md points at rules/${target}.md which does not exist`);
    }
  }
  if (bad.length) fail("INV-05 every cross-reference inside a rule resolves", bad.join("\n        "));
  else pass("INV-05 every cross-reference inside a rule resolves", `${total} pointers`);
}

// ---------------------------------------------------------------------------
// INV-06 bidirectional demarcation
//
// A reference in a rule's `Decision:` block is a demarcation claim: "that
// neighbour owns the adjacent decision". One-way demarcation lets the unnamed
// rule silently absorb the other's traffic, so the target must name the source
// back in its own `Decision:` block. Conditional pointers living in `Do:` or
// `Verify:` are routing, not demarcation, and are exempt, they are reported as
// informational notes instead.
// ---------------------------------------------------------------------------
{
  const bad = [];
  let pairs = 0;
  const decisions = new Map(ruleNames.map((n) => [n, decisionBlock(ruleText.get(n))]));
  for (const name of ruleNames) {
    for (const target of rulePointers(decisions.get(name) ?? "")) {
      if (target === name) continue;
      pairs++;
      const back = rulePointers(decisions.get(target) ?? "");
      if (!back.includes(name)) {
        bad.push(`rules/${name}.md demarcates against rules/${target}.md, which does not name it back`);
      }
    }
  }
  const oneWay = [];
  for (const name of ruleNames) {
    const inDecision = new Set(rulePointers(decisions.get(name) ?? ""));
    for (const target of rulePointers(ruleText.get(name))) {
      if (target !== name && !inDecision.has(target)) oneWay.push(`rules/${name}.md -> rules/${target}.md`);
    }
  }
  if (oneWay.length) note("routing pointers outside Decision blocks (informational, not demarcation)", oneWay.join("\n        "));
  if (bad.length) fail("INV-06 demarcation references are reciprocated", bad.join("\n        "));
  else pass("INV-06 demarcation references are reciprocated", `${pairs} demarcation references`);
}

// ---------------------------------------------------------------------------
// INV-07 portability: no machine path, URL, package manager, CI vendor, or company
// ---------------------------------------------------------------------------
{
  const bad = [];
  const suspects = [];
  const docs = [...scannedDocs, ...(await Promise.all(scenarioFiles.map(async (f) => [`evals/${basename(f)}`, await read(f)])))];

  for (const [label, text] of docs) {
    const prose = stripFences(text);

    for (const { label: kind, re } of ABSOLUTE_PATH_PATTERNS) {
      const m = text.match(re);
      if (m) bad.push(`${label}: ${kind}, ${m[0].trim()}`);
    }
    for (const m of text.matchAll(/https?:\/\/\S+/g)) {
      bad.push(`${label}: embedded URL, ${m[0]}`);
    }
    const lower = text.toLowerCase();
    for (const term of PACKAGE_MANAGERS) {
      if (new RegExp(`(?:^|[^a-z0-9-])${term}(?:[^a-z0-9-]|$)`).test(lower)) bad.push(`${label}: package-manager name, ${term}`);
    }
    for (const term of CI_VENDORS) {
      if (lower.includes(term)) bad.push(`${label}: CI vendor name, ${term}`);
    }
    for (const term of COMPANY_NAMES) {
      if (new RegExp(`(?:^|[^a-z0-9.-])${term.replace(/\./g, "\\.")}(?:[^a-z0-9-]|$)`).test(lower)) bad.push(`${label}: company or product name, ${term}`);
    }
    const corp = prose.match(CORPORATE_SUFFIX);
    if (corp) bad.push(`${label}: corporate-suffix proper noun, ${corp[0]}`);
    if (label.endsWith(".md")) {
      // Manifests are code: `@typedef` and friends are annotations, not handles.
      const handle = prose.match(AT_HANDLE);
      if (handle) bad.push(`${label}: account handle, ${handle[0].trim()}`);
    }

    // Advisory only: multi-word TitleCase runs mid-sentence read like a company
    // or a person. Judging whether one actually IS a proper noun is not
    // mechanical, so these are surfaced for a human rather than failed.
    for (const m of prose.matchAll(/\b[A-Z][a-z]{2,}(?:[ ][A-Z][a-z]{2,})+\b/g)) {
      const before = prose.slice(Math.max(0, m.index - 2), m.index);
      if (/[.!?:#*\n|>-]\s*$/.test(before) || m.index === 0) continue;
      suspects.push(`${label}: "${m[0]}"`);
    }
  }
  if (suspects.length) note("TitleCase runs to eyeball for proper nouns (advisory)", [...new Set(suspects)].join("\n        "));
  if (bad.length) fail("INV-07 portability: no machine path, URL, package manager, CI vendor, or company", [...new Set(bad)].join("\n        "));
  else pass("INV-07 portability: no machine path, URL, package manager, CI vendor, or company", `${docs.length} files`);
}

// ---------------------------------------------------------------------------
// INV-08 and INV-09 are gone. They measured rule and router size, which the
// portable checker already owns as C-07, and they kept a second copy of the
// four thresholds. Those copies drifted three separate times: each change to
// the shared budget left this file asserting the old number, and the last one
// failed a router for nine lines that a folded description had added to its
// frontmatter.
//
// Sizes belong to `tools/verify-skill.mjs`. What stays here is what only this
// skill can check.
// ---------------------------------------------------------------------------
const ruleSizes = ruleNames.map((name) => {
  const text = ruleText.get(name);
  return {
    name,
    lines: lineCount(text),
    words: stripFences(stripFrontmatter(text)).split(/\s+/).filter(Boolean).length,
  };
});
const skillLines = lineCount(skillText);
const indexLines = lineCount(indexText);

// ---------------------------------------------------------------------------
// INV-10 code fences balanced in every shipped markdown file
// ---------------------------------------------------------------------------
{
  const bad = [];
  for (const [label, text] of scannedDocs) {
    const count = (text.match(/```/g) ?? []).length;
    if (count % 2 !== 0) bad.push(`${label} has ${count} fence markers`);
  }
  if (bad.length) fail("INV-10 code fences balanced", bad.join("\n        "));
  else pass("INV-10 code fences balanced", `${scannedDocs.length} files`);
}

// ---------------------------------------------------------------------------
// INV-11 scenario manifests are well formed and leak no skill or rule name
// ---------------------------------------------------------------------------
let scenarioCount = 0;
let positiveCount = 0;
let negativeCount = 0;
{
  const bad = [];
  const ids = new Map();
  const leakTerms = [SKILL_NAME, ...ruleNames.map((n) => `${n}.md`), ...ruleNames.map((n) => `rules/${n}`)];

  for (const file of scenarioFiles) {
    const mod = await import(pathToFileURL(file).href);
    const list = mod.default ?? mod.scenarios ?? [];
    if (!Array.isArray(list) || list.length === 0) {
      bad.push(`evals/${basename(file)} exports no scenario array`);
      continue;
    }
    for (const s of list) {
      scenarioCount++;
      ids.set(s.id, (ids.get(s.id) ?? 0) + 1);
      for (const field of ["id", "bundle", "rule", "tier", "mode", "prompt"]) {
        if (!s[field]) bad.push(`${s.id ?? "(no id)"}: missing ${field}`);
      }
      if (!Array.isArray(s.must) || s.must.length === 0) bad.push(`${s.id}: must is empty`);
      if (!Array.isArray(s.mustNot) || s.mustNot.length === 0) bad.push(`${s.id}: mustNot is empty`);
      if (!s.activation) bad.push(`${s.id}: missing activation expectation`);

      const prompt = String(s.prompt ?? "").toLowerCase();
      const leaked = leakTerms.filter((t) => prompt.includes(t.toLowerCase()));
      if (leaked.length) bad.push(`${s.id}: prompt names ${leaked.join(", ")}`);

      if (s.activation?.shouldActivate === true) {
        positiveCount++;
        if (!s.expectedPrimary) bad.push(`${s.id}: positive scenario has no expectedPrimary`);
        else if (!ruleNames.includes(s.expectedPrimary.replace(/^rules\//, "").replace(/\.md$/, ""))) {
          bad.push(`${s.id}: expectedPrimary "${s.expectedPrimary}" is not a rule in this skill`);
        }
        for (const secondary of s.expectedSecondary ?? []) {
          if (!ruleNames.includes(secondary.replace(/^rules\//, "").replace(/\.md$/, ""))) {
            bad.push(`${s.id}: expectedSecondary "${secondary}" is not a rule in this skill`);
          }
        }
      } else {
        negativeCount++;
        if (!s.nearMiss) bad.push(`${s.id}: negative scenario does not state why it is a near miss`);
        if (s.expectedPrimary) bad.push(`${s.id}: negative scenario must not claim an expectedPrimary`);
      }
      for (const forbidden of s.activation?.forbiddenRoutes ?? []) {
        if (!ruleNames.includes(forbidden.replace(/^rules\//, "").replace(/\.md$/, ""))) {
          bad.push(`${s.id}: forbiddenRoute "${forbidden}" is not a rule in this skill`);
        }
      }
    }
  }
  for (const [id, n] of ids) if (n > 1) bad.push(`duplicate scenario id "${id}" (${n} entries)`);

  if (bad.length) fail("INV-11 scenario manifests well formed and leak no skill or rule name", bad.join("\n        "));
  else pass("INV-11 scenario manifests well formed and leak no skill or rule name", `${scenarioCount} scenarios (${positiveCount} positive, ${negativeCount} negative)`);
}

// ---------------------------------------------------------------------------
// INV-12 every rule carries at least one positive routing scenario
// ---------------------------------------------------------------------------
{
  const owned = new Set();
  for (const file of scenarioFiles) {
    const mod = await import(pathToFileURL(file).href);
    for (const s of mod.default ?? []) {
      if (s.activation?.shouldActivate !== true) continue;
      if (s.expectedPrimary) owned.add(s.expectedPrimary.replace(/^rules\//, "").replace(/\.md$/, ""));
    }
  }
  const uncovered = ruleNames.filter((n) => !owned.has(n));
  if (uncovered.length) fail("INV-12 every rule owns at least one positive routing scenario", uncovered.map((n) => `rules/${n}.md has no scenario naming it as expectedPrimary`).join("\n        "));
  else pass("INV-12 every rule owns at least one positive routing scenario", `${owned.size}/${ruleNames.length} rules covered`);
}

// ---------------------------------------------------------------------------
// INV-13 a scenario never expects and forbids the same route
// ---------------------------------------------------------------------------
{
  const bad = [];
  for (const file of scenarioFiles) {
    const mod = await import(pathToFileURL(file).href);
    for (const s of mod.default ?? []) {
      const expected = [s.expectedPrimary, ...(s.expectedSecondary ?? [])].filter(Boolean);
      const forbidden = s.activation?.forbiddenRoutes ?? [];
      const clash = expected.filter((e) => forbidden.includes(e));
      if (clash.length) bad.push(`${s.id}: ${clash.join(", ")} is both expected and forbidden`);
    }
  }
  if (bad.length) fail("INV-13 expected and forbidden routes are disjoint", bad.join("\n        "));
  else pass("INV-13 expected and forbidden routes are disjoint", "no scenario claims a route twice");
}

// ---------------------------------------------------------------------------
// INV-14 commit-derived evidence is always qualified by mode
// pre-commit has no commit yet, so an unqualified "read the commit messages"
// is an instruction the author cannot follow.
// ---------------------------------------------------------------------------
{
  const bad = [];
  // SKILL.md carries the same hazard: pre-commit has no commit for the new work,
  // so an unqualified "read the commit summary" is unfollowable there too.
  const targets = [...ruleNames.map((n) => [`rules/${n}.md`, ruleText.get(n)]), ["SKILL.md", skillText]];
  for (const [label, body] of targets) {
    const lines = body.split(/\r?\n/);
    // frontmatter carries citations, not instructions, start after it closes
    const start = lines[0]?.trim() === "---" ? lines.indexOf("---", 1) + 1 : 0;
    let fenced = false;
    for (let i = start; i < lines.length; i++) {
      const l = lines[i];
      // inside a fence the mode is carried by the block's own labelling, not by
      // the sentence, so a line-based check cannot judge it
      if (/^\s*```/.test(l)) { fenced = !fenced; continue; }
      if (fenced) continue;
      if (!/commit (message|messages|summary)/i.test(l)) continue;
      if (/`?pre-commit`?/i.test(l) || /where commits exist/i.test(l)) continue;
      bad.push(`${label}:${i + 1} cites commit-derived evidence without qualifying it by mode`);
    }
  }
  if (bad.length) fail("INV-14 commit-derived evidence is mode-qualified", bad.join("\n        "));
  else pass("INV-14 commit-derived evidence is mode-qualified", "pre-commit needs no new commit");
}

// ---------------------------------------------------------------------------
// INV-15 no rule instructs a workspace mutation
// ---------------------------------------------------------------------------
{
  const MUTATION = /\b(revert the|restore it|undo the|stash|reset --hard|checkout -|apply the fix|amend)\b/i;
  const NEGATED = /\b(do not|don't|never|without|rather than|instead of|no rule|reports, it does not)\b/i;
  const bad = [];
  for (const name of ruleNames) {
    for (const [i, l] of ruleText.get(name).split(/\r?\n/).entries()) {
      if (MUTATION.test(l) && !NEGATED.test(l)) bad.push(`rules/${name}.md:${i + 1} reads as a mutation instruction`);
    }
  }
  if (bad.length) fail("INV-15 no rule instructs a workspace mutation", bad.join("\n        "));
  else pass("INV-15 no rule instructs a workspace mutation", "report-only holds across all rules");
}

// ---------------------------------------------------------------------------
// INV-16 a partial run cannot claim a clean bill of health
// ---------------------------------------------------------------------------
{
  const bad = [];
  if (!/focused/i.test(skillText)) bad.push("SKILL.md never names the focused mode");
  else if (!/focused[^.]*\b(no overall status|emits no overall|never .{0,20}PASS|cannot .{0,20}clear)/i.test(skillText))
    bad.push("SKILL.md names focused but does not deny it an overall status");
  if (!/focused/i.test(indexText)) bad.push("INDEX.md does not say how far focused reads");
  for (const name of ruleNames) {
    if (/\bPASS\b/.test(ruleText.get(name))) bad.push(`rules/${name}.md claims a run status; status is owned by SKILL.md`);
  }
  if (bad.length) fail("INV-16 a focused run claims no overall status", bad.join("\n        "));
  else pass("INV-16 a focused run claims no overall status", "partial scope reports partial truth");
}

// ---------------------------------------------------------------------------
// INV-17 availability and recoverability are judged independently
// ---------------------------------------------------------------------------
{
  const bad = [];
  const boundary = ruleText.get("contracts-and-consumers") ?? "";
  if (/\*\*L5\*\*/.test(boundary)) bad.push("rules/contracts-and-consumers.md still ranks rollback as a layer");
  if (!/recoverability/i.test(boundary)) bad.push("rules/contracts-and-consumers.md never names recoverability");
  else if (!/recoverability[^.]*\b(own verdict|not a fifth|independent)/i.test(boundary))
    bad.push("rules/contracts-and-consumers.md names recoverability but not as a separate verdict");
  if (bad.length) fail("INV-17 availability and recoverability judged independently", bad.join("\n        "));
  else pass("INV-17 availability and recoverability judged independently", "the ladder stops at L4");
}

// ---------------------------------------------------------------------------
// INV-18 scenario coverage matches the declared modes
// A full mode inspects every applicable axis, so only `focused` may forbid a
// sibling route. Every declared mode must own at least one scenario, or the
// suite silently stops testing a mode the skill still offers.
// ---------------------------------------------------------------------------
{
  const DECLARED = ["review", "pre-commit", "focused"];
  const seen = new Map(DECLARED.map((m) => [m, 0]));
  const bad = [];
  for (const file of scenarioFiles) {
    const mod = await import(pathToFileURL(file).href);
    for (const s of mod.default ?? []) {
      const mode = s.skillMode;
      if (s.activation?.shouldActivate === true) {
        if (!DECLARED.includes(mode)) { bad.push(`${s.id}: activates but skillMode is ${JSON.stringify(mode)}`); continue; }
        seen.set(mode, seen.get(mode) + 1);
        const forbidden = s.activation?.forbiddenRoutes ?? [];
        if (mode !== "focused" && forbidden.length) bad.push(`${s.id}: ${mode} is a full mode and cannot forbid ${forbidden.join(", ")}`);
      } else if (mode !== "none") {
        bad.push(`${s.id}: does not activate, so skillMode must be "none"`);
      }
    }
  }
  for (const [m, n] of seen) if (n === 0) bad.push(`mode ${m} is declared in SKILL.md but owns no scenario`);
  if (bad.length) fail("INV-18 scenario coverage matches the declared modes", bad.join("\n        "));
  else pass("INV-18 scenario coverage matches the declared modes", [...seen].map(([m, n]) => `${m}:${n}`).join(" "));
}

// ---------------------------------------------------------------------------
// INV-19 an axis that needs an authority can reach one written outside the repo
//
// The first version of this skill assumed every authority lived in the tree, so
// an organisation-wide security, network, or cost standard, and a service page
// another team owns, silently became "undocumented", which downgrades a hard
// violation to a judgement call. Any rule that sends the reviewer looking for a
// standard, an owner, or a requirement must therefore name the rule that owns
// sources outside this repository.
// ---------------------------------------------------------------------------
{
  const AUTHORITY_SEEKERS = ["standards-conformance", "dependent-teams", "spec-conformance"];
  const OWNER = "external-sources";
  const bad = [];
  if (!ruleNames.includes(OWNER)) bad.push(`rules/${OWNER}.md is missing; no rule owns authority outside the repository`);
  else {
    for (const name of AUTHORITY_SEEKERS) {
      if (!ruleNames.includes(name)) {
        bad.push(`INV-19 names rules/${name}.md, which no longer exists, update the seeker list`);
        continue;
      }
      if (!rulePointers(ruleText.get(name)).includes(OWNER)) {
        bad.push(`rules/${name}.md sends the reviewer looking for an authority but never names rules/${OWNER}.md`);
      }
    }
    // The owner must not become a second home for in-repo convention.
    if (!rulePointers(decisionBlock(ruleText.get(OWNER))).includes("standards-conformance")) {
      bad.push(`rules/${OWNER}.md does not demarcate against rules/standards-conformance.md`);
    }
  }
  if (bad.length) fail("INV-19 authority outside the repository is reachable from the axis that needs it", bad.join("\n        "));
  else pass("INV-19 authority outside the repository is reachable from the axis that needs it", `${AUTHORITY_SEEKERS.length} seekers reach rules/${OWNER}.md`);
}

// ---------------------------------------------------------------------------
// INV-20 fetched material is judged, dated, and stripped of secrets
//
// Anything reached outside the repository is observed content: it may contain
// text addressed to the reader, it may be stale, and it may carry credentials.
// All three have to be handled where the fetching is owned, or they are handled
// nowhere.
// ---------------------------------------------------------------------------
{
  const bad = [];
  const owner = ruleText.get("external-sources") ?? "";
  if (!owner) bad.push("rules/external-sources.md is missing");
  else {
    const checks = [
      [/\b(never obey|not an order|is a finding, and|to report, never)\b/i, "does not say fetched text is judged rather than obeyed"],
      [/\b(credential|secret|key, or personal)\b/i, "does not forbid copying a credential or personal detail into the report"],
      [/\b(date unknown|sync date|synced)\b/i, "does not require an external citation to carry its date"],
      [/\bempty search\b|\bnot an absence\b/i, "does not treat an empty search as a Gap rather than proof of absence"],
    ];
    for (const [re, why] of checks) if (!re.test(owner)) bad.push(`rules/external-sources.md ${why}`);
  }
  if (bad.length) fail("INV-20 fetched material is judged, dated, and stripped of secrets", bad.join("\n        "));
  else pass("INV-20 fetched material is judged, dated, and stripped of secrets", "observed content is evidence, not instruction");
}

// --- report ----------------------------------------------------------------

const line = (n) => "-".repeat(n);

console.log(`\n=== Structural invariants: ${SKILL_NAME} ===\n`);
for (const p of passes) console.log(`  PASS  ${p.name}${p.detail ? `  [${p.detail}]` : ""}`);
for (const f of failures) {
  console.log(`  FAIL  ${f.name}`);
  console.log(`        ${f.detail}`);
}
for (const n of notes) {
  console.log(`  NOTE  ${n.name}`);
  console.log(`        ${n.detail}`);
}

if (failures.length === 0) {
  const nameWidth = Math.max(12, ...ruleSizes.map((r) => r.name.length));
  console.log(`\n  ${"rule".padEnd(nameWidth)}  lines  words  severity`);
  console.log(`  ${line(nameWidth)}  -----  -----  --`);
  for (const r of ruleSizes) {
    const fm = parseFrontmatter(ruleText.get(r.name)) ?? {};
    console.log(`  ${r.name.padEnd(nameWidth)}  ${String(r.lines).padStart(5)}  ${String(r.words).padStart(5)}  ${fm.severity ?? "?"}`);
  }
  console.log(`\n  SKILL.md ${skillLines} lines · INDEX.md ${indexLines} lines · ${ruleNames.length} rules`);
  console.log(`  scenarios: ${scenarioCount} total, ${positiveCount} positive, ${negativeCount} near-miss negative`);
}

console.log(`\n${passes.length} passed, ${failures.length} failed (of ${passes.length + failures.length} invariants)\n`);
process.exit(failures.length === 0 ? 0 : 1);
