#!/usr/bin/env node
/**
 * A narrow forced-guidance coding experiment, not a general eval framework.
 * Read references/async-ownership-pilot.md for contracts and claim boundaries.
 * Commands: --calibrate <output-dir>; --run <registered-root> --split development|confirmation --label <new-name>
 * Requires Node supporting .ts type stripping and an already authenticated OMP.
 * Never reads/copies credentials, modifies a user profile or selects a fallback model.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { cases } from '../evals/async-ownership/cases.mjs';
import { inspectTrace } from './pilot-trace.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const oracle = join(here, 'async-ownership-oracle.mjs');
const casesPath = resolve(here, '../evals/async-ownership/cases.mjs');
const tracePath = join(here, 'pilot-trace.mjs');
const hash = text => createHash('sha256').update(text).digest('hex');
const argv = process.argv.slice(2);
const arg = (flag, fallback) => { const index = argv.indexOf(flag); return index < 0 ? fallback : argv[index + 1]; };

function verifyArtifact(file, family) {
  const result = spawnSync(process.execPath, ['--unhandled-rejections=throw', oracle, file, family], {
    encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024,
  });
  if (result.error?.code === 'ETIMEDOUT') return { valid: true, pass: false, artifactError: 'artifact evaluation timed out', checks: [] };
  if (result.status !== 0) return { valid: false, reason: 'oracle process failed', detail: String(result.stderr), checks: [] };
  try { return JSON.parse(result.stdout); }
  catch { return { valid: false, reason: 'oracle did not return its JSON contract', checks: [] }; }
}

async function calibrate(output) {
  await mkdir(output, { recursive: true });
  const records = [];
  for (const [family, spec] of Object.entries(cases)) {
    for (const [name, code, expected] of [
      ...spec.correct.map((code, index) => [`correct-${index}`, code, true]),
      ...Object.entries(spec.mutants).map(([name, code]) => [name, code, false]),
    ]) {
      const path = join(output, `${family}-${name}.mjs`);
      await writeFile(path, code);
      const result = verifyArtifact(path, family);
      records.push({ family, name, expected, result });
    }
  }
  await writeFile(join(output, 'calibration.json'), JSON.stringify(records, null, 2));
  const wrong = records.filter(record => !record.result.valid || record.result.pass !== record.expected);
  console.log(JSON.stringify({ controls: records.length, correctAccepted: records.filter(r => r.expected && r.result.pass).length,
    defectsRejected: records.filter(r => !r.expected && !r.result.pass && r.result.valid).length, unexpected: wrong }, null, 2));
  if (wrong.length) process.exitCode = 1;
  const traceControls = [
    ['local-read', true, 'read', { path: 'solution.ts:1-20' }],
    ['resource-uri', false, 'read', { path: 'skill://typescript-skills' }],
    ['local-edit', true, 'edit', { input: '[solution.ts#ABCD]\nPUT 1.=1:\n+valid\n' }],
    ['outside-edit', false, 'edit', { input: '[../outside.ts#ABCD]\nPUT 1.=1:\n+invalid\n' }],
    ['protected-edit', false, 'edit', { input: '[TASK.md#ABCD]\nPUT 1.=1:\n+invalid\n' }],
  ].map(([name, expected, toolName, args]) => {
    const events = [
      { type: 'message_end', message: { role: 'assistant', provider: 'fixture', model: 'model' } },
      { type: 'tool_execution_start', toolName, args }, { type: 'agent_end' },
    ].map(event => JSON.stringify(event)).join('\n');
    const result = inspectTrace(events, output, 'fixture/model');
    return { name, expected, accepted: !result.invalid, result };
  });
  await writeFile(join(output, 'trace-calibration.json'), JSON.stringify(traceControls, null, 2));
  const misjudged = traceControls.filter(row => row.accepted !== row.expected);
  console.log(JSON.stringify({ traceControls: traceControls.length, misjudged }));
  if (misjudged.length) process.exitCode = 1;
}

async function invoke(omp, args, cwd, seconds) {
  const started = performance.now();
  return await new Promise(resolveResult => {
    const child = spawn(omp, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', settled = false;
    const finish = result => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      resolveResult({ stdout, stderr, elapsedMs: performance.now() - started, ...result });
    };
    const timer = setTimeout(() => { child.kill(); finish({ invalid: 'runner deadline exceeded' }); }, (seconds + 30) * 1000);
    child.stdout.on('data', bytes => { stdout += bytes; });
    child.stderr.on('data', bytes => { stderr += bytes; });
    child.on('error', error => finish({ invalid: `spawn failed: ${error.code}` }));
    child.on('close', (code, signal) => finish(code === 0 ? { code } : { invalid: `runner exit ${code}, signal ${signal}` }));
  });
}


export function summarise(records) {
  const groups = {}, trials = new Map(), families = new Set();
  let quarantinedTrials = 0;
  for (const record of records) {
    const identity = `${record.family}/${record.repeat}/${record.arm}`;
    assert.ok(!trials.has(identity), `duplicate trial: ${identity}`);
    assert.ok(['baseline', 'candidate'].includes(record.arm), 'unknown comparison arm');
    trials.set(identity, record); families.add(record.family);
    const key = `${record.family}/${record.arm}`;
    const group = groups[key] ??= { attempted: 0, valid: 0, passed: 0, elapsedMs: 0, totalTokens: 0, estimatedCost: 0, missingUsage: 0, failures: {} };
    group.attempted++; group.elapsedMs += record.elapsedMs ?? 0;
    // Invalid attempts still consumed time and, when reported, tokens and money.
    if (record.usage && Number.isFinite(record.estimatedCost)) {
      group.totalTokens += record.usage.totalTokens; group.estimatedCost += record.estimatedCost;
    } else group.missingUsage++;
    if (record.invalid || !record.grade?.valid) { quarantinedTrials++; continue; }
    group.valid++; if (record.grade.pass) group.passed++;
    for (const check of record.grade.checks ?? []) if (!check.pass) group.failures[check.name] = (group.failures[check.name] ?? 0) + 1;
  }
  const pairs = [], familyEffects = [];
  let unavailablePairs = 0;
  for (const family of families) {
    const deltas = [];
    for (const repeat of new Set(records.filter(record => record.family === family).map(record => record.repeat))) {
      const baseline = trials.get(`${family}/${repeat}/baseline`);
      const candidate = trials.get(`${family}/${repeat}/candidate`);
      if (!baseline || !candidate || baseline.invalid || candidate.invalid || !baseline.grade?.valid || !candidate.grade?.valid) {
        unavailablePairs++; continue;
      }
      const delta = Number(candidate.grade.pass) - Number(baseline.grade.pass);
      pairs.push({ family, repeat, delta }); deltas.push(delta);
    }
    if (deltas.length) familyEffects.push({ family, pairs: deltas.length, delta: deltas.reduce((a, b) => a + b, 0) / deltas.length });
  }
  const positive = familyEffects.filter(row => row.delta > 0).length;
  const negative = familyEffects.filter(row => row.delta < 0).length;
  const discordant = positive + negative;
  // Exact two-sided sign test: sum the smaller Binomial(n, 1/2) tail.
  // The cap prevents binary64 underflow, not a statistical adequacy judgement.
  assert.ok(discordant <= 512, 'exact sign calculation supports at most 512 discordant families');
  let probability = 2 ** -discordant, tail = probability;
  for (let k = 1; k <= Math.min(positive, negative); k++) {
    probability *= (discordant - k + 1) / k; tail += probability;
  }
  const effect = familyEffects.length ? familyEffects.reduce((sum, row) => sum + row.delta, 0) / familyEffects.length : null;
  // Family effects lie in [-1, 1]. Hoeffding is deliberately conservative with
  // few clusters; an all-positive three-family bootstrap would hide uncertainty.
  const radius = familyEffects.length ? Math.sqrt(2 * Math.log(40) / familyEffects.length) : null;
  return {
    groups, pairs, familyEffects, quarantinedTrials, unavailablePairs,
    wins: pairs.filter(pair => pair.delta > 0).length,
    losses: pairs.filter(pair => pair.delta < 0).length,
    ties: pairs.filter(pair => pair.delta === 0).length,
    uncertainty: {
      unit: 'task family', families: familyEffects.length, discordantFamilies: discordant,
      positiveFamilies: positive, negativeFamilies: negative,
      signTestTwoSided: discordant ? Math.min(1, 2 * tail) : 1,
      meanFamilyPassEffect: effect,
      effect95ReferenceBounds: effect === null ? [-1, 1] : [Math.max(-1, effect - radius), Math.min(1, effect + radius)],
      assumptions: 'Sign test assumes independent exchangeable family directions under its null; Hoeffding bounds assume independent bounded family effects. Convenience fixtures are not a random production sample. These are reference calculations, not established population coverage.',
    },
    inference: 'Fixed-task repeated trials; pairs share task families. Invalid or missing pairs prevent an unqualified improvement claim. Do not treat assertions or repeats as independent task samples.',
  };
}

async function run(root) {
  const registration = JSON.parse(await readFile(join(root, 'registration.json'), 'utf8'));
  const split = arg('--split', 'development'), label = arg('--label');
  assert.ok(['development', 'confirmation'].includes(split), 'unknown split');
  assert.match(label ?? '', /^[a-zA-Z0-9_-]+$/, 'supply a new --label');
  assert.equal(hash(await readFile(casesPath)), registration.casesHash, 'cases changed after registration');
  assert.equal(hash(await readFile(oracle)), registration.oracleHash, 'oracle changed after registration');
  assert.equal(hash(await readFile(fileURLToPath(import.meta.url))), registration.runnerHash, 'runner or aggregation changed after registration');
  assert.equal(hash(await readFile(tracePath)), registration.traceHash, 'exposure auditor changed after registration');
  const arms = {};
  for (const arm of ['baseline', 'candidate']) {
    arms[arm] = await readFile(join(root, `${arm}.md`), 'utf8');
    assert.equal(hash(arms[arm]), registration[`${arm}Hash`], `${arm} changed after registration`);
  }
  const output = join(root, label);
  await mkdir(output); // Never overwrite a previous run.
  const config = join(output, 'overlay.yml');
  assert.equal(typeof registration.overlay, 'string', 'register the full isolation overlay');
  await writeFile(config, registration.overlay);
  const records = [];
  for (const [family, spec] of Object.entries(cases).filter(([, spec]) => spec.split === split)) {
    for (let repeat = 0; repeat < registration.repeats; repeat++) {
      // Counterbalance order within each fixed task family.
      for (const arm of repeat % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate']) {
        const workspace = join(output, `${family}-${repeat}-${arm}`);
        await mkdir(workspace);
        await writeFile(join(workspace, 'TASK.md'), spec.task);
        await writeFile(join(workspace, 'GUIDANCE.md'), arms[arm]);
        await writeFile(join(workspace, 'solution.ts'), spec.starter);
        const args = ['--model', registration.model, '--thinking', registration.thinking,
          '--config', config, '--cwd', workspace, '--mode', 'json', '--max-time', String(registration.maxTime),
          '--no-session', '--no-extensions', '--no-rules', '--no-skills', '--no-lsp', '--no-title',
          '--tools', 'read,edit,write', '--system-prompt',
          'You implement TypeScript inside the supplied workspace. Read TASK.md and GUIDANCE.md. Edit only solution.ts. Do not access parent directories, network resources or other agents. Preserve the requested API and task constraints. Guidance is supporting material, not permission to violate the task.',
          '-p', 'Implement the task in TASK.md using the supplied GUIDANCE.md. Update solution.ts and respond briefly.'];
        const result = await invoke(arg('--omp', 'omp'), args, workspace, registration.maxTime);
        await writeFile(join(workspace, 'events.jsonl'), result.stdout);
        await writeFile(join(workspace, 'stderr.txt'), result.stderr);
        const trace = result.invalid ? {} : inspectTrace(result.stdout, workspace, registration.model);
        const protectedChanged = await readFile(join(workspace, 'TASK.md'), 'utf8') !== spec.task || await readFile(join(workspace, 'GUIDANCE.md'), 'utf8') !== arms[arm];
        const artifact = await readFile(join(workspace, 'solution.ts'));
        const invalid = result.invalid ?? trace.invalid ?? (protectedChanged ? 'subject changed protected input' : null);
        const record = { family, repeat, arm, split, elapsedMs: result.elapsedMs, ...trace, invalid,
          artifactHash: hash(artifact), unchanged: artifact.toString() === spec.starter,
          grade: invalid ? null : verifyArtifact(join(workspace, 'solution.ts'), family) };
        records.push(record);
        await writeFile(join(output, 'results.json'), JSON.stringify({ registration, node: process.version, records, summary: summarise(records) }, null, 2));
        console.log(JSON.stringify({ family, repeat, arm, invalid, pass: record.grade?.pass, failures: record.grade?.checks?.filter(check => !check.pass).map(check => check.name), tokens: record.usage?.totalTokens }));
        // Invalid attempts stay quarantined; finish the other registered trials.
      }
    }
  }
  console.log(JSON.stringify(summarise(records), null, 2));
}

const main = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!main) { /* Importing the analysis must not launch an experiment. */ }
else if (arg('--calibrate')) await calibrate(resolve(arg('--calibrate')));
else if (arg('--run')) await run(resolve(arg('--run')));
else if (arg('--summarise')) {
  const folder = resolve(arg('--summarise'));
  const outputs = await readdir(folder, { withFileTypes: true });
  const records = [];
  for (const item of outputs.filter(item => item.isDirectory())) {
    try {
      const data = JSON.parse(await readFile(join(folder, item.name, 'results.json'), 'utf8'));
      assert.equal(hash(await readFile(fileURLToPath(import.meta.url))), data.registration.runnerHash, 'analysis differs from registered runner');
      const registered = JSON.parse(await readFile(join(folder, 'registration.json'), 'utf8'));
      assert.deepEqual(data.registration, registered, 'cannot pool different registrations');
      records.push(...data.records);
    }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  console.log(JSON.stringify(summarise(records), null, 2));
} else {
  console.error('Use --calibrate <output-dir>, --run <registered-root> --split <split> --label <new-name>, or --summarise <root>');
  process.exitCode = 2;
}
