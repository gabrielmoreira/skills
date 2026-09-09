// Fixed, public, synthetic coding tasks derived from the audited async defect.
// Development and confirmation use different control/data-flow families.
// Oracle assertions are not supplied to experimental subjects.
export const cases = {
  pipeline: {
    split: 'development',
    task: 'Reduce the avoidable waterfall in this request handler. auth and config are independent reads allowed to overlap. data requires successful auth, but does not depend on config and should not wait for it. Return {config, data}. The caller must receive any failure promptly, including when another read remains pending; started work must not leak unhandled rejections. Do not add cancellation, retries, fallbacks or process-wide handlers. Dependencies return promises. Preserve the exported API.',
    starter: `type IO = { auth(): Promise<{id: string}>; config(): Promise<string>; data(id: string): Promise<string> };\nexport async function run(io: IO) {\n  const session = await io.auth();\n  const config = await io.config();\n  const data = await io.data(session.id);\n  return {config, data};\n}\n`,
    correct: [
      'export async function run(io) { const [config,data] = await Promise.all([io.config(), io.auth().then(s => io.data(s.id))]); return {config,data}; }',
      'export function run(io) { const data = Promise.resolve().then(() => io.auth()).then(s => io.data(s.id)); return Promise.all([data, Promise.resolve().then(() => io.config())]).then(([data,config]) => ({config,data})); }'
    ],
    mutants: {
      lateObserver: 'export async function run(io) { const a=io.auth(), c=io.config(); const s=await a; const [config,data]=await Promise.all([c,io.data(s.id)]); return {config,data}; }',
      serialBarrier: 'export async function run(io) { const [s,config]=await Promise.all([io.auth(),io.config()]); return {config,data:await io.data(s.id)}; }',
      swallowedError: 'export async function run(io) { const [config,data]=await Promise.all([io.config().catch(()=>"fallback"),io.auth().then(s=>io.data(s.id))]); return {config,data}; }',
      noOp: 'export async function run() { return {config:"config",data:"data"}; }'
    }
  },
  guarded: {
    split: 'confirmation',
    task: 'This cached report path should avoid remote work completely when cached is true and return {cached:true}. For an uncached report, start the independent flags and records reads together and return {flags,records}. Preserve exact dependency failures and propagate a failure without waiting for another pending read. Every started rejection must be observed, including errors after the caller already received a failure. Do not use retries, fallback values, process-wide handlers or cancellation. Dependencies return promises. Preserve the API.',
    starter: `type IO = { flags(): Promise<string>; records(): Promise<string[]> };\nexport async function run(io: IO, cached: boolean) {\n  if (cached) return {cached:true};\n  const flags = await io.flags();\n  const records = await io.records();\n  return {flags,records};\n}\n`,
    correct: [
      'export async function run(io,cached) { if(cached) return {cached:true}; const [flags,records]=await Promise.all([io.flags(),io.records()]); return {flags,records}; }',
      'export function run(io,cached) { if(cached) return Promise.resolve({cached:true}); return Promise.all([Promise.resolve().then(()=>io.flags()),Promise.resolve().then(()=>io.records())]).then(([flags,records])=>({flags,records})); }'
    ],
    mutants: {
      eagerCache: 'export async function run(io,cached) { const f=io.flags(),r=io.records(); if(cached) return {cached:true}; const [flags,records]=await Promise.all([f,r]); return {flags,records}; }',
      lateObserver: 'export async function run(io,cached) { if(cached) return {cached:true}; const f=io.flags(),r=io.records(); return {flags:await f,records:await r}; }',
      swallowedError: 'export async function run(io,cached) { if(cached) return {cached:true}; const [flags,records]=await Promise.all([io.flags(),io.records().catch(()=>[])]); return {flags,records}; }'
    }
  },
  batch: {
    split: 'confirmation',
    task: 'Improve overlap in this finite batch formatter. keys has at most 32 elements. Start prepare and all independent load(key) reads together. Return strings prefix:value in the original key order, even if reads finish in another order. Empty keys must return [] without calling prepare or load. Propagate the original first observed failure promptly while other work may remain pending, and observe all started rejections even after early failure. No retries, cancellation, fallback values or process-wide handlers. Dependencies return promises. Preserve the API.',
    starter: `type IO = { keys: string[]; prepare(): Promise<string>; load(key: string): Promise<string> };\nexport async function run(io: IO) {\n  if (!io.keys.length) return [];\n  const prefix = await io.prepare();\n  const values = [];\n  for (const key of io.keys) values.push(await io.load(key));\n  return values.map(value => prefix+':'+value);\n}\n`,
    correct: [
      'export async function run(io) { if(!io.keys.length) return []; const [prefix,values]=await Promise.all([io.prepare(),Promise.all(io.keys.map(k=>io.load(k)))]); return values.map(v=>prefix+":"+v); }',
      'export function run(io) { if(!io.keys.length) return Promise.resolve([]); return Promise.all([Promise.resolve().then(()=>io.prepare()), ...io.keys.map(k=>Promise.resolve().then(()=>io.load(k)))]).then(([p,...v])=>v.map(x=>p+":"+x)); }'
    ],
    mutants: {
      lateObserver: 'export async function run(io) { if(!io.keys.length)return []; const p=io.prepare(), all=io.keys.map(k=>io.load(k)); const prefix=await p; return (await Promise.all(all)).map(v=>prefix+":"+v); }',
      reversed: 'export async function run(io) { if(!io.keys.length)return []; const [p,v]=await Promise.all([io.prepare(),Promise.all(io.keys.map(k=>io.load(k)))]); return v.reverse().map(x=>p+":"+x); }',
      eagerEmpty: 'export async function run(io) { const p=io.prepare(); if(!io.keys.length)return []; const [prefix,v]=await Promise.all([p,Promise.all(io.keys.map(k=>io.load(k)))]); return v.map(x=>prefix+":"+x); }'
    }
  },
  ordered: {
    split: 'confirmation',
    task: 'Review this transaction sequence using the supplied guidance and improve it only if justified. begin and commit both return Promise<void>, but share a transaction: commit must start only after begin succeeds. If begin fails, propagate its exact error and never commit. On success return "done". Preserve ordering even though no returned value flows between the calls. No retries, process-wide handlers or fallback success. Preserve the API.',
    starter: `type IO = { begin(): Promise<void>; commit(): Promise<void> };\nexport async function run(io: IO) {\n  await io.begin();\n  await io.commit();\n  return 'done';\n}\n`,
    correct: [
      'export async function run(io) { await io.begin(); await io.commit(); return "done"; }',
      'export function run(io) { return io.begin().then(()=>io.commit()).then(()=>"done"); }'
    ],
    mutants: {
      parallelWrites: 'export async function run(io) { await Promise.all([io.begin(),io.commit()]); return "done"; }',
      falseSuccess: 'export async function run(io) { try { await io.begin(); await io.commit(); } catch {} return "done"; }'
    }
  }
};
