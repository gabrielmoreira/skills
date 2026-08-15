#!/usr/bin/env node
/**
 * Does reading every rule produce better work than reading the routed ones?
 *
 * The tempting version of this experiment is to ask the model at the end
 * whether reading more would have helped. That question answers itself: a model
 * asked whether more context would have improved its work says yes, because
 * agreeing is cheaper than disagreeing. It measures acquiescence.
 *
 * So nothing here asks for an opinion. The same scenario runs twice, once
 * normally and once with an instruction to read every rule first, and the two
 * are compared on what ended up in the transcript:
 *
 *   wroteTest        a test file was written at all
 *   testBeforeImpl   the test was written before the implementation
 *   ranBeforeImpl    a command ran between the two, so a red could be seen
 *   ranAfterImpl     a command ran after, so the green was checked
 *
 * Those four are the skill's own claims, and each is a fact about the sequence
 * rather than a judgment about it. Cost is recorded beside them, because an arm
 * that buys the same outcome for more money lost.
 *
 * Usage:
 *   node tools/experiments/read-all-rules.mjs --skill test-first-by-evidence --samples 3
 */
import { readdir, readFile, writeFile, mkdir, rm, cp, stat } from "node:fs/promises";
import { join, resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { observe, isTestRun } from "../run-activation.mjs";

const ROOT = resolve("skills");
const MODEL = "github-copilot/gpt-5.6-terra";

// The treatment, worded as the user would word it. It is a prompt change on
// purpose: the question is what happens when someone asks for this.
const READ_ALL = "Before you start, read every rule file in the skill you are using.";

const SEED = {
  "package.json": `{\n  "name": "workspace",\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n`,
  "src/index.js": "export function main() {\n  return null;\n}\n",
};

const QUIET = "memories:\n  enabled: false\nmarketplace:\n  autoUpdate: off\ntemperature: 0\nextensions: []\n";
const OFF = ["enableCodexUser", "enableClaudeUser", "enableClaudeProject", "enablePiUser", "enablePiProject", "enableAgentsUser", "enableAgentsProject"]
  .map((k) => `  ${k}: false\n`).join("");

function parseArgs(argv) {
  const a = { skill: "test-first-by-evidence", samples: 3, concurrency: 6, maxTime: 110, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--skill") a.skill = argv[++i];
    else if (k === "--samples") a.samples = Number(argv[++i]);
    else if (k === "--concurrency") a.concurrency = Number(argv[++i]);
    else if (k === "--max-time") a.maxTime = Number(argv[++i]);
    else if (k === "--limit") a.limit = Number(argv[++i]);
    else throw new Error(`unknown argument: ${k}`);
  }
  return a;
}

const isTest = (p) => /\.(test|spec)\./.test(p);
const isSource = (p) => /\.(js|ts|mjs|cjs|jsx|tsx|py|go|rs)$/.test(p) && !isTest(p) && !p.startsWith("skill://");

/**
 * Four facts about the order of what happened. No judgment, no scoring, and
 * nothing that depends on reading the prose the agent produced.
 */
export function outcomes(seq) {
  const acts = seq.map((s, i) => ({ ...s, i }));
  const writes = acts.filter((s) => s.tool === "write" || s.tool === "edit");
  const runs = acts.filter((s) => s.tool === "bash" && isTestRun(s.cmd ?? ""));
  const test = writes.find((s) => isTest(s.path));
  const impl = writes.find((s) => isSource(s.path));
  return {
    wroteTest: Boolean(test),
    // Reported apart from testBeforeImpl. When the implementation is invisible
    // the ordering claim is vacuously true, and folding the two together is how
    // the first version of this reported one measure three times.
    touchedImpl: Boolean(impl),
    testBeforeImpl: Boolean(test) && Boolean(impl) && test.i < impl.i,
    ranTestBeforeImpl: Boolean(test) && runs.some((r) => r.i > test.i && (!impl || r.i < impl.i)),
    ranTestAfterImpl: Boolean(impl) && runs.some((r) => r.i > impl.i),
  };
}

export function costOf(stream) {
  let premium = 0;
  let dollars = 0;
  let turns = 0;
  for (const line of stream.split("\n")) {
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.type === "turn_end") turns++;
    if (j.type !== "message_end") continue;
    const u = j.message?.usage;
    if (!u) continue;
    premium += u.premiumRequests ?? 0;
    dollars += u.cost?.total ?? 0;
  }
  return { premium, dollars, turns };
}

export function finalText(stream) {
  let last = "";
  for (const line of stream.split("\n")) {
    let j;
    try {
      j = JSON.parse(line);
    } catch {
      continue;
    }
    if (j.type !== "turn_end") continue;
    const parts = j.message?.content ?? [];
    const text = parts.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    if (text) last = text;
  }
  return last;
}

async function prepare() {
  const base = join(tmpdir(), `rules-exp-${process.pid}`);
  const conf = join(tmpdir(), `.rules-cfg-${process.pid}`);
  await mkdir(base, { recursive: true });
  await mkdir(conf, { recursive: true });
  const overlay = join(conf, "with.yml");
  await writeFile(overlay, `${QUIET}skills:\n  enabled: true\n${OFF}  customDirectories:\n    - ${ROOT.replace(/\\/g, "/")}\n`);
  return { base, conf, overlay };
}

