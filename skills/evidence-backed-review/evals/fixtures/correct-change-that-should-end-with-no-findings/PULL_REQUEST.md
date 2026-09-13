# Drop our retry wrapper, the client retries the same statuses

`src/client.js` retries 429 and 5xx three times with backoff and leaves
`AbortError` alone. Our wrapper retried exactly those statuses on top of it, so
a retryable failure cost nine attempts instead of three.

After this change: three attempts, one retry policy, in the client.
`src/client.test.js` pins that policy (3 attempts on repeated 503, 1 on 400,
`AbortError` untouched), so the claim above is checkable in the tree.

Error mapping is unchanged: cancellation stays `AbortError`, anything else
still becomes `InvoiceFetchFailed` with the original error as `cause`.

- [x] unit tests updated
- [x] runbook updated
