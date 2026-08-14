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
import { tmpdir } from "node:os";

const ROOT = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");
const BASELINE = resolve("evals/baseline.json");

// ---------------------------------------------------------------- arguments

function parseArgs(argv) {
  const a = {
    samples: 3, model: null, skills: [], limit: Infinity,
    kind: "all", backend: null, dryRun: false, check: false, writeBaseline: false,
    concurrency: 4, verbose: false,
    // omp only
    thinking: "high", maxTime: 90, rules: false, fixture: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--samples") a.samples = Number(argv[++i]);
    else if (k === "--thinking") a.thinking = argv[++i];
    else if (k === "--max-time") a.maxTime = Number(argv[++i]);
    else if (k === "--fixture") a.fixture = argv[++i];
    else if (k === "--with-rules") a.rules = true;
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
  a.backend ??= process.env.ANTHROPIC_API_KEY ? "api" : "omp";
  a.model ??= a.backend === "omp" ? "github-copilot/gpt-5.6-terra" : "claude-haiku-4-5-20251001";
  return a;
}

// --------------------------------------------------------------- omp arms
//
// The omp backend measures the skill where it actually runs: real system
// prompt, real tools, real agent loop. That rules out hiding files from a
// control arm, since a model with a read tool can open anything.
//
// So the arm hides the skill instead. Both arms get the same prompt, the same
// tools and the same model, and differ only in whether the collection is
// loaded at all. The difference between them is what the skill is worth.
//
// Skills load from this repository rather than from an installed copy, so a run
// always measures the working tree and never a stale install.

const OVERLAYS = {
  with: (skillsDir) =>
    `skills:\n  enabled: true\n  enableCodexUser: false\n  enableClaudeUser: false\n  enableClaudeProject: false\n  enablePiUser: false\n  enablePiProject: false\n  enableAgentsUser: false\n  enableAgentsProject: false\n  customDirectories:\n    - ${skillsDir.replace(/\\/g, "/")}\n`,
  without: () => `skills:\n  enabled: false\n`,
};

/**
 * What the agent actually did, read off the event stream.
 *
 * Asking a model which file it would open measures what it says. Watching
 * which files it opens measures what it does, and only the second one is
 * evidence. omp addresses skills as skill://<name>/<path>, so both the
 * activation and the routing decision are visible as ordinary read calls.
 */
export function observe(stream) {
  const skills = new Set();
  const rules = new Set();
  const seq = [];
  for (const line of stream.split("\n")) {
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.type !== "tool_execution_start") continue;
    const path = String(j.args?.path ?? "");
    seq.push({ tool: j.toolName, path });
    const m = path.match(/^skill:\/\/([a-z0-9-]+)(?:\/(.+))?$/);
    if (!m) continue;
    skills.add(m[1]);
    if (m[2]) rules.add(m[2]);
  }
  return { skills: [...skills], rules: [...rules], seq };
}

