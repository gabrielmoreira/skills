---
id: typescript-observability.meaningful-logging
owner: typescript-observability
canonical: true
severity: default
references: [Structured Logging, Twelve-Factor XI (Logs)]
---

# Meaningful Logging

Decision: **A log explains a meaningful decision, outcome, or failure, with enough safe data to act on.** It does not dump objects or narrate every line.

Use when:
- **A log says only `started`, `failed`, `done`, `error`, or `debug`** with no actionable context.
- **A branch that matters in production leaves no breadcrumb.**
- **Logs carry raw payloads, config, headers, secrets, or high-cardinality data.**
- **A failure log lacks the operation name, a safe identifier, the reason, or the next diagnostic step.**
- **Many logs are emitted and none show which path the code took**, or one request crosses modules and needs correlation.

Do:
- **Log at meaningful boundaries.**
  - Operation outcomes.
  - Branch decisions that matter operationally.
  - Retries, fallbacks, and migration paths.
  - External calls.
  - Failures.
- **Scale up only as the need appears.**
  - One structured log for an important outcome or branch.
  - A logger capability passed into the module.
  - Correlation and trace IDs added by the logging adapter.
  - Span events for point-in-time decisions.
  - Sampling, rate limits, and central policy on high-volume paths.
- **Put values in structured fields, never in an interpolated string.**
  - Stable operation and branch names.
  - Outcomes and reason codes.
  - Safe IDs, counts, and durations.
- **Pass the `Error` instance itself**, so `stack`, `cause`, and `message` reach the log pipeline.
- **Keep fields low-cardinality**, unless a high-cardinality identifier is explicitly safe and needed.
- **Coordinate with `typescript-security/rules/redaction.md` before logging sensitive context.**
- **Write to stdout and stderr and let the runtime route them.** Shipping, rotation, and transport are not the application's job.

Avoid:
- **`logger.info("here")`, an error with no context, or `console.log(payload)`.**
- **Logging a whole request body, provider response, config object, header set, or ORM entity.**
- **Logging the happy path while the failure branches stay silent.**
- **Logging every step of a loop or hot path** with no sampling and no specific diagnostic need.
- **Hiding the branch reason inside an unstructured message.**

Exceptions:
- **A very small script may use console output**, still without secrets, still saying enough on failure.
- **Temporary local debugging logs are never committed.**
- **A metric or a trace may replace a log** it answers better.

Example:

Bad: not actionable, and leaks too much.

```ts
logger.error("send failed", { order, requestBody, config });
```

Good: actionable, branch-aware, bounded, and keeps the real error instance.

```ts
logger.warn("receipt_delivery_skipped", { reason: "missing_email", orderId: order.id, tenantId: order.tenantId });

logger.error("receipt_delivery_failed", { orderId: order.id, tenantId: order.tenantId, provider: "ses", err: error });
```

Verify:
- **For each log, ask what action or diagnosis it enables.**
- **Check important branches carry a branch name or a reason code.**
- **Check fields are bounded, safe, and deliberately chosen.**
- **Check a failure names its operation** without dumping a payload.
- **Check logs correlate with trace or request IDs** where an adapter provides them.
