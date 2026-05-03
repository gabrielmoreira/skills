---
title: Keep Crypto Choices Explicit
decision: Use this when encryption, signing, or hashing settings are entering config
tags: typescript, security, crypto
---

## ✅ Prefer

Make crypto-relevant choices explicit in config and in naming.

### Use this when

- the app chooses between encryption modes
- key sources can vary
- one mode is weaker or intended only for local development

### Example

```ts
const encryptionConfigSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('kms'), keyArn: z.string().min(1) }).strict(),
  z.object({ mode: z.literal('local-dev') }).strict(),
]);
```

### Why this helps

- the security posture is visible in config
- weak and strong modes are not blended together
- the risk-bearing choice is explicit

## ⚠️ Avoid

Do not hide crypto choices behind vague booleans or defaults.

### This is a poor fit when

- `secure: true` is doing many things at once
- local and production crypto modes are easy to confuse
- a weak mode can be enabled by accident

### Example

```ts
const secure = process.env.SECURE_MODE !== 'false';
```

### Why to avoid it

- the actual security decision is hard to see
- booleans hide too much meaning
- weak runtime modes can leak further than intended
