---
title: Parse Shapes First; Check External Resources Later
decision: Use this when config values have a clear format now but the real resource must be checked later
tags: typescript, config, validation, aws, files
---

## ✅ Prefer

Treat these as two separate jobs:
1. parse the config shape
2. check the real external resource later

### Use this when

- config contains AWS identifiers
- config points to files, databases, directories, or certificates
- a value can look valid but still fail later at runtime

### Example

```ts
import fs from 'node:fs/promises';
import { z } from 'zod';

function requiredEnv(envName: string) {
  return z.preprocess(
    (value) => (value === undefined ? '' : value),
    z.string().min(1, `${envName} is required.`),
  );
}

const appConfigSchema = z.object({
  queueUrl: requiredEnv('NOTIFICATIONS_QUEUE_URL'),
  secretArn: requiredEnv('DB_SECRET_ARN'),
  tlsCertPath: requiredEnv('TLS_CERT_PATH'),
}).strict();

export const config = appConfigSchema.parse({
  queueUrl: process.env.NOTIFICATIONS_QUEUE_URL,
  secretArn: process.env.DB_SECRET_ARN,
  tlsCertPath: process.env.TLS_CERT_PATH,
});

export async function verifyDependencies() {
  await assertSecretExists(config.secretArn);
  await fs.access(config.tlsCertPath);
}
```

### Why this helps

- parsing stays simple and predictable
- bad input is separated from later runtime failures
- startup order is easier to understand

## ⚠️ Avoid

Do not mix config parsing and remote I/O in one step.

### This is a poor fit when

- the config factory is fetching secrets
- the config factory is pinging a database
- tests become hard because config parsing has side effects

### Example

```ts
export async function getAppConfig(env: Record<string, unknown>) {
  const secret = await secretsManager.getSecretValue({ SecretId: env.DB_SECRET_ARN });
  await databaseClient.connect(String(env.DATABASE_URL ?? ''));

  return appConfigSchema.parse({
    secretArn: env.DB_SECRET_ARN,
    secretValue: secret.SecretString,
  });
}
```

### Why to avoid it

- config parsing is no longer a simple config step
- network or IAM failures now sit inside config assembly
- the config layer is now resolving resources, not just describing them

## Quick note

Load `.env` first if the app uses it. After that, treat env as plain input: parse config, then verify dependencies, then start the app.
