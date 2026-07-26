# TypeScript Observability Topic Index

Use when code must explain production behavior without leaking data or coupling owned logic to a telemetry vendor.

| If you see... | Read |
| --- | --- |
| vague, noisy, or unactionable logging | `skill://typescript-skills/typescript-observability/rules/meaningful-logging.md` |
| tracer, span, exporter, propagation, OpenTelemetry, X-Ray | `skill://typescript-skills/typescript-observability/rules/tracing-boundary.md` |
| secrets, tokens, headers, payloads, or PII in logs | `skill://typescript-skills/typescript-security/rules/redaction.md` |
| SDK construction, exporter selection, lifecycle | `skill://typescript-skills/typescript-composition/INDEX.md` |

Default: start with actionable structured logs. Add spans when operations need temporal or cross-boundary correlation. Keep vendor SDKs and exporters at the application edge.
