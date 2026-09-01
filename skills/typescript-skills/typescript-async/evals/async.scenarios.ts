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
  },
  {
    id: "async-cleanup-transaction-leaks-on-throw",
    bundle: "typescript-async",
    rule: "cleanup-and-teardown",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "This importer opens a read stream and begins a transaction, then commits at the end. When a row fails to insert it throws and we see connections pile up until the pool is exhausted. Reviewer says just wrap it in try/catch.",
    expectedPrimary: "typescript-async",
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Identifies that cleanup runs only on the success path, which is why the failure path leaks",
      "Pairs each acquisition with a release that runs on every exit, using try/finally or explicit resource management",
      "Releases the transaction before the stream, in reverse order of acquisition",
      "Awaits the asynchronous close rather than calling it and moving on",
      "Makes dispose idempotent so a second call is safe"
    ],
    mustNot: [
      "Accepts a bare try/catch that swallows the error without releasing anything",
      "Suggests cleanup in the catch block only, which still skips the cancelled path",
      "Recommends a process-level handler for a per-operation resource"
    ],
    tags: ["cleanup", "teardown", "transaction", "resource-leak"]
  },
  {
    id: "async-callback-in-foreach-is-never-awaited",
    bundle: "typescript-async",
    rule: "promise-ownership",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A handler runs `items.forEach(async (item) => { await save(item); })` and returns straight after. Some saves never land and nothing appears in the logs. What should change?",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/promise-ownership.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Identifies that `forEach` discards the returned promise, so nothing awaits or observes the saves",
      "Replaces it with a form that owns the promises, such as `for...of` with `await` or `Promise.all` over `map`",
      "Connects the missing rejection path to the failures being invisible"
    ],
    mustNot: [
      "Adds a `.catch` inside the callback and treats ownership as resolved",
      "Reads this as a concurrency-tuning question",
      "Leaves the handler returning before the work is observed"
    ],
    tags: ["floating-promise", "ownership", "foreach", "silent-failure"]
  },
  {
    id: "async-detachment-is-allowed-when-it-is-marked",
    bundle: "typescript-async",
    rule: "promise-ownership",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "An endpoint calls `recordAudit(event)` without awaiting, because the response must not wait on the audit sink. A reviewer flagged it as a floating promise. Is the reviewer right?",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/promise-ownership.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Accepts deliberate detachment for work the response must not wait on",
      "Requires the detachment to be marked, with `void` and a handler that reports the failure",
      "Keeps the rejection observable rather than dropped"
    ],
    mustNot: [
      "Demands an `await` that would put the audit sink in the response path",
      "Accepts the bare call with no marker and no handler"
    ],
    tags: ["fire-and-forget", "earned-exception", "ownership"]
  },
  {
    // Code in hand. The defect is on screen, so nothing has to be established
    // before it can be named, and the language rule is the right owner.
    id: "writer-shown-and-asked-whether-it-does-what-it-claims",
    bundle: "typescript-async",
    rule: "promise-ownership",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Here is the writer we ship. `rows.forEach(r => persist(r))`, then it logs how many it was given and returns. Reading it now, is this doing what the log claims?",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/promise-ownership.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Suspects work that was started and never observed, rather than a slow or failing write",
      "Explains why nothing threw: a rejection with no owner does not reach the calling frame",
      "Asks for the call site that starts the per-row work before proposing a fix"
    ],
    mustNot: [
      "Treats an impossibly fast success as a performance result",
      "Proposes retries or batching before the missing ownership is established"
    ],
    tags: ["symptom-only", "de-biased", "silent-success"]
  },
  {
    // Near miss. Same domain, same vocabulary, different decision: this is about
    // when to await, which another rule owns.
    id: "two-lookups-run-back-to-back",
    bundle: "typescript-async",
    rule: "parallel-and-dependencies",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "A handler fetches the account, then fetches the pricing table, then renders. Each takes about 400ms and the endpoint takes 800ms. Neither call uses the other's result.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/parallel-and-dependencies.md"],
    expectedSecondary: [],
    must: [
      "Treats this as ordering, since both results are already owned and awaited",
      "Starts the independent work together rather than in sequence"
    ],
    mustNot: [
      "Routes this to promise ownership, where nothing is unobserved"
    ],
    tags: ["near-miss", "collision", "ordering-not-ownership"]
  },
  {
    // Control. A competent answer needs no rule, so a pass here tells us the
    // skill was not what produced it.
    id: "return-or-await-before-returning",
    bundle: "typescript-async",
    rule: "promise-ownership",
    tier: "P2",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Inside a try/catch, is there any difference between `return doWork()` and `return await doWork()`?",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/promise-ownership.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Says the returned form settles outside the try, so the catch never sees the rejection"
    ],
    mustNot: [
      "Calls the two forms equivalent"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    // The same defect, reported the way it reaches you in production. Measured,
    // one clean sample: this routes to debugging, and the router's own row says
    // it should. Kept as a scenario asserting that, rather than deleted for
    // disagreeing with an expectation that was wrong.
    id: "nightly-job-finishes-impossibly-fast",
    bundle: "typescript-async",
    rule: "promise-ownership",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Our nightly export is supposed to write about 40,000 rows. The log line says it completed in 900ms and the table has 12 rows in it. Nothing threw, and the job is marked successful.",
    expectedPrimary: "debugging-by-evidence",
    expectedSecondary: ["typescript-async"],
    must: [
      "Treats a symptom with no established cause as something to establish before naming a defect",
      "Reaches for the signal that reproduces it rather than a fix"
    ],
    mustNot: [
      "Names a specific language defect as the cause without establishing it"
    ],
    tags: ["symptom-only", "cross-skill", "measured-expectation"]
  },
  {
    id: "user-navigates-away-and-we-keep-fetching",
    bundle: "typescript-async",
    rule: "cancellation-and-abort",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why does the network tab keep filling up? Users click through the list quickly and every row they open starts a fetch that finishes long after they left.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/cancellation-and-abort.md"],
    expectedSecondary: [],
    must: [
      "Cancels work that is no longer wanted rather than ignoring its result",
      "Passes the signal down so the cancellation reaches the request"
    ],
    mustNot: [
      "Discards the late result and leaves the request running",
      "Debounces the clicks as the fix"
    ],
    tags: ["real-world", "abandoned-work"]
  },
  {
    id: "shutdown-kills-requests-mid-flight",
    bundle: "typescript-async",
    rule: "process-lifecycle",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why do we see failed requests on every deploy? The pod goes away and whatever was in flight goes with it.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/process-lifecycle.md"],
    expectedSecondary: ["typescript-async/rules/cleanup-and-teardown.md"],
    must: [
      "Stops accepting new work before finishing what is in flight",
      "Bounds the drain rather than waiting indefinitely"
    ],
    mustNot: [
      "Increases the termination grace period as the whole fix"
    ],
    tags: ["real-world", "deploy-errors"]
  },
  {
    id: "connection-leak-after-a-throw",
    bundle: "typescript-async",
    rule: "cleanup-and-teardown",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Where is this leak? Connections climb all day and only settle after a restart, and the path that acquires them throws sometimes.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/cleanup-and-teardown.md"],
    expectedSecondary: [],
    must: [
      "Releases what was acquired on every exit path, including the throwing one",
      "Separates cancelling work from releasing what it holds"
    ],
    mustNot: [
      "Raises the pool size",
      "Releases only in the success path"
    ],
    tags: ["real-world", "leak"]
  },
  {
    id: "retry-made-the-outage-worse",
    bundle: "typescript-async",
    rule: "retry-and-backoff",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why did our retries make it worse? The upstream got slow, every caller retried three times immediately, and it went down completely.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/retry-and-backoff.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Introduces backoff and jitter rather than immediate retries",
      "Bounds total attempts against the caller's own budget"
    ],
    mustNot: [
      "Removes retry entirely as the only option",
      "Keeps immediate retry and adds a circuit breaker without changing the loop"
    ],
    tags: ["real-world", "retry-storm"]
  },
  {
    id: "cancel-token-that-nobody-passes-on",
    bundle: "typescript-async",
    rule: "cancellation-and-abort",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Fix this. We create an AbortController at the handler and never give the signal to any of the three calls underneath it.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/cancellation-and-abort.md"],
    expectedSecondary: [],
    must: [
      "Threads the signal through to the work that can actually stop",
      "Treats an unused controller as no cancellation at all"
    ],
    mustNot: [
      "Removes the controller because nothing uses it"
    ],
    tags: ["real-world", "signal-not-threaded"]
  },
  {
    id: "should-shutdown-wait-for-the-queue-to-drain",
    bundle: "typescript-async",
    rule: "process-lifecycle",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Should shutdown wait for the queue? A drain can take four minutes and the orchestrator kills us after thirty seconds.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/process-lifecycle.md"],
    expectedSecondary: [],
    must: [
      "Fits the drain inside the window the platform actually gives",
      "Says what happens to work that does not finish in time"
    ],
    mustNot: [
      "Waits for a full drain that the platform will interrupt"
    ],
    tags: ["real-world", "platform-window"]
  },
  {
    id: "finally-that-runs-after-the-response",
    bundle: "typescript-async",
    rule: "cleanup-and-teardown",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Is this fine? Cleanup happens in a `finally`, but the handler has already returned the response by then and the reviewer wants it moved.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/cleanup-and-teardown.md"],
    expectedSecondary: [],
    must: [
      "Answers about when the resource is released rather than about response timing"
    ],
    mustNot: [
      "Moves cleanup before the release is safe"
    ],
    tags: ["near-miss", "ordering-not-leak"]
  },
  {
    id: "how-many-attempts-is-right",
    bundle: "typescript-async",
    rule: "retry-and-backoff",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "How many retry attempts should a background job use for a transient network error?",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/retry-and-backoff.md"],
    expectedSecondary: [],
    must: [
      "Answers from the caller's budget and the failure mode rather than a fixed number"
    ],
    mustNot: [
      "Gives a number with no reasoning attached"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "just-retry-it-the-deploy-is-blocked",
    bundle: "typescript-async",
    rule: "retry-and-backoff",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Can we just wrap it in a retry? The integration test fails about one run in five, the release is blocked, and nobody has time to look at why.",
    expectedPrimary: "typescript-async",
    expectedAll: ["typescript-async/rules/retry-and-backoff.md"],
    expectedSecondary: ["typescript-testing"],
    must: [
      "Separates unblocking the release from accepting the retry as the fix",
      "Records what has not been established"
    ],
    mustNot: [
      "Adds the retry and closes the matter",
      "Blocks the release without offering a contained way through"
    ],
    tags: ["adversarial", "release-pressure", "flaky"]
  },
] satisfies EvalScenario[];

export default scenarios;
