---
title: Redact Secrets in Errors and Logs
decision: Use this when config or startup failures might expose sensitive values
tags: typescript, security, redaction, logging
---

## ✅ Prefer

Redact sensitive values before logging or rethrowing errors.

### Use this when

- startup logs might include secret sources or values
- failures happen during config parsing or secret loading
- config objects include sensitive fields or pointers

### Example

```ts
function redactSecret(value: string) {
  return value.length <= 8 ? '***' : `${value.slice(0, 4)}***`;
}

throw new Error(`Failed to load secret ${redactSecret(config.dbSecretArn)}`);
```

### Why this helps

- operators still get useful context
- logs do not become a second place secrets leak
- debugging stays possible without exposing the full value

## ⚠️ Avoid

Do not log sensitive values in full just because startup failed.

### This is a poor fit when

- a stack trace or log line prints the raw secret value
- the config object is stringified blindly
- redaction is left for "later"

### Example

```ts
logger.error({ config }, 'Failed to load startup config');
```

### Why to avoid it

- the log now holds more sensitive data than it should
- a temporary debugging shortcut becomes a permanent leak risk
- later cleanup is easy to forget
