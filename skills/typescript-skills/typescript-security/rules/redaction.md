---
id: typescript-security.redaction
owner: typescript-security
canonical: true
severity: hard-gate
references: [OWASP Logging (A09)]
---

# Redaction

Decision: **Redact a sensitive value before it is logged, formatted, rethrown, serialized, or attached as error context.**

- **This rule owns data safety in logs and errors.** What is worth logging at all belongs to `skill://typescript-skills/typescript-observability/INDEX.md`.
- **Redaction is the second line of defence, not the first.** Keeping the value out of the typed config belongs to `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md`, where config holds a pointer and the secret is resolved later.

Use when:
- **Code logs something that may carry a secret.**
  - Config, env, or headers.
  - Auth objects, credentials, tokens, or keys.
  - Request bodies, provider responses, or connection strings.
- **An error carries raw input or config context**, especially where the same object is reused across error paths.
- **Debug output is added near authentication, crypto, webhooks, or secret loading.**
- **A pointer may itself reveal account, tenant, environment, or resource detail.**
- **A span or log needs context that may include sensitive fields** unless they are classified first.

Do:
- **Log an allowlist of safe fields at the callsite**, rather than the whole object.
- **Prefer allowlisting over blocklisting names.** A blocklist misses the field added next week.
- **Redact by key and by value category**, before the final message is built.
- **Keep enough non-sensitive context to debug with.**
- **Scale up only as the need appears.**
  - An allowlist at one callsite.
  - A shared helper once a nested shape repeats.
  - A central policy once many modules emit structured sensitive context.
- **Test redaction against representative secrets and nested objects.**
- **Keep the policy reusable by observability adapters.**

Avoid:
- **`JSON.stringify(config)`, or logging a whole request or provider object.**
- **Rethrowing an error that still carries secret-bearing context.**
- **Slicing a token to show a prefix or suffix** with no policy behind it.
- **Assuming development logs are safe.**

Exceptions:
- **An identifier classified as non-sensitive MAY be logged** where traceability needs it.
- **Short-lived local debugging MAY log more**, outside committed code, and never left behind.

Example (one instance, not the set):

Bad: the whole object goes out.

```ts
logger.error("secret loading failed", { config });
```

Good: allowlist, then redact.

```ts
logger.error("secret loading failed", {
  source: config.secretSource.type,
  region: config.region,
  secret: "[REDACTED]",
});
```

Verify:
- **Search for broad stringification near sensitive objects.**
- **Confirm a test fails if a representative token appears in output**, on error paths as well as success paths.
- **Check whether the secret should have been in memory at all.** Where the typed config carries the value rather than a pointer, fix that before adding redaction.
- **Check logging still has enough safe context** once redaction has run.
