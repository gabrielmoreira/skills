# TypeScript Security Topic Index

**Use this topic for security-sensitive decisions about secrets, cryptography, and what reaches logs.**

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **Enter at the matched row, and read a second where the code matches two.** Say which of them owns the decision and why the other applies. What costs is reading every row, not reading two.
- **Read all three where a change touches secret loading**, since they run in sequence: keep the value out, name the algorithm, redact what is left.

| If you see... | Read |
| --- | --- |
| secret, credential, sensitive endpoint, or fallback | `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md` |
| ambiguous crypto mode or implicit algorithm | `skill://typescript-skills/typescript-security/rules/crypto-choices.md` |
| sensitive values in logs or errors | `skill://typescript-skills/typescript-security/rules/redaction.md` |

**Default stance.** Keep secrets and environment-specific coordinates out of code defaults, broad config, logs, and errors. Make every risk-bearing choice explicit.

**Edges.**

- **What is worth logging at all belongs to observability.**
- **Where config is parsed and shaped belongs to configs.**
- **Which errors are exposed to a caller belongs to error handling.**
