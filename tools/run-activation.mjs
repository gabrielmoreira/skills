#!/usr/bin/env node
/**
 * Runs the activation scenarios against a model.
 *
 * Everything else in tools/ checks the shape of the files. This is the only
 * thing that checks whether they work, and it exists because 104 scenarios sat
 * in the repository for months asserting behaviour nobody had ever observed.
 *
 * Four properties make a run worth believing.
 *
 * 1. Two arms. The gated arm sees the gate. The blind arm sees only the list of
 *    file names. A scenario that passes in both was never routed by the gate,
 *    it was routed by the file name, and it tells you nothing about the writing.
 *    This is watch-it-fail pointed at the eval: an eval that passes with the
 *    skill removed never failed for the right reason.
 * 2. Repeats. One sample is a coin toss reported as a fact. Every scenario runs
 *    --samples times and a split verdict is UNSTABLE, which is neither a pass
 *    nor a failure but a statement that the routing is not reliable.
 * 3. Objective grading only. A path either appears in the answer or it does
 *    not. The must and mustNot lists need a judge model, a judge is a weaker
 *    instrument than a string match, and mixing the two hides which is which.
 *    They are not graded here.
 * 4. A recorded baseline. A score with no history cannot show a regression.
 *
 * Backends, in the order they are preferred:
 *   api  ANTHROPIC_API_KEY. A clean room: no settings, no CLAUDE.md, no
 *        plugins, nothing but the prompt this script assembled.
 *   cli  the claude binary in -p mode. Convenient, and contaminated: it loads
 *        the user's own CLAUDE.md and AGENTS.md, which on a machine that uses
 *        these skills already tells the model to use them. The script says so
 *        rather than quietly reporting the number as clean.
 *
 * Usage:
 *   node tools/run-activation.mjs --dry-run --skill test-first-by-evidence
 *   node tools/run-activation.mjs --skill test-first-by-evidence --samples 3
 *   node tools/run-activation.mjs --check          compare against the baseline
 *   node tools/run-activation.mjs --write-baseline
 */
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const ROOT = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");
const BASELINE = resolve("evals/baseline.json");

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const a = {
    samples: 3, model: "claude-haiku-4-5-20251001", skills: [], limit: Infinity,
    kind: "all", backend: null, dryRun: false, check: false, writeBaseline: false,
    concurrency: 4, verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--samples") a.samples = Number(argv[++i]);
    else if (k === "--model") a.model = argv[++i];
    else if (k === "--skill") a.skills.push(argv[++i]);
    else if (k === "--limit") a.limit = Number(argv[++i]);
    else if (k === "--kind") a.kind = argv[++i];
    else if (k === "--backend") a.backend = argv[++i];
    else if (k === "--concurrency") a.concurrency = Number(argv[++i]);
    else if (k === "--dry-run") a.dryRun = true;
    else if (k === "--check") a.check = true;
    else if (k === "--write-baseline") a.writeBaseline = true;
    else if (k === "--verbose") a.verbose = true;
    else throw new Error(`unknown argument: ${k}`);
  }
  if (!["all", "routing", "activation"].includes(a.kind)) throw new Error(`--kind must be all, routing or activation`);
  return a;
}

// ------------------------------------------------------------------ prompts

const ROUTING_SYSTEM =
  "You choose which reference file to open before answering a developer. " +
  "Reply with file paths only, one per line, exactly as written in the list. " +
  "If none apply, reply NONE. Never explain.";

const ACTIVATION_SYSTEM =
  "You decide whether to load a reference skill before answering a developer. " +
  "Reply with one word, YES or NO. Never explain.";

/** The gated arm: the gate is the only thing that distinguishes it. */
function routingPrompt(entryText, prompt) {
  return `<reference-index>\n${entryText.trim()}\n</reference-index>\n\nA developer says:\n\n${prompt}\n\nWhich file paths from the index above would you open before answering?`;
}

/** The blind arm: the same choice, offered without the signals that guide it. */
function blindPrompt(paths, prompt) {
  return `<reference-index>\nAvailable files:\n${paths.map((p) => `- ${p}`).join("\n")}\n</reference-index>\n\nA developer says:\n\n${prompt}\n\nWhich file paths from the index above would you open before answering?`;
}

