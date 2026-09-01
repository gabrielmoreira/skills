#!/usr/bin/env node
/**
 * The train and validation split for activation scenarios.
 *
 * A description tuned against every scenario it is measured on will pass. That
 * is what overfitting looks like from the inside, and the only defence is to
 * hold some of the set back and select on the part that took no part in the
 * tuning.
 *
 * The split is derived, never stored. Each scenario id hashes to a fraction and
 * lands in validation below the threshold. Three properties follow, and each of
 * them is the reason it is done this way rather than by writing `split:` into
 * a hundred scenario objects:
 *
 * 1. Stable. A scenario keeps its side forever, because its id decides it and
 *    nothing else does. Adding, removing or reordering scenarios never moves an
 *    existing one across, so two runs a month apart compare the same things.
 * 2. Uneditable in practice. Nobody can quietly move a failing scenario into
 *    train to make a number look better without renaming it, and a rename is
 *    visible in a diff.
 * 3. Proportion checked rather than forced. Exact 60/40 would require ranking
 *    within each stratum, which makes one added scenario shuffle its neighbours.
 *    Stability is worth more than a round number, so the proportion is measured
 *    and asserted to sit in a sane band instead.
 *
 * Stratified by polarity. Positives and negatives are hashed with different
 * salts, so a set that is mostly positive does not produce a validation half
 * that is entirely positive. Precision and recall both have to survive the
 * held-out check, or the check only measures one of them.
 *
 * Usage:
 *   node tools/split-activation.mjs              report the split
 *   node tools/split-activation.mjs --check      exit non-zero if it drifted
 *   node tools/split-activation.mjs --set validation --ids
 */
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const ROOT = resolve(process.env.SKILL_COLLECTION_ROOT ?? "skills");

/** Held-out fraction. The guide's 40 percent, which is also what the band below is centred on. */
export const VALIDATION_FRACTION = 0.4;

/** The band the measured proportion must stay inside, per polarity. */
const BAND = { low: 0.28, high: 0.52 };

/**
 * A scenario is positive when it names something the gate should reach. The
 * runner already decides it this way, and a second definition here would drift
 * from that one.
 */
export function isPositive(s) {
  // The scenario says so itself. A near miss carries the same layer and target
  // as a real match, because looking like one is the whole point of it, so the
  // shape cannot be inferred from anything else.
  if (s.activation && s.activation.shouldActivate === false) return false;
  return Boolean(s.expectedPrimary || s.activation?.layer === "public-skill");
}

/**
 * id plus polarity salt to a fraction in [0, 1). Salting by polarity is what
 * makes the split stratified: the two classes are drawn independently, so
 * neither can crowd the other out of the held-out half by being more numerous.
 */
export function fractionFor(id, positive) {
  const h = createHash("sha256").update(`${positive ? "pos" : "neg"}:${id}`).digest();
  return h.readUInt32BE(0) / 2 ** 32;
}

/** Which side a scenario belongs to. Pure, and the only definition of it. */
export function setFor(scenario) {
  return fractionFor(scenario.id, isPositive(scenario)) < VALIDATION_FRACTION
    ? "validation"
    : "train";
}

/** Every activation scenario in the collection, with its side attached. */
export async function loadScenarios(root = ROOT) {
  const out = [];

  // A skill's own evals, and a multi-topic skill's, which live beside each
  // topic rather than in one pile at the root.
  const dirs = [];
  for (const d of await readdir(root, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const skill = join(root, d.name);
    dirs.push([d.name, skill]);
    let subs = [];
    try { subs = await readdir(skill, { withFileTypes: true }); } catch { continue; }
    for (const s of subs) if (s.isDirectory()) dirs.push([d.name, join(skill, s.name)]);
  }

  for (const [skill, dir] of dirs) {
    let files;
    try {
      files = (await readdir(join(dir, "evals"))).filter((f) => /\.scenarios\.(mjs|ts)$/.test(f));
    } catch {
      continue;
    }
    for (const f of files) {
      const mod = await import(pathToFileURL(join(dir, "evals", f)).href);
      for (const s of mod.default ?? mod.scenarios ?? []) {
        if (typeof s.id !== "string") continue;
        out.push({ ...s, skill, set: setFor(s), positive: isPositive(s) });
      }
    }
  }
  return out;
}

function summarise(scenarios) {
  const by = { positive: { train: 0, validation: 0 }, negative: { train: 0, validation: 0 } };
  for (const s of scenarios) by[s.positive ? "positive" : "negative"][s.set]++;
  const share = (g) => (g.train + g.validation ? g.validation / (g.train + g.validation) : 0);
  return { by, share: { positive: share(by.positive), negative: share(by.negative) } };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const argv = process.argv.slice(2);
  const want = argv.includes("--set") ? argv[argv.indexOf("--set") + 1] : null;
  const scenarios = await loadScenarios();

  if (argv.includes("--ids")) {
    for (const s of scenarios) if (!want || s.set === want) console.log(s.id);
    process.exit(0);
  }

  const { by, share } = summarise(scenarios);
  const pct = (n) => `${(n * 100).toFixed(0)}%`;
  console.log(`\nactivation split, ${scenarios.length} scenarios, validation target ${pct(VALIDATION_FRACTION)}\n`);
  console.log("  polarity    train  validation  held out");
  for (const k of ["positive", "negative"]) {
    console.log(
      `  ${k.padEnd(10)}${String(by[k].train).padStart(6)}${String(by[k].validation).padStart(12)}` +
      `${pct(share[k]).padStart(10)}`,
    );
  }

  const drifted = ["positive", "negative"].filter((k) => {
    const total = by[k].train + by[k].validation;
    return total >= 8 && (share[k] < BAND.low || share[k] > BAND.high);
  });

  if (argv.includes("--check")) {
    if (drifted.length) {
      console.log(
        `\n  FAIL  held-out share outside ${pct(BAND.low)} to ${pct(BAND.high)} for: ${drifted.join(", ")}.` +
        `\n        The split is derived, so this is not something to edit. It means the scenario set grew` +
        `\n        lopsided, and the fix is scenarios rather than the threshold.\n`,
      );
      process.exit(1);
    }
    console.log(`\n  PASS  both polarities hold out between ${pct(BAND.low)} and ${pct(BAND.high)}\n`);
  } else {
    console.log(
      `\n  Tune against train. Select on validation. A description that only improves` +
      `\n  the train number has been fitted to the prompts rather than to the job.\n`,
    );
  }
}
