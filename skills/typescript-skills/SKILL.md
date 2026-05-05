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
| naming, abstractions, classes, cutovers, local reasoning, `!`, `as`, forced types | `typescript-coding-standards/SKILL.md` |
| provider, SDK, API, request, response, generated types, mapper, mapping, transform, translator, anti-corruption layer | `typescript-boundaries/SKILL.md` |
| dependency construction, factories, lifecycle, singletons, runtime selection | `typescript-composition/SKILL.md` |
| env, config parsing, defaults, typed config exposure, config migration | `typescript-configs/SKILL.md` |
| logging, tracing, OpenTelemetry, X-Ray, actionable diagnostics, branch observability | `typescript-observability/SKILL.md` |
| secrets, crypto choices, redaction, credentials, secret sources | `typescript-security/SKILL.md` |
| tests, characterization, boundary contracts, brittle assertions, config tests | `typescript-testing/SKILL.md` |
| throw vs return, Result type, retryable, error classification, error contract, custom Error subclass, swallowed fallback after error, error factory/helper missing required metadata/context | `typescript-error-handling/SKILL.md` |
| `Promise.all`, sequential awaits, bounded concurrency, AbortSignal, cleanup, SIGTERM, graceful shutdown | `typescript-async/SKILL.md` |

## Tie-breakers

| Situation | Primary | Secondary |
| --- | --- | --- |
| Provider response shape enters business logic | `typescript-boundaries` | `typescript-coding-standards` for naming |
| Provider selection happens at startup | `typescript-composition` | `typescript-boundaries` if provider shapes cross inward |
| Secret source pointer appears in config | `typescript-security` | `typescript-configs` for parsing/exposure |
| Config parsing needs tests | `typescript-testing` | `typescript-configs` |
| Broad app/framework config enters feature modules | `typescript-configs` | `typescript-composition` if framework assembly is involved |
| Secret-bearing log or trace attributes | `typescript-security` | `typescript-observability` for meaningful diagnostic shape |
| Refactor before behavior change | `typescript-testing` | relevant design skill |
| Local model name comes from provider data | `typescript-boundaries` | `typescript-coding-standards` |
| Factory or singleton choice affects tests | `typescript-composition` | `typescript-testing` |
| OpenTelemetry/X-Ray setup or exporter lifecycle | `typescript-observability` | `typescript-composition` for construction/lifecycle |
| `as` cast on `JSON.parse`, env, or unknown response | `typescript-coding-standards` (hard-gate: no assertion) | `typescript-configs` for the parser shape, `typescript-boundaries` if the data is HTTP/transport |
| `localhost` / `sandbox` / `test-token` fallback in code | `typescript-security` | `typescript-configs` only for non-secret behavior defaults |
| Stage-conditional resource selection (`stage === "prod" ? ... : ...`) | `typescript-configs` (`feature-decisions.md`) | `typescript-configs` (`validation-vs-verification.md`) for the explicit pointer |
| Function may fail and caller has multiple branches | `typescript-error-handling` (`throw-vs-result.md`) | `typescript-error-handling` (`error-shape-and-metadata.md`) for metadata consistency |
| Retry loop retries everything including 4xx | `typescript-error-handling` (`error-classification.md`) | `typescript-async` for the retry mechanism |
| Handler returns library/SDK error shape directly to client | `typescript-error-handling` (`error-boundary-contract.md`) | `typescript-boundaries` for the inbound side |
| Sequential `await`s where independent ops would parallelize | `typescript-async` (`parallel-and-dependencies.md`) | — |
| 500 IDs in `Promise.all` causing rate-limit | `typescript-async` (`parallel-and-dependencies.md` — bounded concurrency) | — |
| `fetch` without `signal:` and caller may walk away | `typescript-async` (`cancellation-and-abort.md`) | — |
| Resource leaks on error, missing `finally`/`using` | `typescript-async` (`cleanup-and-teardown.md`) | — |
| SIGTERM/SIGKILL kills mid-request, no graceful shutdown, swallowed `unhandledRejection` | `typescript-async` (`process-lifecycle.md`) | `typescript-observability` for flush before exit |
| Missing `errorId`, no stable `code`, support cannot correlate response to logs | `typescript-error-handling` (`error-shape-and-metadata.md`) | `typescript-observability` for log shape |
| Retry loop with constant sleep / no jitter / no Retry-After | `typescript-async` (`retry-and-backoff.md`) | `typescript-error-handling` for retryable classification |
| error factory/helper has too many optional fields and important metadata/context keeps getting forgotten | `typescript-error-handling` (`define-app-error-semantics-early.md`) | `typescript-coding-standards` for API/signature clarity |
| `catch` returns fallback/default/skip with no log, span event, metric, or explicit error result | `typescript-error-handling` (`error-boundary-contract.md`) | `typescript-observability` for the signal shape |

## Router Rule

Use the focused skill as the source of truth. This router only chooses where to start.

For topic ownership and authoring rules, see `references/ownership.md` and `references/authoring-checklist.md`.
