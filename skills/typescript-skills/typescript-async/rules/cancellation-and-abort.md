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
- A `fetch` call has no `signal:` and the caller may walk away (component unmount, request abort, parent cancel).
- A `useEffect` fetch may resolve after unmount and still update state.
- A long-running query, async iterator, or streaming response has no way to be told "we don't need the answer anymore" or no early-exit path.
- Tests hang because nothing aborts in-flight work between cases.

Do:
- Accept `signal?: AbortSignal` as part of the function's input when the operation may be cancelled.
- Pass `signal` to every `fetch`, timer-as-promise, or downstream call that supports it — propagate it to the lowest-level call.
- Call `signal.throwIfAborted()` (or check `signal.aborted`) at meaningful checkpoints in long or looped work; bail out and return without finishing work the caller no longer needs.
- Use `AbortSignal.timeout(ms)` for time-bound operations, and `AbortSignal.any([...])` to combine a caller's signal with your own deadline.
- In React effects, create one `AbortController` per render and call `controller.abort()` in the cleanup function.
- Treat `AbortError` as expected; do not log it as a real failure.
- Wrap libraries that don't accept `signal` so they reject when it fires, cleaning up the listener on settle.
- On the server, wire the request's disconnect event to a downstream `AbortController` so backend work stops when the client gives up.

Avoid:
- `fetch(url)` where the caller can walk away — the request continues, the response is dropped, work is wasted.
- A function that cannot be cancelled but is composed into something that can — cancellation stops at that hop.
- Catching `AbortError` and swallowing it silently — the caller's `signal.aborted` checks won't see anything.
- Creating a new `AbortController` deep inside owned code where the caller cannot reach it.
- Reusing a global `AbortController` across requests — one cancel kills unrelated work.
- Mixing cancellation with rejection of a Promise that is also a Result channel — pick one signal channel.

Exceptions:
- Truly fire-and-forget work (audit log emit, metric publish) may not need cancellation.
- Synchronous CPU work can't be cancelled mid-tick; chunk it (`await new Promise((r) => setImmediate(r))`) or move it to a worker.
- Test code may use very short `AbortSignal.timeout(...)` values to fail fast; library code may accept `signal` even if unused yet, to keep the option open.

Example — accept, propagate, combine with a deadline, and treat `AbortError` as expected:

```ts
type FetchProfileInput = { id: string; signal?: AbortSignal };

async function fetchProfile({ id, signal }: FetchProfileInput): Promise<Profile> {
  signal?.throwIfAborted();                                             // bail out early if already cancelled
  const combined = signal ? AbortSignal.any([signal, AbortSignal.timeout(5_000)]) : AbortSignal.timeout(5_000);
  const res = await fetch(`/api/profiles/${id}`, { signal: combined }); // propagate to the lowest-level call
  if (!res.ok) throw new Error(`profile ${id} failed: ${res.status}`);
  return res.json();
}

// React: one AbortController per render, abort on cleanup; AbortError is expected, not a real failure.
useEffect(() => {
  const controller = new AbortController();
  fetchProfile({ id: userId, signal: controller.signal })
    .then(setProfile)
    .catch((e) => { if (e.name !== "AbortError") setError(e); });
  return () => controller.abort();
}, [userId]);
```

Wrap libraries that don't accept `signal` so they reject when it fires (listen for `abort`, reject with `signal.reason`, remove the listener on settle). On the server, wire the request's own disconnect event to a downstream `AbortController` (Express: `req.on('close', () => controller.abort())`) so backend work stops when the client gives up.

Verify:
- Functions that may take >100ms or call the network accept `signal?: AbortSignal`, and the signal reaches the lowest-level `fetch`/timer/wait.
- React effects with async work create an `AbortController` and abort it on cleanup.
- `AbortError` is recognized and not treated as a real failure; no global `AbortController` is shared across unrelated requests.
- Tests that exercise cancellation verify the work actually stopped (no hanging promises after abort).
