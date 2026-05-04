---
id: typescript-observability.meaningful-logging
owner: typescript-observability
canonical: true
severity: default
references: [Structured Logging, Twelve-Factor XI (Logs)]
---

# Meaningful Logging

Decision: Logs should explain meaningful decisions, outcomes, and failure context with enough safe data to act; they should not dump objects or narrate every line.

Use when:
- A log says only `started`, `failed`, `done`, `error`, or `debug` without actionable context.
- A branch choice matters in production but leaves no observable breadcrumb.
- Logs contain raw payloads, config, headers, provider responses, secrets, or excessive data.
- A failure log lacks operation name, safe identifiers, reason, or next diagnostic step.
- Many logs are emitted but none make it clear which path the code took.

Start here:
- Use structured logs at meaningful boundaries: operation start/end only when useful, branch decisions, retries, fallback/migration paths, external calls, and failures.

Escalate when:
- One request crosses modules/services and logs need correlation.
- Branch decisions need timeline or parent/child context.
- Teams need to diagnose production incidents without reproducing locally.
- Log volume, cardinality, or data sensitivity becomes hard to control.

Complexity ladder:
1. One structured log for an important outcome or branch.
2. Logger capability passed into the module with safe context.
3. Correlation/trace IDs included automatically by the logging adapter.
4. Span events for meaningful point-in-time decisions inside a traced operation.
5. Sampling/rate limits and centralized logging policy for high-volume paths.

Do:
- Log stable operation names, branch names, outcomes, safe IDs, counts, durations, and reason codes.
- Prefer structured fields over interpolated strings.
- Include branch decisions that explain which path executed when that matters operationally.
- Pass the `Error` instance to the logger when the logger supports structured error serialization; keep stack, `cause`, `name`, and `message` available to the log pipeline.
- Keep fields low-cardinality unless high-cardinality identifiers are explicitly safe and needed.
- Coordinate with `typescript-security/rules/redaction.md` before logging sensitive context.
- Write structured logs to stdout/stderr and let the runtime/infra route them (Twelve-Factor XI). Do not embed log shipping, file rotation, or transport in the application; that belongs to the runtime/platform.

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
logger.warn("receipt_delivery_skipped", {
  reason: "missing_email",
  orderId: order.id,
  tenantId: order.tenantId,
});

logger.error("receipt_delivery_failed", {
  orderId: order.id,
  tenantId: order.tenantId,
  provider: "ses",
  err: error,
});
```

Good: branch choice is visible without dumping data.

```ts
logger.info("receipt_delivery_provider_selected", {
  provider: config.provider,
  reason: "tenant_config",
  tenantId,
});
```

Verify:
- For each log, ask: what action or diagnosis does this enable?
- Check important branches have observable branch names or reason codes.
- Check fields are bounded, safe, and intentionally selected.
- Check failures include enough context to find the operation without raw payload dumps.
- Check logs correlate with trace/request IDs through the logging adapter when available.
