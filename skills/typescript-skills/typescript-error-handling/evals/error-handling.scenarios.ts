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
      "Keeps richer internal details for logs/telemetry rather than the public response",
      "Treats raw cause/context/vendor details as internal by default"
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
      "Separates internal diagnostics or telemetry from the outward boundary response",
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
      "An adapter catches an AxiosError, normalizes `cause` down to `{ name, code, message, status }`, and drops both `error.stack` and the original error object reference before logs/traces run. Public responses are already sanitized. The team says normalized cause fields are enough and keeping the raw cause is risky. What should change?",
    expectedPrimary: "typescript-error-handling",
    expectedSecondary: ["typescript-observability", "typescript-security"],
    must: [
      "Keeps the canonical app-owned `cause` summary rather than replacing it with raw library shape",
      "Preserves runtime-native stacktrace from the observed cause for internal diagnostics/logging/tracing when available",
      "Allows retaining the original cause object reference internally when still in-process and useful, without making it the serialized/public contract",
      "Keeps outward/public projection sanitized instead of exposing raw cause data"
    ],
    mustNot: [
      "Treats normalized cause message/code alone as enough when stacktrace or richer internal diagnostics are still needed",
      "Serializes or returns the raw original cause object by default as the fix",
      "Treats public sanitization as a reason to discard internal cause stacktrace or original-cause access too early"
    ],
    tags: ["cause", "stacktrace", "projection", "calibration"]
  },
] satisfies EvalScenario[];

export default scenarios;
