#!/usr/bin/env node
/**
 * What a model actually costs to run this harness, against what it scores.
 *
 *   node tools/model-cost.mjs                 rank on the measured profile
 *   node tools/model-cost.mjs --record <dir>  measure the profile from a run
 *   node tools/model-cost.mjs --post-promo    price Sol after 3 Sep 2026
 *   node tools/model-cost.mjs --work          only what org policy allows
 *   node tools/model-cost.mjs --credits 326452 --spent-on gpt-5.4
 *                                             what a real month would have
 *                                             cost on each model instead
 *
 * Headline prices mislead here, and the reason is in the traffic. Measured over
 * 541 model turns of our own agentic recordings, a turn carries 1,536 input
 * tokens, 34,064 cache reads and 279 output tokens: cache read outweighs input
 * by twenty-two to one and output by a hundred and twenty. So the cached-input
 * column decides the bill, and the output column — the one a price list leads
 * with — barely moves it.
 *
 * That reverses the obvious reading of Grok 4.6. Its output is $6 against
 * Terra's $12, which looks like half price, and its cached input is $0.50
 * against Terra's $0.20. On this traffic it lands at two-thirds more per turn,
 * not half.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };

// ------------------------------------------------------------------ profile

/** Measured from our own recordings; override by pointing at a newer run. */
let PROFILE = { input: 1536, cacheRead: 34064, cacheWrite: 0, output: 279, turns: 541 };

const record = arg("--record", null);
if (record) {
  let n = 0, input = 0, output = 0, cacheRead = 0, cacheWrite = 0;
  for (const f of readdirSync(record).filter((x) => x.endsWith(".txt"))) {
    for (const line of readFileSync(join(record, f), "utf8").split("\n")) {
      if (!line.includes('"usage"')) continue;
      let j; try { j = JSON.parse(line); } catch { continue; }
      if (j.type !== "message_end") continue;
      const u = j.message?.usage;
      if (!u?.totalTokens) continue;
      n++; input += u.input ?? 0; output += u.output ?? 0;
      cacheRead += u.cacheRead ?? 0; cacheWrite += u.cacheWrite ?? 0;
    }
  }
  if (!n) { console.error(`no usage rows in ${record}`); process.exit(1); }
  PROFILE = { input: input / n, cacheRead: cacheRead / n, cacheWrite: cacheWrite / n, output: output / n, turns: n };
}

// ------------------------------------------------------------------- prices

/**
 * GitHub Copilot, USD per million tokens, default context tier. `agentic` is the
 * public agentic-benchmark score where one is published — the axis this harness
 * exercises — and is left out rather than guessed where it is not.
 */
const POST_PROMO = argv.includes("--post-promo");
// `work: false` is blocked by the organisation's Copilot policy, so its price is
// academic there. Grok 4.6 sits here: the best agentic score on the provider,
// disabled by policy, and 65% dearer than Terra even if it were not.
const WORK_ONLY = argv.includes("--work");
const PRICES = {
  "gpt-5.6-luna":     { in: 0.20, cached: 0.02, write: 0.25, out: 1.20, agentic: 46.9 , work: true },
  "gpt-5.4-nano":     { in: 0.20, cached: 0.02, write: 0, out: 1.25 },
  "gemini-3.7-flash": { in: 0.75, cached: 0.075, write: 0, out: 3.75 , work: false },
  "gpt-5.4-mini":     { in: 0.75, cached: 0.075, write: 0, out: 4.50 , work: true },
  "claude-haiku-4.5": { in: 1.00, cached: 0.10, write: 1.25, out: 5.00 , work: true },
  // Half price through 3 Sep 2026; --post-promo doubles it.
  "gpt-5.6-sol":      { in: POST_PROMO ? 4.00 : 2.00, cached: POST_PROMO ? 0.40 : 0.20, write: POST_PROMO ? 5.00 : 2.50, out: POST_PROMO ? 20.00 : 10.00, agentic: 57.8 , work: true },
  "claude-sonnet-5":  { in: 2.00, cached: 0.20, write: 2.50, out: 10.00, agentic: 49.7 , work: true },
  "gpt-5.6-terra":    { in: 2.00, cached: 0.20, write: 2.50, out: 12.00, agentic: 50.2 , work: true },
  "gpt-5.4":          { in: 2.50, cached: 0.25, write: 0, out: 15.00 , work: true },
  "kimi-k3":          { in: 3.00, cached: 0.30, write: 0, out: 15.00, agentic: 54.3 , work: false },
  "grok-4.6":         { in: 2.00, cached: 0.50, write: 0, out: 6.00, agentic: 58.7 , work: false },
  "claude-opus-5":    { in: 5.00, cached: 0.50, write: 6.25, out: 25.00, agentic: 59.2 , work: false },
};

// -------------------------------------------------------------------- report

const perTurn = (p) =>
  (PROFILE.input * p.in + PROFILE.cacheRead * p.cached + PROFILE.cacheWrite * p.write + PROFILE.output * p.out) / 1e6;

