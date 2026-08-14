#!/usr/bin/env node
/**
 * Who validates the validator, for the portable invariants.
 *
 *   node mutate-skill.mjs <skill-dir> [<skill-dir> ...]
 *
 * Each mutation injects exactly the defect one check in verify-skill.mjs exists
 * to catch, then asserts that check, and not merely something, turns red. A
 * green suite proves nothing until a broken skill fails it for the right reason.
 *
 * Mutations are structural rather than string-anchored, so they keep working
 * when a skill is rewritten. One that could not apply is reported as stale,
 * because a check nobody has seen fire is decoration. One that had nothing of
 * its kind to break is reported as not applicable, which is a different fact.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const VERIFY = path.join(TOOLS, "verify-skill.mjs");

const rulesOf = (dir) =>
  fs.readdirSync(path.join(dir, "rules")).filter((f) => f.endsWith(".md")).sort();

/** A topic directory names its entry INDEX.md; a skill names it SKILL.md. */
const entryOf = (dir) =>
  path.join(dir, fs.existsSync(path.join(dir, "SKILL.md")) ? "SKILL.md" : "INDEX.md");

const readRule = (dir, f) => fs.readFileSync(path.join(dir, "rules", f), "utf8");
const writeRule = (dir, f, t) => fs.writeFileSync(path.join(dir, "rules", f), t, "utf8");

/** The `Decision:` paragraph, where demarcation lives. */
const decision = (t) => {
  const s = t.search(/^Decision:/m);
  if (s < 0) return "";
  const rest = t.slice(s);
  const e = rest.search(/^Use when:/m);
  return e < 0 ? rest : rest.slice(0, e);
};

/**
 * A mutation reports one of three things.
 *
 *   true   it applied, and the check must now turn red
 *   NA     there is nothing of this kind here by design, so it cannot apply
 *   false  it should have applied and could not, which means the anchor moved
 *
 * Collapsing the middle case into `false` reported nine inapplicable mutations
 * per run as stale, which buries the one that is genuinely broken.
 */
const NA = "n/a";

