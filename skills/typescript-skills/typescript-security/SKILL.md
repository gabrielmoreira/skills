---
name: typescript-security
description: Provides rules for TypeScript secrets, redaction, crypto-adjacent choices, and safe runtime checks. Use when handling secret sources, avoiding risky defaults, deciding when to load secrets, or making security-sensitive configuration explicit.
---

# TypeScript Security

Use this skill when config crosses into security-sensitive territory.

This skill focuses on:
- secret sources vs secret values
- redaction
- safe defaults for sensitive settings
- loading and verifying secrets later than pure config parsing
- keeping crypto choices explicit

## Security-sensitive config quick map

| Problem | Open |
| --- | --- |
| Config points to a secret source | `rules/configure-secret-sources-not-secret-values.md` |
| A secret must be fetched from an external system | `rules/load-secrets-later-than-config.md` |
| Errors or logs may leak sensitive values | `rules/redact-secrets-in-errors-and-logs.md` |
| A default touches a secret or crypto-sensitive setting | `rules/avoid-test-secrets-as-defaults.md` |
| Encryption or crypto mode is too vague | `rules/keep-crypto-choices-explicit.md` |

## ✅ Pick a rule

- `rules/configure-secret-sources-not-secret-values.md`
- `rules/load-secrets-later-than-config.md`
- `rules/redact-secrets-in-errors-and-logs.md`
- `rules/avoid-test-secrets-as-defaults.md`
- `rules/keep-crypto-choices-explicit.md`

## Start here if...

### ...config points to secrets
1. `rules/configure-secret-sources-not-secret-values.md`
2. `rules/load-secrets-later-than-config.md`

### ...you are about to log or rethrow sensitive values
1. `rules/redact-secrets-in-errors-and-logs.md`
2. `rules/avoid-test-secrets-as-defaults.md`

### ...crypto or encryption settings are becoming implicit
1. `rules/keep-crypto-choices-explicit.md`
2. `rules/avoid-test-secrets-as-defaults.md`

## What good looks like

A healthy security-sensitive config setup has:
- secret sources in config, not secret values copied around
- redaction before logging
- no risky test defaults for sensitive settings
- secret loading separated from pure config parsing

## Snippets
- `snippets/secret-source-config.ts`
- `snippets/redact-secret-error.ts`
- `snippets/resolve-secret-after-parse.ts`

## References
- `references/secrets-lifecycle.md`
- `references/safe-defaults.md`
- `references/gotchas.md`
- `references/env-only-vs-source-pointer.md`
