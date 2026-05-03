---
name: typescript-configs
description: Use when TypeScript work involves env values, config parsing, contextual config objects, config defaults, validation boundaries, or migration from legacy config reads.
---

# TypeScript Configs

Use this skill when unknown runtime values become typed application configuration.

## Application Shape Model

Config shape depends on app scale and framework pressure:

| Application nature | Start with |
| --- | --- |
| Simple script, single file, usually one maintainer | One small manual parser and one local config object is fine |
| Medium app, multiple files/features, one person to small team | Contextual feature/module configs such as `EmailConfig`, `BillingConfig`, `StorageConfig` |
| Large app, many modules/features, one or more teams | Root parsing plus module config factories; pass only contextual configs inward |
| Framework-shaped app, such as Next.js, React Native/Expo, NestJS | Respect the framework's config/composition entrypoints, then project contextual configs at module/feature boundaries |

Default for non-trivial apps: avoid a god `AppConfig` flowing everywhere. Parse raw values at the boundary, then project the smallest contextual config each module needs. Framework conventions decide where parsing/assembly starts; they do not require feature modules to consume unrelated config.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| `process.env`, raw config strings, `!`, `as`, untyped config | `rules/parse-and-expose-config.md` |
| broad `AppConfig` passed into feature modules or tests | `rules/contextual-config.md` |
| schema does network/file/cloud checks | `rules/validation-vs-verification.md` |
| default value, fallback, dev default, global config owner question, production-safe behavior tuning | `rules/defaults-and-ownership.md` |
| URL, host, IP, endpoint, token, credential, secret-bearing fallback | `../typescript-security/rules/secrets-lifecycle.md` |
| feature flag, mode, stage-derived behavior decision, repeated raw flag check | `rules/feature-decisions.md` |
| legacy env reads or risky config refactor | `rules/migration.md` |

## Owns

- Parsing unknown config into typed contextual objects.
- Deciding simple/local/module/root config shape by application scale.
- Requiredness, production-safe defaults, and config ownership.
- Separation of shape validation from external dependency verification.
- Feature flags and modes parsed into named behavior decisions.
- Migration from scattered env reads.

## Does Not Own

- Secret value fetching and redaction: use `../typescript-security/SKILL.md`.
- Dependency construction from config: use `../typescript-composition/SKILL.md`.
- Config contract tests: use `../typescript-testing/SKILL.md`.

## Default

Parse unknown values once at the boundary. Pass contextual typed config inward. If a missing value would not be production-correct, require it. Keep app-wide config only for app-wide facts, and keep dependency verification separate from parsing.
