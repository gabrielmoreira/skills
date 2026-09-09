import { isAbsolute, relative, resolve } from 'node:path';

/** Post-run exposure audit, not an OS sandbox. Paths include hashline edit headers. */
export function inspectTrace(stdout, workspace, model, writable = ['solution.ts']) {
  let events;
  try { events = stdout.split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line)); }
  catch { return { invalid: 'non-JSON content in event stream' }; }
  const messages = events.filter(event => event.type === 'message_end' && event.message?.role === 'assistant').map(event => event.message);
  const subjects = [...new Set(messages.map(message => `${message.provider}/${message.model}`))];
  const accesses = events.filter(event => event.type === 'tool_execution_start');
  const usage = messages.length && messages.every(message => Number.isFinite(message.usage?.totalTokens))
    ? messages.reduce((sum, message) => {
      for (const key of ['input', 'output', 'cacheRead', 'cacheWrite', 'totalTokens']) sum[key] += message.usage[key] ?? 0;
      return sum;
    }, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0 }) : null;
  const estimatedCost = messages.length && messages.every(message => Number.isFinite(message.usage?.cost?.total))
    ? messages.reduce((sum, message) => sum + message.usage.cost.total, 0) : null;
  const result = { subjects, usage, estimatedCost, toolCalls: accesses.length };
  const reject = invalid => ({ ...result, invalid });
  if (!messages.length || subjects.some(subject => subject !== model)) return reject('missing assistant result or unexpected model');
  if (!events.some(event => event.type === 'agent_end')) return reject('missing terminal event');
  if (messages.some(message => ['error', 'aborted'].includes(message.stopReason))) return reject('model returned error or aborted');
  function checkPath(path, writing) {
    if (typeof path !== 'string' || !path || /^[a-z][a-z\d+.-]*:\/\//i.test(path)) return false;
    const clean = writing ? path : path.replace(/:(?:\d.*|raw.*)$/, '');
    const rel = relative(workspace, resolve(workspace, clean));
    if (rel === '..' || rel.startsWith(`..\\`) || rel.startsWith('../') || isAbsolute(rel)) return false;
    return !writing || writable.includes(rel.replaceAll('\\', '/'));
  }
  for (const event of accesses) {
    if (!['read', 'write', 'edit'].includes(event.toolName)) return reject(`unexpected tool ${event.toolName}`);
    if (event.toolName === 'edit') {
      const patch = event.args?.input;
      if (typeof patch !== 'string') return reject('unsupported edit payload');
      const targets = [...patch.matchAll(/^\[([^\r\n]+)#[0-9A-F]{4}\]$/gm)].map(match => match[1]);
      const destinations = [...patch.matchAll(/^MV (.+)$/gm)].map(match => match[1].replace(/^"(.*)"$/, '$1'));
      if (!targets.length || [...targets, ...destinations].some(path => !checkPath(path, true))) return reject('edit attempted forbidden target');
      if (/^REM\s*$/m.test(patch)) return reject('artifact deletion is outside this pilot');
    } else if (!checkPath(event.args?.path, event.toolName === 'write')) return reject('tool attempted forbidden path');
  }
  return { ...result, invalid: null };
}
