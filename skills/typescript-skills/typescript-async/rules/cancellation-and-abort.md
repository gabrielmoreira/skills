---
id: typescript-async.cancellation-and-abort
owner: typescript-async
canonical: true
severity: default
references: [AbortSignal / AbortController (WHATWG / MDN), TanStack Query query-cancellation, React useEffect cleanup, Node fetch AbortSignal]
---

# Cancellation and Abort

Decision: **An operation that may be cancelled accepts an `AbortSignal` and passes it to everything it calls.** Code that never cancels is fine. Code that should cancel and cannot is a leak waiting to happen.

Use when:
- **A `fetch` has no `signal:`** and the caller may walk away.
- **An effect's fetch may resolve after unmount** and still set state.
- **Long or streaming work has no way to be told the answer is no longer wanted.**
- **Tests hang** because nothing aborts in-flight work between cases.

Do:
- **Accept `signal?: AbortSignal` as part of the input** where the operation may be cancelled.
- **Propagate it to the lowest-level call.** Every `fetch`, timer, and downstream call that supports it.
- **Check at meaningful points in long or looped work**, with `signal.throwIfAborted()`, and bail out.
- **Use `AbortSignal.timeout(ms)` for a deadline**, and `AbortSignal.any([...])` to combine it with the caller's.
- **Create one controller per render in an effect**, and abort it in the cleanup.
- **Treat `AbortError` as expected**, never as a real failure.
- **Wrap a library that does not accept a signal** so it rejects when the signal fires, removing its listener on settle.
- **Wire the server request's disconnect event to a downstream controller**, so work stops when the client gives up.

Avoid:
- **`fetch(url)` where the caller can walk away.** The request continues and the response is thrown out.
- **A function that cannot be cancelled inside one that can.** Cancellation stops at that hop.
- **Swallowing `AbortError` silently.** The caller's own checks then see nothing.
- **Creating a controller deep in owned code** where no caller can reach it.
- **One global controller shared across requests.** A single cancel kills unrelated work.

Exceptions:
- **Genuinely fire-and-forget work MAY skip it.** An audit emit, a metric publish.
- **Synchronous CPU work cannot be cancelled mid-tick.** Chunk it, or move it to a worker.
- **Library code MAY accept a signal it does not use yet**, to keep the option open.

Example (one instance, not the set):

```ts
type FetchProfileInput = { id: string; signal?: AbortSignal };

async function fetchProfile({ id, signal }: FetchProfileInput): Promise<Profile> {
  signal?.throwIfAborted();
  const deadline = AbortSignal.timeout(5_000);
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
  const res = await fetch(`/api/profiles/${id}`, { signal: combined });
  if (!res.ok) throw new Error(`profile ${id} failed: ${res.status}`);
  return res.json();
}

useEffect(() => {
  const controller = new AbortController();
  fetchProfile({ id: userId, signal: controller.signal })
    .then(setProfile)
    .catch((e) => { if (e.name !== "AbortError") setError(e); });
  return () => controller.abort();
}, [userId]);
```

Verify:
- **Check anything slow or networked accepts a signal**, and that it reaches the lowest-level call.
- **Check effects abort on cleanup.**
- **Check `AbortError` is recognised**, and no controller is shared across unrelated requests.
- **Check a cancellation test proves the work stopped**, not just that the promise settled.
