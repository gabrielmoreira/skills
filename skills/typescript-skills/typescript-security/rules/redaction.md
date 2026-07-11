---
id: typescript-security.redaction
owner: typescript-security
canonical: true
severity: hard-gate
references: [OWASP Logging (A09)]
---

# Redaction

Decision: Redact sensitive values before logging, formatting, rethrowing, serializing, or attaching error context.

This rule owns data safety in logs/errors. For deciding what is meaningful to log or trace, use `../typescript-observability/SKILL.md`.

First line of defense is keeping secret values out of the typed config object in the first place — the config should hold a *pointer* (ARN, secret name, env var name) and secrets should be resolved later, on demand. Redaction is the second line of defense for when the secret unavoidably enters memory. See `rules/secrets-lifecycle.md`.

Use when:
- Code logs config, headers, auth objects, env, request bodies, provider responses, credentials, tokens, keys, or connection strings.
- Errors include raw input or config context, especially when sensitive objects are nested or reused across error paths.
- Debug output is added near authentication, crypto, webhooks, or secret loading.
- A pointer may reveal sensitive account, tenant, environment, or resource data.
- Observability spans/logs need meaningful context that may include sensitive fields unless classified first.

Do:
- Log only allowlisted safe fields at the callsite instead of logging whole objects; prefer allowlisting over blocklisting sensitive names.
- Redact by key and by value category, and redact before constructing the final error/log message.
- Preserve enough non-sensitive context for debugging.
- Scale from an allowlist at one callsite, to a shared redaction helper for repeated nested shapes, to a central logging policy once many modules emit structured sensitive context.
- Test redaction for representative secrets and nested objects.
- Keep redaction policy reusable by observability adapters.

Avoid:
- `JSON.stringify(config)` or logging whole request/provider objects.
- Rethrowing errors with raw secret-bearing context.
- Partial slicing that reveals token prefixes/suffixes without policy.
- Assuming development logs are safe.

Exceptions:
- Explicitly non-sensitive identifiers may be logged when needed for traceability.
- Short-lived local debugging may log extra context only outside committed code and must not be left behind.

Example:

Bad: broad object logging.

```ts
logger.error("secret loading failed", { config });
```

Good: allowlist and redact before logging.

```ts
logger.error("secret loading failed", {
  source: config.secretSource.type,
  region: config.region,
  secret: "[REDACTED]",
});
```

Verify:
- Search for broad stringification/logging near sensitive objects.
- Confirm tests fail if a representative token/key/password appears in output, in error paths as well as success paths.
- Check whether the secret should have been excluded from the in-memory config object in the first place; redaction is the second line of defense, not the first. If the typed config carries the secret value (not a pointer), fix that before adding redaction.
- Check meaningful logging/tracing still has enough safe context after redaction.