/**
 * A workspace the scenario can actually happen in.
 *
 * The first run of this experiment used one generic project for every scenario,
 * and four of six scenarios wrote no test in either arm: they describe a state
 * that already exists, an implementation with no test behind it, a bug with a
 * trace, a red waiting for code, and none of that was there to find. The
 * experiment measured the fixture and not the treatment.
 *
 * evals/fixtures/<scenario-id>/ holds that starting state as real files.
 */
async function workspace(base, skillDir, id) {
  const dir = join(base, `w-${randomUUID().slice(0, 8)}`);
  for (const [rel, content] of Object.entries(SEED)) {
    await mkdir(dirname(join(dir, rel)), { recursive: true });
    await writeFile(join(dir, rel), content);
  }
  const fixture = join(skillDir, "evals", "fixtures", id);
  if (await stat(fixture).then(() => true, () => false)) {
    await cp(fixture, dir, { recursive: true, force: true });
  }
  return dir;
}

function run(prompt, cwd, overlay, maxTime) {
  return new Promise((ok, bad) => {
    const child = spawn("omp", [
      "-p", prompt, "--model", MODEL, "--thinking", "high",
      "--config", overlay, "--cwd", cwd, "--mode", "json",
      "--max-time", String(maxTime), "--no-session", "--no-extensions", "--no-rules",
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", bad);
    child.on("close", () => ok(out));
  });
}

async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const dir = join(ROOT, a.skill);
  const scenarios = [];
  for (const f of (await readdir(join(dir, "evals"))).filter((f) => /\.scenarios\.(mjs|ts)$/.test(f))) {
    const mod = await import(pathToFileURL(join(dir, "evals", f)).href);
    for (const s of mod.default ?? mod.scenarios ?? []) scenarios.push(s);
  }

  // Only scenarios that ask for work. A question has no implementation to
  // order, so the four outcomes would all be false in both arms and the
  // comparison would be empty.
  const work = scenarios.filter(
    (s) => s.expectedPrimary && s.activation?.shouldActivate !== false && /add|fix|make|write|handle|cope|implement|patch/i.test(s.prompt),
  ).slice(0, a.limit === Infinity ? undefined : a.limit);

  const paths = await prepare();
  const jobs = [];
  for (const s of work) {
    for (const arm of ["routed", "all-rules"]) {
      for (let i = 0; i < a.samples; i++) jobs.push({ s, arm, i });
    }
  }
  console.log(`${work.length} scenarios x 2 arms x ${a.samples} samples = ${jobs.length} runs\n`);
  for (const s of work) console.log(`  ${s.id}`);
  console.log("");

  const results = await pool(jobs, a.concurrency, async (j) => {
    const cwd = await workspace(paths.base, dir, j.s.id);
    const prompt = j.arm === "all-rules" ? `${j.s.prompt}\n\n${READ_ALL}` : j.s.prompt;
    let stream = "";
    try {
      stream = await run(prompt, cwd, paths.overlay, a.maxTime);
    } catch (e) {
      return { id: j.s.id, arm: j.arm, error: String(e.message) };
    } finally {
      await rm(cwd, { recursive: true, force: true }).catch(() => {});
    }
    const seen = observe(stream);
    return {
      id: j.s.id, arm: j.arm, sample: j.i,
      rulesRead: seen.rules.length,
      ...outcomes(seen.seq),
      seq: seen.seq.map((x) => `${x.tool} ${x.path || x.cmd || ''}`.trim().slice(0, 90)),
      ...costOf(stream),
      text: finalText(stream).slice(0, 4000),
    };
  });

  const KEYS = ["wroteTest", "touchedImpl", "testBeforeImpl", "ranTestBeforeImpl", "ranTestAfterImpl"];
  const arms = ["routed", "all-rules"];
  const rows = {};
  for (const arm of arms) {
    const r = results.filter((x) => x.arm === arm && !x.error);
    rows[arm] = {
      n: r.length,
      ...Object.fromEntries(KEYS.map((k) => [k, r.filter((x) => x[k]).length])),
      rules: (r.reduce((a, x) => a + x.rulesRead, 0) / (r.length || 1)).toFixed(1),
      premium: r.reduce((a, x) => a + x.premium, 0),
      dollars: r.reduce((a, x) => a + x.dollars, 0),
      turns: (r.reduce((a, x) => a + x.turns, 0) / (r.length || 1)).toFixed(1),
    };
  }

  console.log(`${"".padEnd(16)}${arms.map((x) => x.padStart(11)).join("")}`);
  for (const k of [...KEYS, "rules", "turns", "premium"]) {
    const line = arms.map((arm) => {
      const v = rows[arm][k];
      return String(KEYS.includes(k) ? `${v}/${rows[arm].n}` : v).padStart(11);
    }).join("");
    console.log(`${k.padEnd(16)}${line}`);
  }
  console.log(`${"cost".padEnd(16)}${arms.map((arm) => `$${rows[arm].dollars.toFixed(3)}`.padStart(11)).join("")}`);

  const errors = results.filter((x) => x.error);
  if (errors.length) console.log(`\n${errors.length} runs errored`);

  const out = resolve("evals/read-all-rules.json");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify({ ranAt: new Date().toISOString(), model: MODEL, samples: a.samples, summary: rows, results }, null, 2)}\n`);
  console.log(`\nfull transcripts in ${out}`);
  console.log("Outputs are kept so a blind pairwise judge can run over them separately.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(2);
  });
}
