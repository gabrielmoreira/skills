---
id: typescript-boundaries.raw-input-to-internal-model
owner: typescript-boundaries
canonical: true
severity: hard-gate
references: [Anti-Corruption Layer (DDD), Parse don't validate]
---

# Raw Input to Internal Model

Decision: Parse and narrow raw input at the boundary before owned behavior depends on it. Owns HTTP request/response/transport shapes, env-like raw input, webhook payloads, CLI args, untyped JSON — for vendor/SDK/generated types, see `rules/provider-containment.md`.

Use when:
- Request body, query, headers, webhook payload, CLI args, env-like input, or untyped JSON is passed inward.
- Code trusts `unknown`, `any`, stringly typed fields, or external optional fields.
- Internal behavior checks raw transport details repeatedly.

Do:
- Treat raw input as untrusted until parsed.
- Produce a small internal model with requiredness, types, and failure shape made explicit.
- Keep transport-specific names and optionality at the edge unless they are local meaning.
- Return or throw errors that callers can distinguish from success.

Avoid:
- Passing `req.body`, raw JSON, or unparsed webhook payload into business logic.
- Using `as`, non-null assertions, or comments to claim validity.
- Normalizing different input shapes deep in owned behavior.
- Returning plausible defaults when parsing failed.

Exceptions:
- A pass-through proxy may preserve raw shape if it does not interpret it; name it as pass-through.
- Characterization tests may capture raw legacy behavior before migration.

Verify:
- Search for raw request/response/env objects outside boundary modules.
- Check parser tests cover valid input, invalid input, missing required fields, and failure shape.
- Check behavior code accepts an owned type, not raw transport.
