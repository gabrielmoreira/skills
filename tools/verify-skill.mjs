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
// The floor now counts prose lines only, so it had to come down with the change.
// A rule that teaches mostly through a worked example is not thin: its content
// sits in the fence. C-02 already rejects a stub by requiring all five blocks.
const RULE_MIN_LINES = 24;
const RULE_MAX_LINES = 70;
// The gate table now lives in SKILL.md. A routing table is routing, not
// explanation, so the ceiling counts it separately from the prose that got
// the old 100-line limit.
const SKILL_MAX_LINES = 160;
const SKILL_MIN_ROWS = 4;
// A description is the whole activation surface. Anything shorter than this is
// a label, and a label cannot separate this skill from the five that overlap it.
const DESC_MIN_CHARS = 40;

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun", "pip", "pipenv", "poetry", "conda", "cargo", "gradle", "maven", "composer", "nuget", "bundler", "rubygems", "apt-get", "homebrew", "chocolatey", "winget", "deno"];
const CI_VENDORS = ["jenkins", "circleci", "circle ci", "travis ci", "teamcity", "buildkite", "github actions", "gitlab ci", "azure pipelines", "azure devops", "bitbucket pipelines", "appveyor", "spinnaker", "argocd", "argo cd", "drone ci", "codebuild", "codepipeline", "cloudbuild"];
const COMPANY_NAMES = ["github", "gitlab", "bitbucket", "atlassian", "jira", "confluence", "slack", "notion", "linear.app", "asana", "trello", "google", "microsoft", "amazon", "aws", "azure", "meta", "facebook", "apple", "netflix", "uber", "airbnb", "spotify", "stripe", "shopify", "oracle", "salesforce", "vercel", "netlify", "cloudflare", "datadog", "sentry", "splunk", "newrelic", "pagerduty", "openai", "anthropic", "claude", "copilot", "cursor"];

const ABSOLUTE_PATHS = [
  { label: "windows absolute path", re: /\b[A-Za-z]:[\\/](?:Users|Program|Windows)\b/i },
  { label: "posix home or system path", re: /(?:^|[\s"'`(])(?:\/(?:Users|home|opt|srv|mnt|var|etc)\/|~\/)/m },
];
// A loopback or documentation host is not a coupling to anyone's service.
const LOCAL_HOST = /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|example\.(?:com|org|net))(?:[:/]|$)/i;
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

/**
 * Strict parser for the frontmatter subset skills actually use.
 *
 * The point is what it does with something it does not understand: it fails.
 * A parser that skips the line it cannot read reports a valid document while
 * the key nobody validated quietly does nothing, which is how a broken
 * `description` ships and the skill silently stops activating.
 *
 * Understood: `key: value`, quoted scalars, block scalars (`|` and `>` with
 * optional chomping), block sequences, one level of nested mapping, comments
 * and blank lines. Everything else is an error with a line number.
 */
function parseYamlFrontmatter(text) {
  const err = (line, msg) => ({ ok: false, error: msg, line });

  if (!text.startsWith("---")) return err(1, "file does not open with ---");
  const m = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) return err(1, "frontmatter block is not closed by a --- line");

  const body = m[1];
  const lines = body.split(/\r?\n/);
  const data = {};
  const KEY = /^([A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(.*))?$/;
  const indentOf = (l) => l.length - l.trimStart().length;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const at = i + 2; // 1-based, plus the opening --- line
    if (!raw.trim() || raw.trimStart().startsWith("#")) continue;
    if (/^\s*\t/.test(raw)) return err(at, "tab used for indentation, which YAML forbids");
    if (indentOf(raw) !== 0) return err(at, `unexpected indentation: "${raw.trim()}"`);

    const kv = raw.match(KEY);
    if (!kv) return err(at, `not a "key: value" pair: "${raw.trim()}"`);
    const [, key, rawVal] = kv;
    if (key in data) return err(at, `duplicate key "${key}"`);
    const value = (rawVal ?? "").trim();

    // A block scalar header consumes every more-indented line that follows.
    if (/^[|>][-+]?\d*$/.test(value)) {
      const folded = value.startsWith(">");
      const parts = [];
      while (i + 1 < lines.length && (!lines[i + 1].trim() || indentOf(lines[i + 1]) > 0)) {
        parts.push(lines[++i].trim());
      }
      data[key] = folded ? parts.join(" ").replace(/\s+/g, " ").trim() : parts.join("\n");
      continue;
    }

    // An empty value opens a nested block: a sequence or a mapping.
    if (value === "") {
      const child = [];
      while (i + 1 < lines.length && (!lines[i + 1].trim() || indentOf(lines[i + 1]) > 0)) {
        const l = lines[++i];
        if (l.trim()) child.push(l.trim());
      }
      if (!child.length) return err(at, `key "${key}" has no value and no indented block`);
      if (child.every((l) => l.startsWith("- "))) {
        data[key] = child.map((l) => unquote(l.slice(2).trim()));
      } else if (child.every((l) => KEY.test(l))) {
        const obj = {};
        for (const l of child) { const c = l.match(KEY); obj[c[1]] = unquote((c[2] ?? "").trim()); }
        data[key] = obj;
      } else {
        return err(at, `block under "${key}" mixes list items and mapping keys`);
      }
      continue;
    }

    const scalar = unquoteChecked(value);
    if (scalar.error) return err(at, `key "${key}": ${scalar.error}`);
    data[key] = scalar.value;
  }

  return { ok: true, data };
}

const unquote = (v) => {
  if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) || (v.startsWith("'") && v.endsWith("'") && v.length > 1)) {
    return v.slice(1, -1);
  }
  return v;
};

