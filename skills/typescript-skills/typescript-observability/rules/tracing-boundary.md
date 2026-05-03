---
id: typescript-observability.tracing-boundary
owner: typescript-observability
canonical: true
severity: default
references: [OpenTelemetry Specification, Distributed Tracing (Dapper)]
---

# Tracing Boundary

Decision: Use tracing for request/operation paths and meaningful sub-operations from the start, but keep OpenTelemetry, X-Ray, exporters, and vendor APIs behind an observability adapter or framework edge.

Use when:
- A request crosses handlers, modules, queues, workers, providers, or services.
- Code adds OpenTelemetry, AWS X-Ray, ADOT, tracer providers, exporters, spans, or context propagation.
- Behavior needs branch/path visibility over time, not just a single log line.
- External calls, retries, fallbacks, or provider choices need correlation.
- Owned code imports vendor tracing SDKs directly.

Start here:
- For small apps, create one observability capability with `logger` and optional `tracer` and pass it where useful.
- Initialize SDK/exporters at app startup, framework entrypoint, worker bootstrap, or composition root.

Escalate when:
- Multiple modules need trace correlation.
- External calls need parent/child spans.
- Branch decisions need timestamped span events.
- The app must switch exporters/backends, such as console, OTLP collector, AWS X-Ray, or ADOT.
- Libraries/packages should emit telemetry without owning SDK initialization.

Complexity ladder:
1. Structured logs with request/correlation ID.
2. Observability capability passed inward: `{ logger, tracer }`.
3. OpenTelemetry API behind a local adapter; SDK/exporter initialized once at the edge.
4. Span events for meaningful branch decisions inside an operation.
5. Exporter/backend adapter for OTLP, OpenTelemetry Collector, AWS X-Ray/ADOT, or test exporters.
6. Sampling/resource/semantic-convention policy owned by app bootstrap.

Do:
- Name spans as stable operations, not dynamic values.
- Use attributes for stable metadata and span events for meaningful timestamped branch decisions.
- Propagate context across async boundaries, queues, workers, and outbound calls.
- Prefer OpenTelemetry concepts/API inside adapters; keep X-Ray/exporter specifics at the edge.
- In libraries, depend on a small local observability port or OpenTelemetry API only; do not initialize SDK/exporters.
- Coordinate with redaction before adding span attributes or events.

Avoid:
- Importing X-Ray SDK, exporter, or provider setup inside business logic.
- Dynamic span names containing IDs, emails, URLs with secrets, or payload fragments.
- High-cardinality or sensitive span attributes by default.
- Starting spans around every helper when a parent operation span plus events would explain the path.
- Treating tracing as a late add-on after branch/error paths have no names.

Exceptions:
- Framework auto-instrumentation may create spans at framework edges; enrich with local attributes/events where the framework cannot know domain branches.
- Tiny scripts may use structured logs only unless they call external services or need distributed trace context.
- Vendor-specific setup may live in an adapter/bootstrap file that is explicitly named as vendor integration.

Example:

Bad: vendor API leaks into behavior.

```ts
import AWSXRay from "aws-xray-sdk";

export async function sendReceipt(order: Order) {
  const segment = AWSXRay.getSegment()?.addNewSubsegment("sendReceipt");
  segment?.addAnnotation("orderId", order.id);
  await sendEmail(order.email);
  segment?.close();
}
```

Good: owned code depends on a small observability capability.

```ts
type Observability = {
  logger: Logger;
  tracer: {
    span<T>(name: string, fn: () => Promise<T>): Promise<T>;
    event(name: string, attributes?: Record<string, string | number | boolean>): void;
  };
};

export function makeSendReceipt({ mailer, obs }: { mailer: Mailer; obs: Observability }) {
  return (order: Order) =>
    obs.tracer.span("receipt.send", async () => {
      if (!order.email) {
        obs.tracer.event("receipt.skipped", { reason: "missing_email" });
        obs.logger.warn("receipt_delivery_skipped", { reason: "missing_email", orderId: order.id });
        return;
      }

      await mailer.send(order.email);
      obs.tracer.event("receipt.sent", { provider: "ses" });
    });
}
```

Good: vendor/OpenTelemetry setup stays at the edge.

```ts
export function makeObservability(config: ObservabilityConfig): Observability {
  const tracer = makeOpenTelemetryTracer({ exporter: config.exporter });
  const logger = makeStructuredLogger({ redact: redactTelemetryFields });
  return { tracer, logger };
}
```

Verify:
- Search for OpenTelemetry/X-Ray/exporter imports outside observability adapters or bootstrap files.
- Check important request paths have stable span names or structured logs.
- Check branch decisions are span events or logs with reason codes.
- Check attributes are safe, bounded, and low-cardinality unless explicitly justified.
- Check SDK/exporter lifecycle is owned by composition root/framework bootstrap, not behavior modules.
