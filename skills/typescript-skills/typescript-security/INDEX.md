# TypeScript Security Topic Index

Use this topic for security-sensitive TypeScript decisions around secrets, crypto modes, and logging.

## Rule Routing

| If you see... | Read |
| --- | --- |
| secret value, secret source pointer, credential default, URL/IP/token fallback, test secret fallback | `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md` |
| `secure: boolean`, ambiguous crypto/security mode, implicit algorithm | `skill://typescript-skills/typescript-security/rules/crypto-choices.md` |
| logging/rethrowing config, token, credential, headers, secret objects | `skill://typescript-skills/typescript-security/rules/redaction.md` |

## Owns

- Secret values, secret source pointers, and sensitive/environment-specific coordinates.
- Credential, endpoint, URL/IP, token, and test-secret fallbacks.
- Explicit crypto/security choices.
- Redaction in logs/errors.

## Does Not Own

- Non-secret config parsing: read `skill://typescript-skills/typescript-configs/INDEX.md`.
- Provider type containment: read `skill://typescript-skills/typescript-boundaries/INDEX.md`.
- Tests for redaction behavior: read `skill://typescript-skills/typescript-testing/INDEX.md`.

## Default

Keep secret values and environment-specific coordinates out of code defaults, broad config, logs, and errors. Make risk-bearing choices explicit.
