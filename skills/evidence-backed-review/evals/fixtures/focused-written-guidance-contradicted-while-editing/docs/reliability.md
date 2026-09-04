# Reliability

## Retries

Order fetches are retried **at most twice**, immediately, with no delay between
attempts. The upstream service is in the same datacentre and a failure that
survives two immediate attempts is treated as real rather than transient.

Backoff was considered and rejected: it pushes tail latency past the 2 second
budget the checkout page is held to.
