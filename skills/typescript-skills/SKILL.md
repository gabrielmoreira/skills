---
name: typescript-skills
description: >-
  Use when TypeScript code design, implementation, review, debugging, or testing
  needs focused guidance on coding standards, boundaries, composition, configs,
  async control, error handling, observability, security, or testing. Routes to
  one of nine topic indexes, each owning a set of rules with a decision, the
  conditions that trigger it, and a check. Do not use for prose-only,
  formatting-only, or history requests that merely mention TypeScript.
---

# TypeScript Rules Router

**Core principle.** Open one topic, not nine. The cost of this skill is what it makes you read.

- **This is the only discoverable skill in the package.** Everything under it is reference material.
- **An internal `INDEX.md` is not a skill.** Never invoke a topic name. Read the exact path shown for it.
- **`skill://` is this package's reference notation**, not a protocol. Where a harness does not recognise it, translate it to the equivalent file path and read the target directly.

## Open one topic first

**Match the task against the left column, and open that index.**

- **Add a second topic only when the task crosses a real boundary.**
- **Do not load every topic by default.** That is the waste this router exists to prevent.

| If the task involves... | Read this topic index |
| --- | --- |
| naming, abstractions, classes, cutovers, local reasoning, forced types, branded types, exhaustive switch, generics | `skill://typescript-skills/typescript-coding-standards/INDEX.md` |
| provider, SDK, API, request, response, generated types, mapper, mapping, transform, translator, anti-corruption layer | `skill://typescript-skills/typescript-boundaries/INDEX.md` |
| dependency construction, factory, lifecycle, singletons, runtime selection | `skill://typescript-skills/typescript-composition/INDEX.md` |
| env, config parsing, defaults, typed config exposure, feature flags, config migration | `skill://typescript-skills/typescript-configs/INDEX.md` |
| logging, tracing, actionable diagnostics, branch observability | `skill://typescript-skills/typescript-observability/INDEX.md` |
| secrets, crypto choices, redaction, credentials, secret sources | `skill://typescript-skills/typescript-security/INDEX.md` |
| tests, characterization, boundary contracts, brittle assertions, config tests | `skill://typescript-skills/typescript-testing/INDEX.md` |
| throw versus return, result types, retryability, error contract, swallowed fallback | `skill://typescript-skills/typescript-error-handling/INDEX.md` |
| `Promise.all`, sequential awaits, bounded concurrency, `AbortSignal`, cleanup, retry and backoff, SIGTERM, graceful shutdown | `skill://typescript-skills/typescript-async/INDEX.md` |

## Tie-breakers

**Only a genuinely ambiguous case belongs here.** Everything else routes above.

| Situation | Primary | Secondary |
| --- | --- | --- |
| a provider response shape enters business logic | `skill://typescript-skills/typescript-boundaries/INDEX.md` | coding standards, for naming |
| provider selection happens at startup | `skill://typescript-skills/typescript-composition/INDEX.md` | boundaries, if provider shapes cross inward |
| a secret source pointer appears in config | `skill://typescript-skills/typescript-security/INDEX.md` | configs, for parsing and exposure |
| a development value is used as a code default | `skill://typescript-skills/typescript-security/INDEX.md` | configs, only for non-secret behaviour defaults |
| a cast is applied to parsed or unknown data | `skill://typescript-skills/typescript-coding-standards/INDEX.md` | configs for parser shape, boundaries for transport data |
| a broad config object enters feature modules | `skill://typescript-skills/typescript-configs/INDEX.md` | composition, if framework assembly is involved |
| a stage comparison selects a resource | `skill://typescript-skills/typescript-configs/rules/feature-decisions.md` | `skill://typescript-skills/typescript-configs/rules/validation-vs-verification.md` |
| log or trace attributes may carry secrets | `skill://typescript-skills/typescript-security/INDEX.md` | observability, for the diagnostic shape |
| a refactor precedes a behaviour change | `skill://typescript-skills/typescript-testing/INDEX.md` | the relevant design topic |
| a retry loop retries caller errors too | `skill://typescript-skills/typescript-error-handling/rules/error-classification.md` | `skill://typescript-skills/typescript-async/rules/retry-and-backoff.md` for the mechanism |
| a handler returns an SDK error shape to a client | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` | boundaries, for inbound mapping |
| a catch returns a fallback with no signal | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` | observability, for the signal shape |

## Router contract

- **The selected topic index owns routing inside its domain.**
- **The canonical rule files own the design decisions.**
- **For authoring conventions, read `skill://typescript-skills/references/authoring-checklist.md`.**
- **What is still open lives in `docs/typescript-skills/` at the repository root.**
