import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "error-boundary-vendor-message-leak",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P0",
    mode: "bypass",
    difficulty: "mixed",
    prompt:
      "PR review: an Express handler catches Stripe errors and returns `res.status(500).json({ message: err.message, code: err.code })`. The author says clients need the real reason and support can read the exact vendor text faster this way. Should this pass?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-security", "typescript-observability"],
    must: [
      "Rejects returning raw vendor/library error message directly to clients",
      "Requires one boundary translator that projects to an app-owned error shape",
      "Requires stable outward fields such as code and errorId with sanitized message",
      "Keeps richer internal diagnostics for logs/traces rather than the public response",
      "Treats raw runtime cause, normalized cause details, context, and vendor data as internal by default"
    ],
    mustNot: [
      "Approves exposing vendor err.message because support wants it",
      "Mixes log shape and public response shape",
      "Pushes HTTP/protocol status decisions down into domain logic as the fix"
    ],
    tags: ["error-boundary", "p0", "vendor-leak", "simplification-core"]
  },
  {
    id: "throw-vs-result-parser-failure-modes",
    bundle: "typescript-error-handling",
    rule: "throw-vs-result",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "I'm writing a `parseOrder(raw)` function that can fail in three ways: missing required field, wrong type for a field, or unknown extra fields. Should it throw, return null, or something else?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Prefers Result/discriminated failure over `null` for multiple expected parser failure modes",
      "Keeps canonical error semantics aligned even if the parser returns Result",
      "Treats parser failure as expected result flow rather than defaulting to throw-only design",
      "Does not require one specific library"
    ],
    mustNot: [
      "Approves `return null` for multiple distinct parser failures",
      "Treats custom thrown exceptions as the default parser API for expected validation failures",
      "Uses raw type assertions in parser examples as if they were the recommended way to parse unknown input"
    ],
    tags: ["throw-vs-result", "parser", "cross-rule", "calibration"]
  },
  {
    id: "error-handling-upstream-failure-understanding-vs-public-sanitization",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A fetch wrapper turns every non-OK response into `new UpstreamInfraError(`status ${res.status}`)` and drops the response body/reason entirely before logging or translation. The team wants public errors sanitized, but incidents now lack enough detail to diagnose upstream failures. What should change?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-observability", "typescript-security"],
    must: [
      "Preserves richer internal understanding of upstream failure details before public projection",
      "Keeps public error shape sanitized and app-owned rather than exposing raw upstream details",
      "Separates internal diagnostics or tracing/logging detail from the outward boundary response",
      "Rejects throwing away actionable upstream failure context too early just because the public response is narrow"
    ],
    mustNot: [
      "Treats public sanitization as a reason to erase internal diagnostic understanding",
      "Exposes raw upstream response details directly to clients as the fix",
      "Collapses the issue into only status-code handling while ignoring lost failure context"
    ],
    tags: ["error-boundary", "diagnostics", "sanitization", "calibration"]
  },
  {
    id: "error-cause-stacktrace-vs-public-projection",
    bundle: "typescript-error-handling",
    rule: "error-shape-and-metadata",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "An adapter catches an AxiosError, keeps only `normalizedCause` with type/code/message, and drops both `error.stack` and the original runtime cause reference before logs/traces run. Public responses are already sanitized. The team says the normalized cause fields are enough and keeping the raw cause is risky. What should change?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-observability", "typescript-security"],
    must: [
      "Keeps the canonical app-owned `normalizedCause` summary rather than replacing it with raw library shape",
      "Preserves runtime-native stacktrace from the normalized cause source for internal diagnostics/logging/tracing when available",
      "Allows retaining the original runtime cause reference internally when still in-process and useful, without making it the serialized/public contract",
      "Keeps outward/public projection sanitized instead of exposing raw normalized-cause or cause data"
    ],
    mustNot: [
      "Treats normalized cause type/code/message alone as enough when stacktrace or richer internal diagnostics are still needed",
      "Serializes or returns the raw original cause object by default as the fix",
      "Treats public sanitization as a reason to discard internal normalized-cause stacktrace or original-cause access too early"
    ],
    tags: ["normalized-cause", "stacktrace", "projection", "calibration"]
  },
  {
    id: "error-helper-ergonomics-single-cause-pass",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P1",
    mode: "simplification",
    difficulty: "mixed",
    prompt:
      "PR review. A contributor replaces a small local helper with this pattern:\n\n```ts\nthrowError(\n  withMetadata(\n    withNormalizedCause(\n      withContext(orderNotFound({ orderId }), {\n        service: \"orders\",\n        operation: \"require_order\",\n      }),\n      cause,\n    ),\n    { requestId },\n  ),\n  { cause },\n);\n```\n\nThe author says the chain is explicit and composable. Another reviewer worries that developers will miss available enrichment fields or stop attaching them consistently because the pattern is too awkward. What should the project recommend as the default style?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Prefers an object-based enrichment helper or factory options over deeply nested helper chains as the default API",
      "Keeps the semantic error factory visible first and makes enrichment fields discoverable in one place",
      "Avoids requiring callers to pass the same runtime cause twice when throwing",
      "Preserves the same underlying error model and lets teams make important enrichment fields explicit or required at the helper/factory boundary"
    ],
    mustNot: [
      "Treats nested `withContext(withNormalizedCause(withMetadata(...)))` style as the preferred default ergonomics",
      "Requires callers to pass the same runtime cause both into enrichment and separately into `throwError`",
      "Collapses the fix into manual object literals with no shared helper or factory pattern"
    ],
    tags: ["ergonomics", "error-helper", "normalized-cause", "calibration"]
  },
  {
    id: "error-factory-required-fields-vs-optional-everything",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P1",
    mode: "simplification",
    difficulty: "mixed",
    prompt:
      "Code review. A project uses `paymentDeclined(input, options?)` where all enrichment fields are optional. In practice, support always needs `metadata.requestId` and `context.operation`, but contributors keep forgetting to attach them because they rely on later composition helpers and many call sites skip them. The author says making everything optional keeps the API flexible. What should the project recommend?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Says fields that are truly required for the error to be useful should be made explicit or required at the factory/helper boundary",
      "Distinguishes always-needed fields from optional enrichments that can remain composable",
      "Treats helper ergonomics and signature design as part of error quality, not just convenience",
      "Keeps the shared canonical error model rather than abandoning factories/helpers entirely"
    ],
    mustNot: [
      "Treats optional-everything signatures as the default even when important fields are routinely forgotten",
      "Frames missing required metadata/context as only a developer discipline problem with no API change",
      "Recommends abandoning shared helpers in favor of ad hoc inline object literals everywhere"
    ],
    tags: ["required-fields", "ergonomics", "signature-design", "calibration"]
  },
  {
    id: "error-silent-fallback-must-be-observable",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "PR review. A function wraps a dependency call in `try/catch`; on failure it returns a fallback value and does not rethrow, log, emit a span event, or return any explicit error result. The author says the fallback keeps the system resilient and extra signals would just add noise. What should change?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-observability"],
    must: [
      "Treats swallowing or converting an error with a control-flow change as a decision that must stay observable or explicit",
      "Requires a meaningful signal such as a log, span event, metric, or explicit error result when the error no longer propagates normally",
      "Distinguishes silent fallback from normal propagation so operators can understand why behavior changed",
      "Avoids requiring duplicate logs at every layer; the owning fallback/recovery point can emit the signal once"
    ],
    mustNot: [
      "Approves silent fallback or silent swallow when an error changed the control flow",
      "Treats resilience alone as enough reason to remove all observable signal",
      "Demands that every catch at every layer log the same error regardless of ownership"
    ],
    tags: ["silent-swallow", "fallback", "observability", "calibration"]
  },
  {
    id: "retry-everything",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "Our payment service wraps every downstream call in `for (let i = 0; i < 3; i++) { try { return await call() } catch (e) { await sleep(i * 1000) } }`. Sometimes a 400 'card declined' gets retried 3 times. What's wrong?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-async"],
    must: [
      "Identifies that the loop retries caller-fault errors like the declined card",
      "Recommends classifying errors with explicit retry semantics before retrying",
      "Distinguishes caller fault (no retry) from transient infra (retry)",
      "Places classification responsibility at the layer that knows the app's error semantics"
    ],
    mustNot: [
      "Suggests merely reducing the retry count as the fix"
    ],
    tags: ["retry-classification", "caller-fault", "legacy-migrated"]
  },
] satisfies EvalScenario[];

export default scenarios;
