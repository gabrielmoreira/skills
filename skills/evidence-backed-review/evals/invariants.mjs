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
// Wording-pinning checks INV-14..17 and INV-19..20 were removed: matching a
// phrase did not verify safe behavior. Their concerns live in scenario outcomes
// for human or model evaluation, which this script does not execute.

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

// A bare `rules/<x>.md` addresses this skill. A pointer led by a skill name
// addresses a neighbour in the collection, which is routing rather than a local
// reference, and INV-05 resolves the two against different roots.
function rulePointers(text) {
  return [...new Set([...text.matchAll(/(?:([a-z0-9-]+)\/)?rules\/([a-z0-9-]+)\.md/g)].filter((m) => !m[1]).map((m) => m[2]))];
}

function foreignPointers(text) {
  return [...new Set([...text.matchAll(/([a-z0-9-]+)\/rules\/([a-z0-9-]+)\.md/g)].map((m) => `${m[1]}/rules/${m[2]}.md`))];
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
  // A pointer into a neighbouring skill can only be resolved where the
  // collection is. This suite also runs against a lone copy of the skill: the
  // mutation harness copies one unit into a temp tree, and an installed skill
  // may sit alone. A missing sibling there is the copy talking, not a broken
  // reference, so the resolution is skipped and the skip is reported. A sibling
  // is a directory carrying its own SKILL.md, never merely an entry beside this
  // one, or a stray temp file would turn the skip into false failures.
  const collectionRoot = join(SKILL_DIR, "..");
  const neighbours = (await readdir(collectionRoot).catch(() => [])).filter((n) => n !== basename(SKILL_DIR));
  let inCollection = false;
  for (const n of neighbours) if (await exists(join(collectionRoot, n, "SKILL.md"))) { inCollection = true; break; }
  const bad = [];
  let total = 0;
  let foreign = 0;
  for (const name of ruleNames) {
    const body = ruleText.get(name);
    for (const target of rulePointers(body)) {
      total++;
      if (!(await exists(join(rulesDir, `${target}.md`)))) bad.push(`rules/${name}.md points at rules/${target}.md which does not exist`);
    }
    for (const target of foreignPointers(body)) {
      foreign++;
      if (inCollection && !(await exists(join(collectionRoot, target)))) bad.push(`rules/${name}.md points at ${target}, which is not in this collection`);
    }
  }
  const across = inCollection ? `${foreign} across the collection` : `${foreign} across the collection unchecked, no siblings here`;
  if (bad.length) fail("INV-05 every cross-reference inside a rule resolves", bad.join("\n        "));
  else pass("INV-05 every cross-reference inside a rule resolves", `${total} local, ${across}`);
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
      for (const expected of s.expectedAll ?? []) {
        if (!ruleNames.includes(expected.replace(/^rules\//, "").replace(/\.md$/, ""))) {
          bad.push(`${s.id}: expectedAll "${expected}" is not a rule in this skill`);
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
      const expected = [...new Set([s.expectedPrimary, ...(s.expectedSecondary ?? []), ...(s.expectedAll ?? [])].filter(Boolean))];
      const forbidden = s.activation?.forbiddenRoutes ?? [];
      const clash = expected.filter((e) => forbidden.includes(e));
      if (clash.length) bad.push(`${s.id}: ${clash.join(", ")} is both expected and forbidden`);
    }
  }
  if (bad.length) fail("INV-13 expected and forbidden routes are disjoint", bad.join("\n        "));
  else pass("INV-13 expected and forbidden routes are disjoint", "no scenario claims a route twice");
}


// ---------------------------------------------------------------------------
// INV-18 manifest depth and scope are independent.
// This checks the declared scenario contract, not what a model would do.
// A complete pass must expect every category even with a limited subject.
// ---------------------------------------------------------------------------
{
  const DECLARED = ["standard", "complete"];
  const seen = new Map(DECLARED.map((m) => [m, 0]));
  const bad = [];
  for (const file of scenarioFiles) {
    const mod = await import(pathToFileURL(file).href);
    for (const s of mod.default ?? []) {
      const mode = s.skillMode;
      if (s.activation?.shouldActivate === true) {
        if (!DECLARED.includes(mode)) { bad.push(`${s.id}: activates but skillMode is ${JSON.stringify(mode)}`); continue; }
        seen.set(mode, seen.get(mode) + 1);
        const scope = s.reviewScope ?? "whole";
        if (!["whole", "limited"].includes(scope)) bad.push(`${s.id}: invalid reviewScope ${JSON.stringify(scope)}`);
        const forbidden = s.activation?.forbiddenRoutes ?? [];
        if (mode === "complete") {
          if (forbidden.length) bad.push(`${s.id}: complete depth cannot forbid a category`);
          const expected = new Set(s.expectedAll ?? []);
          for (const name of ruleNames) {
            if (!expected.has(`rules/${name}.md`)) bad.push(`${s.id}: complete depth omits rules/${name}.md from expectedAll`);
          }
        }
      } else if (mode !== "none") {
        bad.push(`${s.id}: does not activate, so skillMode must be "none"`);
      }
    }
  }
  for (const [m, n] of seen) if (n === 0) bad.push(`declared depth ${m} owns no scenario`);
  if (bad.length) fail("INV-18 manifest depth and scope contracts are valid", bad.join("\n        "));
  else pass("INV-18 manifest depth and scope contracts are valid", [...seen].map(([m, n]) => `${m}:${n}`).join(" "));
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
