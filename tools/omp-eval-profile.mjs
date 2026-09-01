#!/usr/bin/env node
/**
 * Build, check, and prune the isolated omp profile an eval run uses.
 *
 *   node tools/omp-eval-profile.mjs               create one for this process
 *   node tools/omp-eval-profile.mjs --check       create it and prove it works
 *   node tools/omp-eval-profile.mjs --prune       remove every profile we made
 *   node tools/omp-eval-profile.mjs --list        show what is there now
 *
 * A run that inherits the user's global config measures the environment as much
 * as the skill: their model roles, their provider order, their marketplace and
 * their AGENTS.md all move the answer. `omp --profile <name>` isolates settings,
 * which is what we want, and isolates credentials too, which we do not. So the
 * profile is created empty, given our config, and handed a copy of the
 * credential store.
 *
 * Every profile we create carries the PREFIX below, and nothing without it is
 * ever touched. A generated profile is disposable by construction: it holds a
 * copy of the credential store and nothing that was not copied into it.
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync, readdirSync, rmSync, statSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

// The one thing that makes an unattended prune safe.
const PREFIX = "skilleval-";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
const NAME = arg("--name", `${PREFIX}${process.pid}`);

const OMP = join(homedir(), ".omp");
const PROFILES = join(OMP, "profiles");
const short = (p) => p.replace(homedir(), "~");

/**
 * Which model plays which role, per provider.
 *
 * Two numbers decide a row, and neither alone is enough. The first is
 * Artificial Analysis's intelligence index, in brackets below. The second is
 * how fast the choice burns the plan: opencode-go meters dollars rather than
 * calls, so its published requests-per-five-hours is quoted instead.
 *
 * One rule holds every row together: `slow` must score above `default`, or the
 * escalation escalates to something dumber. That is easy to get wrong from the
 * names — terra sounds like the big one and scores 50 at high, while sol scores
 * 57 at the same effort.
 *
 * The same correction applies to the cheap roles. On opencode-go, glm-5.3-flash
 * reads as the small model and is the best default there: 57 against luna's 47,
 * for 1,580 requests per five hours against 2,050. What belongs in `smol` is
 * mimo-v2.5, which buys 30,100.
 */
/**
 * The fleet these skills actually meet at work: gpt-5.4 predominantly,
 * gpt-5.6-terra, sonnet-5, and gpt-5.4-mini for small work. sol, opus and fable
 * are blocked there on cost.
 *
 * That decides the table before any score does. A benchmark run on a model the
 * skills will never face measures a different thing well, and an earlier
 * version of this table was built entirely on sol — cheaper per point and
 * useless as evidence about the fleet in use.
 */
