---
id: typescript-async.retry-and-backoff
owner: typescript-async
canonical: true
severity: default
references: [Exponential backoff with jitter (AWS Architecture Blog), Retry storms (Google SRE), p-retry / cockatiel / async-retry, AbortSignal interplay]
---

# Retry and Backoff

Decision: Retry only what is explicitly classified for retry, and treat retry as a mode, not a yes/no reflex — no retry, retry after modification/remediation, or retry with backoff. Use exponential backoff with full jitter, honor upstream hints like `Retry-After` as input to local policy (never an unlimited command), and cap attempts. Keep retry waits and per-attempt timeouts under a locally owned budget; when the caller/runtime budget is known, stay under it so the outer timeout is not the first place you learn the operation hung. The retry mechanism is an async concern; the *decision* of what is retryable belongs to error classification. Prefer a library already in the project (`p-retry`/`cockatiel`/`async-retry`) over hand-rolling.

Use when:
- Code wraps every call in `for (...) { try { ... } catch { sleep(...) } }`, retrying everything including 4xx caller errors.
- Sleep is constant instead of exponential, or has no jitter — retry-storm risk, replicas retry in lockstep.
- A server returns `Retry-After` and the client obeys it blindly, even past a much smaller caller budget (e.g. a 20-minute wait inside a 30-second request).
- An inner timeout is longer than, or absent relative to, the enclosing caller/runtime budget (e.g. a 60s fetch timeout inside a 30s Lambda).
- Retry continues after the request was cancelled (`AbortSignal` ignored).

Do:
- Retry only errors classified for backoff retry; keep the mode explicit — no retry, retry-after-remediation, or retry-with-backoff.
- Use exponential backoff with **full jitter**: `sleep = random(0, base * 2^attempt)`. Cap attempts (3-5 typical).
- Treat upstream hints (`Retry-After`, quota reset windows) as input to your schedule, capped by a locally owned max wait/retry budget — never as an unlimited command.
- Keep per-attempt timeouts explicit and locally owned. When the caller/runtime budget is known, inner waits must fail before the outer deadline so you learn the real cause instead of hitting the platform timeout.
- Pass `AbortSignal` through the retry loop and the sleep itself; stop retrying immediately on abort.
- Make the operation idempotent, or use an idempotency key, before retrying mutating calls — retrying without it risks duplicate side effects, not resilience.
- Log each attempt with `errorId`, attempt number, and next delay; propagate the last error — never swallow the final failure.
- Reuse a library (`p-retry`, `cockatiel`, `async-retry`) when the project has one. Extract and name shared policies (`paymentRetry`) across call sites; add a circuit breaker under sustained load; treat queue redelivery as durable retry, designed at the queue level, not in-process retry.

Avoid:
- Retrying caller-fixable errors (`ValidationError`, `BusinessError`) — same failure, three times slower.
- Constant-delay retry without jitter — multi-client retry storms; unbounded retry — outage amplifier.
- Obeying `Retry-After` blindly beyond the local wait budget, or relying on the outer HTTP/Lambda/platform timeout instead of an owned inner timeout.
- Sleeping with `setTimeout` while ignoring the `AbortSignal` — the timer keeps the process alive after cancel; retrying `AbortError` — the caller asked to stop.
- Retrying non-idempotent writes without an idempotency key or equivalent dedup guarantee.
- Catching and silently swallowing the final failure after retries.

Exceptions:
- Idempotent reads can be retried more aggressively than writes.
- Streaming/long-poll connections need their own reconnect logic, not a generic retry wrapper.
- Tests may inject a near-zero-delay policy (`{ maxAttempts: 1, baseDelayMs: 0 }`) through the same parameter used in production.

Example — hand-rolled retry with backoff, capped `Retry-After`, and abortable sleep (prefer a library when one is available):

```ts
import { InfraError } from "core/errors";

type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  maxServerDelayMs: number; // cap on Retry-After / remote hints
  signal?: AbortSignal;
};

async function withRetry<T>(fn: (attempt: number) => Promise<T>, policy: RetryPolicy): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    policy.signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      if (!(e instanceof InfraError) || !e.data.retry?.allowed) throw e; // not classified retryable
      if (attempt === policy.maxAttempts) throw e;
      const hint = e.data.retry?.afterMs;
      const cappedHint = hint == null ? undefined : Math.min(hint, policy.maxServerDelayMs); // cap remote hint
      const jittered = Math.random() * Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1)); // full jitter
      logger.warn("retry_scheduled", { errorId: e.data.telemetry?.errorId, attempt, delayMs: cappedHint ?? jittered });
      await abortableSleep(cappedHint ?? jittered, policy.signal);
    }
  }
  throw lastError;
}

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });
}

// Usage: inner timeout stays below the known caller/runtime budget (e.g. a 30s Lambda).
async function fetchWithRetry(url: string, signal?: AbortSignal) {
  return withRetry(async () => {
    const requestSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(2_000)]) : AbortSignal.timeout(2_000);
    const res = await fetch(url, { signal: requestSignal });
    if (res.status === 429) {
      const afterMs = (Number(res.headers.get("retry-after")) || 0) * 1000;
      throw new RateLimitedInfraError("rate limited", { retry: { allowed: true, afterMs } });
    }
    if (!res.ok) throw new UpstreamInfraError(`status ${res.status}`, { retry: { allowed: false } });
    return res.json();
  }, { maxAttempts: 4, baseDelayMs: 200, maxDelayMs: 4_000, maxServerDelayMs: 1_500, signal });
}
```

For a non-idempotent write, pass a stable idempotency key alongside the same `withRetry` policy (e.g. `stripe.charges.create(input, { idempotencyKey })`) so retried attempts deduplicate server-side.

Verify:
- Only errors classified retryable are retried, with an explicit mode (no retry / remediate / backoff); backoff is exponential with full jitter and a max-attempt cap.
- Remote hints (`Retry-After`) are capped by a locally owned wait budget; per-attempt timeouts stay below the known caller/runtime budget so inner causes surface before the outer deadline fires.
- `AbortSignal` is passed through and respected; aborted requests stop immediately and are not retried.
- Non-idempotent writes use an idempotency key/dedup guarantee; each attempt is logged (errorId, attempt, delay); the final failure is never silently swallowed.