function activationPrompt(name, description, prompt) {
  return `<skill>\nname: ${name}\ndescription: ${description.trim()}\n</skill>\n\nA developer says:\n\n${prompt}\n\nWould you load this skill before answering? YES or NO.`;
}

// ----------------------------------------------------------------- backends

async function apiBackend(model, system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model, max_tokens: 300, temperature: 0, system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  return (body.content ?? []).map((c) => c.text ?? "").join("");
}

// Tools are disabled explicitly. With Read available the blind arm could open
// the very files it is being tested without, which would make it meaningless.
const NO_TOOLS = ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "WebSearch", "Task", "NotebookEdit", "TodoWrite"];

function cliBackend(model, system, user) {
  return new Promise((ok, bad) => {
    const child = spawn(
      "claude",
      ["-p", `${system}\n\n${user}`, "--model", model, "--disallowed-tools", ...NO_TOOLS],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", bad);
    child.on("close", (code) => (code === 0 ? ok(out) : bad(new Error(err.trim() || `claude exited ${code}`))));
  });
}

async function pickBackend(forced) {
  const choice = forced ?? (process.env.ANTHROPIC_API_KEY ? "api" : "cli");
  if (choice === "api") {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("--backend api needs ANTHROPIC_API_KEY");
    return { name: "api", call: apiBackend, clean: true };
  }
  if (choice === "cli") return { name: "cli", call: cliBackend, clean: false };
  throw new Error(`unknown backend: ${choice}`);
}

// ------------------------------------------------------------------ grading

const normalise = (p) => String(p).replace(/^skill:\/\/[^/]+\//, "").replace(/^\.\//, "");

/**
 * Two paths name the same file when one is a suffix of the other at a segment
 * boundary. Plain endsWith is not enough: it scores "it-fail.md" as a match for
 * "rules/watch-it-fail.md", which would mark a wrong answer as a pass.
 */
export const samePath = (a, b) => {
  const [x, y] = [normalise(a), normalise(b)];
  if (x === y) return true;
  const [long, short] = x.length >= y.length ? [x, y] : [y, x];
  return long.endsWith(`/${short}`);
};

/** Every path the answer names, in the vocabulary the scenarios use. */
export function pathsIn(answer) {
  return [...new Set((answer.match(/[a-z0-9-]+\/(?:rules\/)?[a-zA-Z0-9-]+\.md/g) ?? []).map(normalise))];
}

export function saidYes(answer) {
  const first = answer.trim().toUpperCase().replace(/[^A-Z]/g, " ").trim().split(/\s+/)[0];
  return first === "YES" ? true : first === "NO" ? false : null;
}

export function gradeRouting(answer, scenario) {
  const got = pathsIn(answer);
  const want = (scenario.expectedAll?.length ? scenario.expectedAll : [scenario.expectedPrimary]).map(normalise);
  const forbidden = (scenario.activation?.forbiddenRoutes ?? []).map(normalise);
  const hit = want.every((w) => got.some((g) => samePath(g, w)));
  const violated = forbidden.filter((f) => got.some((g) => samePath(g, f)));
  return { pass: hit && !violated.length, got, want, violated };
}

// ---------------------------------------------------------------- scenarios

async function loadSkill(dir) {
  let entry = null;
  let entryName = null;
  for (const name of ["SKILL.md", "INDEX.md"]) {
    try {
      entry = await readFile(join(dir, name), "utf8");
      entryName = name;
      break;
    } catch {}
  }
  if (!entry) return null;
  const fm = entry.match(/^---\n([\s\S]*?)\n---/);
  const description = fm ? (fm[1].match(/description:\s*>-?\s*\n([\s\S]*?)(?=\n[a-z-]+:|$)/)?.[1] ?? fm[1].match(/description:\s*(.+)/)?.[1] ?? "").replace(/\n\s+/g, " ").trim() : "";
  const paths = [];
  try {
    for (const f of await readdir(join(dir, "rules"))) if (f.endsWith(".md")) paths.push(`rules/${f}`);
  } catch {}
  for (const d of await readdir(dir, { withFileTypes: true })) {
    if (!d.isDirectory() || ["evals", "references", "rules", "node_modules"].includes(d.name)) continue;
    try {
      await readFile(join(dir, d.name, "INDEX.md"));
      paths.push(`${d.name}/INDEX.md`);
    } catch {}
  }
  const scenarios = [];
  try {
    for (const f of (await readdir(join(dir, "evals"))).filter((f) => /\.scenarios\.(mjs|ts)$/.test(f))) {
      const mod = await import(pathToFileURL(join(dir, "evals", f)).href);
      for (const s of mod.default ?? mod.scenarios ?? []) scenarios.push(s);
    }
  } catch {}
  return { name: basename(dir), dir, entry, entryName, description, paths, scenarios };
}

/** One unit of work: a scenario, an arm, and the exact prompt it will send. */
function casesFor(skill, args) {
  const out = [];
  for (const s of skill.scenarios) {
    if (typeof s.prompt !== "string") continue;
    if (s.expectedPrimary && args.kind !== "activation") {
      out.push({ kind: "routing", arm: "gated", skill: skill.name, id: s.id, scenario: s, system: ROUTING_SYSTEM, user: routingPrompt(skill.entry, s.prompt) });
      out.push({ kind: "routing", arm: "blind", skill: skill.name, id: s.id, scenario: s, system: ROUTING_SYSTEM, user: blindPrompt(skill.paths, s.prompt) });
    }
    if (s.activation?.layer === "public-skill" && args.kind !== "routing") {
      out.push({ kind: "activation", arm: "gated", skill: skill.name, id: s.id, scenario: s, system: ACTIVATION_SYSTEM, user: activationPrompt(skill.name, skill.description, s.prompt) });
    }
  }
  return out;
}

// -------------------------------------------------------------------- runner

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

function verdictOf(passes, samples) {
  if (passes === samples) return "PASS";
  if (passes === 0) return "FAIL";
  return "UNSTABLE";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dirs = (await readdir(ROOT, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && (!args.skills.length || args.skills.includes(d.name)))
    .map((d) => join(ROOT, d.name));

  const cases = [];
  for (const dir of dirs) {
    const skill = await loadSkill(dir);
    if (skill) cases.push(...casesFor(skill, args));
  }
  const selected = cases.slice(0, args.limit === Infinity ? cases.length : args.limit);

  if (args.dryRun) {
    console.log(`${selected.length} calls would be made, ${args.samples} samples each = ${selected.length * args.samples} requests\n`);
    const sample = selected[0];
    if (sample) {
      console.log(`--- first call: ${sample.skill} / ${sample.id} / ${sample.kind} / ${sample.arm} ---`);
      console.log(`[system] ${sample.system}\n`);
      console.log(sample.user.length > 1200 ? `${sample.user.slice(0, 1200)}\n... (${sample.user.length} chars)` : sample.user);
    }
    const byArm = selected.reduce((m, c) => ((m[`${c.kind}/${c.arm}`] = (m[`${c.kind}/${c.arm}`] ?? 0) + 1), m), {});
    console.log(`\nby arm: ${JSON.stringify(byArm)}`);
    return;
  }

  const backend = await pickBackend(args.backend);
  if (!backend.clean) {
    console.log("WARNING  the cli backend loads your own CLAUDE.md and AGENTS.md.");
    console.log("         If those already tell the model to use these skills, the");
    console.log("         activation numbers are measuring your instructions, not the");
    console.log("         skill description. Set ANTHROPIC_API_KEY for a clean room.\n");
  }
  console.log(`backend ${backend.name}  model ${args.model}  ${selected.length} calls x ${args.samples} samples\n`);

  const results = await pool(selected, args.concurrency, async (c) => {
    let passes = 0;
    const answers = [];
    for (let i = 0; i < args.samples; i++) {
      let answer;
      try {
        answer = await backend.call(args.model, c.system, c.user);
      } catch (e) {
        answers.push(`ERROR ${e.message}`);
        continue;
      }
      answers.push(answer.trim().slice(0, 300));
      if (c.kind === "routing") {
        if (gradeRouting(answer, c.scenario).pass) passes++;
      } else {
        const yes = saidYes(answer);
        if (yes !== null && yes === c.scenario.activation.shouldActivate) passes++;
      }
    }
    return { skill: c.skill, id: c.id, kind: c.kind, arm: c.arm, passes, samples: args.samples, verdict: verdictOf(passes, args.samples), answers: args.verbose ? answers : undefined };
  });

  report(results, args);
  const record = { ranAt: new Date().toISOString(), model: args.model, backend: backend.name, clean: backend.clean, samples: args.samples, results: results.map(({ answers, ...r }) => r) };
  await mkdir(resolve("evals"), { recursive: true });
  await writeFile(resolve("evals/last-run.json"), `${JSON.stringify(record, null, 2)}\n`);
  if (args.writeBaseline) {
    await writeFile(BASELINE, `${JSON.stringify(record, null, 2)}\n`);
    console.log(`\nbaseline written to ${BASELINE}`);
  }
  if (args.check) process.exit(await checkAgainstBaseline(results) ? 0 : 1);
}

function report(results, args) {
  const key = (r) => `${r.skill}/${r.id}`;
  const gated = new Map(results.filter((r) => r.kind === "routing" && r.arm === "gated").map((r) => [key(r), r]));
  const blind = new Map(results.filter((r) => r.kind === "routing" && r.arm === "blind").map((r) => [key(r), r]));

  const rows = [...gated.keys()].map((k) => ({ k, g: gated.get(k), b: blind.get(k) }));
  const routed = rows.length;
  const gatePass = rows.filter((r) => r.g.verdict === "PASS").length;
  const blindPass = rows.filter((r) => r.b?.verdict === "PASS").length;
  const bothPass = rows.filter((r) => r.g.verdict === "PASS" && r.b?.verdict === "PASS").length;
  const unstable = results.filter((r) => r.verdict === "UNSTABLE").length;

  if (routed) {
    console.log("routing");
    console.log(`  with the router    ${gatePass}/${routed}`);
    console.log(`  with names only    ${blindPass}/${routed}`);
    console.log(`  the router earns   ${gatePass - blindPass >= 0 ? "+" : ""}${gatePass - blindPass}`);
    console.log(`  passed both ways   ${bothPass}   the file name was enough`);
  }
  const act = results.filter((r) => r.kind === "activation");
  if (act.length) {
    console.log("activation");
    console.log(`  correct            ${act.filter((r) => r.verdict === "PASS").length}/${act.length}`);
  }
  console.log(`unstable across ${args.samples} samples  ${unstable}`);

  const bad = results.filter((r) => r.verdict !== "PASS" && !(r.kind === "routing" && r.arm === "blind"));
  if (bad.length) {
    console.log("\nnot passing");
    for (const r of bad) console.log(`  ${r.verdict.padEnd(8)} ${r.skill}/${r.id} ${r.kind}  ${r.passes}/${r.samples}`);
  }
  if (bothPass) {
    console.log("\npassed with the gate removed");
    for (const r of rows.filter((r) => r.g.verdict === "PASS" && r.b?.verdict === "PASS")) console.log(`  ${r.k}`);
  }
}

async function checkAgainstBaseline(results) {
  let base;
  try {
    base = JSON.parse(await readFile(BASELINE, "utf8"));
  } catch {
    console.log(`\nno baseline at ${BASELINE}; run with --write-baseline first`);
    return false;
  }
  const was = new Map(base.results.map((r) => [`${r.skill}/${r.id}/${r.kind}/${r.arm}`, r.verdict]));
  const worse = results.filter((r) => was.get(`${r.skill}/${r.id}/${r.kind}/${r.arm}`) === "PASS" && r.verdict !== "PASS");
  if (worse.length) {
    console.log(`\nregressions against the baseline of ${base.ranAt} (${base.model})`);
    for (const r of worse) console.log(`  ${r.skill}/${r.id} ${r.kind}/${r.arm} was PASS, now ${r.verdict}`);
    return false;
  }
  console.log(`\nno regression against the baseline of ${base.ranAt}`);
  return true;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(2);
  });
}
