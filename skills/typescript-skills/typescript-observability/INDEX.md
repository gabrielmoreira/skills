# TypeScript Observability Topic Index

**Use this topic when code must explain production behaviour** without leaking data or tying owned logic to a telemetry vendor.

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **One rule per row.** Enter at the matched row.
- **Logging against tracing.** Logging answers what happened at one point. Tracing answers how one operation moved across boundaries.
- **Read redaction before either**, whenever the context might carry something sensitive.

| If you see... | Read |
| --- | --- |
| vague, noisy, or unactionable logging | `skill://typescript-skills/typescript-observability/rules/meaningful-logging.md` |
| tracer, span, exporter, propagation, distributed context | `skill://typescript-skills/typescript-observability/rules/tracing-boundary.md` |
| secrets, tokens, headers, payloads, or personal data in logs | `skill://typescript-skills/typescript-security/rules/redaction.md` |
| SDK construction, exporter selection, lifecycle | `skill://typescript-skills/typescript-composition/INDEX.md` |

**Default stance.**

- **Start with actionable structured logs.**
- **Add spans once an operation needs temporal or cross-boundary correlation.**
- **Keep vendor SDKs and exporters at the application edge.**

**Edges.**

- **What must never reach a log belongs to security.**
- **Where the SDK is constructed belongs to composition.**
- **Whether a failure is worth reporting at all belongs to error handling.**
