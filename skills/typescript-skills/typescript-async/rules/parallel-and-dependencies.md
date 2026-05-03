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
- Multiple `await` lines run back-to-back with no value flow between them — likely sequential where parallel would do.
- An API route or handler awaits auth, then config, then data — each waits for the previous unnecessarily.
- A loop calls `await` per item over a large input — likely needs `Promise.all` or, if downstream rate-limits, bounded concurrency.
- Code uses `Promise.all` over hundreds/thousands of items and downstream is rate-limited.
- A function fetches data eagerly that some branches do not use.

Start here:
- Look at each `await`. If the operation does not consume any prior result, the `await` is hiding parallelism.
- If three or more independent operations exist, group them in `Promise.all`.
- If the input set is bounded and small (few dozen), `Promise.all` is fine.
- If the input set is unbounded, paginated, or downstream rate-limits, use bounded concurrency.

Escalate when:
- Operations have partial dependencies (e.g., profile depends on user, but config does not) — start unrelated promises early, await late.
- A handler does auth → config → data sequentially but auth and config are independent — start both before the first `await`.
- Bounded concurrency is needed: use `p-limit` (semaphore), `p-map({ concurrency })`, or hand-rolled batches.
- Data flows from one component/scope to several callers — share the promise, do not refetch.
- Critical resources demand a Suspense boundary (React) so wrapper UI streams ahead of data.

Complexity ladder:
1. Sequential `await` — only when each step needs the previous.
2. `Promise.all([...])` — independent ops, bounded count.
3. Start-promise-then-await-late — partial dependencies; one promise can begin before another resolves.
4. Bounded concurrency (`p-limit`, `p-map`, or batch-of-N loop) — unbounded inputs or rate-limited downstream.
5. Shared promise across consumers (`use(promise)` in React, hoisted promise variable) — same data needed in multiple places.
6. Defer-await: only `await` inside the branch that uses the value — skip work the path does not need.

Do:
- Read each `await` and ask: does the line that follows need this result? If no, parallelize.
- For independent ops, `const [a, b, c] = await Promise.all([fa(), fb(), fc()])`.
- For partial dependencies, start independent promises immediately, await them when needed:
  `const sessionP = auth(); const configP = fetchConfig(); const session = await sessionP; const data = await fetchData(session.user.id);`
- For unbounded input, set concurrency explicitly (`p-limit(5)` or batch-of-N).
- For downstream that rate-limits, honor `Retry-After` and respect concurrency the API documents.
- Defer `await` into the branch that uses it; early returns should not pay the cost.
- Pass `AbortSignal` through parallel work so cancelling the parent cancels children — see `cancellation-and-abort.md`.

Avoid:
- Sequential `await` chains that do not pass values between steps — pure waterfall, no benefit.
- `Promise.all` over unbounded input (the canonical "500 IDs" case) — single burst, downstream collapses or rate-limits.
- Awaiting before every conditional even when most branches do not need the value.
- Hand-rolling reusable batching when `p-limit`/`p-map` already exists in the project.
- Sharing `Promise.all` results across components by re-fetching — share the same promise instead.
- Forgetting `Promise.allSettled` when partial failure must not abort the rest.

Exceptions:
- A single small operation does not need the `Promise.all` ceremony.
- Retry/backoff loops are intentionally sequential per attempt.
- Operations with side-effects that must serialize (e.g., write-then-write) stay sequential.
- React Server Components may await directly because Suspense provides streaming — see `async-suspense-boundaries` pattern.
- Library code with no concurrency knob may expose its own AbortSignal but not impose `p-limit`.

Example:

Sequential when correct (b needs a):

```ts
const user = await fetchUser(id);
const profile = await fetchProfile(user.id);
```

Parallel when independent (Vercel `async-parallel`):

```ts
const [user, posts, comments] = await Promise.all([
  fetchUser(id),
  fetchPosts(id),
  fetchComments(id),
]);
```

Partial dependencies — start promises immediately, await late (Vercel `async-api-routes`):

```ts
export async function GET(req: Request) {
  const sessionPromise = auth();
  const configPromise = fetchConfig();
  const session = await sessionPromise;
  const [config, data] = await Promise.all([
    configPromise,
    fetchData(session.user.id),
  ]);
  return Response.json({ data, config });
}
```

Defer await into the branch that uses it (Vercel `async-defer-await`):

```ts
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId);
  if (!resource) return { error: "not_found" };

  // permissions only fetched when there's a resource to update
  const permissions = await fetchPermissions(userId);
  if (!permissions.canEdit) return { error: "forbidden" };

  return updateResourceData(resource, permissions);
}
```

Bounded concurrency — unbounded input:

```ts
import pLimit from "p-limit";

async function fetchAllProfiles(ids: string[], deps: { fetchProfile: (id: string) => Promise<Profile> }) {
  const limit = pLimit(5);
  return Promise.all(ids.map((id) => limit(() => deps.fetchProfile(id))));
}
```

Hand-rolled batches when no library is available:

```ts
async function fetchInBatches<T, R>(items: T[], batchSize: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const slice = items.slice(i, i + batchSize);
    const results = await Promise.all(slice.map(fn));
    out.push(...results);
  }
  return out;
}
```

Partial-failure tolerance with `allSettled`:

```ts
const results = await Promise.allSettled(jobs.map((j) => process(j)));
const failures = results
  .map((r, i) => ({ r, job: jobs[i] }))
  .filter(({ r }) => r.status === "rejected");
if (failures.length) logger.warn("partial_batch_failure", { count: failures.length });
```

Verify:
- Look at every back-to-back `await`: is each line consuming the previous result? If no, it should be parallel.
- For `Promise.all` over arrays: is the input set bounded and small? If no, add concurrency control.
- For handlers/routes: do independent fetches start before the first `await`?
- For deferred work: are unused branches paying for fetches the path does not need?
- For shared data needed in multiple components/places: is one promise reused, or is the same fetch repeated?