const PROVIDER_ROLES = {
  "openai-codex": {
    default: "gpt-5.4:high",           // the work default
    slow: "gpt-5.6-terra:xhigh",       // [53] the thinking point, one step up
    task: "gpt-5.6-luna:xhigh",        // [50] at the floor, a 14th of terra-high
    smol: "gpt-5.4-mini:auto",         // what small work gets at work
  },
  // The work provider, so this row is the reference rather than a stand-in: what
  // it measures is what the skills meet in use. The others approximate it.
  //
  // Fidelity constrains the provider, not the model, and the two were being
  // confused. But the shelf is shorter than the catalogue: the organisation's
  // Copilot policy enables gpt-5.4, 5.4-mini, gpt-5-mini, luna, sol, terra,
  // haiku-4.5 and sonnet-4.5/4.6/5, and disables every Opus, Fable, Gemini,
  // Kimi, GPT-5.5 and all three Grok models. So grok-4.6, briefly the best
  // candidate here on agentic score, is unavailable — and tools/model-cost.mjs
  // killed it independently: on our measured traffic it is 65% dearer than
  // Terra, because its cached input is two and a half times Terra's and cache
  // reads are three-quarters of its bill.
  //
  // What that leaves is better than the candidate that died. Sol is enabled,
  // runs 4% below Terra and 23% below gpt-5.4, and scores 57.8 agentic against
  // Terra's 50.2 — the highest of anything the policy allows. It was being
  // avoided as expensive, and on this traffic it is not. The one catch is a
  // date: half price until 3 September 2026, and 92% above Terra after it.
  //
  // The same table corrects a habit: gpt-5.4 costs 25% *more* per turn than
  // Terra here, so reaching for it to economise is backwards on cache-heavy
  // agentic traffic, whatever it was under request-based billing.
  "github-copilot": {
    default: "gpt-5.4:high",           // the work default
    slow: "claude-sonnet-5:max",       // [55] also in the work fleet
    task: "gpt-5.6-luna:xhigh",        // [50] at the floor, a 14th of terra-high
    smol: "gpt-5.4-mini:auto",         // what small work gets at work
  },
  "opencode-zen": {
    default: "gpt-5.4:high",
    slow: "claude-sonnet-5:max",       // [55]
    task: "gpt-5.6-luna:xhigh",        // [50] at the floor, a 14th of terra-high
    smol: "gpt-5.4-mini:auto",
  },
  // Pay per use, so it survives when every subscription is walled -- which is
  // the state today. On the tau2-bench airline split, a tool-calling benchmark
  // graded on live trajectories rather than recall, glm-5.3-flash scores 73.3%
  // against gpt-5.6-terra's 74.7% and gpt-5.4's 76.0%: level with the work fleet
  // inside the spread, at $0.005 a task against $0.093 and $0.29. glm-5.3 scores
  // 80.0%, above everything in the fleet, for $0.091.
  //
  // That makes this row useful for two different reasons at once, which is rare:
  // the cheap model is representative of the fleet's capability, so measuring on
  // it is not measuring a different class of agent.
  "openrouter": {
    default: "openrouter/z-ai/glm-5.3-flash", // tau2 73.3%, $0.005/task
    slow: "openrouter/z-ai/glm-5.3",          // tau2 80.0%, $0.091/task
    task: "openrouter/z-ai/glm-5.3-flash",
    smol: "openrouter/z-ai/glm-5.3-flash",
  },
  // None of the work fleet is served here, so this row is not a stand-in for the
  // others — but it is not merely a survival option either, and calling it one
  // was wrong. On the agentic leaderboard, which is the axis this harness
  // actually exercises, glm-5.3-flash ranks 5th and glm-5.3 2nd, above every
  // model in the work fleet. So this row answers a different and useful
  // question: whether a rule is followable at all by a strong agent, as opposed
  // to whether the fleet manages it. $12 per five hours, so its budget is
  // requests rather than dollars.
  "opencode-go": {
    default: "glm-5.3-flash",          // [57]  1,580 req/5h
    slow: "glm-5.3:max",               // [60]    220 req/5h
    task: "deepseek-v4-flash",         // [52]  7,600 req/5h
    smol: "mimo-v2.5",                 // [38] 30,100 req/5h
  },
};

/**
 * Two rules keep a row honest, and one keeps it cheap.
 *
 * The floor is named after the model that sets it: GPT-5.6 Terra at high scores
 * 50, and below that a model does actions and ordinary coding but not a complex
 * plan or an investigation. Field evidence puts it in the same place: luna:high
 * [47] ran as the work default and made noticeably more mistakes than gpt-5.4 at
 * high; terra:high [50] replaced it and the trouble stopped. Three points below
 * the floor was the difference, which is why luna appears here only in roles
 * nothing reasons from — and at xhigh [50], not high. `default`, `slow` and `task` clear it; `smol` need
 * not, since nothing reasons from its output.
 *
 * The escalation must escalate: `slow` scores above `default`, or it is a
 * downgrade wearing the name of a fallback.
 *
 * The band is the third. The index does not resolve models a couple of points
 * apart — which is better is a question for a test, not for this table — so
 * inside the band the cheaper one wins, and for a benchmark that is the right
 * answer rather than a compromise: it buys more runs for the same money. The
 * band never applies to `slow` against something at or below `default`, which
 * would collapse the escalation it exists to protect.
 *
 * One caveat on the numbers, and it is not small. These are Artificial
 * Analysis's intelligence scores, and intelligence is not the axis this harness
 * exercises: an eval here asks whether an agent routes, opens the right file and
 * holds a procedure across many tool calls, which is the agentic axis. The two
 * disagree systematically. Going from the coding board to the agentic one, every
 * OpenAI model loses ground — GPT-5.5 by ten places, Terra by seven, Sol by five,
 * and gpt-5.4 leaves the top twenty — while the open Chinese models gain:
 * glm-5.3-flash and Qwen3.8 Max by eleven places each, glm-5.3 by seven. The
 * work fleet sits at the weak end of the axis we measure on.
 *
 * The table is not rebuilt on that board, for a plain reason: it publishes only
 * a top twenty, at max or high effort, and the efforts here are terra:high and
 * luna:xhigh, which do not appear. Rebuilding would mean inventing numbers.
 * Worse, the boards quote different efforts for the same model — Sol at xhigh on
 * one and max on another — so joining them by name silently compares two
 * configurations. What the agentic board does change is the reading of a result:
 * see the note on the opencode-go row.
 *
 * gpt-5.4 and gpt-5.4-mini are absent from this index and known to do well;
 * they are admitted by name, which is why every check skips what it cannot
 * grade instead of rejecting it.
 */
