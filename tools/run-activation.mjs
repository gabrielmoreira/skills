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
import { readdir, readFile, writeFile, mkdir, rm, cp, stat } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { join, resolve, basename, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { setFor } from "./split-activation.mjs";

const ROOT = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");
const BASELINE = resolve("evals/baseline.json");

// ---------------------------------------------------------------- arguments

const HELP = `Run the activation scenarios against a model.

  node tools/run-activation.mjs [selectors] [options]

SELECTORS  narrow before you spend; each one composes with the others
  --skill <name>      one bundle, repeatable       (e.g. typescript-skills)
  --rule <name>       one rule inside it           (e.g. promise-ownership)
  --id <scenario>     one named scenario           (e.g. sequential-independent-fetches)
  --kind <k>          all | routing | activation | far-miss
  --set <s>           train | validation | all     tune on train, report on validation
  --limit <n>         stop after n cases

OPTIONS
  --model <sel>       provider/model, fuzzy        (default github-copilot/gpt-5.6-terra)
  --thinking <lvl>    off..max                     (default high)
  --samples <n>       samples per case             (default 3)
  --backend <b>       omp | api                    (default omp unless ANTHROPIC_API_KEY)
  --concurrency <n>   parallel cases               (default 10, hard max 10)
  --stagger <s>       seconds between launches     (default 5)
  --dry-run           print what would be sent, spend nothing
  --check             compare against the committed baseline
  --write-baseline    replace evals/baseline.json with this run
  --verbose           per-case output
  "  --record <dir>      save each raw stream, so it can be replayed later",
  "  --replay <dir>      score recorded streams instead of calling the model",

RECIPES
  # is this one new rule reachable at all, cheaply
  node tools/run-activation.mjs --rule promise-ownership --samples 1

  # did a description change move activation, on the half held out from tuning
  node tools/run-activation.mjs --skill typescript-skills --set validation

  # the number that goes in the report
  node tools/run-activation.mjs --write-baseline

Every executable model role is pinned to the model under test, so a scenario
that delegates cannot silently measure a second model.`;

function parseArgs(argv) {
  const a = {
    samples: 3, model: null, skills: [], limit: Infinity,
    kind: "all", backend: null, rules_: [], ids: [], record: null, replay: null, profile: null, dryRun: false, check: false, writeBaseline: false,
    concurrency: 10, verbose: false,
    // omp only
    thinking: "xhigh", maxTime: 90, rules: false, fixture: null,
  };
  if (argv.includes("--help") || argv.includes("-h")) { console.log(HELP); process.exit(0); }
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--samples") a.samples = Number(argv[++i]);
    else if (k === "--thinking") a.thinking = argv[++i];
    else if (k === "--max-time") a.maxTime = Number(argv[++i]);
    else if (k === "--fixture") a.fixture = argv[++i];
    else if (k === "--with-rules") a.rules = true;
    // A comma-separated list is the retry chain, same shape as the default.
    // One wall should move to the next provider rather than end the run,
    // and the chain has to be sayable from the command line to be steerable.
    else if (k === "--model") { const v = argv[++i]; a.model = v.includes(",") ? v.split(",").map((x) => x.trim()).filter(Boolean) : v; }
    else if (k === "--skill") a.skills.push(argv[++i]);
    else if (k === "--rule") a.rules_.push(argv[++i]);
    else if (k === "--id") a.ids.push(argv[++i]);
    else if (k === "--record") a.record = argv[++i];
    else if (k === "--replay") a.replay = argv[++i];
    else if (k === "--profile") a.profile = argv[++i];
    else if (k === "--limit") a.limit = Number(argv[++i]);
    else if (k === "--kind") a.kind = argv[++i];
    else if (k === "--backend") a.backend = argv[++i];
    // A ceiling, not a suggestion: above this the provider rate-limits
    // whatever the stagger does.
    else if (k === "--concurrency") a.concurrency = Math.min(10, Number(argv[++i]));
    else if (k === "--stagger") STAGGER.ms = Number(argv[++i]) * 1000;
    // Which half of the split to run. Tune against train, select on validation,
    // and a number quoted without saying which one it came from is not a result.
    else if (k === "--set") a.set = argv[++i];
    // Which polarity to run. A false positive costs tokens on every turn it
    // fires wrongly, and unlike a miss it needs no control arm to be visible,
    // so it is the half worth measuring when the budget will not carry both.
    else if (k === "--only") a.only = argv[++i];
    else if (k === "--dry-run") a.dryRun = true;
    else if (k === "--check") a.check = true;
    else if (k === "--write-baseline") a.writeBaseline = true;
    else if (k === "--verbose") a.verbose = true;
    else throw new Error(`unknown argument: ${k}`);
  }
  if (!["all", "routing", "activation", "far-miss"].includes(a.kind)) throw new Error(`--kind must be all, routing, activation or far-miss`);
  if (a.only && !["positive", "negative"].includes(a.only)) throw new Error(`--only must be positive or negative`);
  a.backend ??= process.env.ANTHROPIC_API_KEY ? "api" : "omp";
  // Tried in order, a whole run each. Not a retry inside a run: omp already
  // does that and it is what `degraded` exists to refuse, because a run that
  // changes model halfway reports a number no model produced.
  // The retry chain, in order. The two terra providers share one quota wall in
  // practice, so they are separated rather than adjacent: a wall on the first
  // would otherwise take the second with it and end the chain two steps early.
  a.model ??= a.backend === "omp"
    ? [
        "openai-codex/gpt-5.6-terra",
        "opencode-go/gpt-5.6-luna",
        "github-copilot/gpt-5.6-terra",
        "opencode-zen/muse-spark-1.2-contributor-free",
      ].join(",")
    : "claude-haiku-4-5-20251001";
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

/**
 * Everything that could differ between two runs of the same prompt, turned off.
 *
 * Memory is built from previous rollouts, so leaving it on lets one sample teach
 * the next and the arms stop being independent. The marketplace can update
 * itself mid-run and can carry skills of its own. Temperature is pinned.
 *
 * Listing every source that might inject a skill is a losing game, so the
 * runner also records every skill it sees the agent open and reports any that
 * this collection does not own. That catches a new source without knowing it
 * exists.
 */
const QUIET = [
  "memories:\n  enabled: false\n",
  "marketplace:\n  autoUpdate: off\n",
  "temperature: 0\n",
  "extensions: []\n",
  // omp retries onto another provider when one stops serving. That is right
  // for work and wrong for measurement: the run would report a model it did
  // not use. Off here, so `degraded` sees the stop and the runner decides.
  "retry:\n  modelFallback: false\n",
].join("");

const OFF_SOURCES = [
  "enableCodexUser", "enableClaudeUser", "enableClaudeProject",
  "enablePiUser", "enablePiProject", "enableAgentsUser", "enableAgentsProject",
].map((k) => `  ${k}: false\n`).join("");

/**
 * Every executable role pinned to the model under test.
 *
 * The runner pinned the main model and nothing else. A scenario that
 * delegates would run its subagent on whatever the user's `task` role names,
 * and the number would silently mix two models. Role resolution happens
 * inside the agent, so `degraded` never sees it: that watches for quota
 * fallback, not for a role resolving elsewhere.
 *
 * Both arms get the identical block, so the arms still differ only in whether
 * the collection is loaded.
 */
const EXECUTABLE_ROLES = [
  "default", "task", "smol", "slow", "plan", "deep", "economical-deep", "review", "advisor",
];

export const pinnedRoles = (model, thinking) =>
  `modelRoles:\n${EXECUTABLE_ROLES.map((r) => `  ${r}: ${model}:${thinking}\n`).join("")}`;

export const OVERLAYS = {
  with: (skillsDir, roles) =>
    `${QUIET}${roles}skills:\n  enabled: true\n${OFF_SOURCES}  customDirectories:\n    - ${skillsDir.replace(/\\/g, "/")}\n`,
  without: (_skillsDir, roles) => `${QUIET}${roles}skills:\n  enabled: false\n`,
};

/**
 * What the agent actually did, read off the event stream.
 *
 * Asking a model which file it would open measures what it says. Watching
 * which files it opens measures what it does, and only the second one is
 * evidence. omp addresses skills as skill://<name>/<path>, so both the
 * activation and the routing decision are visible as ordinary read calls.
 */
const DELEGATES = /^(task|agent|subagent|dispatch|spawn|delegate)/i;

/**
 * Not every tool names its target the same way, and assuming they do loses the
 * ones that matter most. read, write, glob and grep carry `path`. edit carries
 * `input`, whose first line is a patch header naming the file. bash carries
 * `command` and no path at all.
 *
 * Reading only `path` silently dropped every edit target and every command,
 * which made "the test came before the implementation" and "a test ran after
 * it" unmeasurable while still reporting a number.
 */
export function targetOf(args) {
  if (!args) return { path: "", cmd: "" };
  if (typeof args.command === "string") return { path: "", cmd: args.command };
  if (typeof args.path === "string") return { path: args.path, cmd: "" };
  if (typeof args.input === "string") {
    const m = args.input.match(/^\s*\[([^\]#]+?)(?:#[^\]]*)?\]/);
    if (m) return { path: m[1], cmd: "" };
  }
  return { path: "", cmd: "" };
}

/**
 * Whether this run measured the model it claimed to measure.
 *
 * A quota that runs out mid-suite does not stop the agent: it retries, falls
 * back to another model, and keeps answering. The events look ordinary and the
 * results look like data. Ninety-six runs were recorded that way, every one on
 * a fallback chain, before the empty traces gave it away.
 *
 * Any degradation aborts the run rather than writing a number nobody can trust.
 */
export function degraded(stream) {
  for (const line of stream.split("\n")) {
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.type === "retry_fallback_applied") return { fatal: true, why: `fell back from ${j.from} to ${j.to}` };
    // A retry that recovered is the mechanism working. Only a retry that
    // changed the model is fatal, and that arrives as retry_fallback_applied
    // above; the rest is judged by whether the sample produced anything.
  }
  // A spent subscription is not one bad sample. Measured: once the limit was
  // reached, the last 18 recordings of 84 were empty and contiguous — nothing
  // after it can succeed, so carrying on spends wall-clock to manufacture
  // scenarios that look failed and were never asked.
  // Killed on our deadline. One is a lost sample; several in a row mean the
  // provider is not answering at all, which the caller escalates.
  if (/"type":"harness_timeout"/.test(stream)) {
    return { fatal: false, timeout: true, why: "the model did not answer before the deadline" };
  }

  // A fourth disguise for the same thing. OpenRouter reserves credit for the
  // maximum output a request could produce, so an account with a little money
  // left refuses every agentic call while still answering a one-line probe:
  // "You requested up to 131072 tokens, but can only afford 40605." Answering
  // is not the same as being able to work, and treating the first as evidence
  // of the second cost 138 empty recordings before anyone looked.
  // Matched as an error, not as a number. An earlier version tested /\b402\b/
  // against the whole stream, which matches any standalone 402 in anything the
  // agent read — and the arm carrying 12,000 extra tokens of skill text hit one
  // and was aborted at sample eight while its twin ran all 120. A detector that
  // fires on something other than what it names is worse than none: it produced
  // a credit diagnosis for a run with no credit problem.
  if (/"errorStatus":\s*402|requires more credits|can only afford/i.test(stream)) {
    return { fatal: true, why: "the account cannot reserve credit for a request this size" };
  }

  const spent = stream.match(/usage[_ ]limit[_ ]reached|quota[_ ]exceeded|insufficient[_ ]quota/i);
  if (spent) return { fatal: true, why: `provider is out of quota (${spent[0]}), so nothing after this can run` };

  // Nothing named it, so judge it by what it did. An agentic sample that
  // executed no tool and produced a few kilobytes did not run: an upstream
  // refusal, or a transport that gave up. Scoring it as a failure is how a
  // provider going quiet becomes evidence against a skill.
  if (!/"type":"tool_execution_start"/.test(stream) && stream.length < 8000) {
    return { fatal: false, why: `no tool ran in ${stream.length} bytes, so this sample measured nothing` };
  }
  return null;
}

/** A command that runs tests, as opposed to one that lists a directory. */
export const isTestRun = (cmd) =>
  /\b(npm|pnpm|yarn|bun)\s+(run\s+)?test\b|\bnode\s+--test\b|\b(vitest|jest|pytest|mocha|ava|go\s+test|cargo\s+test|rspec|phpunit)\b/.test(cmd);

export function observe(stream, harnessDir = null) {
  const skills = new Set();
  const rules = new Set();
  const seq = [];
  let delegated = false;
  let sawHarness = false;
  for (const line of stream.split("\n")) {
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.type !== "tool_execution_start") continue;
    const { path, cmd } = targetOf(j.args);
    seq.push({ tool: j.toolName, path, cmd });
    if (DELEGATES.test(j.toolName ?? "")) delegated = true;
    if (harnessDir && path.replace(/\\/g, "/").includes(harnessDir.replace(/\\/g, "/"))) sawHarness = true;
    const m = path.match(/^skill:\/\/([a-z0-9-]+)(?:\/(.+))?$/);
    if (!m) continue;
    skills.add(m[1]);
    if (m[2]) rules.add(m[2]);
  }

  // A delegating agent may do its reading inside a child whose tool calls never
  // reach this stream. Every skill:// path anywhere in the transcript is
  // collected as a second, weaker channel, and the two are reported apart so a
  // mention is never mistaken for an observed read.
  const mentioned = new Set();
  for (const m of stream.matchAll(/skill:\/\/([a-z0-9-]+)\/((?:[a-z0-9-]+\/)?(?:rules\/)?[a-zA-Z0-9-]+\.md)/g)) {
    mentioned.add(`${m[1]}|${m[2]}`);
  }
  const onlyMentioned = [...mentioned]
    .filter((s) => !rules.has(s.split("|")[1]))
    .map((s) => s.replace("|", "/"));

  return { skills: [...skills], rules: [...rules], seq, delegated, sawHarness, onlyMentioned };
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
/**
 * A fresh working directory for every single call.
 *
 * Sharing one directory across calls was the worst determinism defect in the
 * first version: with six running at once, one call read the test file another
 * had just written, and a sample was no longer independent of its neighbours.
 */
const SEED = {
  "package.json": `{\n  "name": "workspace",\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n`,
  "src/index.js": "export function main() {\n  return null;\n}\n",
};

async function freshWorkspace(base, skillDir, id) {
  const dir = join(base, `w-${randomUUID().slice(0, 8)}`);
  for (const [rel, content] of Object.entries(SEED)) {
    const target = join(dir, rel);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  // A scenario describing a state that already exists needs that state to be
  // there. Measured without it, four of six scenarios in the first experiment
  // did nothing in either arm, and the run scored the fixture rather than the
  // skill.
  const fixture = join(skillDir, "evals", "fixtures", id);
  if (await stat(fixture).then(() => true, () => false)) {
    await cp(fixture, dir, { recursive: true, force: true });
    // Some scenarios need history rather than files: a review needs a range,
    // and a range needs commits. A fixture may ship setup.sh to build one, and
    // it runs once in the throwaway workspace before the agent sees it.
    const setup = join(dir, "setup.sh");
    if (await stat(setup).then(() => true, () => false)) {
      await new Promise((ok) => {
        const c = spawn("bash", ["setup.sh"], { cwd: dir, stdio: "ignore" });
        c.on("close", ok);
        c.on("error", ok);
      });
      await rm(setup, { force: true }).catch(() => {});
    }
  }
  return dir;
}

async function ompRun(a, arm, prompt, paths, cwd) {
  // Before the process exists, not inside the executor: the wait is the point,
  // and a Promise executor cannot await.
  await stagger();
  return new Promise((ok, bad) => {
    const args = [
      "-p", prompt,
      "--model", a.model,
      "--thinking", a.thinking,
      "--config", paths.overlay[arm],
      "--cwd", cwd,
      "--mode", "json",
      "--max-time", String(a.maxTime),
      "--no-session", "--no-extensions",
    ];
    // Without this the user's own AGENTS.md is loaded, and its routing table
    // already names these skills. That measures the instructions, not the skill.
    // The isolated profile carries our config and a copy of the credentials,
    // so a run reads what we wrote and not the user's global settings.
    if (a.profile) args.push("--profile", a.profile);
    if (!a.rules) args.push("--no-rules");
    // The child's own --max-time is a request, not a guarantee. Measured: ten
    // workers sat on a model that accepted the connection and never answered,
    // and because this waited only on `close`, the promise never settled and
    // the run hung for fourteen hours holding every worker. A deadline here
    // turns an unbounded stall into one lost sample.
    const child = spawn("omp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let settled = false;
    const deadline = (a.maxTime * 2 + 30) * 1000;
    const done = (v) => { if (settled) return; settled = true; clearTimeout(timer); ok(v); };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      done(`${out}
{"type":"harness_timeout","afterMs":${deadline}}
`);
    }, deadline);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", (e) => { if (settled) return; settled = true; clearTimeout(timer); bad(e); });
    child.on("close", () => done(out));
  });
}

/**
 * Starts are spaced, not just capped.
 *
 * Concurrency limits how many runs are in flight; it does nothing about when
 * they begin. Eight workers with a limit of eight all launch in the same
 * instant, and the provider sees eight requests at once — a burst, and a rate
 * limit. So the gate is on launches: each one waits until the configured
 * interval has passed since the previous launch, whichever worker owns it.
 *
 * The queue is a promise chain rather than a timestamp check, because two
 * workers reading the same timestamp before either writes it would both decide
 * they may go, which is the burst the gate exists to prevent.
 */
export const STAGGER = { ms: 5_000 };
let lastLaunch = 0;
let launchQueue = Promise.resolve();
function stagger() {
  launchQueue = launchQueue.then(async () => {
    const wait = lastLaunch + STAGGER.ms - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastLaunch = Date.now();
  });
  return launchQueue;
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

/**
 * A target the observed arm can decide: a file on disk the agent either opened
 * or did not. A bare bundle name names a routing answer instead, and no amount
 * of watching the filesystem settles it.
 */
export const gradableTarget = (t) => typeof t === "string" && /\.md$/.test(t);

export function gradeRouting(answer, scenario) {
  const got = pathsIn(answer);
  const want = (scenario.expectedAll?.length ? scenario.expectedAll : [scenario.expectedPrimary]).map(normalise);
  const forbidden = (scenario.activation?.forbiddenRoutes ?? []).map(normalise);
  const hit = want.every((w) => got.some((g) => samePath(g, w)));
  const violated = forbidden.filter((f) => got.some((g) => samePath(g, f)));
  return { pass: hit && !violated.length, got, want, violated };
}

/**
 * Did the guidance reach the agent, by whatever path it travelled?
 *
 * Scoring "opened the expected file" is exact and answers a narrower question
 * than the one being asked. It makes the harness structurally unable to judge
 * the change this collection is heading towards: fold a rule into the index it
 * sits under and the file stops existing, so the check fails on every run and
 * reports a compression as a regression. An instrument that scores an
 * improvement as damage cannot be used to decide whether to make it.
 *
 * So delivery is what counts. A rule arrived if the agent opened its file, or
 * if it opened a file that carries that rule's text inline. The second case is
 * resolved against the collection on disk rather than guessed: the absorbing
 * file has to actually contain the rule's own heading.
 *
 * The check stays deterministic. It reads files, not intentions, and says which
 * path delivered so a pass is never mysterious.
 */
const deliveryCache = new Map();
function deliveredBy(openedPath, wantPath) {
  const key = `${openedPath}|${wantPath}`;
  if (deliveryCache.has(key)) return deliveryCache.get(key);
  let ok = false;
  try {
    // The rule's own heading is the anchor: a file that absorbed it carries the
    // heading, a file that merely routes to it carries only the path.
    const ruleFile = wantPath.split("/").pop().replace(/\.md$/, "");
    // A bundle name is a directory. What was read is its entry file, and that is
    // exactly where a folded rule would live, so resolving it is the whole point
    // rather than a detail.
    let rel = openedPath.replace(/^skill:\/\//, "");
    if (!rel.endsWith(".md")) {
      rel = ["SKILL.md", "INDEX.md"].map((f) => join(rel, f)).find((p) => existsSync(join(ROOT, p))) ?? rel;
    }
    const body = readFileSync(join(ROOT, rel), "utf8");
    const heading = ruleFile.replace(/-/g, "[ -]");
    ok = new RegExp(`^#{1,3}\\s.*${heading}`, "im").test(body);
  } catch {
    ok = false;
  }
  deliveryCache.set(key, ok);
  return ok;
}

export function gradeObserved(seen, scenario, skillName) {
  const want = (scenario.expectedAll?.length ? scenario.expectedAll : [scenario.expectedPrimary])
    .filter(Boolean)
    .map(normalise);
  const forbidden = (scenario.activation?.forbiddenRoutes ?? []).map(normalise);
  const opened = seen.skills.includes(skillName);
  // Every file this run actually read from the collection, index included: the
  // index is where an inlined rule would be carried, so leaving it out would
  // reintroduce the blindness this is fixing.
  const read = [...seen.rules.map((r) => `${skillName}/${r}`), ...seen.skills];
  const how = new Map();
  const reached = (w) => {
    if (seen.rules.some((g) => samePath(g, w))) { how.set(w, "opened"); return true; }
    const via = read.find((p) => deliveredBy(p, w));
    if (via) { how.set(w, `inline in ${via}`); return true; }
    return false;
  };
  const hit = want.every(reached);
  const violated = forbidden.filter((f) => seen.rules.some((g) => samePath(g, f)));
  return { opened, pass: opened && hit && !violated.length, got: seen.rules, want, violated, how: Object.fromEntries(how) };
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
  // A skill with something underneath can be looked at and declined. A flat one
  // cannot: reading its entry is the whole of using it. The negative verdict
  // below asks a different question of each, and this is what tells them apart.
  for (const d of await readdir(dir, { withFileTypes: true })) {
    if (!d.isDirectory() || ["evals", "references", "rules", "node_modules"].includes(d.name)) continue;
    try {
      await readFile(join(dir, d.name, "INDEX.md"));
      paths.push(`${d.name}/INDEX.md`);
    } catch {}
  }
  const scenarios = [];
  // Scenarios live beside the unit they cover, so a multi-topic skill keeps
  // them under each topic rather than in one pile at the root. Reading only
  // the root evals made every topic scenario invisible to this runner, which
  // is why a --rule selector matched nothing.
  const scenarioFiles = async (from) => {
    const found = [];
    let entries = [];
    try { entries = await readdir(from, { withFileTypes: true }); } catch { return found; }
    for (const e of entries) {
      const p = join(from, e.name);
      if (e.isDirectory()) found.push(...await scenarioFiles(p));
      else if (/\.scenarios\.(mjs|ts)$/.test(e.name) && /(^|[\\/])evals[\\/]/.test(p)) found.push(p);
    }
    return found;
  };
  for (const p of (await scenarioFiles(dir)).sort()) {
    try {
      const mod = await import(pathToFileURL(p).href);
      for (const s of mod.default ?? mod.scenarios ?? []) scenarios.push(s);
    } catch {}
  }
  return { name: basename(dir), dir, entry, entryName, description, paths, scenarios };
}

/** One unit of work: a scenario, an arm, and the exact prompt it will send. */
casesFor.skipped = [];
function casesFor(skill, args) {
  const out = [];
  const ungradeable = [];
  const answerGraded = [];
  for (const s of skill.scenarios) {
    if (typeof s.prompt !== "string") continue;
    if (args.set && args.set !== "all" && setFor(s) !== args.set) continue;
    // Narrower than --skill: one rule, or one named scenario. A conclusion
    // drawn from forty scenarios when the question was about one is not a
    // sharper conclusion, only a slower one.
    if (args.rules_.length && !args.rules_.includes(s.rule)) continue;
    if (args.ids.length && !args.ids.includes(s.id)) continue;
    // Graded on what was said, not on what was opened. A skill whose
    // description instructs an unconditional read cannot have a read-based
    // negative: the verdict would be decided before the scenario ran. Counted
    // and reported, never failed here.
    if (s.gradeOn === "answer") { answerGraded.push(`${skill.name}/${s.id}`); continue; }

    // The agentic backend sends the developer's message unchanged. Wrapping it
    // in a question about file paths would replace the thing being measured.
    if (args.backend === "omp") {
      // The observed arm grades on paths the agent opened, so it needs paths.
      // A scenario carrying only a bundle name belongs to the tree's own
      // suite, which asks a different question, and failing it here would be
      // a finding this runner invented.
      // Gradeable is a question about the shape of the expectation, not about
      // which field carries it. `rules/foo.md` is a file the agent either
      // opened or did not, whether it arrived as expectedAll or as
      // expectedPrimary; a bare bundle name is a routing answer that watching
      // the filesystem cannot settle. Asking for the field rather than the
      // shape excluded sixty positives that were decidable all along, and two
      // skills never had a positive measured at all.
      const want = (s.expectedAll?.length ? s.expectedAll : [s.expectedPrimary]).filter(Boolean);
      const decidable = want.length ? want.every(gradableTarget) : s.activation?.layer === "public-skill";
      if (s.expectedPrimary && !decidable) { ungradeable.push(`${skill.name}/${s.id}`); continue; }
      if (!decidable) continue;
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
  if (answerGraded.length) console.log(`  ${answerGraded.length} scenario(s) graded on the answer, not here: ${answerGraded.join(", ")}`);
  if (ungradeable.length) casesFor.skipped.push(...ungradeable);
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

/**
 * A Wilson 95% interval. A rate printed without one invites reading noise as
 * movement, which is exactly what happened to the first three baselines.
 */
export function bounds(p, n) {
  if (!n) return { lo: 0, hi: 100 };
  const z = 1.96;
  const rate = p / n;
  const d = 1 + (z * z) / n;
  const centre = (rate + (z * z) / (2 * n)) / d;
  const half = (z * Math.sqrt((rate * (1 - rate)) / n + (z * z) / (4 * n * n))) / d;
  return { lo: Math.max(0, 100 * (centre - half)), hi: Math.min(100, 100 * (centre + half)) };
}

export function interval(p, n) {
  if (!n) return "";
  const { lo, hi } = bounds(p, n);
  return `[${Math.round(lo)}-${Math.round(hi)}%]`;
}

/**
 * Whether a rule earned its place, pooled across its scenarios.
 *
 * A single scenario at three samples decides almost nothing: three passes and
 * zero passes are both inside the noise of a coin. The rule is the smallest
 * unit worth a verdict, because its scenarios pool.
 *
 * The test is the gap, not the rate. A rule the agent satisfies anyway bought
 * nothing however high its with-arm sits, so acceptance is the with-arm's lower
 * bound clearing the without-arm's upper bound. No invented percentage, and it
 * tightens on its own as samples are added.
 */
export function acceptance(withP, withN, withoutP, withoutN) {
  if (!withN) return { verdict: "NO DATA", note: "nothing ran" };
  const w = bounds(withP, withN);
  const o = bounds(withoutP, withoutN);
  if (!withoutN) return { verdict: "UNCONTROLLED", note: "no without arm, so the gap is unknown" };
  if (w.lo > o.hi) return { verdict: "ACCEPT", note: `${Math.round(w.lo)}% floor clears the ${Math.round(o.hi)}% ceiling without it` };
  if (o.lo > w.hi) return { verdict: "HARMFUL", note: "it does better without the rule" };
  // Both arms at zero is not the same finding as both arms succeeding, and one
  // label for them asserts the opposite of the truth. "The agent does this
  // anyway" requires the arm without the rule to have done it; when neither arm
  // passed, the rule was never reached even with the skill loaded, which points
  // at routing rather than at a rule that earns nothing.
  if (!withP && !withoutP) {
    return { verdict: "NEVER REACHED", note: "no run opened it, with the skill or without: routing, not worth" };
  }
  const same = withP / withN <= withoutP / withoutN;
  if (same) return { verdict: "NO EFFECT", note: "the agent does this anyway" };
  return { verdict: "UNSTABLE", note: `bounds overlap: ${Math.round(w.lo)}-${Math.round(w.hi)} against ${Math.round(o.lo)}-${Math.round(o.hi)}, needs more samples` };
}

function verdictOf(passes, samples) {
  // No samples is not zero passes. Absence reported as failure is how a
  // provider going quiet becomes evidence against a skill.
  if (!samples) return "NO DATA";
  if (passes === samples) return "PASS";
  if (passes === 0) return "FAIL";
  return "UNSTABLE";
}

async function main(modelOverride) {
  const args = parseArgs(process.argv.slice(2));
  if (modelOverride) args.model = modelOverride;
  const dirs = (await readdir(ROOT, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && (!args.skills.length || args.skills.includes(d.name)))
    .map((d) => join(ROOT, d.name));

  const cases = [];
  if (args.kind === "far-miss") {
    // One arm only. The control is trivial: nothing fires when nothing is
    // loaded, so measuring it would add cost and no information.
    const mod = await import(pathToFileURL(resolve("evals/far-miss.scenarios.mjs")).href);
    for (const s of mod.default ?? []) {
      cases.push({ kind: "far-miss", arm: "with", skill: "(collection)", id: s.id, scenario: s, user: s.prompt });
    }
  } else {
    for (const dir of dirs) {
      const skill = await loadSkill(dir);
      // The shape travels with the case: a negative for a skill with rules
      // beneath it asks a different question from one for a flat skill.
      if (skill) cases.push(...casesFor(skill, args).map((c) => ({ ...c, skillPaths: skill.paths })));
    }
  }
  // Only a positive can show the gap; a negative passes for free in the arm
  // without the skill. Whatever truncates a run — a quota, a --limit, an
  // interrupt — takes it from the end, so the half that carries the evidence
  // goes first. The sort is stable, which keeps each scenario's two arms
  // adjacent: a positive with no control arm would measure nothing.
  const isNegative = (c) => c.scenario?.activation?.shouldActivate === false || c.scenario?.mode === "bypass";
  // Whether this skill has anything beneath its entry, decided once from the
  // paths loadSkill found rather than re-read per sample.
  const deep = new Map();
  for (const c of cases) {
    if (deep.has(c.skill)) continue;
    deep.set(c.skill, (c.skillPaths ?? []).some((x) => x.includes("/") ));
  }
  cases.sort((a, b) => Number(isNegative(a)) - Number(isNegative(b)));
  // A negative run needs only the arm that has the skills to open: the other
  // arm has nothing to fire and would pass for free, at full price.
  const keep = args.only === "negative" ? (c) => isNegative(c) && c.arm === "with"
    : args.only === "positive" ? (c) => !isNegative(c)
    : () => true;
  const kept = cases.filter(keep);
  const selected = kept.slice(0, args.limit === Infinity ? kept.length : args.limit);

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
  const roots = paths
    ? [
        [paths.conf.replace(/\\/g, "/"), "<harness>"],
        [paths.base.replace(/\\/g, "/"), "<workspace>"],
        [ROOT.replace(/\\/g, "/"), "<skills>"],
      ]
    : [];

  // Self-checks. Each names a way a run can be worth less than it looks, and
  // each is counted rather than assumed away.
  const flags = { delegated: 0, sawHarness: 0, foreign: new Set() };
  // Set by the first degraded call. Everything after it stops immediately.
  let stop = null;
  // The whole collection, not the selected subset: a sibling skill opening is
  // normal and interesting, a skill from somewhere else means a source is still
  // loading that the overlay was supposed to have silenced.
  const ours = new Set(
    (await readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name),
  );

  let timeouts = 0;
  const results = await pool(selected, args.concurrency, async (c) => {
    if (stop) return { skill: c.skill, id: c.id, kind: c.kind, arm: c.arm, passes: 0, samples: 0, verdict: "SKIPPED" };
    let passes = 0;
    let lost = 0;
    const answers = [];
    const opened = [];
    let seq = null;
    let entered = false;
    for (let i = 0; i < args.samples; i++) {
      let answer;
      let workspace = null;
      try {
        if (backend.agentic) {
          // A recorded stream is the whole run: what the agent opened, what it
          // answered, and the events `degraded` reads. Replaying it exercises
          // every scoring path for nothing, which is what makes it safe to
          // change the scoring without paying for the model again.
          const tag = `${c.skill}__${c.id}__${c.arm}__${i}`;
          if (args.replay) {
            answer = await readFile(join(args.replay, `${tag}.txt`), "utf8").catch(() => {
              throw new Error(`no recording for ${tag} in ${args.replay}`);
            });
          } else {
            workspace = await freshWorkspace(paths.base, join(ROOT, c.skill), c.id);
            answer = await ompRun(args, c.arm, c.user, paths, workspace);
            if (args.record) {
              await mkdir(args.record, { recursive: true });
              await writeFile(join(args.record, `${tag}.txt`), answer);
            }
          }
        } else {
          answer = await backend.call(args.model, c.system, c.user);
        }
      } catch (e) {
        // A sample that threw produced nothing, and nothing is not zero passes.
        // Without this the denominator kept counting it: a scenario with no
        // recording at all reported 0/3 FAIL, which is how twelve negatives
        // that were never run read as a skill firing on every one of them.
        answers.push(`ERROR ${e.message}`);
        lost++;
        continue;
      } finally {
        if (workspace) await rm(workspace, { recursive: true, force: true }).catch(() => {});
      }
      let bad = backend.agentic ? degraded(answer) : null;
      // On replay every one of these is history. A quota wall recorded last
      // night says nothing about now, and reading one as a live condition
      // aborted a replay of 81 recordings on the first bad one — throwing away
      // 80 good samples to re-report a failure that was already known. Nothing
      // a recording contains can end a run that is not calling anyone.
      if (bad && args.replay) bad = { ...bad, fatal: false };
      // A lost sample is lost. A model substitution makes every later sample
      // suspect, so only that one ends the run.
      if (bad?.timeout) {
        // A provider that answers nothing would otherwise burn the deadline on
        // every remaining sample: 192 launches at three and a half minutes each
        // is eleven hours to learn what three launches already showed.
        if (++timeouts >= 3) { stop ??= "three launches in a row hit the deadline, so the model is not answering"; break; }
      } else if (!bad) timeouts = 0;
      if (bad && !bad.fatal) { lost++; continue; }
      if (bad) {
        stop ??= bad.why;
        break;
      }
      if (c.kind === "far-miss") {
        const seen = observe(answer, paths?.conf);
        seq ??= seen.seq.slice(0, 12).map((s) => redact(`${s.tool} ${s.path || s.cmd || ""}`.trim(), roots));
        if (seen.skills.length === 0) passes++;
        answers.push(seen.skills.join(", ") || "(quiet)");
        opened.push(...seen.skills);
        continue;
      }
      if (c.kind === "observed") {
        const seen = observe(answer, paths.conf);
        // Reading the entry file and opening a rule underneath it are different
        // acts, and a negative currently fails on the first. The only way to
        // establish that a skill does not apply is to read enough of it, and
        // several scenarios say so in their own words ("without opening a
        // rule"). The verdict is left alone here; what was missing is being
        // able to see which of the two happened.
        if (seen.skills.includes(c.skill)) entered ||= seen.rules.length > 0;
        if (seen.delegated) flags.delegated++;
        if (seen.sawHarness) flags.sawHarness++;
        for (const s of seen.skills) if (!ours.has(s)) flags.foreign.add(s);
        seq ??= seen.seq.slice(0, 12).map((s) => redact(`${s.tool} ${s.path}`, roots));
        const want = c.scenario.activation?.shouldActivate === false;
        const graded = gradeObserved(seen, c.scenario, c.skill);
        // A negative scenario passes by the skill not taking the work.
        //
        // It used to pass only by the entry file never being read, and that is
        // a stricter question than any scenario asks. Establishing that a skill
        // does not apply requires reading enough of it, and one scenario here
        // carries must: "Answers the question on its merits without opening a
        // rule" against an agent that opened no rule: by its own criterion it
        // passed, and the runner failed it anyway.
        //
        // Measured over 57 portable negatives: 9 read an entry, 3 went on to
        // open a rule. Only the second is a skill taking work that is not its
        // own, and the two numbers were being reported as one.
        //
        // Which question applies depends on shape. A skill with rules beneath
        // it can be opened, judged and declined, so entering is the failure. A
        // flat skill has nothing underneath, so reading it is the whole of
        // using it and the old rule still holds.
        // Which rules count as this scenario's own.
        //
        // c.skill is the top-level directory, because that is what loadSkill
        // walks. In a multi-topic tree every one of the nine topics reports as
        // typescript-skills, so "opened any rule" was true whenever the agent
        // went to the sibling topic a bypass names, which is the correct move.
        //
        // Measured on eight topic negatives: the harness called five of them
        // over-activation. Seven of the eight had left the topic under test
        // completely shut and gone to the sibling the prompt pointed at. Only
        // one genuinely entered its own topic.
        //
        // So a scenario that names a bundle narrower than the skill is scored
        // against that bundle. A rule opened in a sibling is a handoff, not a
        // failure to decline.
        const own = c.scenario?.bundle && c.scenario.bundle !== c.skill
          ? seen.rules.filter((r) => String(r).includes(c.scenario.bundle))
          : seen.rules;
        const tookIt = deep.get(c.skill) ? own.length > 0 : graded.opened;
        if (want ? !tookIt : graded.pass) passes++;
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
    return { skill: c.skill, id: c.id, rule: c.scenario?.rule ?? null, kind: c.kind, arm: c.arm, opened: [...new Set(opened)], negative: c.scenario.activation?.shouldActivate === false, entered, passes, samples: args.samples - lost, lost, verdict: verdictOf(passes, args.samples - lost), seq, answers: args.verbose ? answers : undefined };
  });

  if (stop) {
    console.log(`
ABORTED  ${stop}`);
    console.log("The provider stopped serving the model this run asked for, so the");
    console.log("remaining calls were skipped and nothing was written. Check quota,");
    console.log("then re-run once the intended model is being served again.");
    return { aborted: stop };
  }

  report(results, args, flags);
  const record = { ranAt: new Date().toISOString(), model: args.model, backend: backend.name, replayed: Boolean(args.replay), clean: backend.clean, rules: args.rules, samples: args.samples, thinking: args.thinking, provider: String(args.model).split("/")[0], roles: EXECUTABLE_ROLES, selfChecks: { delegated: flags.delegated, sawHarness: flags.sawHarness, foreign: [...flags.foreign] }, results: results.map(({ answers, ...r }) => r) };
  await mkdir(resolve("evals"), { recursive: true });
  await writeFile(resolve("evals/last-run.json"), `${JSON.stringify(record, null, 2)}\n`);
  if (args.writeBaseline) {
    // Two different questions, two different records. Folding them into one
    // file would let a far-miss run silently replace the behaviour numbers.
    const target = args.kind === "far-miss" ? resolve("evals/far-miss.json") : BASELINE;
    await writeFile(target, `${JSON.stringify(record, null, 2)}\n`);
    console.log(`\nwritten to ${target}`);
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
  // The overlays live outside the fixture's tree. A first run left them one
  // directory above it, and the agent globbed upward, read both arms, and
  // learned it was inside an experiment.
  const conf = join(tmpdir(), `.omp-cfg-${process.pid}`);
  await mkdir(fixture, { recursive: true });
  await mkdir(conf, { recursive: true });
  const roles = pinnedRoles(args.model, args.thinking);
  const overlay = {};
  for (const arm of ["with", "without"]) {
    const p = join(conf, `${arm}.yml`);
    await writeFile(p, arm === "with" ? OVERLAYS.with(ROOT, roles) : OVERLAYS.without(ROOT, roles));
    overlay[arm] = p;
  }
  return { base, conf, fixture, overlay };
}

function reportObserved(results, flags) {
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

  // Pooled samples first, per-scenario verdicts second.
  //
  // Three runs of unchanged code produced the same headline and a different
  // composition every time, with one scenario scoring 0, then 2, then 1 out of
  // 3. That is what a rate near 60% does to a three-sample verdict: it lands on
  // UNSTABLE most of the time and on PASS about one run in five. Counting
  // verdicts measures the coin. Pooling the samples measures the skill.
  const pool = (rows, arm) => {
    const r = rows.map((x) => (arm === "with" ? x.w : x.o)).filter(Boolean);
    return { p: r.reduce((s, x) => s + x.passes, 0), n: r.reduce((s, x) => s + x.samples, 0) };
  };
  const rate = ({ p, n }) => (n ? `${p}/${n} ${Math.round((100 * p) / n)}% ${interval(p, n)}` : "n/a");
  const withPool = pool(pos, "with");
  const withoutPool = pool(pos, "without");

  console.log("observed behaviour");
  console.log(`  with the skills    ${rate(withPool)}`);
  console.log(`  without them       ${rate(withoutPool)}`);
  console.log(`  by scenario        ${pass}/${pos.length} pass, ${controlPass}/${pos.length} without`);
  console.log(`  passed both ways   ${both}   the agent did this anyway`);
  const negRan = neg.filter((r) => r.w.samples > 0);
  if (negRan.length) {
    console.log(`  stayed shut        ${negRan.filter((r) => r.w.verdict === "PASS").length}/${negRan.length}   near misses, control not applicable`);
  } else if (neg.length) {
    console.log(`  stayed shut        no data   ${neg.length} negatives produced nothing`);
  }
  console.log(`  unstable           ${results.filter((r) => r.verdict === "UNSTABLE").length}`);
  const lost = results.reduce((a, r) => a + (r.lost ?? 0), 0);
  const norun = all.filter((r) => !r.w.samples).length;
  if (lost || norun) {
    console.log(`  lost samples       ${lost}   ${norun} scenarios produced nothing and carry no verdict`);
  }
  console.log("  (per-scenario outcomes are a screen; three samples cannot carry a verdict)");

  // Pooled per rule, which is the unit the acceptance bar is calibrated for.
  const rules = new Map();
  for (const r of results) {
    if (!r.rule || r.negative) continue;
    if (!rules.has(r.rule)) rules.set(r.rule, { w: { p: 0, n: 0 }, o: { p: 0, n: 0 }, ids: new Set() });
    const e = rules.get(r.rule);
    const arm = r.arm === "with" || r.arm === "gated" ? e.w : e.o;
    arm.p += r.passes; arm.n += r.samples; e.ids.add(r.id);
  }
  if (rules.size) {
    console.log("\nby rule, pooled");
    for (const [rule, e] of [...rules].sort()) {
      const a = acceptance(e.w.p, e.w.n, e.o.p, e.o.n);
      const line = `${e.w.p}/${e.w.n} with, ${e.o.p}/${e.o.n} without, ${e.ids.size} scenarios`;
      console.log(`  ${a.verdict.padEnd(13)} ${rule.padEnd(34)} ${line}`);
      if (a.verdict !== "ACCEPT") console.log(`  ${"".padEnd(13)} ${"".padEnd(34)} ${a.note}`);
    }
  }

  // A run can be worth less than it looks. Each of these says how.
  if (flags?.delegated) console.log(`  delegated          ${flags.delegated}   a child's reads may not appear in the transcript`);
  if (flags?.sawHarness) console.log(`  read the harness   ${flags.sawHarness}   the agent found the eval's own config`);
  if (flags?.foreign?.size) console.log(`  foreign skills     ${[...flags.foreign].join(", ")}   a source the overlay did not silence`);

  const bad = all.filter((r) => r.w.verdict !== "PASS" && r.w.samples > 0);
  if (bad.length) {
    console.log("\nnot passing with the skills loaded");
    for (const r of bad) {
      console.log(`  ${r.w.verdict.padEnd(8)} ${r.k}${r.neg ? " (should stay shut)" : ""}  ${r.w.passes}/${r.w.samples}`);
      for (const s of r.w.seq ?? []) console.log(`           ${s}`);
    }
  }
}

function reportFarMiss(results) {
  const quiet = results.filter((r) => r.verdict === "PASS").length;
  console.log("prompts no skill should claim");
  console.log(`  stayed quiet       ${quiet}/${results.length}`);
  const noisy = results.filter((r) => r.verdict !== "PASS");
  if (!noisy.length) return;
  console.log("\nopened anyway");
  for (const r of noisy) {
    console.log(`  ${r.verdict.padEnd(8)} ${r.id.padEnd(24)} ${r.passes}/${r.samples} quiet   ${r.opened.join(", ")}`);
  }
}

function report(results, args, flags) {
  if (results.some((r) => r.kind === "far-miss")) return reportFarMiss(results);
  if (results.some((r) => r.kind === "observed")) return reportObserved(results, flags);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    const m = parseArgs(process.argv.slice(2)).model ?? "";
    const models = (Array.isArray(m) ? m : m.split(",")).map((s) => s.trim()).filter(Boolean);
    for (const [i, m] of models.entries()) {
      const r = await main(m);
      if (!r?.aborted) return;
      const next = models[i + 1];
      if (!next) { console.log("no provider left to try"); process.exit(3); }
      console.log(`\nretrying the whole run on ${next}`);
    }
  })().catch((e) => {
    console.error(e.message);
    process.exit(2);
  });
}
