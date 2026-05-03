---
id: typescript-async.retry-and-backoff
owner: typescript-async
canonical: true
severity: default
references: [Exponential backoff with jitter (AWS Architecture Blog), Retry storms (Google SRE), p-retry / cockatiel / async-retry, AbortSignal interplay]
---

# Retry and Backoff

Decision: Retry only what is **classified retryable** (see `../typescript-error-handling/rules/error-classification.md`). Use exponential backoff with full jitter, honor `Retry-After` when the server provides it, and cap attempts. The retry mechanism is an async concern; the *decision* of what is retryable belongs to error classification. Use a library when one is already in the project; do not hand-roll a retry policy when `p-retry`/`cockatiel`/`async-retry` already does it correctly.

Use when:
- Code wraps every call in `for (let i = 0; i < N; i++) { try { ... } catch { sleep(...) } }`.
- A retry loop retries everything (including 4xx caller errors).
- Sleep is constant (`sleep(1000)`) instead of exponential — the retry storm risk is high.
- Two retries hit at the same time across replicas because there is no jitter.
- A server returns `Retry-After` and the client ignores it.
- Retry continues even after the request was cancelled (`AbortSignal` ignored).

Start here:
- Decide **what to retry**: only `InfraError` with `retryable: true` (or the equivalent Result variant). Validation, conflict, and other business errors are not retryable.
- Decide **how often**: exponential backoff with full jitter. Cap attempts (typically 3-5).
- Decide **when to stop**: budget exhausted, signal aborted, or a non-retryable error surfaces.
- Prefer a library (`p-retry`, `cockatiel`, `async-retry`) over hand-rolled.

Escalate when:
- Multiple call sites need the same policy — extract once (`withRetry(policy, fn)`).
- The policy varies by service (some downstreams need longer backoff) — name the policies (`paymentRetry`, `cacheRetry`).
- A circuit breaker is needed — pair with `cockatiel` or similar; bare retry is not enough at scale.
- Retries cross worker boundaries (queue redelivery) — that is durable retry, not in-process retry; design at the queue level.

Complexity ladder:
1. No retry — sometimes the right answer; surface failure to the caller.
2. Single retry without backoff — acceptable for one-shot patterns (token refresh, optimistic concurrency retry); not for general I/O resilience.
3. Bounded retries with exponential backoff + full jitter, max attempts, AbortSignal-aware.
4. Retry only on classified retryable errors; honor `Retry-After` when present.
5. Library-based policy (`p-retry`, `cockatiel`) reused across the codebase.
6. Retry + circuit breaker — production resilience pattern, only when measured pressure justifies it.

Do:
- Retry **only** errors marked retryable by classification.
- Use exponential backoff with **full jitter**: `sleep = random(0, base * 2^attempt)`. Without jitter, multiple clients retry at the same instant.
- Cap attempts (3-5 is typical). Without a cap, retries amplify outages.
- Honor `Retry-After` (HTTP `429` / `503`) when the server provides it; only fall back to backoff if it does not.
- Pass `AbortSignal` through the retry loop. Aborted requests stop retrying immediately.
- Make the operation **idempotent** before retrying; use idempotency keys for non-idempotent operations.
- Log each retry attempt with `errorId`, attempt number, next delay — incidents need this trail.
- Reuse a library (`p-retry`, `cockatiel`, `async-retry`) when the project has one.

Avoid:
- Retrying caller errors (`BusinessError`, `ValidationError`) — same failure 3× slower.
- Constant-delay retry without jitter — multi-client retry storms.
- Unbounded retry — outage amplifier.
- Retrying non-idempotent operations without an idempotency key — duplicate side effects.
- Catching and silently swallowing the final failure after retries — propagate the last error.
- Retrying `AbortError` — the caller asked to stop.
- Sleeping with `setTimeout` while ignoring the AbortSignal — the timer keeps the process alive after cancel.

Exceptions:
- Idempotent reads can be retried more aggressively than writes.
- Streaming/long-poll connections have their own reconnect logic — do not wrap in generic retry.
- Tests may use zero/very short delays — expose the retry policy as an injectable parameter (factory or call argument) so tests can swap it for `{ maxAttempts: 1, baseDelayMs: 0 }`.

