---
id: typescript-async.parallel-and-dependencies
owner: typescript-async
canonical: true
severity: default
references: [Vercel React Best Practices (async-parallel, async-defer-await, async-dependencies), Promise.all (MDN), p-limit / p-map (Sindresorhus)]
---

# Parallel and Dependencies

Decision: **A sequential `await` is correct only where one operation needs the previous one's result.** Independent work runs together, partial dependencies start as early as possible, and unbounded input gets bounded concurrency.

Use when:
- **Several `await` lines run back to back with no value flowing between them.**
- **A handler awaits auth, then config, then data**, where some of those are independent.
- **A loop awaits per item** over a large or unbounded input.
- **Code fetches eagerly in branches that never use the result.**
- **A batch uses `Promise.all`** where partial failure must not abort the rest.

Do:
- **Read each `await` and ask whether the next line consumes it.** If not, the wait is hiding parallelism.
- **Group independent operations with `Promise.all`.**
- **For partial dependencies, start every independent promise immediately** and await each only where its value is needed.
- **Use bounded concurrency for unbounded, paginated, or rate-limited input.** A concurrency limiter, or a batch-of-N loop.
- **Defer the await into the branch that uses the value**, so an early return pays nothing.
- **Use `Promise.allSettled` where partial failure must not sink the batch.**
- **Share one promise between consumers that need the same data.**
- **Pass the abort signal through**, so cancelling the parent cancels the children.
- **Honour any concurrency or rate limit the downstream documents.**

Avoid:
- **A waterfall of awaits that pass no values.**
- **`Promise.all` over unbounded input.** One burst that collapses or throttles the downstream.
- **Awaiting before a conditional** that most branches never reach.
- **Hand-rolling a concurrency limiter** where the project already has one.
- **Re-fetching the same data per consumer.**

Exceptions:
- **A single small operation needs no `Promise.all` ceremony.**
- **Side effects that must serialize stay sequential.** A write followed by a dependent write.
- **A retry loop is sequential per attempt on purpose.**
- **A server component MAY await directly**, because streaming provides the overlap.

Example (one instance, not the set):

```ts
// Sequential, because there is a real dependency:
const user = await fetchUser(id);
const profile = await fetchProfile(user.id);

// Independent, so run together:
const [posts, comments] = await Promise.all([fetchPosts(id), fetchComments(id)]);

// Partial dependency: start both now, await each where it is needed.
const sessionP = auth();
const configP = fetchConfig();
const session = await sessionP;
const [config, data] = await Promise.all([configP, fetchData(session.user.id)]);

// Unbounded input: bound the concurrency instead of one burst.
const limit = pLimit(5);
await Promise.all(ids.map((id) => limit(() => fetchProfile(id))));

// Partial failure must not sink the batch:
const results = await Promise.allSettled(jobs.map(process));
```

Verify:
- **Check each back-to-back await consumes the previous result.**
- **Check `Promise.all` is used only over bounded input.**
- **Check independent fetches start before the first await.**
- **Check shared data reuses one promise** rather than repeating the fetch.
