---
id: typescript-error-handling.error-classification
owner: typescript-error-handling
canonical: true
severity: default
references: [Errors are values (Go), Failure modes (resilience engineering), Who can fix it? (Lubu-Labs/langgraph-error-handling), Smithbox-ai/ControlFlow error taxonomy]
---

# Error Classification

Decision: Classify failures by what callers can do, not only by technical origin. Use a stable app-owned `code`; add a broad `kind` and retry mode only where they drive behavior.

Use when:
- Callers cannot tell whether to fix input, retry, alert, or fail.
- Retry loops treat every failure alike.
- Boundary translation falls through to generic responses.
- Different modules name the same failure differently.

Do:
- Keep codes stable across provider changes.
- Distinguish no retry, retry after caller remediation, and retry with backoff.
- Use broad families such as validation, business, infrastructure, and security when boundaries need coarse handling.
- Classify at the point with enough semantic context; preserve the original cause.
- Treat fallback or swallowing as an explicit outcome with one meaningful signal.

Avoid:
- Inferring retryability from status code or exception class alone.
- Retrying validation, authorization, invariant, or permanent business failures.
- Creating one subclass for every code when data is sufficient.
- Letting unknown errors disappear into a default value.

Example:

```ts
type RetryMode = "none" | "after-remediation" | "backoff";

type FailureClass = {
  code: string;
  kind?: "business" | "validation" | "infra" | "security";
  retry: RetryMode;
};
```

Verify:
- Every retried failure has an explicit retry classification.
- Codes express app meaning rather than provider vocabulary.
- Unknown failures remain visible and fail safely.
- Boundaries branch on stable semantics, not message strings.
