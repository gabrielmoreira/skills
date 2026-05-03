---
id: typescript-async.cancellation-and-abort
owner: typescript-async
canonical: true
severity: default
references: [AbortSignal / AbortController (WHATWG / MDN), TanStack Query query-cancellation, React useEffect cleanup, Node fetch AbortSignal]
---

# Cancellation and Abort

Decision: Operations that may be cancelled accept an `AbortSignal` as a capability and propagate it to anything they call. The signal flows from the caller (request, component, parent task) down through fetches and waits. Code that never cancels is fine; code that should cancel but cannot is a bug waiting to leak handles, memory, or wasted work.

Use when:
- A `fetch` call is made without `signal:` and the caller may walk away (component unmount, request abort, parent cancel).
- A `useEffect` triggers a fetch but state updates may land after unmount.
- A long-running query has no way to be told "we don't need the answer anymore".
- An async iterator / streaming response has no early-exit path.
- Tests hang because nothing aborts the in-flight work between cases.

Start here:
- Accept `AbortSignal` as part of the function's input when the operation may be cancelled.
- Pass the signal to every `fetch`, `setTimeout`-via-Promise, or downstream call that supports it.
- Detect cancellation early and return; do not finish work the caller no longer needs.

Escalate when:
- Multiple concurrent operations should cancel together — share one signal across all of them.
- A timeout is needed — combine with `AbortSignal.timeout(ms)`.
- Cancellation must combine with caller's signal — use `AbortSignal.any([s1, s2])` to merge.
- A library does not accept `signal` natively — wrap the call so it rejects when the signal fires.
- A request crosses process boundaries — propagate cancellation as a server-side disconnect (not always automatic).

Complexity ladder:
1. Accept `AbortSignal` and pass to one `fetch`.
2. Throw `AbortError` (or `signal.throwIfAborted()`) at the start of an operation if already aborted.
3. Combine signals (`AbortSignal.any([userSignal, AbortSignal.timeout(5000)])`).
4. Propagate signal through composed operations — every layer accepts and forwards.
5. React effect with `AbortController` per render, abort on cleanup.
6. Server handler wires request abort to downstream signal so backend stops working.

Do:
- Make `signal?: AbortSignal` part of the function's options/input shape.
- Pass `signal` to `fetch`, `setTimeout` Promises, database drivers that support it.
- Call `signal.throwIfAborted()` (or check `signal.aborted`) at meaningful checkpoints in long work.
- Use `AbortSignal.timeout(ms)` for time-bound operations.
- Use `AbortSignal.any([...])` when the operation should die on either parent cancel or its own deadline.
- In React effects, create one `AbortController` per render and `controller.abort()` in the cleanup.
- Treat `AbortError` as expected; do not log it as a real failure.

Avoid:
- `fetch(url)` in a place where the caller can walk away — the request continues, response is dropped, work is wasted.
- A function that cannot be cancelled but is composed into something that can — the cancellation stops at this hop.
- Catching `AbortError` and swallowing it silently — the caller's checks for `signal.aborted` won't see anything.
- Creating a new `AbortController` deep inside owned code where the caller cannot cancel — the controller is never reachable.
- Using a global `AbortController` reused across requests — one cancel kills unrelated work.
- Mixing cancellation with rejection of a Promise that is also a Result — pick one signal channel.

Exceptions:
- Truly fire-and-forget work (audit log emit, metric publish) may not need cancellation.
- Synchronous CPU work cannot be cancelled mid-tick; chunk it with `await new Promise((r) => setImmediate(r))` or move to a worker if needed.
- Test code may use very short timeouts via `AbortSignal.timeout(...)` to fail fast.
- Library code may *accept* `signal` even if it does not currently use it, to keep the option open.

Example:

Owned function accepts `AbortSignal` and propagates:

```ts
type FetchProfileInput = { id: string; signal?: AbortSignal };

async function fetchProfile({ id, signal }: FetchProfileInput): Promise<Profile> {
  signal?.throwIfAborted();
  const res = await fetch(`/api/profiles/${id}`, { signal });
  if (!res.ok) throw new Error(`profile ${id} failed: ${res.status}`);
  return res.json();
}
```

React effect — abort on cleanup:

```ts
useEffect(() => {
  const controller = new AbortController();

  fetchProfile({ id: userId, signal: controller.signal })
    .then(setProfile)
    .catch((e) => {
      if (e.name !== "AbortError") setError(e);
    });

  return () => controller.abort();
}, [userId]);
```

Combine signals — caller cancel OR deadline:

```ts
async function fetchWithDeadline(url: string, ms: number, signal?: AbortSignal): Promise<Response> {
  const combined = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(ms)])
    : AbortSignal.timeout(ms);
  return fetch(url, { signal: combined });
}
```

Throw early when already aborted (long composed work):

```ts
async function processBatch(items: Item[], signal: AbortSignal) {
  for (const item of items) {
    signal.throwIfAborted();           // bail out cleanly between items
    await processOne(item, signal);    // and propagate to inner work
  }
}
```

Wrap a library that does not support `signal`:

```ts
function withAbort<T>(p: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    p.then(
      (v) => { signal.removeEventListener("abort", onAbort); resolve(v); },
      (e) => { signal.removeEventListener("abort", onAbort); reject(e); },
    );
  });
}
```

Server handler — abort downstream when client disconnects (Express example):

```ts
app.get("/long-task", async (req, res) => {
  const controller = new AbortController();
  req.on("close", () => controller.abort());
  try {
    const data = await fetchLongTask({ signal: controller.signal });
    res.json(data);
  } catch (e) {
    if ((e as Error).name === "AbortError") return; // client gave up; nothing to send
    next(e);
  }
});
```

Verify:
- Functions that may take >100ms or call network accept `signal?: AbortSignal`.
- The signal reaches the lowest-level `fetch`/timer/waiting call.
- React effects with async work create an `AbortController` and abort it on cleanup.
- `AbortError` is recognized and not treated as a real failure.
- No global `AbortController` is shared across unrelated requests.
- Tests that exercise cancellation actually verify the work stopped (no hanging promises after abort).
