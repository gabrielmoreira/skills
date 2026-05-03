---
name: typescript-observability
description: Use when TypeScript work involves logging, tracing, OpenTelemetry, AWS X-Ray, span design, trace context, actionable diagnostics, or observability boundaries.
---

# TypeScript Observability

Use this skill when code needs to explain what happened in production without leaking data or coupling owned code to a telemetry vendor.

Official docs note: OpenTelemetry traces model request paths as spans with attributes, events, context propagation, and exporters; JavaScript apps initialize SDK/exporters at the app edge, while libraries use the API. AWS X-Ray supports OpenTelemetry/ADOT and X-Ray backends. Keep those vendor choices behind adapters.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| vague log, noisy log, missing branch decision, log without actionability | `rules/meaningful-logging.md` |
| OpenTelemetry, X-Ray, tracer/span/exporter, trace context, instrumentation setup | `rules/tracing-boundary.md` |
| logs include secrets, tokens, payloads, headers, config, or PII | `../typescript-security/rules/redaction.md` |
| logger/tracer construction, exporter selection, lifecycle | `../typescript-composition/SKILL.md` |

## Owns

- Meaningful structured logging.
- Branch/outcome observability.
- Tracing and span/event design.
- OpenTelemetry/X-Ray boundary placement.
- Logger/tracer capability shape used by owned code.

## Does Not Own

- Redaction/security classification: use `../typescript-security/SKILL.md`.
- Runtime construction/lifecycle of exporters/providers: use `../typescript-composition/SKILL.md`.
- Provider response shape mapping: use `../typescript-boundaries/SKILL.md`.

## Default

Add observability from the start, but keep it proportional: meaningful structured logs and trace boundaries first; vendor SDKs, exporters, sampling, and X-Ray/OpenTelemetry specifics stay at the edge behind an adapter.