const THINKING_FLOOR = 50;
const BAND = 3;

/**
 * Where the two pressures meet.
 *
 * Mirroring the work fleet is the ideal, and it cannot always be afforded. The
 * split that resolves it: `default` is the role under measurement, so it is
 * pinned to a model the skills actually meet and the band does not get to argue
 * about it. `slow`, `task` and `smol` are machinery the result does not depend
 * on, so there the cheaper equivalent wins and the saving buys more runs.
 *
 * That is why `task` is luna:xhigh rather than terra:high. Both score 50 and
 * sit exactly on the floor; one costs $0.03 and the other $0.23. Were `task`
 * the thing being measured, the fleet model would win instead.
 */
const FIDELITY_ROLES = new Set(["default"]);

const MODELS = {
  "gpt-5.6-terra:medium": { iq: 47, cost: 0.12 },
  "gpt-5.6-terra:high": { iq: 50, cost: 0.23 },
  "gpt-5.6-terra:xhigh": { iq: 53, cost: 0.32 },
  "gpt-5.6-terra:max": { iq: 57, cost: 0.53 },
  "gpt-5.6-luna:medium": { iq: 39, cost: 0.01 },
  "gpt-5.6-luna:high": { iq: 47, cost: 0.02 },
  "gpt-5.6-luna:xhigh": { iq: 50, cost: 0.03 },
  "claude-sonnet-5:max": { iq: 55, cost: 1.72 },
  "glm-5.3-flash": { iq: 57, req5h: 1580 },
  "glm-5.3:max": { iq: 60, req5h: 220 },
  "grok-4.6:high": { iq: 61, req5h: 169 },
  "deepseek-v4-flash": { iq: 52, req5h: 7600 },
  "mimo-v2.5": { iq: 38, req5h: 30100 },
};

const iq = (m) => MODELS[m]?.iq;
const dearer = (a, b) => {
  const [x, y] = [MODELS[a], MODELS[b]];
  if (!x || !y) return false;
  if (x.cost != null && y.cost != null) return x.cost > y.cost;
  if (x.req5h != null && y.req5h != null) return x.req5h < y.req5h;
  return false;   // never compare a metered price against a plan's request count
};
for (const [prov, r] of Object.entries(PROVIDER_ROLES)) {
  if (iq(r.slow) != null && iq(r.default) != null && iq(r.slow) < iq(r.default)) {
    console.error(`${prov}: slow ${r.slow} [${iq(r.slow)}] scores below default ${r.default} [${iq(r.default)}]`);
    process.exit(2);
  }
  for (const role of ["default", "slow", "task"]) {
    if (iq(r[role]) != null && iq(r[role]) < THINKING_FLOOR) {
      console.error(`${prov}: ${role} ${r[role]} [${iq(r[role])}] is below the thinking floor of ${THINKING_FLOOR}`);
      process.exit(2);
    }
  }
  for (const [role, chosen] of Object.entries(r)) {
    if (iq(chosen) == null) continue;
    for (const [cand, m] of Object.entries(MODELS)) {
      if (cand === chosen || m.iq == null) continue;
      if (FIDELITY_ROLES.has(role)) continue;
      if ((MODELS[chosen].cost != null) !== (m.cost != null)) continue;
      if (Math.abs(m.iq - iq(chosen)) > BAND) continue;
      if (role !== "smol" && m.iq < THINKING_FLOOR) continue;
      // Swapping slow for something at or below default is not a saving. When
      // default is unscored the escalation cannot be shown to survive the swap,
      // so the band does not get to argue about slow at all.
      if (role === "slow" && (iq(r.default) == null || m.iq <= iq(r.default))) continue;
      if (dearer(chosen, cand)) {
        console.error(`${prov}: ${role} ${chosen} [${iq(chosen)}] costs more than ${cand} [${m.iq}], inside the ${BAND}-point band`);
        process.exit(2);
      }
    }
  }
}

// The order the runner walks when one provider stops serving. The two terra
// providers are deliberately not adjacent: they share a quota wall in practice,
// so putting them together would end the chain two steps early.
const CHAIN = ["openai-codex", "opencode-go", "github-copilot", "opencode-zen", "openrouter"];

