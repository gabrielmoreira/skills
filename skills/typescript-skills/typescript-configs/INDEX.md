# TypeScript Configs Topic Index

Use when unknown runtime values become typed application configuration.

| Application shape | Start with |
| --- | --- |
| Small script | One local parser and config object |
| Multi-feature app | Contextual module configs |
| Large app | Root parsing plus module projections |
| Framework-led app | Framework entrypoint plus contextual projections |

| If you see... | Read |
| --- | --- |
| `process.env`, raw strings, untyped config | `skill://typescript-skills/typescript-configs/rules/parse-and-expose-config.md` |
| broad `AppConfig` passed everywhere | `skill://typescript-skills/typescript-configs/rules/contextual-config.md` |
| schema doing network, file, or cloud checks | `skill://typescript-skills/typescript-configs/rules/validation-vs-verification.md` |
| default, fallback, requiredness, ownership | `skill://typescript-skills/typescript-configs/rules/defaults-and-ownership.md` |
| secret-bearing fallback | `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md` |
| feature flag, mode, repeated raw flag check | `skill://typescript-skills/typescript-configs/rules/feature-decisions.md` |
| scattered env reads or risky migration | `skill://typescript-skills/typescript-configs/rules/migration.md` |

Default: parse unknown values once, then pass the smallest typed config each consumer needs. Respect framework conventions and keep external verification separate from shape parsing.
