---
title: Load Secrets Later Than Config Parsing
decision: Use this when a secret must be fetched from an external system
tags: typescript, security, config, secrets
---

## ✅ Prefer

Parse the secret source first. Fetch the secret value later in startup or bootstrap.

### Use this when

- the secret lives in an external system
- fetching the secret needs I/O or permissions
- config parsing should stay pure and predictable

### Example

```ts
export const config = appConfigSchema.parse({
  dbSecretArn: process.env.DB_SECRET_ARN,
});

export async function loadSecurityDependencies() {
  return {
    dbSecret: await secretsManager.getSecretValue({ SecretId: config.dbSecretArn }),
  };
}
```

### Why this helps

- malformed config is separated from IAM or network failures
- startup order stays visible
- secret fetches are easier to reason about and retry

## ⚠️ Avoid

Do not fetch remote secrets inside the pure config parser.

### This is a poor fit when

- the parser is now async only because of one secret fetch
- config errors and permission errors are mixed together
- tests become hard because parsing has side effects

### Example

```ts
export async function getAppConfig(env: Record<string, unknown>) {
  const dbSecret = await secretsManager.getSecretValue({ SecretId: env.DB_SECRET_ARN });

  return appConfigSchema.parse({
    dbSecretArn: env.DB_SECRET_ARN,
    dbPassword: dbSecret.SecretString,
  });
}
```

### Why to avoid it

- the parser now resolves secrets and parses config in one step
- failures are harder to interpret
- the config layer is doing too much