// Which row builds this profile. Shifting provider is one flag, because the one
// that is serving changes between sessions.
const PROVIDER = arg("--provider", CHAIN[0]);
if (!PROVIDER_ROLES[PROVIDER]) {
  console.error(`unknown provider ${PROVIDER}; known: ${Object.keys(PROVIDER_ROLES).join(", ")}`);
  process.exit(2);
}
const ROW = PROVIDER_ROLES[PROVIDER];
const qualify = (m) => (m.includes("/") ? m : `${PROVIDER}/${m}`);

const DEFAULT_MODEL = arg("--model", qualify(ROW.default).replace(/:[^:/]*$/, ""));
const THINKING = arg("--thinking", (ROW.default.split(":")[1] ?? "auto"));
const SLOW = arg("--slow", qualify(ROW.slow));
const SMOL = arg("--smol", qualify(ROW.smol));
const TASK = arg("--task", qualify(ROW.task));

// Every provider the chain may reach, so the profile carries credentials and
// provider order for all of them rather than only the first two.
const FALLBACK_MODEL = arg(
  "--fallback",
  CHAIN.filter((p) => p !== PROVIDER).map((p) => `${p}/${PROVIDER_ROLES[p].default.split(":")[0]}`).join(","),
);
const FALLBACKS = FALLBACK_MODEL.split(",").map((m) => m.trim()).filter(Boolean);

const ROLE_MODEL = {
  default: `${DEFAULT_MODEL}${THINKING === "none" ? "" : `:${THINKING}`}`,
  slow: SLOW,
  smol: SMOL,
  task: TASK,
};
const ROLES = ["default", "task", "smol", "slow", "plan", "deep", "economical-deep", "review", "advisor"];
const modelFor = (r) => ROLE_MODEL[r] ?? ROLE_MODEL.default;
const CONFIG = [
  "# Written by tools/omp-eval-profile.mjs. Edit the script, not this file.",
  "#",
  "# Everything that could differ between two runs of the same prompt is off.",
  "memories:",
  "  enabled: false",
  "marketplace:",
  "  autoUpdate: off",
  "extensions: []",
  "# The runner spawns omp once per sample, so anything that happens at startup",
  "# happens eighty-four times a block: an update check over the network, a",
  "# changelog, a wizard. None of it is the measurement.",
  "# Streaming redraws the assistant message once per delta, which is an",
  "# appearance choice for a person watching. Nobody watches a run, and every",
  "# redraw lands in the recorded stream: the transcripts reach a megabyte and",
  "# message_update outnumbers everything else nine to one.",
  "display:",
  "  smoothStreaming: false",
  "startup:",
  "  checkUpdate: false",
  "  changelogMode: hidden",
  "  setupWizard: false",
  "  showSplash: false",
  "  quiet: true",
  "# A profile isolates settings and not tool sources. A first run through one",
  "# still mounted xd:// MCP servers from the user environment, putting fifteen",
  "# unrelated tools in front of the agent, and the run behaved differently.",
  "tools:",
  "  xdev: false",
  "mcp:",
  "  enableProjectConfig: false",
  "temperature: 0",
  "# The runner decides which provider to use and records it. omp choosing its",
  "# own would report a model the run did not use.",
  "retry:",
  "  modelFallback: false",
  `modelProviderOrder: ${JSON.stringify([...new Set([DEFAULT_MODEL, ...FALLBACKS, SLOW, SMOL, TASK].map((m) => m.split("/")[0]))])}`,
  "modelRoles:",
  // smol is the cheap role by definition, so it runs a step below the model
  // under test rather than paying xhigh for work nobody reads closely.
  ...ROLES.map((r) => `  ${r}: ${modelFor(r)}`),
  "",
].join("\n");

const CARRY = [
  ["agent/agent.db", true],
  // A locally bridged provider keeps its catalogue here, not in the credential
  // store. Without it an isolated profile reports the model as not found, which
  // reads as a missing key and is not one.
  // models.yml declares a bridged or custom provider; the db is only its cache.
  ["agent/models.yml", false],
  ["agent/models.db", false],
  ["agent/models.db-wal", false],
  ["agent/models.db-shm", false],
  ["agent/agent.db-wal", false],
  ["agent/agent.db-shm", false],
  ["auth-broker.token", false],
  ["auth-gateway.token", false],
];

function ours() {
  if (!existsSync(PROFILES)) return [];
  return readdirSync(PROFILES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith(PREFIX))
    .map((d) => d.name);
}

