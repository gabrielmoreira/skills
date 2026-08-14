---
id: typescript-observability.tracing-boundary
owner: typescript-observability
canonical: true
severity: default
references: [OpenTelemetry Specification, Distributed Tracing (Dapper)]
---

# Tracing Boundary

Decision: **Trace request paths and meaningful sub-operations from the start, and keep every vendor SDK, exporter, and provider API behind an observability adapter or the framework edge.**

Use when:
- **A request crosses a boundary and needs correlation.**
  - Handlers and modules.
  - Queues and workers.
  - Providers and services.
- **Code adds tracing machinery**: a tracer provider, an exporter, spans, or context propagation.
- **The app must switch exporter or backend.**
- **Behaviour needs branch visibility over time.**
- **Retries, fallbacks, or provider choices need parent and child correlation.**
- **Owned code imports a vendor SDK directly**, or a library must emit telemetry without owning setup.

Do:
- **Start with one observability capability**: a logger, plus a tracer once there is something to correlate.
- **Initialise the SDK and exporters exactly once**, in the composition root or the framework bootstrap.
- **Scale up only as the need appears.**
  - A local adapter around the tracing API.
  - Span events for branch decisions.
  - An exporter adapter, with sampling policy owned by bootstrap.
- **Name spans as stable operations, never dynamic values.**
- **Put stable metadata in attributes** and timestamped branch decisions in span events.
- **Propagate context across async boundaries, queues, workers, and outbound calls.**
- **Prefer the vendor-neutral API inside adapters**, keeping exporter specifics at the edge.
- **In a library, depend on a small local port or the neutral API.** Never initialise an SDK there.
- **Coordinate with redaction before adding any attribute or event.**

Avoid:
- **Vendor SDK, exporter, or provider setup inside business logic.**
- **Dynamic span names** holding an ID, an email, or a payload fragment.
- **High-cardinality or sensitive attributes by default.**
- **A span around every helper**, where one parent span plus events explains the path.
- **Treating tracing as a late add-on**, once the paths already have no names.

Exceptions:
- **Framework auto-instrumentation may create spans at the edges.** Enrich them where it cannot know a domain branch.
- **A tiny script may use structured logs only**, unless it calls out or needs distributed context.
- **Vendor setup may live in a bootstrap adapter** named as vendor integration.

Example:

Bad: the vendor API leaks into behaviour.

```ts
import AWSXRay from "aws-xray-sdk";

export async function sendReceipt(order: Order) {
  const segment = AWSXRay.getSegment()?.addNewSubsegment("sendReceipt");
  await sendEmail(order.email);
  segment?.close();
}
```

Good: owned code depends on a small capability; vendor setup stays in bootstrap.

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
- **Search for SDK or exporter imports outside adapters and bootstrap.**
- **Confirm the SDK lifecycle belongs to the composition root**, not a behaviour module.
- **Check important request paths carry a stable span name or a structured log.**
- **Check branch decisions appear as span events, or as logs with reason codes.**
- **Check attributes are safe, bounded, and low-cardinality** unless justified.
