#!/usr/bin/env node
// Programmatic invariants for the typescript-skills tree.
// Run from repo root: node evals/check-invariants.mjs
// Exit code 0 = all pass, non-zero = failures listed.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, basename, sep } from "node:path";

const failures = [];
const passes = [];

function pass(name) { passes.push(name); }
function fail(name, detail) { failures.push({ name, detail }); }

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full));
    else out.push(full.split(sep).join("/"));
  }
  return out;
}

async function readUtf8(path) {
  return await readFile(path, "utf8");
}

function lower(s) { return s.toLowerCase(); }

// ----- discover files -----
const allMd = (await walk(".")).filter(f => f.endsWith(".md"));
const ruleFiles = allMd.filter(f => /typescript-[^/]+\/rules\/[^/]+\.md$/.test(f)).sort();
const skillFiles = allMd.filter(f => /typescript-[^/]+\/SKILL\.md$/.test(f)).sort();
const rootSkill = "SKILL.md";

// ----- INV-1: every canonical rule has required frontmatter fields -----
{
  const required = ["id:", "owner:", "canonical:", "severity:", "references:"];
  let bad = [];
  for (const f of ruleFiles) {
    const text = await readUtf8(f);
    const fm = text.split("---")[1] || "";
    const missing = required.filter(r => !fm.includes(r));
    if (missing.length) bad.push(`${f} missing ${missing.join(", ")}`);
  }
  if (bad.length) fail("INV-1 frontmatter complete on every rule", bad.join("\n  "));
  else pass(`INV-1 frontmatter complete on every rule (${ruleFiles.length} files)`);
}

// ----- INV-2: every canonical rule has required sections -----
{
  const required = ["Decision:", "Use when:", "Do:", "Avoid:", "Verify:"];
  let bad = [];
  for (const f of ruleFiles) {
    const text = await readUtf8(f);
    const missing = required.filter(s => !text.includes(s));
    if (missing.length) bad.push(`${f} missing ${missing.join(", ")}`);
  }
  if (bad.length) fail("INV-2 required sections on every rule", bad.join("\n  "));
  else pass(`INV-2 required sections on every rule (${ruleFiles.length} files)`);
}