/** Did the test file appear before the implementation was edited? */
export function testCameFirst(seq) {
  const isTest = (p) => /\.(test|spec)\./.test(p);
  const wrote = seq.filter((s) => s.tool === "write" || s.tool === "edit");
  const firstTest = wrote.findIndex((s) => isTest(s.path));
  const firstOther = wrote.findIndex((s) => !isTest(s.path) && /\.(js|ts|mjs|cjs|tsx|jsx|py|go|rs)$/.test(s.path));
  if (firstTest === -1) return null;
  return firstOther === -1 || firstTest < firstOther;
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

/**
 * One omp session per call. Tools stay on and the system prompt stays untouched,
 * because the point is to measure the agent that actually runs, not a stripped
 * one. stdin is closed: omp waits for EOF on a piped stdin and hangs otherwise.
 */
function ompRun(a, arm, prompt, paths) {
  return new Promise((ok, bad) => {
    const args = [
      "-p", prompt,
      "--model", a.model,
      "--thinking", a.thinking,
      "--config", paths.overlay[arm],
      "--cwd", paths.fixture,
      "--mode", "json",
      "--max-time", String(a.maxTime),
      "--no-session", "--no-extensions",
    ];
    // Without this the user's own AGENTS.md is loaded, and its routing table
    // already names these skills. That measures the instructions, not the skill.
    if (!a.rules) args.push("--no-rules");
    const child = spawn("omp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", bad);
    child.on("close", () => ok(out));
  });
}

async function pickBackend(forced) {
  if (forced === "omp") return { name: "omp", clean: true, agentic: true };
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

/**
 * Grading by observation. The agent either opened the skill or it did not, and
 * either opened the expected rule or it did not. Neither is an opinion.
 */
export function gradeObserved(seen, scenario, skillName) {
  const want = (scenario.expectedAll?.length ? scenario.expectedAll : [scenario.expectedPrimary])
    .filter(Boolean)
    .map(normalise);
  const forbidden = (scenario.activation?.forbiddenRoutes ?? []).map(normalise);
  const opened = seen.skills.includes(skillName);
  const hit = want.every((w) => seen.rules.some((g) => samePath(g, w)));
  const violated = forbidden.filter((f) => seen.rules.some((g) => samePath(g, f)));
  return { opened, pass: opened && hit && !violated.length, got: seen.rules, want, violated };
}

/** Nothing written to disk may carry the path of the machine that wrote it. */
export function redact(value, roots) {
  let s = typeof value === "string" ? value : JSON.stringify(value);
  for (const [from, to] of roots) s = s.split(from).join(to).split(from.replace(/\//g, "\\")).join(to);
  return typeof value === "string" ? s : JSON.parse(s);
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

    // The agentic backend sends the developer's message unchanged. Wrapping it
    // in a question about file paths would replace the thing being measured.
    if (args.backend === "omp") {
      const wants = s.expectedPrimary || s.activation?.layer === "public-skill";
      if (!wants) continue;
      for (const arm of ["with", "without"]) {
        out.push({ kind: "observed", arm, skill: skill.name, id: s.id, scenario: s, user: s.prompt });
      }
      continue;
    }

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
      console.log(sample.system ? `[system] ${sample.system}\n` : "[system] omp's own, untouched\n");
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

  // Both of these are absolute paths on whoever's machine is running, so they
  // are built here and never written into the repository. The overlay is
  // generated from this script's own location, so it is derived, never stored.
  const paths = backend.agentic ? await prepareOmp(args) : null;
  const roots = paths ? [[paths.fixture.replace(/\\/g, "/"), "<fixture>"], [ROOT.replace(/\\/g, "/"), "<skills>"]] : [];

  const results = await pool(selected, args.concurrency, async (c) => {
    let passes = 0;
    const answers = [];
    let seq = null;
    for (let i = 0; i < args.samples; i++) {
      let answer;
      try {
        answer = backend.agentic
          ? await ompRun(args, c.arm, c.user, paths)
          : await backend.call(args.model, c.system, c.user);
      } catch (e) {
        answers.push(`ERROR ${e.message}`);
        continue;
      }
      if (c.kind === "observed") {
        const seen = observe(answer);
        seq ??= seen.seq.slice(0, 12).map((s) => redact(`${s.tool} ${s.path}`, roots));
        const want = c.scenario.activation?.shouldActivate === false;
        const graded = gradeObserved(seen, c.scenario, c.skill);
        // A negative scenario passes by the skill staying shut.
        if (want ? !graded.opened : graded.pass) passes++;
        answers.push(redact(JSON.stringify({ skills: seen.skills, rules: seen.rules }), roots));
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
    return { skill: c.skill, id: c.id, kind: c.kind, arm: c.arm, negative: c.scenario.activation?.shouldActivate === false, passes, samples: args.samples, verdict: verdictOf(passes, args.samples), seq, answers: args.verbose ? answers : undefined };
  });

  report(results, args);
  const record = { ranAt: new Date().toISOString(), model: args.model, backend: backend.name, clean: backend.clean, rules: args.rules, samples: args.samples, results: results.map(({ answers, ...r }) => r) };
  await mkdir(resolve("evals"), { recursive: true });
  await writeFile(resolve("evals/last-run.json"), `${JSON.stringify(record, null, 2)}\n`);
  if (args.writeBaseline) {
    await writeFile(BASELINE, `${JSON.stringify(record, null, 2)}\n`);
    console.log(`\nbaseline written to ${BASELINE}`);
  }
  if (args.check) process.exit(await checkAgainstBaseline(results) ? 0 : 1);
}

/**
 * The overlays and the throwaway working directory, both outside the
 * repository. The agent writes real files, so it gets a directory it is
 * welcome to ruin rather than the collection it is being measured against.
 */
async function prepareOmp(args) {
  const base = args.fixture ? resolve(args.fixture) : join(tmpdir(), `skill-evals-${process.pid}`);
  const fixture = join(base, "workspace");
  await mkdir(fixture, { recursive: true });
  const overlay = {};
  for (const arm of ["with", "without"]) {
    const p = join(base, `${arm}.yml`);
    await writeFile(p, arm === "with" ? OVERLAYS.with(ROOT) : OVERLAYS.without());
    overlay[arm] = p;
  }
  return { base, fixture, overlay };
}

function reportObserved(results) {
  const key = (r) => `${r.skill}/${r.id}`;
  const withS = new Map(results.filter((r) => r.arm === "with").map((r) => [key(r), r]));
  const without = new Map(results.filter((r) => r.arm === "without").map((r) => [key(r), r]));
  const all = [...withS.keys()].map((k) => ({ k, w: withS.get(k), o: without.get(k), neg: withS.get(k).negative }));

  // The control only means something for a scenario the skill should catch.
  // A skill that was never loaded cannot fire wrongly, so every negative passes
  // the control for free, and counting those would credit the skill with work
  // the absence of the skill did.
  const pos = all.filter((r) => !r.neg);
  const neg = all.filter((r) => r.neg);
  const pass = pos.filter((r) => r.w.verdict === "PASS").length;
  const controlPass = pos.filter((r) => r.o?.verdict === "PASS").length;
  const both = pos.filter((r) => r.w.verdict === "PASS" && r.o?.verdict === "PASS").length;

  console.log("observed behaviour");
  console.log(`  with the skills    ${pass}/${pos.length}`);
  console.log(`  without them       ${controlPass}/${pos.length}`);
  console.log(`  the skills earn    ${pass - controlPass >= 0 ? "+" : ""}${pass - controlPass}`);
  console.log(`  passed both ways   ${both}   the agent did this anyway`);
  if (neg.length) {
    console.log(`  stayed shut        ${neg.filter((r) => r.w.verdict === "PASS").length}/${neg.length}   near misses, control not applicable`);
  }
  console.log(`  unstable           ${results.filter((r) => r.verdict === "UNSTABLE").length}`);

  const bad = all.filter((r) => r.w.verdict !== "PASS");
  if (bad.length) {
    console.log("\nnot passing with the skills loaded");
    for (const r of bad) {
      console.log(`  ${r.w.verdict.padEnd(8)} ${r.k}${r.neg ? " (should stay shut)" : ""}  ${r.w.passes}/${r.w.samples}`);
      for (const s of r.w.seq ?? []) console.log(`           ${s}`);
    }
  }
}

function report(results, args) {
  if (results.some((r) => r.kind === "observed")) return reportObserved(results);
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
