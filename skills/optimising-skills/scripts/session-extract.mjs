#!/usr/bin/env node
/**
 * Normalise agent session stores into one common event format.
 *
 *   node .../session-extract.mjs <store-dir> [...] --out <file.jsonl>
 *   node .../session-extract.mjs <dir> --out <f> --weeks 8 --deny '<regex>'
 *   node .../session-extract.mjs --self-test
 *
 * Five harnesses disagree about their event schema and agree that a session is
 * one JSONL file of timestamped events. This reads each, emits one record shape,
 * and every later analysis reads that instead of five parsers.
 *
 * ONE ADAPTER PER HARNESS, DETECTED, NOT ONE FUNCTION GUESSING. A single
 * tolerant parser was written first and it silently produced almost nothing for
 * four of the five: their tool calls sit in places it never looked. The count
 * would have come back dominated by one store and read as "the others are
 * barely used". A shape this file does not know yields nothing and says so,
 * rather than yielding a plausible number.
 *
 * REDACTION HAPPENS AT THE ADAPTER, NOT BEFORE THE WRITE. A session store holds
 * work that is not yours to publish: machine paths, network identifiers, repo
 * and branch names, hosts, addresses. Redacting on the way out means the raw
 * value existed in a variable, a log line, or a terminal first, which is how it
 * escapes.
 *
 * WHAT A RECORD CARRIES
 *
 *   store    an opaque label per input directory, never the directory
 *   session  a hash of the file identity, stable across runs, not the name
 *   week     0 is the current week, counted back from now
 *   agent    main or sub, from the harness's own subagent marker
 *   kind     user, assistant, tool_call, tool_result, skill, turn, error
 *   tool     the harness's own tool name; an MCP tool is counted under a
 *            stable label, because its server segment is named by whoever
 *            installed it and not by the harness
 *   verb     for a shell call, the program and subcommand only
 *            A program name is still a name the environment chose: a private
 *            tool cannot be told from a public one by shape, so --deny is the
 *            control and the output stays untracked
 *   skill    the skill name; how is invoked when a person named it, opened
 *            when the model chose to read it
 *   ok       whether a command exited zero, where the harness records it
 *   chars    size, so density is measurable without keeping the text
 *
 * NO MESSAGE TEXT IS EMITTED. What was said needs a person reading the store
 * where it lives.
 */
