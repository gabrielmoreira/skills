import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "async-retry-after-must-respect-local-cap",
    bundle: "typescript-async",
    rule: "retry-and-backoff",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A retry helper reads `Retry-After` from a 429 response and sleeps that full duration, even if the server asks for 20 minutes. The caller is an HTTP request with a much smaller budget. What should change?",
    expectedPrimary: "typescript-async",
    expectedSecondary: ["typescript-error-handling", "typescript-observability"],
    must: [
      "Treats remote `Retry-After` as an input to local retry policy rather than an unlimited command",
      "Requires an explicit locally owned maximum wait or retry budget",
      "Fails or stops retrying when the remote wait exceeds the local allowed budget",
      "Keeps retry timing aligned under the caller's known budget instead of outliving it"
    ],
    mustNot: [
      "Obeys remote `Retry-After` blindly regardless of local limits",
      "Treats longer waiting as automatically safer or more correct",
      "Leaves timeout or wait ownership implicit"
    ],
    tags: ["retry-after", "timeouts", "caller-budget", "calibration"]
  },
  {
    id: "async-timeout-must-fit-caller-budget",
    bundle: "typescript-async",
    rule: "retry-and-backoff",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A Lambda has a 30s timeout, but an internal HTTP fetch is configured with a 60s timeout and no shorter local cap. The code relies on the platform timeout if something hangs. What should change?",
    expectedPrimary: "typescript-async",
    expectedSecondary: ["typescript-observability", "typescript-error-handling"],
    must: [
      "Requires explicit locally owned timeouts rather than relying on outer platform timeout",
      "Keeps inner operation timeouts below the known caller/runtime budget",
      "Preserves diagnosability by avoiding situations where the outer timeout fires before the inner cause is known",
      "Treats timeout ownership as part of operation design rather than an incidental transport detail"
    ],
    mustNot: [
      "Accepts inner timeouts longer than the enclosing caller/runtime budget by default",
      "Treats platform timeout as an adequate replacement for owned internal timeouts",
      "Leaves long waits or hangs effectively unbounded"
    ],
    tags: ["timeout", "lambda", "caller-budget", "calibration"]
  }
] satisfies EvalScenario[];

export default scenarios;
