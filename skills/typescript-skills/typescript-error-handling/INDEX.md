# TypeScript Error Handling Topic Index

Failure is part of the design, not an afterthought. Define a canonical, app-owned error model first; then classify failures, structure attachments, choose a propagation style (`throw` or `Result`), and project errors safely at boundaries.

## Project Decision

| Decision | Guidance |
| --- | --- |
| **Canonical contract** | One shared `AppErrorData` shape. Root fields (`kind`, `code`, `message`, `details`) are the app-owned semantic contract; `context`, `normalizedCause`, `metadata`, `retry`, `http` are structured attachments. Runtime `cause` stays available for in-process diagnostics but is not the serialized contract. |
| **Propagation style** | One default style per package: class-based (`throw`) or Result-based. Mixing both casually in the same package leads to inconsistency. |
| **Runtime wrappers** | Prefer family wrappers (`AppError`, `BusinessError`, `InfraError`, `SecurityError`, `ValidationError`). Specific subclasses are allowed for local value, but stable `code` plus canonical error data is the cross-package contract — not class identity. |

Hierarchy by app size: simple script → plain `Error` or a couple of local wrappers; mid app → family wrappers in `core/errors`; large multi-package app → same family wrappers in a shared `core/errors` package with no reverse dependency. For a new mid-or-larger app, start with the family wrappers on day one.

## Suggested Progression

1. Define app error semantics early — `skill://typescript-skills/typescript-error-handling/rules/define-app-error-semantics-early.md`
2. Classify failures consistently — `skill://typescript-skills/typescript-error-handling/rules/error-classification.md`
3. Structure the error shape and metadata — `skill://typescript-skills/typescript-error-handling/rules/error-shape-and-metadata.md`
4. Choose how failures propagate — `skill://typescript-skills/typescript-error-handling/rules/throw-vs-result.md`
5. Project errors safely at boundaries — `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md`

## Rule Routing

| If you see... | Read |
| --- | --- |
| starting a new app, no error types yet; factory/helper keeps losing required metadata/context | `skill://typescript-skills/typescript-error-handling/rules/define-app-error-semantics-early.md` |
| function that may fail, choosing throw vs return | `skill://typescript-skills/typescript-error-handling/rules/throw-vs-result.md` |
| "should I retry this?", retryable vs caller fault, generic `catch (e)` swallowing, silent fallback | `skill://typescript-skills/typescript-error-handling/rules/error-classification.md` |
| missing `errorId`/`code`, log/response cannot be correlated; unclear ownership of `details`/`context`/`normalizedCause`/`metadata`/runtime `cause` | `skill://typescript-skills/typescript-error-handling/rules/error-shape-and-metadata.md` |
| handler returning provider/library error shape to client or unfiltered log | `skill://typescript-skills/typescript-error-handling/rules/error-boundary-contract.md` |

## Owns

- Canonical error semantics, family wrappers, and propagation-style choice.
- Error classification (`kind`, business/infra/security/validation, retryability).
- Error shape and structured attachments; runtime-cause retention guidance.
- Boundary translation and projection into transport-level responses.

## Does Not Own

- Retry mechanics (backoff, jitter, caps): read `skill://typescript-skills/typescript-async/rules/retry-and-backoff.md`.
- Logging/redaction mechanics: read `skill://typescript-skills/typescript-observability/INDEX.md` and `skill://typescript-skills/typescript-security/rules/redaction.md`.
- Narrowing `catch (e: unknown)`: read `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md`.

## Default

Define one canonical `AppErrorData` shape, default to class-based propagation with family wrappers in `core/errors`, use stable `code` plus canonical data as the shared contract, translate once at the boundary, and keep fallback/swallow decisions observable. Make always-needed enrichment fields explicit in factory/helper signatures instead of optional-everything.
