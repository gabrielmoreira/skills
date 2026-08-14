#!/usr/bin/env node
/**
 * Portable structural invariants for any skill in this collection.
 *
 *   node verify-skill.mjs <skill-dir> [<skill-dir> ...]
 *
 * This is the subset of the checks that are not specific to one skill's
 * subject. A skill may add its own on top; it may not drop these.
 *
 * Scenario checks are skipped, loudly, when a skill has no evals yet, a
 * missing suite is reported as unproven, never as passing.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const REQUIRED_FRONTMATTER = ["id", "owner", "canonical", "severity", "references"];
const MANDATED = ["Decision:", "Use when:", "Do:", "Avoid:", "Verify:"];
const OPTIONAL = ["Exceptions:", "Example"];  // "Example:" or "Example (one instance, not the set):"

// Raised when the prose-to-bullet reshape landed. Bullet markers and split
// sentences cost words for the same information, and the cap exists to stop a
// rule owning two decisions, not to stop it being scannable.
const RULE_MAX_WORDS = 450;
const RULE_MAX_TOTAL = 600;
const RULE_MIN_LINES = 30;
const RULE_MAX_LINES = 70;
// The gate table now lives in SKILL.md. A routing table is routing, not
// explanation, so the ceiling counts it separately from the prose that got
// the old 100-line limit.
const SKILL_MAX_LINES = 160;
const SKILL_MIN_ROWS = 4;

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun", "pip", "pipenv", "poetry", "conda", "cargo", "gradle", "maven", "composer", "nuget", "bundler", "rubygems", "apt-get", "homebrew", "chocolatey", "winget", "deno"];
const CI_VENDORS = ["jenkins", "circleci", "circle ci", "travis ci", "teamcity", "buildkite", "github actions", "gitlab ci", "azure pipelines", "azure devops", "bitbucket pipelines", "appveyor", "spinnaker", "argocd", "argo cd", "drone ci", "codebuild", "codepipeline", "cloudbuild"];
const COMPANY_NAMES = ["github", "gitlab", "bitbucket", "atlassian", "jira", "confluence", "slack", "notion", "linear.app", "asana", "trello", "google", "microsoft", "amazon", "aws", "azure", "meta", "facebook", "apple", "netflix", "uber", "airbnb", "spotify", "stripe", "shopify", "oracle", "salesforce", "vercel", "netlify", "cloudflare", "datadog", "sentry", "splunk", "newrelic", "pagerduty", "openai", "anthropic", "claude", "copilot", "cursor"];

const ABSOLUTE_PATHS = [
  { label: "windows absolute path", re: /\b[A-Za-z]:[\\/](?:Users|Program|Windows)\b/i },
  { label: "posix home or system path", re: /(?:^|[\s"'`(])(?:\/(?:Users|home|opt|srv|mnt|var|etc)\/|~\/)/m },
];
const CORPORATE_SUFFIX = /\b[A-Z][A-Za-z0-9]+\s+(?:Inc\.?|LLC|Ltd\.?|GmbH|S\.A\.|Corp\.?|Corporation|Labs|Studio|Studios|Technologies|Holdings)\b/;
const AT_HANDLE = /(?:^|\s)@[A-Za-z][A-Za-z0-9_-]{2,}/;

// The user's stated objection: an agent takes the lowest-effort reading of
// vague guidance, so a hedge is not politeness, it is an escape hatch.
const HEDGES = [
  /\bconsider (?:using|adding|making|whether|the)\b/i,
  /\byou (?:may|might) want to\b/i,
  /\bit is recommended\b/i,
  /\bwhere appropriate\b/i,
  /\bas needed\b/i,
  /\btry to\b/i,
  /\bif possible\b/i,
  /\bgenerally speaking\b/i,
];

const stripFences = (t) => t.replace(/```[\s\S]*?```/g, "");
const stripFrontmatter = (t) => {
  const m = t.match(/^---\n[\s\S]*?\n---\n?/);
  return m ? t.slice(m[0].length) : t;
};
const lineCount = (t) => t.replace(/\n$/, "").split("\n").length;

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const f = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (kv) f[kv[1]] = kv[2].trim();
  }
  return f;
}

function decisionBlock(text) {
  const s = text.search(/^Decision:/m);
  if (s < 0) return "";
  const rest = text.slice(s);
  const e = rest.search(/^Use when:/m);
  return e < 0 ? rest : rest.slice(0, e);
}

/** Local rule pointers only. A pointer carrying a skill-name segment before
 *  `rules/` addresses another skill and is resolved against the collection. */
