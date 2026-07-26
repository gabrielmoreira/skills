---
id: typescript-async.retry-and-backoff
owner: typescript-async
canonical: true
severity: default
references: [Exponential backoff with jitter (AWS Architecture Blog), Retry storms (Google SRE), p-retry / cockatiel / async-retry, AbortSignal interplay]
---

# Retry and Backoff

Decision: Retry only explicitly retryable, safe operations within a finite caller-owned budget. Prefer a proven project dependency; otherwise use capped exponential backoff with jitter and cancellation.

Use when:
- Transient network, throttling, or availability failures are expected.
- Existing retries lack caps, jitter, cancellation, or timeout budgeting.
- Replicas retry in lockstep or ignore `Retry-After`.
- A write may be repeated after an ambiguous outcome.

Do:
- Separate retry classification from retry mechanics.
- Cap attempts and elapsed time below the outer request or runtime deadline.
- Use exponential backoff with full jitter; treat `Retry-After` as input bounded by local policy.
- Propagate `AbortSignal` through attempts and waits.
- Require idempotency, an idempotency key, or deduplication for repeatable writes.
- Record attempts and final failure without logging secrets.

Avoid:
- Retrying every exception or caller error.
- Constant sleeps, unlimited retries, nested retry layers, or waits beyond the caller budget.
- Retrying non-idempotent work without a duplicate-prevention contract.
- Swallowing the final failure.

Example:

```ts
const delay = Math.random() * Math.min(capMs, baseMs * 2 ** attempt);
await sleep(delay, { signal });
```

Verify:
- Classification, attempt cap, elapsed budget, timeout, jitter, and cancellation are explicit.
- Only one layer owns retries for an operation.
- Repeated writes are safe.
- The final failure preserves cause and classification.