function build(name) {
  if (!existsSync(OMP)) { console.error(`no omp home at ${short(OMP)}`); process.exit(1); }
  if (!name.startsWith(PREFIX)) { console.error(`profile name must start with ${PREFIX}, so prune can find it`); process.exit(1); }
  const dir = join(PROFILES, name);
  mkdirSync(join(dir, "agent"), { recursive: true });
  const carried = [];
  for (const [rel, required] of CARRY) {
    const from = join(OMP, rel);
    if (!existsSync(from)) {
      if (required) { console.error(`missing ${rel}, which the profile needs to authenticate`); process.exit(1); }
      continue;
    }
    copyFileSync(from, join(dir, rel));
    carried.push(rel);
  }
    // OpenRouter reserves credit for the largest output a request could produce,
  // not for what it does produce. At the catalogue's 131,072 that reservation
  // exceeds what a key's monthly limit can cover, and every agentic call is
  // refused with a 402 while the account still holds money -- an account balance
  // and a key's limit are different things, and the error names the second.
  // Capping the output the harness would never use makes the balance reachable.
  const modelsYml = join(dir, "agent", "models.yml");
  if (existsSync(modelsYml)) {
    const y = readFileSync(modelsYml, "utf8");
    const NL = String.fromCharCode(10);
    if (y.startsWith("providers:") && !y.includes(`${NL}  openrouter:`)) {
      const cap = [
        "  openrouter:",
        "    modelOverrides:",
        "      z-ai/glm-5.3-flash:",
        "        maxTokens: 8192",
        "      z-ai/glm-5.3:",
        "        maxTokens: 8192",
      ].join(NL);
      const lines = y.split(NL);
      lines.splice(1, 0, cap);
      writeFileSync(modelsYml, lines.join(NL));
    }
  }

writeFileSync(join(dir, "agent", "config.yml"), CONFIG);
  console.log(`built ${name} at ${short(dir)}`);
  console.log(`  carried: ${carried.join(", ")}`);
  for (const [r, m] of Object.entries(ROLE_MODEL)) console.log(`  ${r.padEnd(8)} ${m}`);
  console.log(`  others   ${ROLE_MODEL.default}`);
  const chain = [DEFAULT_MODEL, ...FALLBACKS].map((m) => m.split("/")[0]);
  console.log(`  order:   ${[...new Set(chain)].join(" -> ")}`);
  return dir;
}

function check(name) {
  // Both questions answerable without spending a model call: did our config
  // land instead of the user's, and do the copied credentials authenticate?
  const order = execFileSync("omp", ["--profile", name, "config", "get", "modelProviderOrder"], { encoding: "utf8" }).trim();
  console.log(`  order in profile: ${order}`);
  const out = execFileSync("omp", ["--profile", name, "models", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const models = JSON.parse(out).models ?? [];
  // Each model in the chain, checked on its own. Checking the joined string
  // asked whether one model named "a,b,c" existed, and reported all three
  // absent when every one of them was present.
  for (const w of [DEFAULT_MODEL, ...FALLBACKS]) {
    console.log(`  ${models.some((m) => m.selector === w) ? "present" : "ABSENT "}  ${w}`);
  }
  console.log(`  catalogue: ${models.length} models`);
}

function prune() {
  const found = ours();
  // Two profiles from before the prefix existed. Named explicitly rather than
  // matched by a looser pattern, so nothing of the user's can be caught.
  const strays = ["skilleval", "skill-evals"].filter((n) => existsSync(join(PROFILES, n)));
  const all = [...found, ...strays];
  if (!all.length) { console.log("nothing to prune"); return; }
  // A profile in use by a run in flight looks like any other, and removing it
  // pulls the model catalogue out from under eighty samples. Recent writes are
  // the only signal available, so treat them as occupied unless forced.
  const FRESH_MS = 15 * 60 * 1000;
  const force = argv.includes("--force");
  for (const n of all) {
    const dir = join(PROFILES, n);
    const age = Date.now() - statSync(dir).mtimeMs;
    if (!force && age < FRESH_MS) {
      console.log(`kept ${n}, written ${Math.round(age / 60000)} min ago and may be in use; --force overrides`);
      continue;
    }
    rmSync(dir, { recursive: true, force: true });
    console.log(`removed ${n}`);
  }
}

if (argv.includes("--list")) {
  const all = existsSync(PROFILES) ? readdirSync(PROFILES) : [];
  for (const n of all) console.log(`${n.startsWith(PREFIX) ? "ours " : "     "} ${n}`);
} else if (argv.includes("--prune")) {
  prune();
} else {
  build(NAME);
  if (argv.includes("--check")) check(NAME);
}