const MUTATIONS = [
  {
    check: "C-01",
    needsRules: true,
    what: "a rule loses a required frontmatter field",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^severity:.*$/m.test(t)) return false;
      writeRule(dir, f, t.replace(/^severity:.*$\n/m, ""));
      return true;
    },
  },
  {
    check: "C-02",
    needsRules: true,
    what: "a rule puts Avoid before Do",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^Do:/m.test(t) || !/^Avoid:/m.test(t)) return false;
      // A sentinel, or the second replace undoes the first.
      writeRule(dir, f, t.replace(/^Do:/m, "@@SWAP@@").replace(/^Avoid:/m, "Do:").replace(/^@@SWAP@@/m, "Avoid:"));
      return true;
    },
  },
  {
    check: "C-03",
    needsRules: true,
    what: "the index routes a rule that does not exist",
    apply(dir) {
      const p = entryOf(dir);
      if (!fs.existsSync(p)) return false;
      const t = fs.readFileSync(p, "utf8");
      const rows = t.split("\n");
      const last = rows.map((l, i) => [l, i]).filter(([l]) => l.trimStart().startsWith("|")).pop();
      if (!last) return false;
      rows.splice(last[1] + 1, 0, "| a signal nothing produces | `rules/no-such-rule.md` |");
      fs.writeFileSync(p, rows.join("\n"), "utf8");
      return true;
    },
  },
  {
    check: "C-04",
    needsRules: true,
    what: "a rule points at a sibling that does not exist",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^Verify:/m.test(t)) return false;
      writeRule(dir, f, t.replace(/^Verify:/m, "Verify:\n- Cross-check against `rules/vanished-neighbour.md`."));
      return true;
    },
  },
  {
    check: "C-05",
    needsRules: true,
    what: "demarcation becomes one-way",
    apply(dir) {
      // Find a reciprocated pair, then delete one direction.
      const names = rulesOf(dir).map((f) => f.replace(/\.md$/, ""));
      const dec = new Map(names.map((n) => [n, decision(readRule(dir, `${n}.md`))]));
      const ptr = (s) => [...new Set([...s.matchAll(/(?<![a-z-]\/)rules\/([a-z0-9-]+)\.md/g)].map((m) => m[1]))];
      for (const a of names) {
        for (const b of ptr(dec.get(a) ?? "")) {
          if (b !== a && ptr(dec.get(b) ?? "").includes(a)) {
            const t = readRule(dir, `${b}.md`);
            const d = decision(t);
            writeRule(dir, `${b}.md`, t.replace(d, d.replace(new RegExp(`\`rules/${a}\\.md\``), "`rules/" + b + ".md`")));
            return true;
          }
        }
      }
      return NA;   // no reciprocated local pair here to make one-way
    },
  },
  {
    check: "C-06",
    needsRules: true,
    what: "a vendor name is embedded in a rule",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^Avoid:/m.test(t)) return false;
      writeRule(dir, f, t.replace(/^Avoid:/m, "Avoid:\n- Skipping the check the github workflow already performs."));
      return true;
    },
  },
  {
    check: "C-07",
    needsRules: true,
    what: "a rule blows the word budget",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^Avoid:/m.test(t)) return false;
      // Scale the filler to this file, or the mutation silently stops firing
      // whenever the rule is compressed below the fixed threshold.
      const prose = t.replace(/^---[\s\S]*?---/, "").replace(/```[\s\S]*?```/g, "").split(/\s+/).filter(Boolean).length;
      const need = Math.max(20, 451 - prose);
      const filler = ("- " + "restating the same consideration at length ".repeat(Math.ceil(need / 6))).trim() + ".";
      writeRule(dir, f, t.replace(/^Avoid:/m, "Avoid:\n" + filler));
      return true;
    },
  },
  {
    check: "C-08",
    needsRules: true,
    what: "a code fence is left unbalanced",
    apply(dir) {
      const f = rulesOf(dir)[0];
      writeRule(dir, f, readRule(dir, f) + "\n```\n");
      return true;
    },
  },
  {
    check: "C-09",
    needsRules: true,
    what: "guidance is softened into a hedge",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^Do:/m.test(t)) return false;
      writeRule(dir, f, t.replace(/^Do:/m, "Do:\n- Consider using the narrower form where appropriate."));
      return true;
    },
  },
  {
    check: "C-10",
    needsRules: true,
    what: "a rule claims an overall run status",
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^Verify:/m.test(t)) return false;
      writeRule(dir, f, t.replace(/^Verify:/m, "Verify:\n- Report PASS when this axis is clean."));
      return true;
    },
  },
  {
    check: "C-12",
    what: "a rule's frontmatter stops being valid YAML",
    needsRules: true,
    apply(dir) {
      const f = rulesOf(dir)[0];
      const t = readRule(dir, f);
      if (!/^---\n/.test(t)) return false;
      // An unterminated quote: valid-looking to a line-by-line reader, and a
      // hard parse error to anything that actually parses YAML.
      writeRule(dir, f, t.replace(/^---\n/, '---\nnote: "unterminated\n'));
      return true;
    },
  },
  {
    check: "C-16",
    needsRules: true,
    what: "a multi-rule prompt is rewritten to spell out the row it should trigger",
    apply(dir) {
      const evals = path.join(dir, "evals");
      if (!fs.existsSync(evals)) return NA;
      const file = fs.readdirSync(evals).find((f) => /\.scenarios\.(mjs|ts)$/.test(f));
      if (!file) return NA;
      const p = path.join(evals, file);
      const t = fs.readFileSync(p, "utf8");
      // Find a scenario that claims two or more rules, and the first rule it claims.
      const m = t.match(/expectedAll:\s*\[\s*"[^"]*rules\/([a-z0-9-]+)\.md"/);
      if (!m) return NA;
      const rule = m[1];
      // Its gate row, which is exactly what an honest prompt must not repeat.
      const entry = fs.readFileSync(entryOf(dir), "utf8");
      const row = entry.split("\n").find((l) => l.trimStart().startsWith("|") && l.includes(`rules/${rule}.md`));
      if (!row) return false;
      const signal = (row.split("|")[1] ?? "").replace(/\*\*/g, "").trim();
      // Put the row's own words into the prompt above that expectedAll.
      const before = t.slice(0, m.index);
      const at = before.lastIndexOf("prompt:");
      if (at < 0) return false;
      const end = t.indexOf("\n", t.indexOf('"', t.indexOf('"', at) + 1));
      const head = t.slice(0, at);
      const tail = t.slice(end);
      fs.writeFileSync(p, `${head}prompt: ${JSON.stringify(signal)},${tail}`, "utf8");
      return true;
    },
  },
  {
    check: "C-15",
    what: "the gate loses the default stance under it",
    apply(dir) {
      const p = entryOf(dir);
      if (!fs.existsSync(p)) return NA;
      const t = fs.readFileSync(p, "utf8");
      if (!/\*\*Default stance\.?\*\*/.test(t)) return NA;
      fs.writeFileSync(p, t.replace(/\*\*Default stance\.?\*\*/, "Notes."), "utf8");
      return true;
    },
  },
  {
    check: "C-14",
    needsRules: true,
    what: "a scenario prompt names the rule it is meant to route to",
    apply(dir) {
      const evals = path.join(dir, "evals");
      if (!fs.existsSync(evals)) return NA;
      const file = fs.readdirSync(evals).find((f) => /\.scenarios\.(mjs|ts)$/.test(f));
      if (!file) return NA;
      const p = path.join(evals, file);
      const t = fs.readFileSync(p, "utf8");
      const rule = rulesOf(dir)[0].replace(/\.md$/, "");
      const m = t.match(/prompt:\s+"([^"]{20,})"/);
      if (!m) return false;
      // Put the rule filename inside a prompt, which is the giveaway C-14 bans.
      fs.writeFileSync(p, t.replace(m[1], `${m[1]} (see ${rule})`), "utf8");
      return true;
    },
  },
  {
    check: "C-13",
    what: "the entry loses the name that routes to it",
    apply(dir) {
      const p = path.join(dir, "SKILL.md");
      if (!fs.existsSync(p)) return NA;   // a topic index declares no name
      const t = fs.readFileSync(p, "utf8");
      if (!/^name:.*$/m.test(t)) return NA;
      fs.writeFileSync(p, t.replace(/^name:.*$\n/m, ""), "utf8");
      return true;
    },
  },
  {
    check: "C-11",
    what: "a rule loses its only positive scenario",
    needsRules: true,
    apply(dir) {
      const evals = path.join(dir, "evals");
      if (!fs.existsSync(evals)) return false;
      const file = fs.readdirSync(evals).find((f) => /\.scenarios\.(mjs|ts)$/.test(f));
      if (!file) return NA;
      const p = path.join(evals, file);
      let t = fs.readFileSync(p, "utf8");
      // Two fields can carry the scenario-to-rule link, and a scenario may
      // carry both. Rewriting only one left the other still naming the real
      // rule, so coverage survived the mutation and the check never fired.
      let applied = false;
      for (const re of [/expectedPrimary: "rules\/[a-z0-9-]+\.md",/g, /rule: "[a-z0-9-]+",/g]) {
        const first = t.match(re)?.[0];
        if (!first) continue;
        t = t.replace(re, first);   // point every scenario at the same rule
        applied = true;
      }
      if (!applied) return false;
      fs.writeFileSync(p, t, "utf8");
      return true;
    },
  },
];

