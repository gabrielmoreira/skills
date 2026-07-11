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
  },
  {
    id: "sequential-independent-fetches",
    bundle: "typescript-async",
    rule: "parallel-and-dependencies",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Our profile page handler does `const user = await fetchUser(id); const config = await fetchConfig(); const notifications = await fetchNotifications(id);`. P95 latency went up. The three fetches don't depend on each other. What's the fix?",
    expectedPrimary: "typescript-async",
    must: [
      "Recommends Promise.all for the three independent fetches",
      "Names the sequential awaits with no value flow as a waterfall",
      "Mentions start-early/await-late for partial dependencies"
    ],
    mustNot: [
      "Recommends caching or CDN as the primary fix for this latency"
    ],
    tags: ["parallel", "waterfall", "legacy-migrated"]
  },
  {
    id: "promise-all-rate-limited",
    bundle: "typescript-async",
    rule: "parallel-and-dependencies",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "We have a nightly job that fetches profile data for ~5000 users from a third-party API. We do `Promise.all(userIds.map(fetchProfile))`. Half the requests now fail with 429 since they tightened the limits. What should we do?",
    expectedPrimary: "typescript-async",
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Recommends bounded concurrency (p-limit, p-map, or batch-of-N) instead of an unbounded Promise.all burst",
      "Mentions honoring Retry-After and the documented rate limit",
      "Mentions classifying 429 as retryable so the retry layer behaves correctly"
    ],
    mustNot: [
      "Recommends dropping to fully sequential processing as the fix"
    ],
    tags: ["bounded-concurrency", "rate-limit", "legacy-migrated"]
  },
  {
    id: "fetch-without-abort",
    bundle: "typescript-async",
    rule: "cancellation-and-abort",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "In a React component I do `useEffect(() => { fetch('/api/users/' + id).then(r => r.json()).then(setUser) }, [id])`. Sometimes the user state shows the wrong user briefly when navigating quickly. Why?",
    expectedPrimary: "typescript-async",
    must: [
      "Identifies the race: a stale fetch resolves after a newer one and overwrites state",
      "Recommends AbortController in the effect with abort on cleanup",
      "Mentions AbortError must not be treated as a real failure"
    ],
    mustNot: [
      "Offers only a stale-check guard (if currentId === id) as the primary fix"
    ],
    tags: ["abort", "race-condition", "react", "legacy-migrated"]
  },
  {
    id: "sigterm-mid-request",
    bundle: "typescript-async",
    rule: "process-lifecycle",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "Our Node.js HTTP server in Kubernetes occasionally returns 502 to clients during deploys. We did not set up any signal handler. What changes should we make?",
    expectedPrimary: "typescript-async",
    expectedSecondary: ["typescript-observability"],
    must: [
      "Recommends a SIGTERM handler that drains in-flight requests, then exits",
      "Says readiness should flip to not-ready before draining so new traffic stops arriving",
      "Mentions a hard exit deadline shorter than the platform grace period",
      "Mentions flushing observability before exit"
    ],
    mustNot: [
      "Recommends only increasing terminationGracePeriodSeconds"
    ],
    tags: ["sigterm", "graceful-shutdown", "kubernetes", "legacy-migrated"]
  }
] satisfies EvalScenario[];

export default scenarios;
