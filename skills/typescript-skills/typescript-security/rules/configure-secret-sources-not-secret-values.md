---
title: Configure Secret Sources, Not Secret Values
decision: Use this when config points to a secret manager, parameter store, or similar source
tags: typescript, security, secrets
---

## ✅ Prefer

Keep secret sources in config and load the real secret value later.

### Use this when

- config points to a secret ARN, parameter name, or vault path
- the secret value should not live in normal app config objects
- the app may need to rotate or re-read the secret later

### Example

```ts
type DatabaseSecretSource = {
  kind: 'secrets-manager';
  secretArn: string;
};

export type DatabaseConfig = {
  credentialsSource: DatabaseSecretSource;
};
```

### Why this helps

- config describes where the secret comes from
- the secret value is not copied into every config consumer
- later rotation or reload stays possible

## ⚠️ Avoid

Do not spread secret values through ordinary config objects by default.

### This is a poor fit when

- the secret value is parsed with the rest of app config
- many modules can accidentally log or inspect it
- the source and the loaded value are being treated as the same thing

### Example

```ts
export type DatabaseConfig = {
  password: string;
};
```

### Why to avoid it

- the blast radius grows immediately
- redaction gets harder
- the config object now carries more sensitive state than it needs to
