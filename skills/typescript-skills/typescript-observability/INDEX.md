# TypeScript Observability Topic Index

Use this topic when code needs to explain what happened in production without leaking data or coupling owned code to a telemetry vendor.

Official docs note: OpenTelemetry traces model request paths as spans with attributes, events, context propagation, and exporters; JavaScript apps initialize SDK/exporters at the app edge, while libraries use the API. AWS X-Ray supports OpenTelemetry/ADOT and X-Ray backends. Keep those vendor choices behind adapters.

## Rule Routing

| If you see... | Read |
| --- | --- |
| vague log, noisy log, missing branch decision, log without actionability | `skill://typescript-skills/typescript-observability/rules/meaningful-logging.md` |
| OpenTelemetry, X-Ray, tracer/span/exporter, trace context, instrumentation setup | `skill://typescript-skills/typescript-observability/rules/tracing-boundary.md` |
| logs include secrets, tokens, payloads, headers, config, or PII | `skill://typescript-skills/typescript-security/rules/redaction.md` |
| logger/tracer construction, exporter selection, lifecycle | `skill://typescript-skills/typescript-composition/INDEX.md` |

## Owns

- Meaningful structured logging.
- Branch/outcome observability.
- Tracing and span/event design.
- OpenTelemetry/X-Ray boundary placement.
- Logger/tracer capability shape used by owned code.

## Does Not Own

- Redaction/security classification: read `skill://typescript-skills/typescript-security/INDEX.md`.
- Runtime construction/lifecycle of exporters/providers: read `skill://typescript-skills/typescript-composition/INDEX.md`.
- Provider response shape mapping: read `skill://typescript-skills/typescript-boundaries/INDEX.md`.

## Default

Add observability from the start, but keep it proportional: meaningful structured logs and trace boundaries first; vendor SDKs, exporters, sampling, and X-Ray/OpenTelemetry specifics stay at the edge behind an adapter.
