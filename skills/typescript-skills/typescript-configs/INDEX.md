# TypeScript Configs Topic Index

**Use this topic when unknown runtime values become typed application configuration.**

**Start at the shape the application actually has.**

| Application shape | Start with |
| --- | --- |
| Small script | One local parser and config object |
| Multi-feature app | Contextual module configs |
| Large app | Root parsing plus module projections |
| Framework-led app | Framework entrypoint plus contextual projections |

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **One rule per row.** Enter at the matched row.
- **Parse against contextual.** Parse owns turning unknown into typed. Contextual owns who receives which slice.
- **Defaults against secrets.** A behaviour-tuning value may have a production-safe default. An environment-specific or security-bearing value is required, never defaulted.

| If you see... | Read |
| --- | --- |
| `process.env`, raw strings, untyped config | `skill://typescript-skills/typescript-configs/rules/parse-and-expose-config.md` |
| broad `AppConfig` passed everywhere | `skill://typescript-skills/typescript-configs/rules/contextual-config.md` |
| schema doing network, file, or cloud checks | `skill://typescript-skills/typescript-configs/rules/validation-vs-verification.md` |
| default, fallback, requiredness, ownership | `skill://typescript-skills/typescript-configs/rules/defaults-and-ownership.md` |
| secret-bearing fallback | `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md` |
| feature flag, mode, repeated raw flag check | `skill://typescript-skills/typescript-configs/rules/feature-decisions.md` |
| scattered env reads or risky migration | `skill://typescript-skills/typescript-configs/rules/migration.md` |

**Default stance.** Parse unknown values once, then pass the smallest typed config each consumer needs. Respect framework conventions, and keep external verification separate from shape parsing.

**Edges.**

- **Secret values and environment coordinates belong to security.**
- **How long a config-derived dependency lives belongs to composition.**
- **How tests supply config belongs to testing.**
- **What a parse failure looks like to a caller belongs to error handling.**
