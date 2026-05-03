---
name: typescript-configs
description: Provides rules for parsing and exposing TypeScript app config. Use when deciding whether to parse env first or build config first, how to handle defaults, how to pass config through the app, how to verify external resources later, and how to avoid `!` or `as` in config code.
compatibility: Works best in TypeScript projects using plain objects or schema-based parsing such as Zod.
---

# TypeScript Configs

Use this skill when a TypeScript app needs clearer config boundaries.

This skill stays focused on config itself:
- where config comes from
- where it gets validated
- who owns defaults
- how config moves through the app
- what belongs in parsing vs later startup checks

## Problem → Rule

| Problem | Open |
| --- | --- |
| The app is still tiny | `rules/start-simple.md` |
| I do not know whether to validate env or final config | `rules/where-to-validate.md` |
| Defaults feel hidden or duplicated | `rules/defaults-single-owner.md` |
| Modules are reaching into `process.env` | `rules/exposure-validated-config.md` |
| I do not know who should own config | `rules/modularity-global-vs-local.md` |
| Config points to files, URLs, or AWS resources | `rules/parse-shapes-verify-later.md` |
| TypeScript pressure is pushing me toward `!` or `as` | `rules/type-safety-parse-dont-assert.md` |
| I am cleaning up legacy config code | `rules/migration-incremental.md` |

## ✅ Pick a rule

- `rules/start-simple.md`
  - Start here when the app is still small.

- `rules/where-to-validate.md`
  - Use this when deciding between env-first and config-first validation.

- `rules/defaults-single-owner.md`
  - Use this when defaults feel hidden, duplicated, or too test-oriented.

- `rules/exposure-validated-config.md`
  - Use this when modules are reading `process.env` or reaching into a giant config bag.

- `rules/modularity-global-vs-local.md`
  - Use this when you are unsure between one global config and module-local config factories.

- `rules/parse-shapes-verify-later.md`
  - Use this when config values point to files, URLs, AWS resources, or other external things.

- `rules/type-safety-parse-dont-assert.md`
  - Use this when config code is drifting toward `!`, `as`, or hand-written type guards.

- `rules/migration-incremental.md`
  - Use this when you are cleaning up an existing codebase instead of starting fresh.

## Start here if...

### ...the service is simple
1. `rules/start-simple.md`
2. `rules/where-to-validate.md`
3. `rules/type-safety-parse-dont-assert.md`

### ...a flag or mode changes what is required
1. `rules/where-to-validate.md`
2. `rules/defaults-single-owner.md`
3. `rules/exposure-validated-config.md`

### ...config points to external resources
1. `rules/parse-shapes-verify-later.md`
2. `rules/exposure-validated-config.md`
3. `rules/type-safety-parse-dont-assert.md`

### ...you are refactoring legacy config code
1. `rules/migration-incremental.md`
2. `rules/where-to-validate.md`
3. `rules/defaults-single-owner.md`

## What good looks like

A healthy config setup has:
- one clear place where parsing happens
- one owner for each default
- no deep `process.env` reads in feature code
- config types inferred from real validation
- external resource checks kept separate from pure config parsing

## Snippets

- `snippets/parse-env-directly.ts`
- `snippets/build-config-then-validate.ts`
- `snippets/required-env-helper.ts`
- `snippets/validated-config-slice.ts`
- `snippets/verify-dependencies-after-parse.ts`

## References

- `references/config-theory.md`
- `references/migration-playbook.md`
- `references/naming-config-fields.md`
- `references/gotchas.md`
