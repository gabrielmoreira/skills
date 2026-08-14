---
id: typescript-error-handling.error-classification
owner: typescript-error-handling
canonical: true
severity: default
references: [Errors are values (Go), Failure modes (resilience engineering), error taxonomy by remediation]
---

# Error Classification

Decision: **Classify a failure by what the caller can do about it, not only by where it came from.** Use a stable app-owned `code`, and add a broad `kind` or a retry mode only where they drive behaviour.

Use when:
- **A caller cannot tell which action applies.** Fix the input, retry, alert, or give up.
- **A retry loop treats every failure alike.**
- **Boundary translation falls through to a generic response.**
- **Different modules name the same failure differently.**

Do:
- **Keep codes stable across provider changes.** The vendor renaming a status is not a domain event.
- **Distinguish the three retry answers.**
  - No retry. It will fail the same way.
  - Retry after the caller fixes something.
  - Retry with backoff.
- **Use a broad family where a boundary needs coarse handling.** Validation, business, infrastructure, security.
- **Classify where there is enough semantic context to do it**, and preserve the original cause.
- **Treat a fallback or a swallow as an explicit outcome**, with one meaningful signal.

Avoid:
- **Inferring retryability from a status code or an exception class alone.**
- **Retrying what cannot succeed on a second try.** Validation, authorization, invariant, permanent business failures.
- **One subclass per code**, where data would carry it.
- **Letting an unknown error disappear into a default value.**

Exceptions:
- **A small surface MAY carry a code and nothing else**, where no caller branches further.
- **A transport-level retry MAY act on a status** before app semantics exist, provided it is bounded and visible.

Example (one instance, not the set):

```ts
// Retry mode is a decision, not an inference from the exception class.
type RetryMode = "none" | "after-remediation" | "backoff";

type FailureClass = {
  code: string;
  kind?: "business" | "validation" | "infra" | "security";
  retry: RetryMode;
};
```

Verify:
- **Check every retried failure carries an explicit retry classification.**
- **Check codes express app meaning**, not provider vocabulary.
- **Check an unknown failure stays visible and fails safely.**
- **Check boundaries branch on stable semantics**, never on message strings.
