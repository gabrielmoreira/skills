---
name: typescript-skills
description: Use when working on TypeScript code and needing to choose the smallest focused TypeScript skill for coding standards, boundaries, composition, configs, async control, error handling, observability, security, or testing.
---

# TypeScript Skills Router

This skill routes TypeScript work to the smallest relevant focused skill. It is not the source of truth for design rules.

Default: open one primary skill first. Add secondary skills only when the task crosses a real boundary. Do not load every TypeScript skill by default.

## Open First

| If the task involves... | Open |
| --- | --- |
| naming, abstractions, classes, cutovers, local reasoning, `!`, `as`, forced types, blank-line groups, branded types, exhaustive switch, generics | `typescript-coding-standards/SKILL.md` |
| provider, SDK, API, request, response, generated types, mapper, mapping, transform, translator, anti-corruption layer | `typescript-boundaries/SKILL.md` |
| dependency construction, factory, lifecycle, singletons, runtime selection | `typescript-composition/SKILL.md` |
| env, config parsing, defaults, typed config exposure, feature flags, config migration | `typescript-configs/SKILL.md` |
| logging, tracing, OpenTelemetry, X-Ray, actionable diagnostics, branch observability | `typescript-observability/SKILL.md` |
| secrets, crypto choices, redaction, credentials, secret sources | `typescript-security/SKILL.md` |
| tests, characterization, boundary contracts, brittle assertions, config tests | `typescript-testing/SKILL.md` |
| throw vs return, Result type, retryable, error classification, error contract, custom Error subclass, error factory/helper, swallowed fallback | `typescript-error-handling/SKILL.md` |
| `Promise.all`, sequential awaits, bounded concurrency, AbortSignal, cleanup, retry/backoff, SIGTERM, graceful shutdown | `typescript-async/SKILL.md` |

## Tie-breakers

Only genuinely ambiguous cases; everything single-skill routes via Open First.

| Situation | Primary | Secondary |
| --- | --- | --- |
| Provider response shape enters business logic | `typescript-boundaries` | `typescript-coding-standards` for naming |
| Provider selection happens at startup | `typescript-composition` | `typescript-boundaries` if provider shapes cross inward |
| Secret source pointer appears in config | `typescript-security` | `typescript-configs` for parsing/exposure |
| `localhost` / `sandbox` / `test-token` fallback in code | `typescript-security` | `typescript-configs` only for non-secret behavior defaults |
| `as` cast on `JSON.parse`, env, or unknown response | `typescript-coding-standards` (hard-gate: no assertion) | `typescript-configs` for the parser shape; `typescript-boundaries` if the data is HTTP/transport |
| Broad app/framework config enters feature modules | `typescript-configs` | `typescript-composition` if framework assembly is involved |
| Stage-conditional resource selection (`stage === "prod" ? ... : ...`) | `typescript-configs` (`feature-decisions.md`) | `typescript-configs` (`validation-vs-verification.md`) |
| Secret-bearing log or trace attributes | `typescript-security` | `typescript-observability` for diagnostic shape |
| Refactor before behavior change | `typescript-testing` | relevant design skill |
| Retry loop retries everything including 4xx | `typescript-error-handling` (`error-classification.md`) owns the decision | `typescript-async` (`retry-and-backoff.md`) owns the mechanism |
| Handler returns library/SDK error shape directly to client | `typescript-error-handling` (`error-boundary-contract.md`) | `typescript-boundaries` for the inbound side |
| `catch` returns fallback/default/skip with no log, span event, metric, or explicit error result | `typescript-error-handling` (`error-boundary-contract.md`) | `typescript-observability` for the signal shape |

## Router Rule

Use the focused skill as the source of truth. This router only chooses where to start.

For rule authoring conventions, see `references/authoring-checklist.md`. Project history and design notes live in `docs/typescript-skills/` at the repo root.
