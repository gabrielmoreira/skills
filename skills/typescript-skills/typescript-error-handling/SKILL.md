---
name: typescript-error-handling
description: Use when TypeScript code needs to express failure with a canonical app-owned error model, family-level runtime wrappers or Result-based propagation, stable error codes, retry classification, and safe boundary translation.
---

# TypeScript Error Handling

Failure is part of the design, not an afterthought. Start by defining a canonical, app-owned error model. Then classify failures, structure attachments, choose a propagation style (`throw` or `Result`), and project errors safely at boundaries.

## Project Decision (read first)

Before writing new error-handling code, define the project's canonical error semantics. The error contract should stay stable even if the project later chooses a different propagation style.

| Decision | Guidance |
| --- | --- |
| **Canonical contract** | Define one shared `AppErrorData` shape first. Root fields describe the app-owned semantic contract; attachments carry context, normalized cause data, retry, protocol projection, and metadata. Runtime `cause` stays available for internal diagnostics, but it is not the canonical serialized contract. |
| **Propagation style** | Then pick one default style inside each package: class-based (`throw`) or Result-based. Mixing both styles casually inside the same package leads to inconsistency. |
| **Runtime wrappers** | Prefer family wrappers such as `AppError`, `BusinessError`, `InfraError`, `SecurityError`, and `ValidationError`. Specific subclasses are allowed when they add local value, but they are not the primary cross-package contract. |

The durable shared contract is the canonical error data plus stable `code`. Class identity is useful in-process, but it should not be the only thing another package must know to understand the error.

## Suggested progression

1. Define app error semantics early — `rules/define-app-error-semantics-early.md`
2. Classify failures consistently — `rules/error-classification.md`
3. Structure the error shape and metadata — `rules/error-shape-and-metadata.md`
4. Choose how failures propagate — `rules/throw-vs-result.md`
5. Project errors safely at boundaries — `rules/error-boundary-contract.md`

## Hierarchy ladder by app size

| App scale | Suggested runtime wrappers |
| --- | --- |
| Simple script / single-file tool | Plain `Error` or a couple of local wrappers if needed |
| Mid app (multiple features, one team) | `AppError` → `BusinessError`, `InfraError` (+ `ValidationError` / `SecurityError`) in `core/errors` |
| Large app (multi-team, multi-package) | Same family wrappers in a shared `core/errors` package with no reverse dependency |

For a new mid-or-larger app, start with the family wrappers on day one. They solve most runtime needs without forcing every feature into a subclass-per-code hierarchy.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| starting a new app, no error types yet, no shared conventions | `rules/define-app-error-semantics-early.md` |
| function that may fail, choosing throw vs return | `rules/throw-vs-result.md` |
| caller asking "should I retry this?", retryable vs caller fault, generic `catch (e)` swallowing | `rules/error-classification.md` |
| missing `errorId`, no `code`, support cannot find the request, log/response cannot be correlated | `rules/error-shape-and-metadata.md` |
| unclear ownership of `details`, `context`, `normalizedCause`, `metadata`, or runtime `cause` | `rules/error-shape-and-metadata.md` |
| HTTP/RPC handler returning provider/library error shape directly to client | `rules/error-boundary-contract.md` |
| third-party SDK / library error reaching the client or an unfiltered log | `rules/error-boundary-contract.md` |

## Owns

- Guidance for defining the project's canonical error semantics early.
- Guidance for choosing one default propagation style per package: class-based or Result-based.
- The family-level runtime wrappers and when to use specific subclasses.
- Error classification (`kind`, business vs infra vs security vs validation, retryability).
- Error shape and structured attachments: semantic root, context, normalized cause data, metadata, retry, protocol projections, and runtime-cause retention guidance.
- Boundary translation and projection into transport-level responses.

## Does Not Own

- Retry mechanics (backoff, jitter, max attempts) — see `../typescript-async/rules/retry-and-backoff.md`.
- Logging implementation and redaction mechanics — see `../typescript-observability/` and `../typescript-security/rules/redaction.md`.
- Type narrowing mechanics for `catch (e: unknown)` — see `../typescript-coding-standards/rules/type-narrowing-over-assertion.md`.
- Framework-specific HTTP/REST/GraphQL error hooks beyond the translator contract.

## Default

For a new mid-sized app: define one canonical `AppErrorData` shape first, then default to class-based propagation with family wrappers in `core/errors`. Use stable `code` plus canonical error data as the shared contract. Add `context`, `normalizedCause`, `metadata`, `retry`, and `http` as structured attachments when needed. Keep runtime `cause` for internal diagnostics when useful, keep `normalizedCause` in the canonical shape, prefer object-based enrichment helpers or factory options over nested helper chains so important enrichment fields stay discoverable, translate once at the boundary, log the full internal diagnostic shape, and project only the safe public shape outward.