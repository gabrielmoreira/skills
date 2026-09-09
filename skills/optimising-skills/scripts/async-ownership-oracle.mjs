#!/usr/bin/env node
/**
 * Executable oracle for the scoped async-ownership coding pilot.
 * Observes returned values, propagated errors, start/dependency semantics and
 * unhandled rejections in the real Node runtime. It does not grade prose, route,
 * syntax preferences, maintainability, production prevalence or model capability.
 * Run in a fresh process per artifact. Controls are supplied by the pilot runner.
 * Usage: node async-ownership-oracle.mjs <artifact.ts> <pipeline|guarded|batch|ordered>
 */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { setImmediate as nextTurn } from 'node:timers/promises';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
async function flush() { await nextTurn(); await nextTurn(); }
function observe(promise) {
  const state = { kind: 'pending', value: undefined };
  Promise.resolve(promise).then(value => { state.kind = 'value'; state.value = value; }, error => {
    state.kind = 'error'; state.value = error;
  });
  return state;
}

export async function grade(artifact, family) {
  const checks = [];
  const escaped = [];
  const onUnhandled = error => escaped.push(error);
  const onHandled = () => {};
  process.on('unhandledRejection', onUnhandled);
  process.on('rejectionHandled', onHandled);
  async function check(name, exercise) {
    const before = escaped.length;
    try {
      await exercise();
      await flush();
      assert.equal(escaped.length, before, 'started work leaked an unhandled rejection');
      assert.ok(process.listeners('unhandledRejection').includes(onUnhandled), 'artifact removed observer');
      checks.push({ name, pass: true });
    } catch (error) {
      checks.push({ name, pass: false, reason: String(error.message) });
    }
  }
  try {
    const { run } = await import(pathToFileURL(resolve(artifact)).href);
    assert.equal(typeof run, 'function', 'artifact must export run');
    if (family === 'pipeline') {
      await check('overlap-and-dependent-progress', async () => {
        const auth = deferred(), config = deferred(); let configStarted = false, dataStarted = false;
        const result = observe(run({ auth: () => auth.promise, config: () => {
          configStarted = true; return config.promise;
        }, data: async id => { dataStarted = true; return id === 'account' ? 'data' : 'wrong-account'; } }));
        await flush(); const overlap = configStarted;
        auth.resolve({ id: 'account' }); await flush(); const progress = dataStarted;
        config.resolve('config'); await flush();
        assert.ok(overlap, 'config must overlap auth');
        assert.ok(progress, 'data must not wait for unrelated config');
        assert.deepEqual(result, { kind: 'value', value: { config: 'config', data: 'data' } });
      });
      await check('early-config-error', async () => {
        const auth = deferred(), config = deferred(), failure = new Error('config down');
        const result = observe(run({ auth: () => auth.promise, config: () => config.promise, data: async () => 'data' }));
        config.reject(failure); await flush(); const early = result.kind === 'error' && result.value === failure;
        auth.resolve({ id: 'account' }); await flush();
        assert.ok(early, 'config error must reach caller while auth is pending');
      });
      await check('auth-error-and-late-sibling-error', async () => {
        const auth = deferred(), config = deferred(), failure = new Error('auth denied'); let dataStarted = false;
        const result = observe(run({ auth: () => auth.promise, config: () => config.promise, data: async () => { dataStarted = true; return 'data'; } }));
        auth.reject(failure); await flush(); config.reject(new Error('late config')); await flush();
        assert.equal(result.value, failure); assert.equal(result.kind, 'error');
        assert.equal(dataStarted, false, 'dependent operation started despite failed auth');
      });
      await check('dependent-error-preserved', async () => {
        const failure = new Error('data failed');
        const result = observe(run({ auth: async () => ({ id: 'account' }), config: async () => 'config', data: async () => { throw failure; } }));
        await flush(); assert.equal(result.kind, 'error'); assert.equal(result.value, failure);
      });
    } else if (family === 'guarded') {
      await check('cached-branch-does-no-remote-work', async () => {
        let started = false;
        const forbidden = () => { started = true; return Promise.reject(new Error('remote forbidden on cache hit')); };
        const result = observe(run({ flags: forbidden, records: forbidden }, true));
        await flush(); assert.deepEqual(result, { kind: 'value', value: { cached: true } });
        assert.equal(started, false, 'cache branch incurred remote work');
      });
      await check('uncached-overlap-and-values', async () => {
        const flags = deferred(), records = deferred(); let started = false;
        const result = observe(run({ flags: () => flags.promise, records: () => { started = true; return records.promise; } }, false));
        await flush(); const overlap = started; flags.resolve('flags'); records.resolve(['record']); await flush();
        assert.ok(overlap); assert.deepEqual(result, { kind: 'value', value: { flags: 'flags', records: ['record'] } });
      });
      await check('uncached-early-and-late-errors', async () => {
        const flags = deferred(), records = deferred(), failure = new Error('records failed');
        const result = observe(run({ flags: () => flags.promise, records: () => records.promise }, false));
        records.reject(failure); await flush(); const early = result.value === failure && result.kind === 'error';
        flags.reject(new Error('late flags')); await flush(); assert.ok(early);
      });
    } else if (family === 'batch') {
      await check('empty-input-has-no-effects', async () => {
        let started = false;
        const result = observe(run({ keys: [], prepare: async () => { started = true; return 'prefix'; }, load: async () => { started = true; return 'value'; } }));
        await flush(); assert.deepEqual(result, { kind: 'value', value: [] }); assert.equal(started, false);
      });
      await check('batch-overlap-input-order-and-values', async () => {
        const prep = deferred(), a = deferred(), b = deferred(); const started = [];
        const result = observe(run({ keys: ['a', 'b'], prepare: () => prep.promise, load: key => { started.push(key); return key === 'a' ? a.promise : b.promise; } }));
        await flush(); const overlap = started.length === 2;
        b.resolve('B'); a.resolve('A'); prep.resolve('P'); await flush();
        assert.ok(overlap, 'loads must overlap preparation');
        assert.deepEqual(result, { kind: 'value', value: ['P:A', 'P:B'] });
      });
      await check('item-failure-before-preparation', async () => {
        const prep = deferred(), item = deferred(), failure = new Error('item unavailable');
        const result = observe(run({ keys: ['a'], prepare: () => prep.promise, load: () => item.promise }));
        item.reject(failure); await flush(); const early = result.value === failure && result.kind === 'error';
        prep.resolve('P'); await flush(); assert.ok(early);
      });
      await check('preparation-failure-and-multiple-late-rejections', async () => {
        const prep = deferred(), items = [deferred(), deferred()], failure = new Error('prepare failed');
        const result = observe(run({ keys: ['a', 'b'], prepare: () => prep.promise, load: key => items[key === 'a' ? 0 : 1].promise }));
        prep.reject(failure); await flush(); items.forEach(item => item.reject(new Error('late item'))); await flush();
        assert.equal(result.kind, 'error'); assert.equal(result.value, failure);
      });
    } else if (family === 'ordered') {
      await check('transaction-order-without-value-dependency', async () => {
        const opened = deferred(); let committed = false, open = false;
        const result = observe(run({ begin: async () => { await opened.promise; open = true; }, commit: async () => {
          if (!open) throw new Error('commit before begin'); committed = true;
        } }));
        await flush(); assert.equal(committed, false);
        opened.resolve(); await flush(); assert.equal(result.kind, 'value'); assert.equal(result.value, 'done'); assert.ok(committed);
      });
      await check('failed-begin-must-not-commit', async () => {
        const failure = new Error('begin failed'); let committed = false;
        const result = observe(run({ begin: async () => { throw failure; }, commit: async () => { committed = true; } }));
        await flush(); assert.equal(result.value, failure); assert.equal(result.kind, 'error'); assert.equal(committed, false);
      });
    } else throw new Error(`Unknown family: ${family}`);
    await flush();
    return { valid: true, family, pass: checks.length > 0 && checks.every(check => check.pass), checks, escapedRejections: escaped.length };
  } catch (error) {
    return { valid: true, family, pass: false, checks, artifactError: String(error.message), escapedRejections: escaped.length };
  } finally {
    process.removeListener('unhandledRejection', onUnhandled);
    process.removeListener('rejectionHandled', onHandled);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2] || !['pipeline', 'guarded', 'batch', 'ordered'].includes(process.argv[3])) {
    console.error('Usage: node async-ownership-oracle.mjs <artifact.ts> <pipeline|guarded|batch|ordered>');
    process.exitCode = 2;
  } else {
    console.log(JSON.stringify(await grade(process.argv[2], process.argv[3])));
  }
}