const copy = (from, to) => {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
};

// `collection` is the real parent of the skill under test. The copy under /tmp has
// no siblings, so cross-skill pointers would otherwise all read as broken.
const verify = (dir, collection) => {
  try {
    execFileSync("node", [VERIFY, dir], {
      encoding: "utf8",
      stdio: "pipe",
      env: { ...process.env, SKILL_COLLECTION_ROOT: collection },
    });
    return { ok: true, out: "" };
  } catch (e) {
    return { ok: false, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
};

/** A multi-topic skill has no rules of its own; its topics carry them. */
const expand = (dir) => {
  if (fs.existsSync(path.join(dir, "rules"))) return [dir];
  const topics = fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "evals" && e.name !== "references")
    .map((e) => path.join(dir, e.name))
    .filter((p) => fs.existsSync(path.join(p, "rules")));
  return topics.length ? topics : [dir];
};

let failures = 0;
for (const target of process.argv.slice(2).flatMap((t) => expand(path.resolve(t)))) {
  const src = path.resolve(target);
  const name = path.basename(src);
  const collection = path.dirname(src);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "mutate-"));
  const dir = path.join(work, name);

  copy(src, dir);
  if (!verify(dir, collection).ok) {
    console.error(`\n=== ${name} ===\n  baseline already failing, fix the skill before trusting this test`);
    fs.rmSync(work, { recursive: true, force: true });
    failures++;
    continue;
  }

  console.log(`\n=== ${name} ===\n`);
  const problems = [];
  // A flat skill has no rules to mutate. Reporting those mutations as stale
  // would be a false alarm: they are inapplicable, not broken.
  const hasRules = fs.existsSync(path.join(src, "rules"));
  const inapplicable = [];
  for (const m of MUTATIONS) {
    if (m.needsRules && !hasRules) { inapplicable.push(m.check); continue; }
    copy(src, dir);
    const outcome = m.apply(dir);
    if (outcome === NA) { inapplicable.push(m.check); continue; }
    if (!outcome) {
      problems.push(`${m.check}: mutation no longer applies, this check has not been seen firing`);
      continue;
    }
    const r = verify(dir, collection);
    if (r.out.includes(`FAIL  ${m.check}`)) console.log(`  CAUGHT  ${m.check}  ${m.what}`);
    else if (!r.ok) problems.push(`${m.check}: caught by ${(r.out.match(/FAIL {2}C-\d+/g) ?? []).join(", ")} instead of itself`);
    else problems.push(`${m.check}: NOT CAUGHT, ${m.what}`);
  }
  fs.rmSync(work, { recursive: true, force: true });

  if (inapplicable.length) console.log(`  N/A     ${inapplicable.join(", ")}  no rules/ directory in this skill`);
  for (const p of problems) console.log(`  PROBLEM  ${p}`);
  const applicable = MUTATIONS.length - inapplicable.length;
  console.log(`\n  ${applicable - problems.length}/${applicable} caught`);
  failures += problems.length;
}

console.log(failures === 0 ? "\nevery portable check fires for its own reason\n" : `\n${failures} problems\n`);
process.exit(failures === 0 ? 0 : 1);
