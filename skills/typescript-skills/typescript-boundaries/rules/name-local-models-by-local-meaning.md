---
title: Name Local Models by Local Meaning
decision: Use this when provider terms are clearer to the machine than to the reader
tags: typescript, boundaries, naming
---

## ✅ Prefer

Name local models for what they mean inside the app.

### Use this when

- the provider name is too specific or too alien
- the app uses the same concept across different providers
- the local meaning is what readers really need to understand

### Example

```ts
type SecretSource = {
  kind: 'secrets-manager';
  arn: string;
};

type DatabaseCredentialsSource = SecretSource;
```

### Why this helps

- the local concept stays visible
- provider details still exist, but in the right place
- later provider changes do less damage

## ⚠️ Avoid

Do not name everything after the current provider by default.

### This is a poor fit when

- provider words dominate internal types
- a reader must know one vendor well to read local code
- the app concept is broader than the current provider name

### Example

```ts
type DbSecretArnConfig = {
  dbSecretArn: string;
};
```

### Why to avoid it

- the local meaning is weaker than it should be
- the code couples its language to one provider
- the next provider change becomes a naming migration too
