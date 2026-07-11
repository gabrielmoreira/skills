---
id: typescript-observability.meaningful-logging
owner: typescript-observability
canonical: true
severity: default
references: [Structured Logging, Twelve-Factor XI (Logs)]
---

# Meaningful Logging

Decision: Logs should explain meaningful decisions, outcomes, and failure context with enough safe data to act. They should not dump objects or narrate every line.

Use when:
- A log says only `started`, `failed`, `done`, `error`, or `debug` without actionable context.
- A branch choice matters in production but leaves no observable breadcrumb, or needs timeline/parent-child context across a request.
- Logs contain raw payloads, config, headers, provider responses, secrets, or excessive/high-cardinality data.
- A failure log lacks operation name, safe identifiers, reason, or next diagnostic step, and teams need to diagnose production incidents without reproducing locally.
- Many logs are emitted but none make it clear which path the code took, or one request crosses modules/services and needs correlation.

Do:
- Use structured logs at meaningful boundaries: operation outcomes, branch decisions (explaining which path executed when that matters operationally), retries, fallback/migration paths, external calls, and failures.
- Scale from one structured log for an important outcome/branch, to a logger capability passed into the module, to automatic correlation/trace IDs from the logging adapter, to span events for point-in-time decisions, to sampling/rate limits and centralized policy for high-volume paths.
- Log stable operation names, branch names, outcomes, safe IDs, counts, durations, and reason codes using structured fields, not interpolated strings.
- Pass the `Error` instance to the logger when it supports structured error serialization; keep stack, `cause`, `name`, and `message` available to the log pipeline.
- Keep fields low-cardinality unless high-cardinality identifiers are explicitly safe and needed.
- Coordinate with `typescript-security/rules/redaction.md` before logging sensitive context.
- Write structured logs to stdout/stderr and let the runtime/infra route them (Twelve-Factor XI); do not embed log shipping, file rotation, or transport in the application.

Avoid:
- `logger.info("here")`, uncontextualized errors, or `console.log(payload)`.
- Logging whole request bodies, provider responses, config objects, headers, or ORM entities.
- Logging only happy-path success while failure branches are silent.
- Logging every step in a loop or hot path without sampling or a specific diagnostic need.
- Hiding the branch reason behind an unstructured message.

Exceptions:
- Very small scripts may use minimal console output, but should still avoid secrets and include enough context for failure.
- Temporary local debugging logs must not be committed.
- Metrics/traces may replace some logs when they answer the operational question better.

Example:

Bad: not actionable and leaks too much.

```ts
logger.error("send failed", { order, requestBody, config });
```

Good: actionable, branch-aware, bounded, and keeps the real error instance for serializer-controlled stack/cause handling.

```ts
logger.warn("receipt_delivery_skipped", { reason: "missing_email", orderId: order.id, tenantId: order.tenantId });

logger.error("receipt_delivery_failed", { orderId: order.id, tenantId: order.tenantId, provider: "ses", err: error });
```

Verify:
- For each log, ask: what action or diagnosis does this enable?
- Check important branches have observable branch names or reason codes.
- Check fields are bounded, safe, and intentionally selected, and failures include enough context to find the operation without raw payload dumps.
- Check logs correlate with trace/request IDs through the logging adapter when available.