// ----- INV-3: code fences balanced in every md file -----
{
  let bad = [];
  for (const f of allMd) {
    const text = await readUtf8(f);
    const count = (text.match(/```/g) || []).length;
    if (count % 2 !== 0) bad.push(`${f} unbalanced fences (${count})`);
  }
  if (bad.length) fail("INV-3 code fences balanced in every md", bad.join("\n  "));
  else pass(`INV-3 code fences balanced in every md (${allMd.length} files)`);
}

// ----- INV-4: root router includes mapper/transform keyword -----
{
  const text = await readUtf8(rootSkill);
  const lc = lower(text);
  const ok = lc.includes("mapper") && lc.includes("transform");
  if (ok) pass("INV-4 root router includes mapper + transform");
  else fail("INV-4 root router includes mapper + transform", "missing keywords on boundaries trigger");
}

// ----- INV-5: root router triggers cover all 7 bundles by keyword -----
{
  const text = lower(await readUtf8(rootSkill));
  const required = [
    ["typescript-coding-standards", ["naming", "abstraction", "class"]],
    ["typescript-boundaries", ["provider", "sdk", "mapper"]],
    ["typescript-composition", ["dependency", "factory", "lifecycle"]],
    ["typescript-configs", ["env", "config"]],
    ["typescript-observability", ["logging", "tracing"]],
    ["typescript-security", ["secret", "credential"]],
    ["typescript-testing", ["test"]],
  ];
  let bad = [];
  for (const [bundle, keys] of required) {
    if (!text.includes(bundle.toLowerCase())) bad.push(`${bundle} missing from router`);
    const missingKeys = keys.filter(k => !text.includes(k));
    if (missingKeys.length) bad.push(`${bundle} keywords missing: ${missingKeys.join(", ")}`);
  }
  if (bad.length) fail("INV-5 root router covers all bundles + key triggers", bad.join("\n  "));
  else pass("INV-5 root router covers all 7 bundles + key triggers");
}

// ----- INV-6: defaults-and-ownership does NOT own URL/host/IP/token/credential fallbacks -----
{
  const f = "typescript-configs/rules/defaults-and-ownership.md";
  const text = await readUtf8(f);
  // It must defer to security; out-of-scope section must list these
  const ok =
    text.includes("typescript-security/rules/secrets-lifecycle.md") &&
    text.toLowerCase().includes("out of scope");
  // It must NOT have an "Avoid" line claiming ownership of URL/IP/token defaults beyond delegation
  // We allow the example showing the wrong file is this file, since it explicitly says "Wrong file for this concern"
  if (ok) pass("INV-6 defaults-and-ownership defers URL/IP/token fallbacks to security");
  else fail("INV-6 defaults-and-ownership defers URL/IP/token fallbacks to security", "missing security cross-link or out-of-scope marker");
}

// ----- INV-7: provider-containment does NOT claim transport/request/response/webhook -----
{
  const f = "typescript-boundaries/rules/provider-containment.md";
  const text = await readUtf8(f);
  // Use-when section must not include these phrases as primary triggers.
  // Look in the Use-when block specifically.
  const useWhenIdx = text.indexOf("Use when:");
  const startHereIdx = text.indexOf("Start here:");
  const useWhen = text.slice(useWhenIdx, startHereIdx > 0 ? startHereIdx : text.length).toLowerCase();
  const forbidden = ["request body", "query", "headers", "webhook", "transport"];
  const found = forbidden.filter(p => useWhen.includes(p));
  if (found.length === 0) pass("INV-7 provider-containment Use-when does not claim transport/request territory");
  else fail("INV-7 provider-containment Use-when does not claim transport/request territory", `found: ${found.join(", ")}`);
}

// ----- INV-8: raw-input-to-internal-model does NOT claim SDK/provider/generated -----
{
  const f = "typescript-boundaries/rules/raw-input-to-internal-model.md";
  const text = await readUtf8(f);
  const useWhenIdx = text.indexOf("Use when:");
  const doIdx = text.indexOf("\nDo:");
  const useWhen = text.slice(useWhenIdx, doIdx > 0 ? doIdx : text.length).toLowerCase();
  const forbidden = ["sdk", "provider", "generated"];
  const found = forbidden.filter(p => useWhen.includes(p));
  if (found.length === 0) pass("INV-8 raw-input-to-internal-model Use-when does not claim SDK/provider territory");
  else fail("INV-8 raw-input-to-internal-model Use-when does not claim SDK/provider territory", `found: ${found.join(", ")}`);
}

// ----- INV-9: local-test-style does NOT prescribe fixed unit/integration/e2e ordering -----
{
  const f = "typescript-testing/rules/local-test-style.md";
  const text = lower(await readUtf8(f));
  // Forbid the exact prescriptive phrasing
  const bad = text.includes("prefer coverage in this order") || text.includes("unit, integration, e2e/api-driven");
  if (!bad) pass("INV-9 local-test-style does not prescribe fixed unit/integration/e2e ordering");
  else fail("INV-9 local-test-style does not prescribe fixed unit/integration/e2e ordering", "found prescriptive phrasing");
}

// ----- INV-10: ownership.md lists each rule file at most once as canonical -----
{
  const text = await readUtf8("references/ownership.md");
  const lines = text.split("\n").filter(l => l.includes("rules/") && l.includes("|"));
  const counts = new Map();
  for (const line of lines) {
    const m = line.match(/`(rules\/[^`]+\.md)`/);
    if (m) counts.set(m[1], (counts.get(m[1]) || 0) + 1);
  }
  const dupes = [...counts.entries()].filter(([_, n]) => n > 1);
  if (dupes.length === 0) pass(`INV-10 ownership.md has unique canonical entries (${counts.size} rules)`);
  else fail("INV-10 ownership.md has unique canonical entries", dupes.map(([r, n]) => `${r}: ${n} entries`).join("\n  "));
}

// ----- INV-11: parse-and-expose-config defers parser purity / secret loading to neighbors -----
{
  const f = "typescript-configs/rules/parse-and-expose-config.md";
  const text = await readUtf8(f);
  const ok = text.includes("validation-vs-verification.md") && text.includes("secrets-lifecycle.md");
  if (ok) pass("INV-11 parse-and-expose-config cross-links validation-vs-verification and secrets-lifecycle");
  else fail("INV-11 parse-and-expose-config cross-links validation-vs-verification and secrets-lifecycle", "missing cross-link");
}

// ----- INV-12: composition-root canonical does NOT contain the full layered resolve block -----
{
  const f = "typescript-composition/rules/composition-root.md";
  const text = await readUtf8(f);
  const hasMemoizeByReference = text.includes("memoizeByReference");
  const hasLayeredReferenceLink = text.includes("references/patterns/layered-resolve.md");
  if (!hasMemoizeByReference && hasLayeredReferenceLink) pass("INV-12 composition-root delegates layered resolve to references");
  else fail("INV-12 composition-root delegates layered resolve to references",
    `memoizeByReference present=${hasMemoizeByReference}, link present=${hasLayeredReferenceLink}`);
}

// ----- INV-13: type-narrowing example does not use raw `as Record<string, unknown>` -----
{
  const f = "typescript-coding-standards/rules/type-narrowing-over-assertion.md";
  const text = await readUtf8(f);
  // Allow the phrase only when explicitly in a hasField helper context
  const hasRawAssertion = /\bconst\s+\w+\s*=\s*\w+\s+as\s+Record<string,\s*unknown>/.test(text);
  if (!hasRawAssertion) pass("INV-13 type-narrowing rule does not use raw `as Record<string, unknown>` in good examples");
  else fail("INV-13 type-narrowing rule does not use raw `as Record<string, unknown>` in good examples", "found raw cast");
}

// ----- INV-14: layered-resolve reference exists -----
{
  try {
    await stat("references/patterns/layered-resolve.md");
    pass("INV-14 references/patterns/layered-resolve.md exists");
  } catch {
    fail("INV-14 references/patterns/layered-resolve.md exists", "file missing");
  }
}

// ----- INV-15: meaningful-logging mentions stdout/stderr (Twelve-Factor XI) -----
{
  const text = (await readUtf8("typescript-observability/rules/meaningful-logging.md")).toLowerCase();
  if (text.includes("stdout")) pass("INV-15 meaningful-logging mentions stdout (Twelve-Factor XI)");
  else fail("INV-15 meaningful-logging mentions stdout (Twelve-Factor XI)", "stdout not mentioned");
}

// ----- INV-16: cross-link makeXxx between functions-vs-classes and ready-instance-vs-factory -----
{
  const a = await readUtf8("typescript-coding-standards/rules/functions-vs-classes.md");
  const b = await readUtf8("typescript-composition/rules/ready-instance-vs-factory.md");
  const aOk = a.includes("ready-instance-vs-factory.md");
  const bOk = b.includes("functions-vs-classes.md");
  if (aOk && bOk) pass("INV-16 makeXxx cross-links between functions-vs-classes and ready-instance-vs-factory");
  else fail("INV-16 makeXxx cross-links between functions-vs-classes and ready-instance-vs-factory",
    `functions-vs-classes→ready-instance: ${aOk}, ready-instance→functions-vs-classes: ${bOk}`);
}

// ----- INV-17: naming demarcation between general and provider-derived -----
{
  const a = await readUtf8("typescript-coding-standards/rules/naming-and-semantic-center.md");
  const b = await readUtf8("typescript-boundaries/rules/local-naming.md");
  const aOk = a.includes("local-naming.md");
  const bOk = b.includes("naming-and-semantic-center.md");
  if (aOk && bOk) pass("INV-17 naming rules cross-reference each other for demarcation");
  else fail("INV-17 naming rules cross-reference each other for demarcation",
    `naming→local-naming: ${aOk}, local-naming→naming: ${bOk}`);
}

// ----- INV-18: provider-containment + raw-input-to-internal-model demarcate explicitly -----
{
  const a = await readUtf8("typescript-boundaries/rules/provider-containment.md");
  const b = await readUtf8("typescript-boundaries/rules/raw-input-to-internal-model.md");
  const aOk = a.includes("rules/raw-input-to-internal-model.md");
  const bOk = b.includes("rules/provider-containment.md");
  if (aOk && bOk) pass("INV-18 provider-containment and raw-input-to-internal-model demarcate via cross-link");
  else fail("INV-18 provider-containment and raw-input-to-internal-model demarcate via cross-link",
    `provider→raw: ${aOk}, raw→provider: ${bOk}`);
}

// ----- INV-19: roadmap opening status is not stale (no "27 canonical rules") -----
{
  const text = await readUtf8("references/roadmap.md");
  const stale = text.includes("27 canonical rules") || text.includes("Evals 12/12");
  if (!stale) pass("INV-19 roadmap opening status is not stale");
  else fail("INV-19 roadmap opening status is not stale", "stale phrasing found");
}

// ----- INV-20: no README.md inside skill bundles (router must be SKILL.md) -----
{
  const readmes = allMd.filter(f =>
    basename(f).toLowerCase() === "readme.md" &&
    /typescript-[^/]+\//.test(f)
  );
  if (readmes.length === 0) pass("INV-20 no README.md inside skill bundles (router is SKILL.md)");
  else fail("INV-20 no README.md inside skill bundles (router is SKILL.md)", readmes.join("\n  "));
}

// ----- INV-21: eval prompts do not name the expected skill or rule file -----
{
  const evalsJson = JSON.parse(await readUtf8("evals/evals.json"));
  const skillNames = ["typescript-coding-standards", "typescript-boundaries", "typescript-composition", "typescript-configs", "typescript-security", "typescript-observability", "typescript-testing"];
  const ruleSuffixes = ruleFiles.map(f => basename(f));
  let bad = [];
  for (const e of evalsJson.evals) {
    const lc = e.prompt.toLowerCase();
    const namedSkills = skillNames.filter(s => lc.includes(s));
    const namedRules = ruleSuffixes.filter(r => lc.includes(r.toLowerCase()));
    if (namedSkills.length || namedRules.length) {
      bad.push(`${e.id}: prompt names ${[...namedSkills, ...namedRules].join(", ")}`);
    }
  }
  if (bad.length === 0) pass(`INV-21 eval prompts do not leak skill/rule names (${evalsJson.evals.length} prompts)`);
  else fail("INV-21 eval prompts do not leak skill/rule names", bad.join("\n  "));
}

// ----- output -----
console.log("\n=== Structural Invariants ===\n");
for (const p of passes) console.log(`  PASS  ${p}`);
for (const f of failures) {
  console.log(`  FAIL  ${f.name}`);
  console.log(`        ${f.detail}`);
}
console.log(`\n${passes.length} passed, ${failures.length} failed (of ${passes.length + failures.length} total)\n`);

process.exit(failures.length === 0 ? 0 : 1);
