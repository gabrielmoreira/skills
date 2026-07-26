# TypeScript Security Topic Index

Use for security-sensitive TypeScript decisions around secrets, cryptography, and logging.

| If you see... | Read |
| --- | --- |
| secret, credential, sensitive endpoint, or fallback | `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md` |
| ambiguous crypto mode or implicit algorithm | `skill://typescript-skills/typescript-security/rules/crypto-choices.md` |
| sensitive values in logs or errors | `skill://typescript-skills/typescript-security/rules/redaction.md` |

Default: keep secrets and environment-specific coordinates out of code defaults, broad config, logs, and errors. Make risk-bearing choices explicit.
