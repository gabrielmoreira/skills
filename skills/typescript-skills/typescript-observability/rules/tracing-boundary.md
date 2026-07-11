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
- A request crosses handlers, modules, queues, workers, providers, or services and needs trace correlation.
- Code adds OpenTelemetry, X-Ray, ADOT, tracer providers, exporters, spans, or context propagation, or the app must switch exporters/backends (console, OTLP collector, X-Ray/ADOT).
- Behavior needs branch/path visibility over time — not just one log line — via timestamped span events.
- External calls, retries, fallbacks, or provider choices need parent/child span correlation.
- Owned code imports vendor tracing SDKs directly, or a library/package needs to emit telemetry without owning SDK initialization.

Do:
- Start with one observability capability (`logger` + optional `tracer`) passed where useful, with SDK/exporters initialized once at app startup, framework entrypoint, worker bootstrap, or composition root; scale up through a local adapter around OpenTelemetry, span events for branch decisions, and an exporter/backend adapter (OTLP/Collector/X-Ray/ADOT) with sampling/semantic-convention policy owned by bootstrap as needs grow.
- Name spans as stable operations, not dynamic values; use attributes for stable metadata and span events for meaningful timestamped branch decisions.
- Propagate context across async boundaries, queues, workers, and outbound calls.
- Prefer OpenTelemetry concepts/API inside adapters, keeping X-Ray/exporter specifics at the edge; in libraries, depend on a small local observability port or the OpenTelemetry API only and do not initialize SDK/exporters.
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
  await sendEmail(order.email);
  segment?.close();
}
```

Good: owned code depends on a small observability capability; vendor setup stays in a bootstrap adapter.

```ts
type Observability = { logger: Logger; tracer: Tracer /* span(name, fn), event(name, attrs) */ };

export function makeSendReceipt({ mailer, obs }: { mailer: Mailer; obs: Observability }) {
  return (order: Order) =>
    obs.tracer.span("receipt.send", async () => {
      if (!order.email) {
        obs.tracer.event("receipt.skipped", { reason: "missing_email" });
        return;
      }
      await mailer.send(order.email);
      obs.tracer.event("receipt.sent", { provider: "ses" });
    });
}
```

Verify:
- Search for OpenTelemetry/X-Ray/exporter imports outside observability adapters or bootstrap files, and confirm SDK/exporter lifecycle is owned by the composition root/framework bootstrap, not behavior modules.
- Check important request paths have stable span names or structured logs.
- Check branch decisions are span events or logs with reason codes.
- Check attributes are safe, bounded, and low-cardinality unless explicitly justified.
