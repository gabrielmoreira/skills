---
name: typescript-security
description: Use when TypeScript work involves secrets, credentials, crypto choices, redaction, secret source pointers, sensitive endpoints, or security-sensitive logging.
---

# TypeScript Security

Use this skill for security-sensitive TypeScript decisions around secrets, crypto modes, and logging.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| secret value, secret source pointer, credential default, URL/IP/token fallback, test secret fallback | `rules/secrets-lifecycle.md` |
| `secure: boolean`, ambiguous crypto/security mode, implicit algorithm | `rules/crypto-choices.md` |
| logging/rethrowing config, token, credential, headers, secret objects | `rules/redaction.md` |

## Owns

- Secret values, secret source pointers, and sensitive/environment-specific coordinates.
- Credential, endpoint, URL/IP, token, and test-secret fallbacks.
- Explicit crypto/security choices.
- Redaction in logs/errors.

## Does Not Own

- Non-secret config parsing: use `../typescript-configs/SKILL.md`.
- Provider type containment: use `../typescript-boundaries/SKILL.md`.
- Tests for redaction behavior: use `../typescript-testing/SKILL.md`.

## Default

Keep secret values and environment-specific coordinates out of code defaults, broad config, logs, and errors. Make risk-bearing choices explicit.
