---
title: Avoid Test Secrets as Defaults
decision: Use this when a default touches a secret, credential, encryption key, or external security setting
tags: typescript, security, defaults
---

## ✅ Prefer

Require sensitive values explicitly, or use safe production-oriented defaults only when the value is not a real secret.

### Use this when

- a config field points to credentials or encryption settings
- a test convenience default is tempting
- production would be harmed badly by a wrong implicit value

### Example

```ts
const securityConfigSchema = z.object({
  kmsKeyArn: z.string().min(1),
}).strict();
```

### Why this helps

- sensitive values fail fast instead of guessing
- production does not inherit test assumptions
- operators must make the risk-bearing choice explicitly

## ⚠️ Avoid

Do not ship fake or test secrets as hidden defaults.

### This is a poor fit when

- the default points to a real system or secret source
- the default only exists to make tests easier
- the failure mode in production would be expensive or dangerous

### Example

```ts
const kmsKeyArn = process.env.KMS_KEY_ARN || 'arn:aws:kms:us-east-1:123456789012:key/test';
```

### Why to avoid it

- a test default can leak into production
- the app may start with the wrong security posture
- failing fast is safer than guessing here