import { readdirSync, readFileSync, statSync, writeFileSync, appendFileSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const flag = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const hash8 = (s) => createHash("sha256").update(String(s)).digest("hex").slice(0, 8);

// ---------------------------------------------------------------- redaction

const RULES = [
  [/[A-Za-z]:[\\/](?:Users|home)[\\/][^\\/\s"']+/gi, "<home>"],
  [/(?:^|(?<=[\s"':=(]))\/(?:Users|home)\/[^/\s"']+/g, "<home>"],
  [/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "<email>"],
  [/\bhttps?:\/\/[^\s"'<>)]+/gi, "<url>"],
  [/\b(?:[\w-]+\.)+(?:com|net|org|io|nl|dev|internal|invalid|local)\b/gi, "<host>"],
  [/\b[A-Fa-f0-9]{32,}\b/g, "<hex>"],
  [/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, "<b64>"],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "<ip>"],
];

let redactions = 0;
export function redact(value, extra = []) {
  if (typeof value !== "string") return value;
  let s = value;
  for (const [re, to] of RULES) s = s.replace(re, () => { redactions++; return to; });
  for (const re of extra) s = s.replace(re, () => { redactions++; return "<denied>"; });
  return s;
}

/**
 * A shell command reduced to what it is, discarding what it is about.
 *
 * A program name is a bare token: letters, digits, dot, dash, underscore.
 * Everything that leaked past this function was something else wearing the
 * first position, and each was caught by a scan of real output rather than by
 * the code looking wrong: an environment assignment, a repository URL, a
 * package specifier. So the shape of what may pass is stated, rather than the
 * shapes to refuse enumerated.
 */
const PROGRAM = /^[A-Za-z][A-Za-z0-9._-]{0,31}$/;
/** Runs the program that follows it, so the program is the interesting part. */
const WRAPPER = /^(sudo|env|nohup|time|npx|bunx)$/i;
/** Owns its own subcommands: `git status` names git and nothing else. */
const DRIVER = /^(git|cargo|go|docker|kubectl|terraform|helm)$/i;
/** Second word is a task somebody in the project named, not a fixed verb. */
const TASK_RUNNER = /^(mise|make|just|task|nx|turbo|rake|lerna|mvn|gradle|gradlew|npm|pnpm|yarn)$/i;
/** The part of a runner's second word that belongs to the runner. */
const RUNNER_OWN = /^(run|exec|install|i|add|remove|rm|test|build|start|dev|lint|format|watch|clean|ci|publish|list|ls|outdated|why|use|which|trust|upgrade|activate|env|shell|dlx|create|generate|help|version|compile|package|verify|deploy)$/i;

export function verbOf(cmd) {
  if (typeof cmd !== "string") return null;
  const first = cmd.trim().split(/[\n;|&]/)[0] ?? "";
  // `VAR=value cmd args` runs cmd. The assignment is data, and it names a
  // system, an account or an environment often enough to matter.
  let parts = first.trim().split(/\s+/).filter(Boolean);
  while (parts.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(parts[0])) parts = parts.slice(1);
  if (!parts.length) return null;
  // Basename-stripping is what makes a path safe, and it is also what makes a
  // URL dangerous: the last segment of `ssh://host/org--internal.git` is a
  // repository name that passes for a program. A scheme is never a program, so
  // it is refused before the strip rather than after it.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(parts[0])) return "<other>";
  const prog = parts[0].replace(/^.*[\\/]/, "").replace(/\.(exe|cmd|sh)$/i, "");
  if (!PROGRAM.test(prog)) return "<other>";
  if (WRAPPER.test(prog) && parts[1]) {
    const next = parts[1].startsWith("-") ? parts[2] : parts[1];
    const bare = next ? next.replace(/^.*[\\/]/, "") : null;
    if (bare) return PROGRAM.test(bare) ? `${prog} ${bare}` : prog;
  }
  // An interpreter takes a script path where a driver takes a subcommand.
  // `git status` is a verb; `node scripts/query-internal.mjs` is a path, and
  // keeping parts[1] for both leaked a work script name and a managed skill.
  if (/^(node|deno|bun|python3?|ruby|perl|dotnet|java|sh|bash|zsh)$/i.test(prog)) return prog;
  const sub = parts[1];
  // A task runner's second word is a name somebody in the project chose. The
  // first run over the real stores put a work identifier there and only the
  // deny list caught it, which is the wrong layer to be caught by: a deny list
  // needs the name in advance, and the whole point of the shape rules is not
  // to need it.
  if (sub && PROGRAM.test(sub) && TASK_RUNNER.test(prog)) return `${prog} ${RUNNER_OWN.test(sub) ? sub.toLowerCase() : "<task>"}`;
  if (sub && PROGRAM.test(sub) && DRIVER.test(prog)) return `${prog} ${sub}`;
  return prog;
}

/** A path reduced to its shape: a skill name, or an extension. */
export function pathShape(p) {
  if (typeof p !== "string") return null;
  const m = /^skill:\/\/([a-z0-9][a-z0-9-]*)/i.exec(p.trim());
  if (m) return { skill: m[1].toLowerCase() };
  const m2 = /(?:^|[\\/])skills[\\/]([a-z0-9][a-z0-9-]*)[\\/]SKILL\.md$/i.exec(p);
  if (m2) return { skill: m2[1].toLowerCase() };
  const m3 = /(?:^|[\\/])managed-skills[\\/]([a-z0-9][a-z0-9-]*)[\\/]/i.exec(p);
  if (m3) return { skill: m3[1].toLowerCase(), managed: true };
  const ext = extname(p).toLowerCase().replace(/^\./, "");
  return { ext: /^[a-z0-9]{1,12}$/.test(ext) ? ext : null };
}

const INVOKED = /invoked the "([a-z0-9][a-z0-9-]*)" skill/i;
const SHELLISH = /^(bash|shell|run|exec|terminal|run_command|runcommand)$/i;

/** Shared tail: a tool name plus its arguments become one tool_call record. */
export let KNOWN = null;   // set from --skills; null means name nothing

/**
 * An MCP tool is `mcp__<server>__<tool>`, and both of those segments are chosen
 * by whoever installed the server rather than by the harness. Naming a
 * harness's own tool is safe; naming an MCP tool publishes an installation.
 * `--allow-tool` names the ones you vouch for.
 */
const BUILTIN_TOOL = /^[a-z][a-z0-9_]{0,23}$/;
/** A key name is schema. A key not shaped like one is reported, not printed. */
const KEYNAME = /^[a-zA-Z_][a-zA-Z0-9_]{0,24}$/;
export let ALLOW_TOOL = new Set();

export function toolLabel(name) {
  const t = String(name ?? "?").toLowerCase().trim();
  if (ALLOW_TOOL.has(t)) return t;
  if (/^mcp[^a-z0-9]/.test(t) || t.includes("__")) return `mcp:${hash8(t).slice(0, 6)}`;
  return BUILTIN_TOOL.test(t) ? t : `<tool:${hash8(t).slice(0, 6)}>`;
}

/** Foreign skills are counted under a stable label, never under their name. */
export function skillLabel(name) {
  if (!name) return null;
  if (KNOWN && KNOWN.has(name)) return name;
  return `<managed:${hash8(name).slice(0, 6)}>`;
}

function toolRecord(name, argsObj, extras = {}) {
  const tool = toolLabel(name);
  const a = argsObj && typeof argsObj === "object" ? argsObj : {};
  const rec = { kind: "tool_call", tool, chars: JSON.stringify(a).length, ...extras };
  const shape = pathShape(a.path ?? a.file_path ?? a.filePath ?? a.notebook_path ?? "");
  if (shape?.skill) { rec.skill = skillLabel(shape.skill); rec.how = "opened"; if (shape.managed) rec.managed = true; }
  else if (shape?.ext) rec.ext = shape.ext;
  if (SHELLISH.test(tool)) rec.verb = verbOf(a.command ?? a.cmd ?? a.script ?? "");
  return rec;
}

// ---------------------------------------------------------------- adapters

/**
 * Each adapter is written against a schema observed in that harness's own
 * files, not inferred from another. A store whose first lines match none of
 * these is reported unknown rather than parsed by the nearest guess.
 */
export const ADAPTERS = {
  // type:custom + customType:tool_execution_start, data.{toolName,args,intent}
  omp: {
    // A session whose first eighty lines are ordinary messages carries no
    // customType yet, and asking only for that marker dropped whole real
    // sessions as an unknown shape. type:"message" with a role, and the session
    // header, are omp's own and appear from the first line.
    detect: (o) =>
      o.customType !== undefined ||
      (o.type === "custom" && o.data?.toolName) ||
      (o.type === "message" && o.message?.role !== undefined) ||
      o.type === "session" || o.titleSource !== undefined || o.pad !== undefined,
    read(o) {
      const out = [];
      if (o.customType === "skill-prompt" || (typeof o.content === "string" && INVOKED.test(o.content))) {
        const m = INVOKED.exec(String(o.content ?? ""));
        if (m) out.push({ kind: "skill", skill: skillLabel(m[1].toLowerCase()), how: "invoked" });
      }
      if (o.type === "custom" && o.customType === "tool_execution_start" && o.data?.toolName) {
        out.push(toolRecord(o.data.toolName, o.data.args, o.data.intent ? { intentChars: String(o.data.intent).length } : {}));
      }
      const role = o.message?.role;
      if (role) {
        const c = o.message.content;
        out.push({ kind: role === "toolResult" ? "tool_result" : role === "user" ? "user" : "assistant", chars: (typeof c === "string" ? c : JSON.stringify(c ?? "")).length });
      }
      return out;
    },
  },

  // message.content[] blocks; tool_use {name,input}; isSidechain marks a subagent
  claude: {
    detect: (o) => o.isSidechain !== undefined || (o.uuid && o.type === "assistant"),
    read(o) {
      const out = [];
      const c = o.message?.content;
      if (Array.isArray(c)) {
        for (const b of c) {
          if (b.type === "tool_use") out.push(toolRecord(b.name, b.input));
          else if (b.type === "tool_result") out.push({ kind: "tool_result", chars: JSON.stringify(b.content ?? "").length });
          else if (b.type === "text") out.push({ kind: o.type === "user" ? "user" : "assistant", chars: String(b.text ?? "").length });
        }
      } else if (typeof c === "string") {
        out.push({ kind: o.type === "user" ? "user" : "assistant", chars: c.length });
      }
      if (o.isSidechain === true) for (const r of out) r.agent = "sub";
      return out;
    },
  },

  // response_item:function_call {name,arguments}; event_msg:exec_command_end
  // carries the command, its exit code and its duration
  codex: {
    detect: (o) => o.type === "response_item" || o.type === "event_msg" || o.type === "turn_context",
    read(o) {
      const p = o.payload ?? {};
      if (o.type === "response_item" && p.type === "function_call") {
        let parsed = {};
        try { parsed = JSON.parse(p.arguments ?? "{}"); } catch {}
        return [toolRecord(p.name, parsed)];
      }
      if (o.type === "event_msg" && p.type === "exec_command_end") {
        return [{ kind: "tool_call", tool: "bash", verb: verbOf(p.command), ok: p.exit_code === 0, ms: p.duration ?? null, chars: String(p.aggregated_output ?? "").length }];
      }
      if (o.type === "event_msg" && p.type === "error") return [{ kind: "error", chars: String(p.message ?? "").length }];
      if (o.type === "event_msg" && (p.type === "user_message" || p.type === "agent_message")) {
        return [{ kind: p.type === "user_message" ? "user" : "assistant", chars: String(p.message ?? "").length }];
      }
      if (o.type === "response_item" && p.type === "message") {
        return [{ kind: p.role === "user" ? "user" : "assistant", chars: JSON.stringify(p.content ?? "").length }];
      }
      if (o.type === "turn_context") return [{ kind: "turn", model: p.model ?? null, effort: p.effort ?? null }];
      return [];
    },
  },

  // the event type is the action; content is a plain string
  gemini: {
    detect: (o) => o.step_index !== undefined && o.source !== undefined,
    read(o) {
      const t = String(o.type ?? "");
      const chars = String(o.content ?? "").length;
      if (t === "USER_INPUT") return [{ kind: "user", chars }];
      if (t === "PLANNER_RESPONSE" || t === "GENERIC") return [{ kind: "assistant", chars }];
      // A RUN_COMMAND record carries the result and its exit code, not the
      // command. Reading content as a command produced nine hundred and
      // seventy-four shell verbs that were all the same word, and the totals
      // looked reasonable the whole time. What the command was is not in this
      // record, so nothing is claimed about it.
      if (t === "RUN_COMMAND") {
        return [{ kind: "tool_call", tool: "bash", ok: typeof o.exit_code === "number" ? o.exit_code === 0 : undefined, chars }];
      }
      if (/^(VIEW_FILE|LIST_DIRECTORY|EDIT_FILE|WRITE_FILE|SEARCH)/.test(t)) {
        return [toolRecord(t.toLowerCase(), { path: String(o.content ?? "").split(/\s+/)[0] })];
      }
      return [];
    },
  },

  // dotted event names; data.{content,toolRequests}
  copilot: {
    detect: (o) => typeof o.type === "string" && /^(user|assistant|session|hook)\./.test(o.type),
    read(o) {
      const d = o.data ?? {};
      const out = [];
      if (Array.isArray(d.toolRequests)) for (const t of d.toolRequests) out.push(toolRecord(t.name ?? t.tool, t.arguments ?? t.input));
      if (o.type === "user.message") out.push({ kind: "user", chars: String(d.content ?? "").length });
      if (o.type === "assistant.message") out.push({ kind: "assistant", chars: String(d.content ?? "").length, ...(d.outputTokens ? { tokens: d.outputTokens } : {}) });
      return out;
    },
  },
};

/** Which adapter this file belongs to, decided from its own first lines. */
export function detectStore(lines) {
  const counts = new Map();
  for (const l of lines.slice(0, 80)) {
    let o;
    try { o = JSON.parse(l); } catch { continue; }
    for (const [name, a] of Object.entries(ADAPTERS)) if (a.detect(o)) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  let best = null, n = 0;
  for (const [name, c] of counts) if (c > n) { best = name; n = c; }
  return best;
}

// ---------------------------------------------------------------- self test

if (args.includes("--self-test")) {
  const checks = [];
  const push = (label, ok) => checks.push([label, ok]);

  // Fixtures are assembled rather than written out. A literal home path or a
  // private address in a tracked file is what the commit gate refuses, and the
  // gate cannot tell a fixture from a leak. Neither can a reader in a hurry,
  // which is the better reason.
  const BS = String.fromCharCode(92);
  const under = ["Users", "someone", "Projects", "thing"];
  const homeWin = "C:" + BS + under.join(BS);
  const homePosix = "/" + under.join("/");
  const privateIp = [10, 11, 12, 13].join(".");

  for (const [label, input, want] of [
    ["a windows home", homeWin, "<home>"],
    ["a posix home", homePosix, "<home>"],
    ["an address", "first.last@example.co.uk", "<email>"],
    ["a url", "https://internal.example.com/a?b=c", "<url>"],
    ["a host", "build.internal.example.org", "<host>"],
    ["a long hex", "a".repeat(40), "<hex>"],
    ["an address v4", privateIp, "<ip>"],
  ]) {
    const got = redact(input);
    push(`${label} is removed`, got.includes(want) && !got.includes(input));
  }

  push("a command keeps only its verb", verbOf("git push origin feature/1234-internal") === "git push");
  push("an operand does not survive", !verbOf("rg secret-term src/private/mod.ts").includes("secret"));
  push("a wrapper resolves to the program", verbOf("npx tsc --noEmit") === "npx tsc");
  push("a skill url is a skill", pathShape("skill://bound-the-unknown").skill === "bound-the-unknown");

  // Both of these got through the first real run and neither had a planted
  // case. An interpreter's second word is a script path, and a managed skill
  // from somebody else's collection carries their vocabulary in its name.
  push("an interpreter keeps no script path", verbOf("node scripts/query-something-internal.mjs") === "node");
  push("an env prefix is not a program", verbOf("AZURE_THING=some-internal-app az login") === "az");
  push("a package specifier does not survive", !verbOf("npx some-tool@latest run").includes("@"));
  push("a url fragment is not a program", verbOf("ssh://host/org--internal-app.git") === "<other>");
  push("an extension is a bare word or nothing", pathShape("/x/y.yml@head").ext === null);
  push("a python script path does not survive", !verbOf("python3 tools/internal_report.py").includes("internal"));

  // Found by scanning real output, not by reading the code: a project task name
  // sat in a verb and an MCP server name sat in a tool name. Both fields had
  // been reasoned about and declared safe.
  push("a task runner does not keep the task", verbOf("mise run build-internal-app") === "mise run");
  push("a bare task is counted, not named", verbOf("make deploy-internal-thing") === "make <task>");
  push("a package script is not a program", verbOf("yarn serve-internal-bff") === "yarn <task>");
  push("a driver keeps its own subcommand", verbOf("git status --porcelain") === "git status");
  push("an mcp server name does not survive", /^mcp:[0-9a-f]{6}$/.test(toolLabel("mcp__internal_platform__query")));
  push("the same mcp tool gets the same label", toolLabel("mcp__a_b__c") === toolLabel("mcp__a_b__c"));
  push("two mcp tools stay distinguishable", toolLabel("mcp__a__one") !== toolLabel("mcp__a__two"));
  push("a server with no tool segment is still hidden", /^mcp:[0-9a-f]{6}$/.test(toolLabel("mcp__internal_platform")));
  push("a harness tool keeps its name", toolLabel("Read") === "read");
  push("a vouched-for tool keeps its name", (() => {
    ALLOW_TOOL = new Set(["mcp__ctx__docs"]);
    const got = toolLabel("mcp__ctx__docs");
    ALLOW_TOOL = new Set();
    return got === "mcp__ctx__docs";
  })());
  KNOWN = new Set(["bound-the-unknown"]);
  push("a known skill keeps its name", skillLabel("bound-the-unknown") === "bound-the-unknown");
  push("a foreign skill is counted, not named", /^<managed:[0-9a-f]{6}>$/.test(skillLabel("some-internal-project-skill")));
  push("the same foreign skill gets the same label", skillLabel("some-internal-project-skill") === skillLabel("some-internal-project-skill"));
  // Stays set for the adapter cases below: they name skills from this
  // collection, and resetting here made the copilot case fail for the right
  // reason, which is what a planted case is for.
  KNOWN = new Set(["bound-the-unknown", "debugging-by-evidence", "progressive-reading"]);
  push("a file path does not survive", !JSON.stringify(pathShape(homePosix + "/src/secret.ts")).includes("secret"));

  // One planted event per adapter, in the shape that harness actually writes.
  // A tolerant parser passed the omp case and silently returned nothing for the
  // rest, which is the defect these four exist to catch.
  const planted = {
    omp: { line: { type: "custom", customType: "tool_execution_start", data: { toolName: "read", args: { path: "skill://debugging-by-evidence" } } }, want: (r) => r[0]?.skill === "debugging-by-evidence" && r[0].how === "opened" },
    claude: { line: { isSidechain: true, type: "assistant", message: { role: "assistant", content: [{ type: "tool_use", name: "Bash", input: { command: "git status --porcelain" } }] } }, want: (r) => r[0]?.verb === "git status" && r[0].agent === "sub" },
    codex: { line: { type: "event_msg", payload: { type: "exec_command_end", command: "npm test -- --grep private", exit_code: 1, duration: 42 } }, want: (r) => r[0]?.verb === "npm test" && r[0].ok === false },
    // Written from the real record shape after the invented one passed. The
    // planted case agreed with the code and the store did not.
    gemini: { line: { step_index: 3, source: "agent", type: "RUN_COMMAND", status: "done", created_at: "2026-01-01T00:00:00Z", content: "Created the thing and ran it", exit_code: 0 }, want: (r) => r[0]?.verb === undefined && r[0]?.ok === true },
    copilot: { line: { type: "assistant.message", data: { content: "x".repeat(12), toolRequests: [{ name: "read", arguments: { path: "skill://progressive-reading" } }] } }, want: (r) => r.some((x) => x.skill === "progressive-reading") },
  };
  for (const [name, { line, want }] of Object.entries(planted)) {
    const a = ADAPTERS[name];
    push(`${name} detects its own line`, a.detect(line));
    push(`${name} reads what it carries`, want(a.read(line)));
  }
  push("an unknown shape yields no adapter", detectStore(['{"whatever":1,"nope":2}']) === null);
  push("a known shape is detected", detectStore([JSON.stringify(planted.codex.line)]) === "codex");
  push("no record carries message text",
    !JSON.stringify(ADAPTERS.claude.read({ type: "user", message: { role: "user", content: "my secret plan" } })).includes("secret"));

  for (const [label, ok] of checks) console.log(`${label.padEnd(44)} ${ok ? "correct" : "WRONG"}`);
  const pass = checks.every((c) => c[1]);
  console.log(pass ? `\n${checks.length} planted cases, all refused` : "\nsomething gets through");
  process.exit(pass ? 0 : 1);
}

// ---------------------------------------------------------------- extraction

// The functions above are the reusable part, and a diagnostic that wants to
// ask why a file matched no adapter has to reach the same detectStore this
// run used rather than a second copy of it. Importing the file must therefore
// not start an extraction.
const IS_MAIN = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (IS_MAIN) {

  const dirs = args.filter((a, i) => !a.startsWith("--") && !["--out", "--weeks", "--deny", "--skills", "--allow-tool"].includes(args[i - 1]));
  const out = flag("--out", null);
  if (!dirs.length || !out) {
    console.log("usage: session-extract.mjs <store-dir> [more] --out <file.jsonl> [--weeks N] [--deny <regex>]");
    console.log("\nWrite the output somewhere untracked. It carries no message text and no");
    console.log("raw path, and it is still derived from a store that is not yours to publish.");
    process.exit(1);
  }
  const weeks = Number(flag("--weeks", "8"));
  const deny = args.includes("--deny") ? [new RegExp(flag("--deny", ""), "gi")] : [];

  // Only the collection being studied may be named. Every other skill is a
  // vocabulary somebody else owns, and the first run leaked seventy of them.
  const collection = flag("--skills", "skills");
  try {
    KNOWN = new Set(readdirSync(collection, { withFileTypes: true })
      .filter((d) => d.isDirectory()).map((d) => d.name.toLowerCase()));
  } catch { KNOWN = new Set(); }

  // MCP tools you vouch for, by exact name. Everything else is counted, not named.
  ALLOW_TOOL = new Set(String(flag("--allow-tool", "")).split(",").map((t) => t.trim().toLowerCase()).filter(Boolean));

// A skill named in prose and never opened is a routing lead, and it is the one
// signal that needs the text rather than the events. Only a name from the
// collection under study can match, so no other vocabulary can reach the
// output through this.
// Names are directory names, so a name that is not shaped like one is not
// searched for rather than escaped into one.
const NAMEISH = /^[a-z0-9][a-z0-9-]{0,63}$/i;
const MENTIONS = new Map(
  [...KNOWN].filter((n) => NAMEISH.test(n))
    .map((n) => [n, new RegExp("(?:^|[^a-z0-9/-])" + n + "(?![a-z0-9-])", "i")]),
);

  function* files(dir) {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) yield* files(p);
      else if (e.name.endsWith(".jsonl")) yield p;
    }
  }

  const MS_WEEK = 7 * 24 * 3600 * 1000;
  const now = Date.now();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, "");

  const byKind = new Map();
  const skippedShapes = new Map();
  let sessions = 0, records = 0, unknown = 0, unreadable = 0, empty = 0;

  for (const [i, dir] of dirs.entries()) {
    const store = String.fromCharCode(97 + i);
    for (const f of files(dir)) {
      let st;
      try { st = statSync(f); } catch { unreadable++; continue; }
      const week = Math.floor((now - st.mtimeMs) / MS_WEEK);
      if (week >= weeks || week < 0) continue;
      let text;
      try { text = readFileSync(f, "utf8"); } catch { unreadable++; continue; }
      const lines = text.split("\n").filter((l) => l.trim());
      // An empty file is not an unrecognised shape, and counting it as one made
      // the skipped number look like a parsing problem.
      if (!lines.length) { empty++; continue; }
      const kind = detectStore(lines);
      if (!kind) {
        unknown++;
        // Naming the shape is the difference between "a fifth was dropped" and
        // knowing it was a tool side-log rather than a session. Key names are
        // schema; no value from an unrecognised file is read.
        let sig = "<unparsable>";
        try {
          const k = Object.keys(JSON.parse(lines[0]) ?? {});
          sig = k.length ? k.map((x) => (KEYNAME.test(x) ? x : "<odd>")).sort().join(",") : "<no-keys>";
        } catch {}
        skippedShapes.set(sig, (skippedShapes.get(sig) ?? 0) + 1);
        continue;
      }
      sessions++;
      byKind.set(kind, (byKind.get(kind) ?? 0) + 1);

      const session = hash8(f);
      const batch = [];
      // Recorded once per session, whether or not the skill was also opened.
      // "Mentioned and never opened" is the comparison worth making, and it
      // needs both halves counted the same way.
      for (const [name, re] of MENTIONS) {
        if (!re.test(text)) continue;
        batch.push(JSON.stringify({ store, harness: kind, session, week, ts: null, kind: "mention", skill: name }));
        records++;
      }
      for (const line of lines) {
        let o;
        try { o = JSON.parse(line); } catch { continue; }
        const ts = Date.parse(o.timestamp ?? o.created_at ?? o.updatedAt ?? "") || null;
        for (const r of ADAPTERS[kind].read(o)) {
          if (r.tool) r.tool = redact(r.tool, deny);
          if (r.verb) r.verb = redact(r.verb, deny);
          if (r.ext) r.ext = redact(r.ext, deny);
          if (r.skill) r.skill = redact(r.skill, deny);
          batch.push(JSON.stringify({ store, harness: kind, session, week, ts, ...r }));
          records++;
        }
      }
      if (batch.length) appendFileSync(out, `${batch.join("\n")}\n`);
    }
  }

  console.log(`${sessions} session(s) inside ${weeks} week(s) across ${dirs.length} store(s)`);
  for (const [k, c] of [...byKind].sort((a, b) => b[1] - a[1])) console.log(`  ${String(c).padStart(5)}  ${k}`);
  console.log(`\n${records} normalised record(s) written to ${out}`);
  console.log(`${redactions} redaction(s) fired at the adapter`);
  if (empty) console.log(`${empty} empty file(s)`);
  if (unknown) {
    console.log("");
    console.log(`${unknown} file(s) matched no adapter and were skipped, not guessed at.`);
    console.log("Shapes, by first-line key names. A shape you recognise is either a");
    console.log("harness this has no adapter for, or a side-log whose events the session");
    console.log("file already carries:");
    console.log("");
    for (const [sig, c] of [...skippedShapes].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
      console.log(`  ${String(c).padStart(4)}  {${sig}}`);
    }
  }
  if (unreadable) console.log(`${unreadable} file(s) could not be read`);
  console.log(`\nNo message text and no raw path is in that file. It is still derived from a`);
  console.log(`store that is not yours to publish, so keep it untracked.`);

}