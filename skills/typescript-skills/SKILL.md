---
name: typescript-skills
description: >-
  Decide something inside TypeScript or JavaScript: what a value may be and what
  happens when it is absent, what a failure means and who handles it, what crosses
  a module or service boundary, what runs concurrently and who owns the promise,
  what a test actually proves, what a compiler or lint setting buys. Use when the
  user says "is this type right", "should this throw or return", "why is this
  any", "how do I test this", "this promise is never awaited", "fix these type
  errors", or hands over TypeScript to write, review or repair. Routes to one of
  nine topic indexes, each owning rules that carry a decision, the conditions that
  trigger it, and a check. Not for prose, formatting-only passes, history
  questions that merely mention TypeScript, or explaining an error when the
  request forbids changing code.
---

# TypeScript Rules Router

**Core principle.** Open one topic, not nine. The cost of this skill is what it makes you read.

- **This is the only discoverable skill in the package.** Everything under it is reference material.
- **An internal `INDEX.md` is not a skill.** Never invoke a topic name. Read the exact path shown for it.
- **`skill://` is this package's reference notation**, not a protocol. Where a harness does not recognise it, translate it to the equivalent file path and read the target directly.
- **You opened this in the middle of something.** This is how to do that work, not a replacement for it. Name what you were doing before you start, and return to it when this is done.

## Open one topic first

**Match the task against the left column, and open that index.**

- **A reported lint or compiler diagnostic enters elsewhere.** Read `skill://typescript-skills/references/diagnostics-to-rules.md` first, then the rule it names.

- **Add a second topic only when the task crosses a real boundary.**
- **Do not load every topic by default.** That is the waste this router exists to prevent.
- **Read every row, then act on the matches, hardest to undo first.** Reading a row costs nothing; the row you skipped is where the coverage went.

| If the task involves... | Read this topic index |
| --- | --- |
| a value that may be absent, or `any`, `unknown` and casts standing in for a type; a `switch` over a union with no exhaustive check; an abstraction, class or generic added before its second caller; an old shape and its cutover kept side by side | `skill://typescript-skills/typescript-coding-standards/INDEX.md` |
| an SDK, provider or generated type reaching business logic; an `API` request or response shape used as a domain type; a mapper, transform or translator standing between them | `skill://typescript-skills/typescript-boundaries/INDEX.md` |
| a dependency constructed where it is used rather than passed in; a factory or singleton picked at runtime; a connect, warm or close step in a lifecycle nobody owns | `skill://typescript-skills/typescript-composition/INDEX.md` |
| `process.env` read outside startup; a config value parsed, defaulted or exposed with no type; a feature flag or a config migration mid-flight | `skill://typescript-skills/typescript-configs/INDEX.md` |
| a branch taken with no logging or tracing behind it; a log line naming what happened but not what to do about it | `skill://typescript-skills/typescript-observability/INDEX.md` |
| a secret, credential or token in a literal, a log or a config default; redaction running after the value was already written; a crypto choice made by habit | `skill://typescript-skills/typescript-security/INDEX.md` |
| a test asserting on mock calls rather than on behaviour; a boundary contract no test pins; a refactor starting with no characterization test | `skill://typescript-skills/typescript-testing/INDEX.md` |
| a `throw` where a result type was meant, or the reverse; an error crossing a boundary with its retryability unstated; a `catch` swallowing the cause | `skill://typescript-skills/typescript-error-handling/INDEX.md` |
| `Promise.all`, sequential awaits, an unawaited promise, bounded concurrency, `AbortSignal` cleanup, retry and backoff, `SIGTERM` shutdown | `skill://typescript-skills/typescript-async/INDEX.md` |

**Default stance.**

- **Open one topic, not nine.** A second one only where the task crosses a real boundary.
- **Follow the conventions the repository already has**, unless a rule protects a stronger invariant.
- **Add structure only when the pressure is real**, and let the topic's own rules say when it is.

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
- **A named diagnostic routes through `skill://typescript-skills/references/diagnostics-to-rules.md`.**
- **For authoring conventions, read `skill://typescript-skills/references/authoring-checklist.md`.**
- **What is still open lives in `docs/typescript-skills/` at the repository root.**
