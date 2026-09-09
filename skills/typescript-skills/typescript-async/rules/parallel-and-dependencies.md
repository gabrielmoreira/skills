---
id: typescript-async.parallel-and-dependencies
owner: typescript-async
canonical: true
severity: default
references: [Vercel React Best Practices (async-parallel, async-defer-await, async-dependencies), Promise.all (MDN), p-limit / p-map (Sindresorhus)]
---

# Parallel and Dependencies

Decision: **Run work concurrently only where data dependencies, required effects, permissions, resource limits, and failure semantics permit it.** Sequential awaits can be correct without a returned value flowing between them. Observe all started branches before waiting on one.

Use when:
- **Several `await` lines run back to back with no value flowing between them.**
- **A handler awaits auth, then config, then data**, where some of those are independent.
- **A loop awaits per item** over a large or unbounded input.
- **Code fetches eagerly in branches that never use the result.**
- **A batch uses `Promise.all`** where partial failure must not abort the rest.

Do:
- **Read each wait and identify its dependency or constraint.** No value flow is a reason to investigate overlap, not proof that ordering is unnecessary.
- **Group independent operations with `Promise.all` when fail-fast aggregation fits the contract.** It observes each input but does not cancel unfinished siblings.
- **For partial dependencies, build the dependency chains and attach all branches to their result owner before the first await.** A sibling may reject while another branch remains pending or fails.
- **Bound active work and admission separately.** A limiter over a finite moderate array bounds active calls; streaming or unbounded input also needs bounded queues, pagination, or backpressure.
- **Defer starting optional work until its branch is selected.** Moving only its await does not undo already-started work or its cost.
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

// Partial dependency: data needs auth, but not config.
// Deferred calls also turn a synchronous API throw into an observed rejection.
const dataP = Promise.resolve().then(() => auth())
  .then(session => fetchData(session.user.id));
const configP = Promise.resolve().then(() => fetchConfig());
const [data, config] = await Promise.all([dataP, configP]);

// Finite moderate input: bound active calls, not the number of queued tasks.
const limit = pLimit(5);
await Promise.all(ids.map((id) => limit(() => fetchProfile(id))));

// Partial failure must not sink the batch:
const results = await Promise.allSettled(jobs.map(process));
```

Verify:
- **Check each sequential wait has a data, effect, permission, resource, or failure-semantics reason.**
- **Check `Promise.all` is used only over bounded input.**
- **Check permitted independent work overlaps and every started branch is observed**, including early rejection and early return paths.
- **Check shared data reuses one promise** rather than repeating the fetch.
