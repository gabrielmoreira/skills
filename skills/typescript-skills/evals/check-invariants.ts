#!/usr/bin/env node
// Programmatic invariants for the typescript-skills tree.
// Run from repo root: node evals/check-invariants.ts
// Exit code 0 = all pass, non-zero = failures listed.

import { readdir, readFile, stat } from "node:fs/promises";
import { join, basename, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { listScenarioControlIds, validateScenarioControls } from "./control-matrix.ts";

const failures = [];
const passes = [];

function pass(name: string) { passes.push(name); }
function fail(name: string, detail: string) { failures.push({ name, detail }); }

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(full));
    else out.push(full.split(sep).join("/"));
  }
  return out;
}

async function readUtf8(path: string) {
  return await readFile(path, "utf8");
}

function lower(s: string) { return s.toLowerCase(); }

export async function runInvariants() {
// ----- discover files -----
const allFiles = await walk(".");
const allMd = allFiles.filter(f => f.endsWith(".md"));
const ruleFiles = allMd.filter(f => /typescript-[^/]+\/rules\/[^/]+\.md$/.test(f)).sort();
const skillFiles = allMd.filter(f => /typescript-[^/]+\/SKILL\.md$/.test(f)).sort();
const scenarioFiles = allFiles.filter(f => /(?:^|\/)evals\/[^/]+\.scenarios\.ts$/.test(f)).sort();
const scenarioIds = [];
for (const file of scenarioFiles) {
  const text = await readUtf8(file);
  for (const match of text.matchAll(/\bid:\s*"([^"]+)"/g)) scenarioIds.push(match[1]);
}
const bundleNames = skillFiles.map(f => f.split("/")[0]).sort();
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

// ----- INV-5: root router triggers cover all discovered bundles by keyword -----
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
    ["typescript-async", ["promise", "abort", "retry"]],
    ["typescript-error-handling", ["error", "result", "retry"]],
  ];
  let bad = [];
  for (const bundle of bundleNames) {
    if (!text.includes(bundle.toLowerCase())) bad.push(`${bundle} missing from router`);
  }
  for (const [bundle, keys] of required) {
    const missingKeys = keys.filter(k => !text.includes(k));
    if (missingKeys.length) bad.push(`${bundle} keywords missing: ${missingKeys.join(", ")}`);
  }
  if (bad.length) fail("INV-5 root router covers discovered bundles + key triggers", bad.join("\n  "));
  else pass(`INV-5 root router covers all ${bundleNames.length} bundles + key triggers`);
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
  const endIdx = ["Start here:", "\nDo:"].map(s => text.indexOf(s)).filter(i => i > useWhenIdx).sort((a, b) => a - b)[0] ?? text.length;
  const useWhen = text.slice(useWhenIdx, endIdx).toLowerCase();
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

// ----- INV-10: each rule file has a unique canonical id in its frontmatter -----
{
  const ids = new Map();
  for (const f of ruleFiles) {
    const text = await readUtf8(f);
    const m = text.match(/^id:\s*(\S+)/m);
    if (m) ids.set(m[1], (ids.get(m[1]) || 0) + 1);
  }
  const dupes = [...ids.entries()].filter(([_, n]) => n > 1);
  if (dupes.length === 0) pass(`INV-10 rule ids are unique (${ids.size} rules)`);
  else fail("INV-10 rule ids are unique", dupes.map(([r, n]) => `${r}: ${n} entries`).join("\n  "));
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

// ----- INV-19: no meta/authoring docs inside the skill payload references/ -----
{
  const metaDocs = ["roadmap.md", "ownership.md", "evaluation-plan.md", "source-coverage.md", "review-notes.md", "cheatsheet.md"];
  const found = allMd.filter(f => f.startsWith("references/") && metaDocs.includes(basename(f)));
  if (found.length === 0) pass("INV-19 no meta/authoring docs inside references/ (they live in docs/typescript-skills)");
  else fail("INV-19 no meta/authoring docs inside references/", found.join("\n  "));
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

// ----- INV-21: scenario prompts do not name the expected skill or rule file -----
{
  const skillNames = ["typescript-skills", ...bundleNames];
  const ruleSuffixes = ruleFiles.map(f => basename(f));
  let bad = [];
  let promptCount = 0;
  for (const file of scenarioFiles) {
    const mod = await import(pathToFileURL(file).href);
    const scenarios = mod.default ?? mod.scenarios ?? [];
    for (const s of scenarios) {
      promptCount++;
      const lc = String(s.prompt ?? "").toLowerCase();
      const namedSkills = skillNames.filter(n => lc.includes(n));
      const namedRules = ruleSuffixes.filter(r => lc.includes(r.toLowerCase()));
      if (namedSkills.length || namedRules.length) {
        bad.push(`${s.id}: prompt names ${[...namedSkills, ...namedRules].join(", ")}`);
      }
    }
  }
  if (bad.length === 0) pass(`INV-21 scenario prompts do not leak skill/rule names (${promptCount} prompts, ${skillNames.length} skill names checked)`);
  else fail("INV-21 scenario prompts do not leak skill/rule names", bad.join("\n  "));
}

// ----- INV-22: committed control matrix only references discovered successor scenarios -----
{
  const bad = validateScenarioControls(scenarioIds);
  if (bad.length === 0) {
    pass(`INV-22 control matrix stays aligned with discovered scenarios (${listScenarioControlIds().length} control-backed scenarios)`);
  } else {
    fail("INV-22 control matrix stays aligned with discovered scenarios", bad.join("\n  "));
  }
}

// ----- INV-23: no legacy eval .mjs shims remain -----
{
  const legacyShims = allFiles.filter((file) => /(^|\/)evals\/.+\.mjs$/.test(file));
  if (legacyShims.length === 0) pass("INV-23 no legacy eval .mjs shims remain");
  else fail("INV-23 no legacy eval .mjs shims remain", legacyShims.join("\n  "));
}

// ----- output -----
console.log("\n=== Structural Invariants ===\n");
for (const p of passes) console.log(`  PASS  ${p}`);
for (const f of failures) {
  console.log(`  FAIL  ${f.name}`);
  console.log(`        ${f.detail}`);
}
console.log(`\n${passes.length} passed, ${failures.length} failed (of ${passes.length + failures.length} total)\n`);

return failures.length === 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const ok = await runInvariants();
  process.exit(ok ? 0 : 1);
}
