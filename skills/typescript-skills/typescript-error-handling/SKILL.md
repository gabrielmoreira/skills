---
name: typescript-error-handling
description: Use when TypeScript code needs to express failure with a canonical app-owned error model, family-level runtime wrappers or Result-based propagation, stable error codes, retry classification, and safe boundary translation.
---

# TypeScript Error Handling

Failure is part of the design, not an afterthought. Define a canonical, app-owned error model first; then classify failures, structure attachments, choose a propagation style (`throw` or `Result`), and project errors safely at boundaries.

## Project Decision (read first)

| Decision | Guidance |
| --- | --- |
| **Canonical contract** | One shared `AppErrorData` shape. Root fields (`kind`, `code`, `message`, `details`) are the app-owned semantic contract; `context`, `normalizedCause`, `metadata`, `retry`, `http` are structured attachments. Runtime `cause` stays available for in-process diagnostics but is not the serialized contract. |
| **Propagation style** | One default style per package: class-based (`throw`) or Result-based. Mixing both casually in the same package leads to inconsistency. |
| **Runtime wrappers** | Prefer family wrappers (`AppError`, `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`). Specific subclasses are allowed for local value, but stable `code` plus canonical error data is the cross-package contract — not class identity. |

Hierarchy by app size: simple script → plain `Error` or a couple of local wrappers; mid app → family wrappers in `core/errors`; large multi-package app → same family wrappers in a shared `core/errors` package with no reverse dependency. For a new mid-or-larger app, start with the family wrappers on day one.

## Suggested progression

1. Define app error semantics early — `rules/define-app-error-semantics-early.md`
2. Classify failures consistently — `rules/error-classification.md`
3. Structure the error shape and metadata — `rules/error-shape-and-metadata.md`
4. Choose how failures propagate — `rules/throw-vs-result.md`
5. Project errors safely at boundaries — `rules/error-boundary-contract.md`

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| starting a new app, no error types yet; factory/helper keeps losing required metadata/context | `rules/define-app-error-semantics-early.md` |
| function that may fail, choosing throw vs return | `rules/throw-vs-result.md` |
| "should I retry this?", retryable vs caller fault, generic `catch (e)` swallowing, silent fallback | `rules/error-classification.md` |
| missing `errorId`/`code`, log/response cannot be correlated; unclear ownership of `details`/`context`/`normalizedCause`/`metadata`/runtime `cause` | `rules/error-shape-and-metadata.md` |
| handler returning provider/library error shape to client or unfiltered log | `rules/error-boundary-contract.md` |

## Owns

- Canonical error semantics, family wrappers, and propagation-style choice.
- Error classification (`kind`, business/infra/security/validation, retryability).
- Error shape and structured attachments; runtime-cause retention guidance.
- Boundary translation and projection into transport-level responses.

## Does Not Own

- Retry mechanics (backoff, jitter, caps) — `../typescript-async/rules/retry-and-backoff.md`.
- Logging/redaction mechanics — `../typescript-observability/` and `../typescript-security/rules/redaction.md`.
- Narrowing `catch (e: unknown)` — `../typescript-coding-standards/rules/type-narrowing-over-assertion.md`.

## Default

Define one canonical `AppErrorData` shape, default to class-based propagation with family wrappers in `core/errors`, use stable `code` plus canonical data as the shared contract, translate once at the boundary, and keep fallback/swallow decisions observable. Make always-needed enrichment fields explicit in factory/helper signatures instead of optional-everything.
