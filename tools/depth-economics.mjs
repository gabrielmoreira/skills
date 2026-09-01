#!/usr/bin/env node
/**
 * What a level of depth costs, and what it delivers.
 *
 * READ THE REACH COLUMN, NOT THE COST ONE. This was written to decide an
 * architecture on money, and tools/model-cost.mjs later established that a skill
 * is 4.7% of what an activation costs -- the conversation is the rest. So the
 * difference between these three architectures is around 0.3% of a bill, and
 * anyone choosing between them on that number is optimising noise.
 *
 * What the arithmetic still decides is reach: guidance that does not arrive is
 * worth nothing at any price, and the three shapes deliver it at very different
 * rates. That is the column to read.
 *
 *   node tools/depth-economics.mjs
 *   node tools/depth-economics.mjs --follow 0.36   per-hop follow-through
 *
 * The question is whether guidance belongs in rule files a hop away or inlined
 * where it is already loaded. Arguing it from taste goes nowhere; both sides
 * sound reasonable. It has an arithmetic, and every input below is measured
 * rather than assumed.
 *
 * The two costs pull in opposite directions.
 *
 *   A hop is expensive and its price has nothing to do with the file. Each turn
 *   re-sends the whole conversation, so at the measured 34,064 cached tokens a
 *   turn costs about $0.0068 in cache reads plus $0.0033 of output before the
 *   file is even opened. That is the floor, paid per level of depth.
 *
 *   Inlining is cheap per token and paid unconditionally. The tokens enter as
 *   input once, then ride in cache for the rest of the conversation, which at
 *   the measured 6.7 turns is roughly two thirds of an input token's price
 *   again.
 *
 * So depth wins only when the content is rarely wanted. The break-even is a
 * probability, and it is not small.
 *
 * The second cost is the one that decides it. A level is not only tokens; it is
 * a place to stop. Measured on evidence-backed-review: of eleven activations
 * that opened the skill, four opened any rule file. One hop delivered its
 * content 36% of the time, and depth multiplies — two hops at that rate reach
 * the leaf 13% of the time. So the honest metric is not cost but cost per
 * successful delivery, and that is what this prints.
 */
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : Number(argv[i + 1]); };

// ------------------------------------------------------- measured parameters

/** From 541 model turns of our own recordings, and Copilot's published rates. */
// Measured over 82,940 model turns of real work sessions, 1,795 sessions from
// March to August 2026 (tools/work-sessions.mjs). The earlier figures here came
// from synthetic eval workspaces and were wrong by a lot in the direction that
// mattered most: cached context was 34,064 against a real 158,307, so the cost
// of a hop -- which is almost entirely cache re-read -- was understated 4.6x.
const CONTEXT = 158307;
const OUT_PER_TURN = 714;
const TURNS = 17;             // median; the mean of 46 is dragged by a few huge sessions
const P_IN = 2.0 / 1e6, P_CACHED = 0.2 / 1e6, P_OUT = 12.0 / 1e6;   // gpt-5.6-terra

/**
 * Per-hop follow-through, measured per level rather than assumed uniform. In
 * typescript-skills: 51 sessions opened it, 38 reached a topic (75%), 28 reached
 * a rule beneath it (74%). The two hops are not the same barrier -- descending
 * is easier once you have descended -- so the earlier model, which squared a
 * single rate, was wrong about where the loss happens as well as how big it is.
 *
 * It also badly understated the rate: 36% assumed, 75% and 74% measured. The
 * three-level tree delivers to level three 55% of the time, not 13%.
 */
const F12 = arg("--f12", 0.75);
const F23 = arg("--f23", 0.74);
const FOLLOW = F12;

const HOP = CONTEXT * P_CACHED + OUT_PER_TURN * P_OUT;   // a turn, before any file
const inlineCost = (tok) => tok * P_IN + tok * P_CACHED * TURNS;
const hopCost = (tok) => HOP + tok * P_IN + tok * P_CACHED * (TURNS / 2);

// ------------------------------------------------------------- the tree today