// Characters YAML will not accept at the start of a plain scalar. Backtick and
// at-sign are reserved outright; the rest are indicators.
const RESERVED_START = /^[`@|>%&*!]/;

function plainScalarError(v) {
  if (RESERVED_START.test(v)) return `plain value starts with the reserved character ${v[0]}, so it must be quoted`;
  if (/:\s/.test(v)) return `unquoted ": " in a plain scalar, which YAML reads as a nested key`;
  return null;
}

/** Split a flow sequence on its top-level commas, respecting quotes and nesting. */
function flowItems(inner) {
  const out = [];
  let depth = 0, quote = null, cur = "";
  for (const ch of inner) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === "[" || ch === "{") depth++;
    if (ch === "]" || ch === "}") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function unquoteChecked(v) {
  const q = v[0];

  // A flow sequence is checked element by element. Treating the whole bracket
  // as one opaque scalar is how a reserved character inside it goes unseen.
  if (v.startsWith("[") && v.endsWith("]")) {
    const items = flowItems(v.slice(1, -1));
    for (const it of items) {
      if (it.startsWith('"') || it.startsWith("'")) {
        if (it.length < 2 || !it.endsWith(it[0])) return { error: `unterminated quote in list item ${JSON.stringify(it)}` };
        continue;
      }
      const e = plainScalarError(it);
      if (e) return { error: `list item ${JSON.stringify(it)}: ${e}` };
    }
    return { value: items.map(unquote) };
  }

  if (q !== '"' && q !== "'") {
    const e = plainScalarError(v);
    return e ? { error: e } : { value: v };
  }
  if (v.length < 2 || !v.endsWith(q)) return { error: `unterminated ${q === '"' ? "double" : "single"} quote` };
  return { value: v.slice(1, -1) };
}

/** Back-compatible accessor: the parsed map, or null when it does not parse. */
function parseFrontmatter(text) {
  const r = parseYamlFrontmatter(text);
  return r.ok ? r.data : null;
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

/**
 * Three shapes are legal, and the checker must know which one it is looking at
 * rather than assume the one it was written for.
 *
 *   routed   an entry file plus rules/, one rule per gate row
 *   flat     an entry file and nothing else, for a skill with one topic
 *   multi    an entry file routing to topic directories, each of them routed
 *
 * `evals` and `references` are never topics. They are the skill's own machinery.
 */
const NOT_TOPICS = new Set(["evals", "references", "rules", "node_modules"]);

async function detectShape(dir) {
  const entry = (await exists(join(dir, "SKILL.md"))) ? "SKILL.md"
    : (await exists(join(dir, "INDEX.md"))) ? "INDEX.md"
      : null;
  if (!entry) return { kind: "unreadable", reason: "no SKILL.md and no INDEX.md" };
  if (await exists(join(dir, "rules"))) return { kind: "routed", entry };

  const topics = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    if (!d.isDirectory() || NOT_TOPICS.has(d.name)) continue;
    if (await exists(join(dir, d.name, "rules"))) topics.push(d.name);
  }
  return topics.length ? { kind: "multi", entry, topics } : { kind: "flat", entry };
}

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
  const passes = [], failures = [], notes = [], skipped = [];
  const pass = (n, d) => passes.push({ n, d });
  const fail = (n, d) => failures.push({ n, d });
  const note = (n, d) => notes.push({ n, d });
  // An absent signal is reported as not-applicable, naming the signal. A check
  // that silently passes because it had nothing to look at is a false green.
  const na = (n, d) => skipped.push({ n, d });

  const shape = await detectShape(SKILL_DIR);
  const blank = { NAME, shape, passes, failures, notes, skipped, sizes: [], ruleText: new Map(), ruleNames: [] };
  if (shape.kind === "unreadable") {
    fail("C-00 the skill has an entry file", `${NAME}: ${shape.reason}`);
    return blank;
  }

  const routed = shape.kind === "routed";
  const rulesDir = join(SKILL_DIR, "rules");
  const ruleNames = routed
    ? (await readdir(rulesDir)).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort()
    : [];
  const ruleText = new Map();
  for (const n of ruleNames) ruleText.set(n, await readFile(join(rulesDir, `${n}.md`), "utf8"));
  const skillText = await readFile(join(SKILL_DIR, shape.entry), "utf8");
  const docs = [[shape.entry, skillText], ...ruleNames.map((n) => [`rules/${n}.md`, ruleText.get(n)])];
  const ENTRY = shape.entry;

  const NO_RULES = "no rules/ directory, so there is nothing of this kind to check";

  if (!routed) na("C-01 frontmatter complete, id matches filename and owner", NO_RULES);
  else { // C-01 frontmatter
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

  if (!routed) na("C-02 five mandated blocks present and ordered", NO_RULES);
  else { // C-02 mandated blocks
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

  if (!routed) na(`C-03 ${ENTRY} routes every rule exactly once`, NO_RULES);
  else { // C-03 index routes each rule once
    const bad = [], pointed = [];
    // Only pointers that address this topic's own rules count. A row may also
    // send the reader to a neighbouring topic, which is routing, not a local rule.
    const soleTarget = new Map();
    for (const row of skillText.split("\n").filter((l) => l.trimStart().startsWith("|"))) {
      const here = [];
      for (const m of row.matchAll(/(?:([a-z0-9-]+)\/)?rules\/([a-z0-9-]+)\.md/g)) {
        if (!m[1] || m[1] === NAME) here.push(m[2]);
      }
      pointed.push(...here);
      // A row naming exactly one destination is that rule's primary route. A row
      // naming several, including a neighbouring topic index, is a deliberate
      // "read both" rather than a redundant entry.
      const destinations = (row.match(/(?:rules\/[a-z0-9-]+\.md|INDEX\.md)/g) ?? []).length;
      if (here.length === 1 && destinations === 1) soleTarget.set(here[0], (soleTarget.get(here[0]) ?? 0) + 1);
    }
    for (const n of new Set(pointed)) if (!(await exists(join(rulesDir, `${n}.md`)))) bad.push(`${ENTRY} points at rules/${n}.md which does not exist`);
    const counts = new Map();
    for (const n of pointed) counts.set(n, (counts.get(n) ?? 0) + 1);
    for (const [n, c] of soleTarget) if (c > 1) bad.push(`${ENTRY} makes rules/${n}.md the sole target of ${c} separate rows`);
    for (const n of ruleNames) if (!counts.has(n)) bad.push(`rules/${n}.md has no row in ${ENTRY}`);
    bad.length ? fail(`C-03 ${ENTRY} routes every rule exactly once`, bad.join("\n        ")) : pass(`C-03 ${ENTRY} routes every rule exactly once`, `${counts.size} rows`);
  }

  { // C-04 references resolve, local and cross-skill
    const bad = [];
    let total = 0;
    for (const [label, text] of docs) {
      for (const t of localPointers(text)) { total++; if (!(await exists(join(rulesDir, `${t}.md`)))) bad.push(`${label} points at rules/${t}.md which does not exist`); }
      for (const f of foreignPointers(text)) {
        total++;
        // In a multi-topic skill a pointer led by one of its own topics is
        // internal, not a reference to a neighbouring skill.
        const internal = shape.kind === "multi" && shape.topics.includes(f.split("/")[0]);
        const base = internal ? SKILL_DIR : COLLECTION;
        if (await exists(join(base, f))) continue;
        bad.push(internal
          ? `${label} points at ${f}, which is not in this skill`
          : `${label} points at ${f}, which is not in this collection`);
      }
    }
    bad.length ? fail("C-04 every rule reference resolves", bad.join("\n        ")) : pass("C-04 every rule reference resolves", `${total} pointers`);
  }

  if (!routed) na("C-05 demarcation references are reciprocated", NO_RULES);
  else { // C-05 bidirectional demarcation
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
      // Vendor coupling is a property of what a rule tells you to do, so this
      // reads instruction prose only. The `references:` field exists to cite
      // outside sources by name, and a worked example has to name something
      // concrete to be worth reading: a rule about containing a payment
      // provider's vocabulary needs that provider in its example.
      const prose = stripFences(stripFrontmatter(text));
      // A machine path is a leak wherever it appears, an example included.
      for (const { label: k, re } of ABSOLUTE_PATHS) { const m = text.match(re); if (m) bad.push(`${label}: ${k}, ${m[0].trim()}`); }
      for (const m of prose.matchAll(/https?:\/\/\S+/g)) { if (!LOCAL_HOST.test(m[0])) bad.push(`${label}: embedded URL, ${m[0]}`); }
      const lower = prose.toLowerCase();
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
      // Count the decision content, the same thing the prose budget counts.
      // Frontmatter is metadata and a code example is already bounded by the
      // read budget below, so charging both against the line cap penalises a
      // rule twice for teaching with real code.
      const lines = lineCount(stripFences(stripFrontmatter(t)));
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
    // Measure the document, not its metadata header. A folded description costs
    // nine lines more than the same words on one line, and the ceiling exists to
    // bound what the reader wades through, not how the frontmatter is formatted.
    const sl = lineCount(stripFrontmatter(skillText));
    // A routed gate points at rules. A multi-topic gate points at topic
    // directories. A flat skill has no gate at all, and demanding one would be
    // demanding that every small skill be split.
    const rowRe = shape.kind === "multi"
      ? new RegExp(`^\\|.*\\b(${shape.topics.join("|")})\\b`)
      : /^\|.*rules\/[a-z0-9-]+\.md/;
    const rows = shape.kind === "flat"
      ? 0
      : skillText.split("\n").filter((l) => rowRe.test(l.trim())).length;

    if (shape.kind !== "flat" && rows < SKILL_MIN_ROWS) {
      bad.push(`${ENTRY} routes only ${rows}; a gate with fewer than ${SKILL_MIN_ROWS} rows is a list, not a gate`);
    }
    // The same ceiling holds for a flat skill. Needing more room is the signal
    // that its decisions have earned a rules/ directory.
    if (sl >= SKILL_MAX_LINES) bad.push(`${ENTRY} ${sl} lines (limit ${SKILL_MAX_LINES})`);

    const shown = shape.kind === "flat" ? `${ENTRY} ${sl} lines, flat skill` : `${ENTRY} ${sl} lines, ${rows} gate rows`;
    bad.length ? fail("C-07 unit sizes within targets", bad.join("\n        ")) : pass("C-07 unit sizes within targets", shown);
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

  if (!routed) na("C-10 no rule claims an overall status", NO_RULES);
  else { // C-10 the router owns the verdict vocabulary
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

  { // C-12 every markdown file that carries frontmatter has valid frontmatter
    const bad = [], withFm = [];
    const all = new Map();
    for (const f of (await readdir(SKILL_DIR)).filter((f) => f.endsWith(".md"))) {
      all.set(f, await readFile(join(SKILL_DIR, f), "utf8"));
    }
    for (const n of ruleNames) all.set(`rules/${n}.md`, ruleText.get(n));

    for (const [label, text] of all) {
      if (!text.startsWith("---")) continue;  // no frontmatter is legal; broken frontmatter is not
      const r = parseYamlFrontmatter(text);
      if (r.ok) withFm.push(label);
      else bad.push(`${label}:${r.line} ${r.error}`);
    }
    bad.length
      ? fail("C-12 frontmatter parses as YAML", bad.join("\n        "))
      : pass("C-12 frontmatter parses as YAML", `${withFm.length} of ${all.size} markdown files carry it`);
  }

  if (ENTRY !== "SKILL.md") na("C-13 the entry declares name and description", "INDEX.md is internal routing, not an installed activation surface");
  else { // C-13 the activation surface exists and is answerable
    const bad = [];
    const r = parseYamlFrontmatter(skillText);
    if (!r.ok) bad.push(`${ENTRY}:${r.line} ${r.error}`);
    else {
      const fm = r.data;
      if (!fm.name) bad.push(`${ENTRY} declares no name`);
      else if (typeof fm.name !== "string") bad.push(`${ENTRY} name is not a scalar`);
      else if (fm.name !== NAME) bad.push(`${ENTRY} name "${fm.name}" is not the directory name "${NAME}"`);

      if (!fm.description) bad.push(`${ENTRY} declares no description; nothing can route to this skill`);
      else if (typeof fm.description !== "string") bad.push(`${ENTRY} description is not a scalar`);
      else if (fm.description.trim().length < DESC_MIN_CHARS) {
        bad.push(`${ENTRY} description is ${fm.description.trim().length} characters, under the ${DESC_MIN_CHARS} needed to distinguish it from a neighbour`);
      }
    }
    bad.length
      ? fail("C-13 the entry declares name and description", bad.join("\n        "))
      : pass("C-13 the entry declares name and description", `name matches the directory`);
  }

  return { NAME, shape, passes, failures, notes, skipped, sizes, ruleText, ruleNames };
}

const targets = process.argv.slice(2);
if (!targets.length) { console.error("usage: node verify-skill.mjs <skill-dir> [...]"); process.exit(2); }

function report(r) {
  console.log(`\n=== ${r.NAME} ===  (${r.shape.kind})\n`);
  for (const p of r.passes) console.log(`  PASS  ${p.n}${p.d ? `  [${p.d}]` : ""}`);
  for (const f of r.failures) { console.log(`  FAIL  ${f.n}`); console.log(`        ${f.d}`); }
  for (const s of r.skipped) { console.log(`  N/A   ${s.n}`); console.log(`        ${s.d}`); }
  for (const n of r.notes) { console.log(`  NOTE  ${n.n}`); console.log(`        ${n.d}`); }
  if (!r.failures.length && r.sizes.length) {
    const w = Math.max(12, ...r.sizes.map((s) => s.n.length));
    console.log("");
    for (const s of r.sizes) {
      const fm = parseFrontmatter(r.ruleText.get(s.n)) ?? {};
      console.log(`  ${s.n.padEnd(w)}  ${String(s.lines).padStart(3)} lines  ${String(s.words).padStart(3)} prose  ${String(s.total).padStart(3)} read  ${fm.severity ?? "?"}`);
    }
  }
  const na = r.skipped.length ? `, ${r.skipped.length} n/a` : "";
  console.log(`\n  ${r.passes.length} passed, ${r.failures.length} failed${na}`);
}

let totalFail = 0;
const queue = [...targets];
while (queue.length) {
  const t = queue.shift();
  let r;
  try {
    r = await verify(t);
  } catch (e) {
    // Anything unexpected is a finding with a name. A stack trace tells the
    // reader nothing about which skill is wrong or what to do about it.
    console.log(`\n=== ${basename(resolve(t))} ===\n`);
    console.log("  FAIL  C-00 the skill could be read");
    console.log(`        ${e.message}`);
    totalFail++;
    continue;
  }
  report(r);
  totalFail += r.failures.length;
  // A multi-topic skill routes to topics, each verified as a skill of its own.
  if (r.shape.kind === "multi") queue.unshift(...r.shape.topics.map((n) => join(resolve(t), n)));
}
console.log(`\n${totalFail === 0 ? "all skills structurally clean" : `${totalFail} failing invariants`}\n`);
process.exit(totalFail === 0 ? 0 : 1);
