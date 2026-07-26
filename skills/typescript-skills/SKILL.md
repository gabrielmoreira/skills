---
name: typescript-skills
description: Use when TypeScript code design, implementation, review, debugging, or testing needs focused guidance on coding standards, boundaries, composition, configs, async control, error handling, observability, security, or testing. Do not use for prose-only, formatting-only, or history requests that merely mention TypeScript.
---

# TypeScript Rules Router

This is the only discoverable skill in this package. It routes work to internal topic indexes and canonical rule files.

Internal `INDEX.md` files are not skills. Never invoke a topic name as a skill. Read the exact URI shown for that topic.

`skill://` is the reference notation used by this package, not a required protocol for every harness. If the current harness does not recognize it, translate the URI to the equivalent project or installed file path—or use that harness's reference-loading mechanism—and read the target file directly. Keep internal topics as references; do not expose or invoke them as separate skills.

Default: open one primary topic index first. Add a secondary topic only when the task crosses a real boundary. Do not load every topic by default.

## Open First

| If the task involves... | Read this topic index |
| --- | --- |
| naming, abstractions, classes, cutovers, local reasoning, `!`, `as`, forced types, blank-line groups, branded types, exhaustive switch, generics | `skill://typescript-skills/typescript-coding-standards/INDEX.md` |
| provider, SDK, API, request, response, generated types, mapper, mapping, transform, translator, anti-corruption layer | `skill://typescript-skills/typescript-boundaries/INDEX.md` |
| dependency construction, factory, lifecycle, singletons, runtime selection | `skill://typescript-skills/typescript-composition/INDEX.md` |
| env, config parsing, defaults, typed config exposure, feature flags, config migration | `skill://typescript-skills/typescript-configs/INDEX.md` |
| logging, tracing, OpenTelemetry, X-Ray, actionable diagnostics, branch observability | `skill://typescript-skills/typescript-observability/INDEX.md` |
| secrets, crypto choices, redaction, credentials, secret sources | `skill://typescript-skills/typescript-security/INDEX.md` |
| tests, characterization, boundary contracts, brittle assertions, config tests | `skill://typescript-skills/typescript-testing/INDEX.md` |
| throw vs return, Result type, retryable, error classification, error contract, custom Error subclass, error factory/helper, swallowed fallback | `skill://typescript-skills/typescript-error-handling/INDEX.md` |
| `Promise.all`, sequential awaits, bounded concurrency, AbortSignal, cleanup, retry/backoff, SIGTERM, graceful shutdown | `skill://typescript-skills/typescript-async/INDEX.md` |

## Tie-breakers

Only genuinely ambiguous cases belong here. Everything else routes through Open First.

| Situation | Primary | Secondary |
| --- | --- | --- |
| Provider response shape enters business logic | `skill://typescript-skills/typescript-boundaries/INDEX.md` | `skill://typescript-skills/typescript-coding-standards/INDEX.md` for naming |
| Provider selection happens at startup | `skill://typescript-skills/typescript-composition/INDEX.md` | `skill://typescript-skills/typescript-boundaries/INDEX.md` if provider shapes cross inward |
| Secret source pointer appears in config | `skill://typescript-skills/typescript-security/INDEX.md` | `skill://typescript-skills/typescript-configs/INDEX.md` for parsing/exposure |
| `localhost` / `sandbox` / `test-token` fallback in code | `skill://typescript-skills/typescript-security/INDEX.md` | `skill://typescript-skills/typescript-configs/INDEX.md` only for non-secret behavior defaults |
| `as` cast on `JSON.parse`, env, or unknown response | `skill://typescript-skills/typescript-coding-standards/INDEX.md` (untrusted boundary: parse or narrow) | `skill://typescript-skills/typescript-configs/INDEX.md` for parser shape; `skill://typescript-skills/typescript-boundaries/INDEX.md` for HTTP/transport data |
| Broad app/framework config enters feature modules | `skill://typescript-skills/typescript-configs/INDEX.md` | `skill://typescript-skills/typescript-composition/INDEX.md` if framework assembly is involved |
| Stage-conditional resource selection (`stage === "prod" ? ... : ...`) | `skill://typescript-skills/typescript-configs/rules/feature-decisions.md` | `skill://typescript-skills/typescript-configs/rules/validation-vs-verification.md` |
| Secret-bearing log or trace attributes | `skill://typescript-skills/typescript-security/INDEX.md` | `skill://typescript-skills/typescript-observability/INDEX.md` for diagnostic shape |
| Refactor before behavior change | `skill://typescript-skills/typescript-testing/INDEX.md` | the relevant design topic index |
| Retry loop retries everything including 4xx | `skill://typescript-skills/typescript-error-handling/rules/error-classification.md` owns the decision | `skill://typescript-skills/typescript-async/rules/retry-and-backoff.md` owns the mechanism |
| Handler returns library/SDK error shape directly to client | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` | `skill://typescript-skills/typescript-boundaries/INDEX.md` for inbound mapping |
| `catch` returns fallback/default/skip without an explicit signal | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` | `skill://typescript-skills/typescript-observability/INDEX.md` for the signal shape |

## Router Contract

The selected topic index owns routing within its domain. The canonical rule files own design decisions.

For rule authoring conventions, read `skill://typescript-skills/references/authoring-checklist.md`. Project history and design notes live in `docs/typescript-skills/` at the repo root.
