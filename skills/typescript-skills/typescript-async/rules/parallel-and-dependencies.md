---
id: typescript-async.parallel-and-dependencies
owner: typescript-async
canonical: true
severity: default
references: [Vercel React Best Practices (async-parallel, async-defer-await, async-dependencies, async-api-routes), Promise.all (MDN), p-limit / p-map (Sindresorhus)]
---

# Parallel and Dependencies

Decision: Sequential `await` is correct only when one operation depends on the previous one's result. Independent operations use `Promise.all`. Operations with partial dependencies start each promise at the earliest possible moment. Unbounded input sets need bounded concurrency.

Use when:
- Multiple `await` lines run back-to-back with no value flowing between them — likely sequential where parallel would do.
- A handler awaits auth, then config, then data — each waits on the previous unnecessarily even though some are independent.
- A loop `await`s per item over a large or unbounded input — needs `Promise.all` (small/bounded) or bounded concurrency (large/rate-limited).
- Code fetches data eagerly in branches that don't end up using it.
- Partial failure in a batch must not abort the rest, but the code uses `Promise.all` (all-or-nothing).

Do:
- Read each `await`: if the next line doesn't consume its result, the wait is hiding parallelism — group independent ops with `Promise.all`.
- For partial dependencies, start every independent promise immediately and `await` each only where its value is needed — don't block earlier work on a later dependency.
- For unbounded, paginated, or rate-limited input, use bounded concurrency (`p-limit`, `p-map({ concurrency })`, or a batch-of-N loop) instead of one large `Promise.all` burst.
- Defer `await` into the branch that actually uses the value; early returns should not pay for work they don't need.
- Use `Promise.allSettled` when partial failure must not abort the rest of the batch.
- Share one promise across consumers that need the same data instead of re-fetching it per caller.
- Pass `AbortSignal` through parallel work so cancelling the parent cancels the children — see `cancellation-and-abort.md`.
- Honor any concurrency/rate limits the downstream API documents.

Avoid:
- Sequential `await` chains that pass no values between steps — pure waterfall, no benefit.
- `Promise.all` over unbounded input (the canonical "500 IDs" case) — a single burst that collapses or rate-limits downstream.
- Awaiting a value before every conditional even when most branches never use it.
- Hand-rolling batching/concurrency limiting when `p-limit`/`p-map` is already in the project.
- Re-fetching the same data per component/consumer instead of sharing one promise; defaulting to `Promise.all` when one failure should not sink the whole batch.

Exceptions:
- A single small operation doesn't need `Promise.all` ceremony; operations with side effects that must serialize (write-then-write) stay sequential; retry/backoff loops are intentionally sequential per attempt.
- React Server Components may `await` directly because Suspense provides streaming (`async-suspense-boundaries` pattern).
- Library code with no concurrency knob may expose its own `AbortSignal` without imposing `p-limit` itself.

Example:

```ts
// Sequential only when there's a dependency:
const user = await fetchUser(id);
const profile = await fetchProfile(user.id); // needs user.id

// Independent — run in parallel:
const [posts, comments] = await Promise.all([fetchPosts(id), fetchComments(id)]);

// Partial dependency — start both immediately, await only when needed:
const sessionP = auth();
const configP = fetchConfig();           // independent of session
const session = await sessionP;
const [config, data] = await Promise.all([configP, fetchData(session.user.id)]);

// Unbounded input — bounded concurrency, not a single Promise.all burst:
const limit = pLimit(5);
await Promise.all(ids.map((id) => limit(() => fetchProfile(id))));

// Partial-failure tolerance — allSettled instead of all-or-nothing:
const results = await Promise.allSettled(jobs.map(process));
```

Verify:
- Every back-to-back `await` is checked: does it consume the previous result? If not, it should be parallel or started earlier.
- `Promise.all` over arrays is only used when the input is bounded and small; unbounded/rate-limited input uses bounded concurrency.
- Independent fetches in handlers/routes start before the first `await`; deferred work doesn't pay for branches that don't use it.
- Shared data reuses one promise instead of repeating the fetch; `Promise.allSettled` is used where partial failure must not abort the batch.