function localPointers(text) {
  const out = new Set();
  for (const m of text.matchAll(/(?:([a-z0-9-]+)\/)?rules\/([a-z0-9-]+)\.md/g)) {
    if (!m[1]) out.add(m[2]);
  }
  return [...out];
}
function foreignPointers(text) {
  const out = new Set();
  for (const m of text.matchAll(/([a-z0-9-]+)\/rules\/([a-z0-9-]+)\.md/g)) out.add(`${m[1]}/rules/${m[2]}.md`);
  return [...out];
}

const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

async function verify(skillDir) {
  const SKILL_DIR = resolve(skillDir);
  const NAME = basename(SKILL_DIR);
  // Cross-skill pointers resolve against the collection the skill sits in, never
  // against wherever this script happens to live. Anything else couples the
  // checker to one machine's layout.
  // The override exists for the mutation harness, which verifies a throwaway copy
  // of one skill and still needs its siblings resolved from the real collection.
  const COLLECTION = process.env.SKILL_COLLECTION_ROOT
    ? resolve(process.env.SKILL_COLLECTION_ROOT)
    : dirname(SKILL_DIR);
  const passes = [], failures = [], notes = [];
  const pass = (n, d) => passes.push({ n, d });
  const fail = (n, d) => failures.push({ n, d });
  const note = (n, d) => notes.push({ n, d });

  const rulesDir = join(SKILL_DIR, "rules");
  const ruleNames = (await readdir(rulesDir)).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();
  const ruleText = new Map();
  for (const n of ruleNames) ruleText.set(n, await readFile(join(rulesDir, `${n}.md`), "utf8"));
  const skillText = await readFile(join(SKILL_DIR, "SKILL.md"), "utf8");
  const docs = [["SKILL.md", skillText], ...ruleNames.map((n) => [`rules/${n}.md`, ruleText.get(n)])];

  { // C-01 frontmatter
    const bad = [];
    for (const n of ruleNames) {
      const fm = parseFrontmatter(ruleText.get(n));
      if (!fm) { bad.push(`rules/${n}.md has no frontmatter`); continue; }
      const missing = REQUIRED_FRONTMATTER.filter((k) => !(k in fm) || fm[k] === "");
      if (missing.length) bad.push(`rules/${n}.md missing ${missing.join(", ")}`);
      if (fm.id && !fm.id.endsWith(`.${n}`)) bad.push(`rules/${n}.md id "${fm.id}" does not end in ".${n}"`);
      if (fm.id && fm.owner && !fm.id.startsWith(`${fm.owner}.`)) bad.push(`rules/${n}.md id not prefixed by owner`);
      if (fm.owner && fm.owner !== NAME) bad.push(`rules/${n}.md owner "${fm.owner}" is not "${NAME}"`);
    }
    bad.length ? fail("C-01 frontmatter complete, id matches filename and owner", bad.join("\n        ")) : pass("C-01 frontmatter complete, id matches filename and owner", `${ruleNames.length} rules`);
  }

  { // C-02 mandated blocks
    const bad = [];
    for (const n of ruleNames) {
      const t = ruleText.get(n);
      const at = (b) => t.search(new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m"));
      const pos = MANDATED.map((b) => [b, at(b)]);
      const missing = pos.filter(([, i]) => i < 0).map(([b]) => b);
      if (missing.length) { bad.push(`rules/${n}.md missing ${missing.join(", ")}`); continue; }
      for (let i = 1; i < pos.length; i++) if (pos[i][1] < pos[i - 1][1]) bad.push(`rules/${n}.md has ${pos[i][0]} before ${pos[i - 1][0]}`);
      const a = at("Avoid:"), v = at("Verify:");
      for (const o of OPTIONAL) { const i = at(o); if (i >= 0 && (i < a || i > v)) bad.push(`rules/${n}.md places ${o} outside the Avoid…Verify window`); }
    }
    bad.length ? fail("C-02 five mandated blocks present and ordered", bad.join("\n        ")) : pass("C-02 five mandated blocks present and ordered", `${ruleNames.length} rules`);
  }

  { // C-03 index routes each rule once
    const bad = [], pointed = [];
    for (const row of skillText.split("\n").filter((l) => l.trimStart().startsWith("|"))) {
      for (const m of row.matchAll(/rules\/([a-z0-9-]+)\.md/g)) pointed.push(m[1]);
    }
    for (const n of pointed) if (!(await exists(join(rulesDir, `${n}.md`)))) bad.push(`SKILL.md points at rules/${n}.md which does not exist`);
    const counts = new Map();
    for (const n of pointed) counts.set(n, (counts.get(n) ?? 0) + 1);
    for (const [n, c] of counts) if (c > 1) bad.push(`SKILL.md routes rules/${n}.md ${c} times`);
    for (const n of ruleNames) if (!counts.has(n)) bad.push(`rules/${n}.md has no row in SKILL.md`);
    bad.length ? fail("C-03 SKILL.md routes every rule exactly once", bad.join("\n        ")) : pass("C-03 SKILL.md routes every rule exactly once", `${counts.size} rows`);
  }

  { // C-04 references resolve, local and cross-skill
    const bad = [];
    let total = 0;
    for (const [label, text] of docs) {
      for (const t of localPointers(text)) { total++; if (!(await exists(join(rulesDir, `${t}.md`)))) bad.push(`${label} points at rules/${t}.md which does not exist`); }
      for (const f of foreignPointers(text)) { total++; if (!(await exists(join(COLLECTION, f)))) bad.push(`${label} points at ${f}, which is not in this collection`); }
    }
    bad.length ? fail("C-04 every rule reference resolves", bad.join("\n        ")) : pass("C-04 every rule reference resolves", `${total} pointers`);
  }

  { // C-05 bidirectional demarcation
    const bad = [];
    let pairs = 0;
    const dec = new Map(ruleNames.map((n) => [n, decisionBlock(ruleText.get(n))]));
    for (const n of ruleNames) {
      for (const t of localPointers(dec.get(n) ?? "")) {
        if (t === n) continue;
        pairs++;
        if (!localPointers(dec.get(t) ?? "").includes(n)) bad.push(`rules/${n}.md demarcates against rules/${t}.md, which does not name it back`);
      }
    }
    bad.length ? fail("C-05 demarcation references are reciprocated", bad.join("\n        ")) : pass("C-05 demarcation references are reciprocated", `${pairs} demarcation references`);
  }

  { // C-06 portability
    const bad = [], suspects = [];
    for (const [label, text] of docs) {
      const prose = stripFences(text);
      for (const { label: k, re } of ABSOLUTE_PATHS) { const m = text.match(re); if (m) bad.push(`${label}: ${k}, ${m[0].trim()}`); }
      for (const m of text.matchAll(/https?:\/\/\S+/g)) bad.push(`${label}: embedded URL, ${m[0]}`);
      const lower = text.toLowerCase();
      for (const t of PACKAGE_MANAGERS) if (new RegExp(`(?:^|[^a-z0-9-])${t}(?:[^a-z0-9-]|$)`).test(lower)) bad.push(`${label}: package-manager name, ${t}`);
      for (const t of CI_VENDORS) if (lower.includes(t)) bad.push(`${label}: CI vendor name, ${t}`);
      for (const t of COMPANY_NAMES) if (new RegExp(`(?:^|[^a-z0-9.-])${t.replace(/\./g, "\\.")}(?:[^a-z0-9-]|$)`).test(lower)) bad.push(`${label}: company or product name, ${t}`);
      const c = prose.match(CORPORATE_SUFFIX); if (c) bad.push(`${label}: corporate-suffix proper noun, ${c[0]}`);
      const h = prose.match(AT_HANDLE); if (h) bad.push(`${label}: account handle, ${h[0].trim()}`);
      for (const m of prose.matchAll(/\b[A-Z][a-z]{2,}(?:[ ][A-Z][a-z]{2,})+\b/g)) {
        const before = prose.slice(Math.max(0, m.index - 2), m.index);
        if (/[.!?:#*\n|>-]\s*$/.test(before) || m.index === 0) continue;
        suspects.push(`${label}: "${m[0]}"`);
      }
    }
    if (suspects.length) note("TitleCase runs to eyeball (advisory)", [...new Set(suspects)].join("\n        "));
    bad.length ? fail("C-06 portability: no path, URL, package manager, CI vendor, or company", [...new Set(bad)].join("\n        ")) : pass("C-06 portability: no path, URL, package manager, CI vendor, or company", `${docs.length} files`);
  }

  const sizes = [];
  { // C-07 sizes
    const bad = [];
    for (const n of ruleNames) {
      const t = ruleText.get(n);
      const lines = lineCount(t);
      const words = stripFences(stripFrontmatter(t)).split(/\s+/).filter(Boolean).length;
      // Two budgets, because one number cannot serve both. Prose measures
      // decision density, an example adds no second decision, so it is excluded.
      // Total measures what is actually read, so an example cannot grow free.
      // 520 = the 400 prose cap plus the ~120 words a 20-line example costs.
      const total = stripFrontmatter(t).split(/\s+/).filter(Boolean).length;
      sizes.push({ n, lines, words, total });
      if (words >= RULE_MAX_WORDS) bad.push(`rules/${n}.md ${words} prose words (limit ${RULE_MAX_WORDS})`);
      if (total >= RULE_MAX_TOTAL) bad.push(`rules/${n}.md ${total} words read (limit ${RULE_MAX_TOTAL}), the example is carrying the file`);
      if (lines < RULE_MIN_LINES || lines > RULE_MAX_LINES) bad.push(`rules/${n}.md ${lines} lines (allowed ${RULE_MIN_LINES}-${RULE_MAX_LINES})`);
    }
    const sl = lineCount(skillText);
    const rows = skillText.split("\n").filter((l) => /^\|.*rules\/[a-z0-9-]+\.md/.test(l.trim())).length;
    if (rows < SKILL_MIN_ROWS) bad.push(`SKILL.md routes only ${rows} rules; a gate with fewer than ${SKILL_MIN_ROWS} rows is a list, not a gate`);
    if (sl >= SKILL_MAX_LINES) bad.push(`SKILL.md ${sl} lines (limit ${SKILL_MAX_LINES})`);
    bad.length ? fail("C-07 unit sizes within targets", bad.join("\n        ")) : pass("C-07 unit sizes within targets", `SKILL.md ${sl} lines, ${rows} gate rows`);
  }

  { // C-08 fences balanced
    const bad = [];
    for (const [label, text] of docs) { const c = (text.match(/```/g) ?? []).length; if (c % 2) bad.push(`${label} has ${c} fence markers`); }
    bad.length ? fail("C-08 code fences balanced", bad.join("\n        ")) : pass("C-08 code fences balanced", `${docs.length} files`);
  }

  { // C-09 no hedging
    const bad = [];
    for (const [label, text] of docs) {
      for (const [i, l] of stripFences(text).split(/\r?\n/).entries()) {
        for (const re of HEDGES) { const m = l.match(re); if (m) bad.push(`${label}:${i + 1} hedge, "${m[0]}"`); }
      }
    }
    bad.length ? fail("C-09 no hedging language", bad.join("\n        ")) : pass("C-09 no hedging language", "guidance is not optional-by-wording");
  }

  { // C-10 the router owns the verdict vocabulary
    const bad = [];
    for (const n of ruleNames) if (/\bPASS\b/.test(ruleText.get(n))) bad.push(`rules/${n}.md claims a run status; status belongs to SKILL.md`);
    bad.length ? fail("C-10 no rule claims an overall status", bad.join("\n        ")) : pass("C-10 no rule claims an overall status", "status stays in the router");
  }

  { // C-11 scenarios, when present
    const evalsDir = join(SKILL_DIR, "evals");
    const files = (await exists(evalsDir)) ? (await readdir(evalsDir)).filter((f) => f.endsWith(".scenarios.mjs")) : [];
    if (!files.length) note("no activation scenarios yet, routing and behaviour are UNPROVEN", `${NAME} has no evals/*.scenarios.mjs`);
    else {
      const bad = [];
      const owned = new Set();
      let count = 0, pos = 0, neg = 0;
      for (const f of files) {
        const mod = await import(pathToFileURL(join(evalsDir, f)).href);
        for (const s of mod.default ?? []) {
          count++;
          for (const k of ["id", "prompt"]) if (!s[k]) bad.push(`${s.id ?? "(no id)"}: missing ${k}`);
          if (s.activation?.shouldActivate === true) { pos++; if (s.expectedPrimary) owned.add(s.expectedPrimary.replace(/^rules\//, "").replace(/\.md$/, "")); else bad.push(`${s.id}: positive scenario has no expectedPrimary`); }
          else { neg++; if (!s.nearMiss) bad.push(`${s.id}: negative scenario does not say why it is a near miss`); }
        }
      }
      for (const n of ruleNames) if (!owned.has(n)) bad.push(`rules/${n}.md has no positive scenario`);
      bad.length ? fail("C-11 scenarios cover every rule", bad.join("\n        ")) : pass("C-11 scenarios cover every rule", `${count} scenarios (${pos} positive, ${neg} negative)`);
    }
  }

  return { NAME, passes, failures, notes, sizes, ruleText, ruleNames };
}

const targets = process.argv.slice(2);
if (!targets.length) { console.error("usage: node verify-skill.mjs <skill-dir> [...]"); process.exit(2); }

let totalFail = 0;
for (const t of targets) {
  const r = await verify(t);
  console.log(`\n=== ${r.NAME} ===\n`);
  for (const p of r.passes) console.log(`  PASS  ${p.n}${p.d ? `  [${p.d}]` : ""}`);
  for (const f of r.failures) { console.log(`  FAIL  ${f.n}`); console.log(`        ${f.d}`); }
  for (const n of r.notes) { console.log(`  NOTE  ${n.n}`); console.log(`        ${n.d}`); }
  if (!r.failures.length) {
    const w = Math.max(12, ...r.sizes.map((s) => s.n.length));
    console.log("");
    for (const s of r.sizes) {
      const fm = parseFrontmatter(r.ruleText.get(s.n)) ?? {};
      console.log(`  ${s.n.padEnd(w)}  ${String(s.lines).padStart(3)} lines  ${String(s.words).padStart(3)} prose  ${String(s.total).padStart(3)} read  ${fm.severity ?? "?"}`);
    }
  }
  console.log(`\n  ${r.passes.length} passed, ${r.failures.length} failed`);
  totalFail += r.failures.length;
}
console.log(`\n${totalFail === 0 ? "all skills structurally clean" : `${totalFail} failing invariants`}\n`);
process.exit(totalFail === 0 ? 0 : 1);
