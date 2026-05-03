---
name: typescript-error-handling
description: Use when TypeScript code needs to express failure — class-based AppError hierarchy or Result/Either, error metadata (errorId, timestamp, code), classification (retryable, business vs infra), and boundary translation.
---

# TypeScript Error Handling

Failure is part of the design, not an afterthought. This skill assumes the project picks one error style (class-based or Result-based) and keeps it inside a package. Both styles share the same metadata so logs, responses, and tracing stay correlated.

## Project Decision (read first)

Before writing any error-handling code, the project picks one default style. Mixing both styles in the same package leads to inconsistency where the next contributor has to guess.

| Style | When to choose | Default in this skill |
| --- | --- | --- |
| **Class-based** (`AppError` subclasses, `throw`, `instanceof` at boundary) | Mid/large apps, long-lived codebases, OOP-leaning teams, projects that want consistent boundary translation by class hierarchy | **Recommended default** |
| **Result-based** (`Result<T, E>` discriminated union, no throw in domain) | Public libraries, pure parsers, FP-leaning teams, contracts where failure is part of the return type | Acceptable; opt in deliberately |

Both styles share the same metadata (`errorId`, `timestamp`, `code`, `cause`, optional `traceId`) — see `rules/error-shape-and-metadata.md` for the contract that both styles satisfy.

The rules below show both vias when the choice matters; sections marked **[Class-based]** and **[Result-based]** assume the project already picked one.

## Hierarchy ladder by app size

| App scale | Suggested hierarchy |
| --- | --- |
| Simple script / single-file tool | Plain `Error` + a couple of subclasses if needed; no package isolation |
| Mid app (multiple features, one team) | `AppError` → `BusinessError`, `InfraError` (+ `ValidationError`); kept in a `core/errors` module |
| Large app (multi-team, multi-package) | Same hierarchy, but `core/errors` lives in a **shared package** (`@app/core` / `core/errors`) that other packages depend on. No reverse dependency. The hierarchy is a contract. |

For a new mid-or-larger app, start with the `AppError` hierarchy on day one — retrofitting it after dozens of throws costs more than introducing it up front. Simple scripts stay on plain `Error` until a second failure mode appears.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| function that may fail, choosing throw vs return | `rules/throw-vs-result.md` |
| caller asking "should I retry this?", retryable vs caller fault, generic `catch (e)` swallowing | `rules/error-classification.md` |
| HTTP/RPC handler returning provider/library error shape directly to client | `rules/error-boundary-contract.md` |
| missing `errorId`, no `code`, support cannot find the request, log/response cannot be correlated | `rules/error-shape-and-metadata.md` |
| `try { ... } catch (e) { console.log(e) }`, rethrow without context | `rules/error-classification.md` |
| third-party SDK / library error reaching the client or an unfiltered log | `rules/error-boundary-contract.md` |
| starting a new app, no error types yet, choosing class-based vs Result-based | this SKILL.md (Project Decision) + `rules/error-classification.md` |

## Owns

- Guidance for the **project decision**: class-based vs Result-based (the project picks; this skill names the trade-offs and keeps the choice consistent across rules).
- The **hierarchy**: `AppError` and what subclasses exist; package isolation as size grows.
- Error **metadata**: `errorId`, `timestamp`, stable `code`, `cause` chain.
- **Classification**: business fault vs infra fault, retryable vs not.
- **Boundary translation**: how each error category becomes a transport-level response.

## Does Not Own

- Retry mechanism (backoff, jitter, max attempts) — see `../typescript-async/rules/retry-and-backoff.md`. This skill marks errors as `retryable`; async owns the *how*.
- Logging/redaction shape — see `../typescript-observability/` and `../typescript-security/rules/redaction.md`.
- Type narrowing of `catch (e: unknown)` mechanics — see `../typescript-coding-standards/rules/type-narrowing-over-assertion.md`.
- HTTP/REST/GraphQL specific status mapping outside the translator (use the framework's idiomatic error handler).

## Default

For a new mid-sized app: pick class-based. Define `AppError` with `errorId`, `timestamp`, `code`, optional `cause`. Subclass for `BusinessError` (caller's fault, 4xx) and `InfraError` (system's fault, 5xx, with `retryable` flag). Keep the hierarchy in `core/errors`. The boundary catches by class-base and translates once. Log with the `errorId` and full `cause` chain; respond with `errorId` + `code` + sanitized message.