const rows = Object.entries(PRICES)
  .filter(([, p]) => !WORK_ONLY || p.work)
  .map(([name, p]) => ({ name, cost: perTurn(p), agentic: p.agentic, share: (PROFILE.cacheRead * p.cached) / 1e6 }))
  .sort((a, b) => a.cost - b.cost);

const r = (n, d = 0) => Math.round(n).toLocaleString();
console.log(`profile: ${r(PROFILE.input)} input, ${r(PROFILE.cacheRead)} cache read, ${r(PROFILE.cacheWrite)} cache write, ${r(PROFILE.output)} output, over ${PROFILE.turns} turns`);
console.log(`prices:  GitHub Copilot, default tier${POST_PROMO ? ", Sol after the promotion ends" : ""}\n`);
console.log("model".padEnd(20) + "$/turn    $/1k turns   agentic   cache read is");
for (const x of rows) {
  const pct = Math.round((100 * x.share) / x.cost);
  console.log(
    x.name.padEnd(20) +
    x.cost.toFixed(5).padStart(8) +
    ("$" + (x.cost * 1000).toFixed(2)).padStart(13) +
    (x.agentic == null ? "     --" : String(x.agentic).padStart(9)) +
    `${String(pct).padStart(10)}% of it`,
  );
}

const terra = rows.find((x) => x.name === "gpt-5.6-terra");
console.log(`
against gpt-5.6-terra at ${terra.cost.toFixed(5)}, every row on the same token profile:`);
for (const x of rows) {
  if (x.name === "gpt-5.6-terra" || x.agentic == null) continue;
  const dc = Math.round((100 * (x.cost - terra.cost)) / terra.cost);
  const da = (x.agentic - 50.2).toFixed(1);
  const verdict = x.cost <= terra.cost && x.agentic > 50.2 ? "  <- lower rate and higher score; total spend unmeasured" : "";
  console.log(`  ${x.name.padEnd(18)} ${dc >= 0 ? "+" : ""}${dc}% cost   ${da >= 0 ? "+" : ""}${da} agentic${verdict}`);
}

// ------------------------------------------------------- a month, repriced

const credits = Number(arg("--credits", 0));
if (credits) {
  // 1 AI credit = $0.01. The bill names credits, not turns, so the turn count
  // has to be inferred from the model it was spent on — state that model rather
  // than let the comparison quietly assume one.
  const spentOn = arg("--spent-on", "gpt-5.4");
  const base = PRICES[spentOn];
  if (!base) { console.error(`unknown model ${spentOn}`); process.exit(1); }
  const usd = credits / 100;
  const turns = usd / perTurn(base);
  console.log(`
${credits.toLocaleString()} AI credits = $${usd.toFixed(2)}`);
  console.log(`at ${spentOn}'s $${perTurn(base).toFixed(5)} a turn, that is about ${Math.round(turns).toLocaleString()} turns`);
  console.log(`
the same ${Math.round(turns).toLocaleString()} turns on each model:`);
  for (const x of rows) {
    const total = x.cost * turns;
    const delta = total - usd;
    const tag = x.name === spentOn ? "   <- what was actually billed"
      : delta < 0 ? `   saves $${Math.abs(delta).toFixed(0)}`
      : `   costs $${delta.toFixed(0)} more`;
    console.log(`  ${x.name.padEnd(18)} $${total.toFixed(0).padStart(6)}${x.agentic == null ? "" : `   agentic ${x.agentic}`}${tag}`);
  }
  console.log(`
A mixed month does not divide this cleanly, and every row assumes the token
profile measured on terra. A model that reasons more, or finishes in fewer
turns, moves further than any gap shown here: these are rates, not bills.`);
}

// ------------------------------------------------- how much reasoning it takes

/**
 * Raising effort buys reasoning tokens, and reasoning bills as output. So the
 * fair question about a cheap model at a high effort is not "does it cost less
 * at the same volume" but "how much more may it emit before it stops costing
 * less". That number is the headroom, and it is usually far larger than the
 * worry it answers.
 */
if (argv.includes("--headroom")) {
  const ref = arg("--against", "gpt-5.6-terra");
  const base = PRICES[ref];
  const target = perTurn(base);
  console.log(`
headroom before a model costs as much as ${ref} ($${target.toFixed(5)} a turn)`);
  console.log(`measured output is ${Math.round(PROFILE.output)} tokens a turn
`);
  for (const [name, p] of Object.entries(PRICES)) {
    if (name === ref || (WORK_ONLY && !p.work)) continue;
    const fixed = (PROFILE.input * p.in + PROFILE.cacheRead * p.cached + PROFILE.cacheWrite * p.write) / 1e6;
    if (fixed >= target) { console.log(`  ${name.padEnd(18)} already dearer before emitting a single output token`); continue; }
    const tokens = ((target - fixed) * 1e6) / p.out;
    console.log(`  ${name.padEnd(18)} ${Math.round(tokens).toLocaleString().padStart(9)} output tokens  = ${(tokens / PROFILE.output).toFixed(1)}x the measured volume`);
  }
}