const ROOT = "skills/typescript-skills";
const tok = (p) => Math.round(readFileSync(p, "utf8").length / 4);
const topics = [];
for (const d of readdirSync(ROOT, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const dir = join(ROOT, d.name);
  const idx = ["INDEX.md", "SKILL.md"].map((f) => join(dir, f)).find(existsSync);
  if (!idx) continue;
  const rd = join(dir, "rules");
  const rules = existsSync(rd) ? readdirSync(rd).filter((f) => f.endsWith(".md")).map((f) => tok(join(rd, f))) : [];
  topics.push({ name: d.name, index: tok(idx), rules });
}
const L1 = tok(join(ROOT, "SKILL.md"));
const meanRule = Math.round(topics.flatMap((t) => t.rules).reduce((a, b) => a + b, 0) / topics.flatMap((t) => t.rules).length);

console.log(`measured: ${CONTEXT.toLocaleString()} cached tokens a turn, ${TURNS} turns a session, follow-through ${(F12*100).toFixed(0)}% then ${(F23*100).toFixed(0)}%`);
console.log(`a hop costs $${HOP.toFixed(5)} before any file is read; the mean rule is ${meanRule} tokens\n`);

console.log(`break-even: inlining beats hopping when the content is wanted more than ` +
  `${Math.round((100 * inlineCost(meanRule)) / hopCost(meanRule))}% of the time`);
console.log(`  inline a ${meanRule}-token rule   $${inlineCost(meanRule).toFixed(5)} always`);
console.log(`  hop to it                  $${hopCost(meanRule).toFixed(5)} when wanted\n`);

// ------------------------------------------------------- three architectures

/** Cost and reach of getting one rule's guidance in front of the agent. */
function architecture(name, alwaysTok, hopTok, reach) {
  const always = inlineCost(alwaysTok);
  const hops = hopTok.reduce((a, t) => a + hopCost(t), 0);
  return { name, levels: hopTok.length, cost: always + hops, reach, per: (always + hops) / reach };
}

const mid = topics.find((t) => t.name === "typescript-coding-standards");
const midRules = mid.rules.reduce((a, b) => a + b, 0);

// Inlining one topic is not an architecture; the root either carries all nine
// or none. Getting that wrong made "everything in the root" look cheap by
// pricing a ninth of it.
const allIndexes = topics.reduce((a, t) => a + t.index, 0);
const allRules = topics.reduce((a, t) => a + t.rules.reduce((x, y) => x + y, 0), 0);

const arch = [
  architecture("3 levels, as built", L1, [mid.index, meanRule], F12 * F23),
  architecture("2 levels, rules folded into each topic", L1, [mid.index + midRules], F12),
  architecture("1 level, all nine topics in the root", L1 + allIndexes + allRules, [], 1),
];

console.log("architecture".padEnd(40) + "hops   cost    reach   cost per delivery");
for (const a of arch) {
  console.log(
    a.name.padEnd(40) +
    String(a.levels).padStart(4) +
    ("$" + a.cost.toFixed(4)).padStart(9) +
    (Math.round(a.reach * 100) + "%").padStart(8) +
    ("$" + a.per.toFixed(4)).padStart(19),
  );
}

const best = arch.reduce((a, b) => (a.per <= b.per ? a : b));
console.log(`\ncheapest per delivered rule: ${best.name}`);

/**
 * The verdict is not the finding; the threshold is. Ranking at one
 * follow-through rate answers today only. What decides the architecture is
 * where the ranking flips, because that is a number the models move over time
 * and a number an experiment can chase.
 */
const [three, two, flat] = arch;
console.log(`
what each would have to achieve to win, holding the others as measured:
  3 levels needs its two hops to reach   ${((three.cost / flat.per) * 100).toFixed(0)}%   (measured ${(F12 * F23 * 100).toFixed(0)}%)
  2 levels needs its one hop to reach    ${((two.cost / flat.per) * 100).toFixed(0)}%   (measured ${(F12 * 100).toFixed(0)}%)`);
console.log(`
Every input above is measured: token rates over 82,940 real model turns, reach
over the 51 work sessions that opened typescript-skills. An earlier version of
this file ran on synthetic eval numbers and ranked these three in the opposite
order. Three errors did it, and two of them pushed the same way:

  - "everything in the root" was priced by inlining one topic of nine, which
    made the flat option look a fifth of its real cost;
  - follow-through was assumed at 36% and is 75% then 74%, so the deep tree was
    charged for a loss it does not suffer;
  - cached context was taken as 34,064 and is 158,307, so every hop was priced
    at a quarter of what it costs.

The last of those flattered the hierarchy and the first two flattered the flat
file. Correcting all three puts the middle option in front, which neither the
original guess nor the first correction predicted.

What is still assumed: that reach would hold after restructuring. Folding rules
into a topic makes that file eight times larger, and a model that opened a
600-token index may behave differently with an 8,800-token one. That is the
experiment, and it is the one thing here worth spending on.`);
