---
name: typescript-skills
description: Use when working on TypeScript code and needing to choose the smallest focused TypeScript skill for coding standards, boundaries, composition, configs, observability, security, or testing.
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

## Router Rule

Use the focused skill as the source of truth. This router only chooses where to start.

For topic ownership and authoring rules, see `references/ownership.md` and `references/authoring-checklist.md`.