Example:

Hand-rolled retry with the right primitives (only when no library is available):

```ts
import { InfraError } from "core/errors";

type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  signal?: AbortSignal;
};

async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  policy: RetryPolicy,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    policy.signal?.throwIfAborted();
    try {
      return await fn(attempt);
    } catch (e) {
      lastError = e;
      // 1. caller-fault errors do not retry
      if (!(e instanceof InfraError) || !e.retryable) throw e;
      // 2. last attempt? give up
      if (attempt === policy.maxAttempts) throw e;
      // 3. honor Retry-After when the error knows it (declared on RateLimitedInfraError).
      const serverHint =
        "retryAfterMs" in e && typeof (e as { retryAfterMs?: unknown }).retryAfterMs === "number"
          ? (e as { retryAfterMs: number }).retryAfterMs
          : undefined;
      const expDelay   = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** (attempt - 1));
      const jittered   = Math.random() * expDelay;     // full jitter
      const delay      = serverHint ?? jittered;
      logger.warn("retry_scheduled", {
        errorId: e.errorId, code: e.code, name: e.constructor.name, attempt, delayMs: delay,
      });
      await abortableSleep(delay, policy.signal);
    }
  }
  throw lastError;
}

function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => { clearTimeout(t); reject(signal.reason); },
      { once: true },
    );
  });
}
```

With `p-retry` (preferred when library is available):

```ts
import pRetry, { AbortError } from "p-retry";
import { InfraError } from "core/errors";

await pRetry(
  async () => {
    try {
      return await charge(input);
    } catch (e) {
      // p-retry only retries thrown errors that are NOT AbortError
      if (e instanceof InfraError && e.retryable) throw e;
      throw new AbortError(e instanceof Error ? e : new Error(String(e)));
    }
  },
  { retries: 3, factor: 2, minTimeout: 200, maxTimeout: 2_000, randomize: true /* full jitter */ },
);
```

Honoring `Retry-After`:

```ts
async function fetchWithRetry(url: string, signal?: AbortSignal) {
  return withRetry(async () => {
    const res = await fetch(url, { signal });
    if (res.status === 429 || res.status === 503) {
      const retryAfterSec = Number(res.headers.get("retry-after")) || 0;
      // RateLimitedInfraError / UpstreamInfraError declared in core/errors with their own retryable flag — see error-classification.md.
      throw new RateLimitedInfraError("rate limited", { retryAfterMs: retryAfterSec * 1000 });
    }
    if (!res.ok) throw new UpstreamInfraError(`status ${res.status}`, { retryable: false });
    return res.json();
  }, { maxAttempts: 4, baseDelayMs: 200, maxDelayMs: 4_000, signal });
}
```

Cancellation-aware retry:

```ts
const controller = new AbortController();
setTimeout(() => controller.abort(), 5_000);  // default reason — DOMException("AbortError"). Pass a custom reason if the caller needs to distinguish causes; then detect via `signal.reason` instead of `.name`.

try {
  await withRetry(() => charge(input), {
    maxAttempts: 5,
    baseDelayMs: 200,
    maxDelayMs: 5_000,
    signal: controller.signal,
  });
} catch (e) {
  if (controller.signal.aborted) {
    /* user cancelled — not a real failure */
  } else {
    throw e;
  }
}
```

Idempotency for non-idempotent operations:

```ts
import { ulid } from "ulid";

const idempotencyKey = ulid();
await withRetry(() => stripe.charges.create(
  { /* ... */ },
  { idempotencyKey } // Stripe deduplicates retries by this key
), policy);
```

Verify:
- The retry layer asks classification (`InfraError && retryable`); it does not retry every error.
- Backoff is exponential **with full jitter**, not constant.
- A maximum number of attempts is set; no unbounded loops.
- `Retry-After` is honored when the server provides it.
- `AbortSignal` is passed through and respected; retries stop on abort.
- Non-idempotent operations either are not retried or use an idempotency key.
- Each retry attempt is logged with the `errorId`, attempt number, and next delay.
- The operation does not silently swallow the final error after retries — the last failure surfaces.
