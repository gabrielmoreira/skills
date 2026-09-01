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
      "What should change here? Our adapter catches an AxiosError, keeps only `normalizedCause` with type, code and message, and drops both `error.stack` and the original cause before logs and traces run. Public responses are already sanitised, and the team says the normalised fields are enough and keeping the raw cause is risky.",
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
      "Review this before I approve it. A contributor replaces a small local helper with this:\n\n```ts\nthrowError(\n  withMetadata(\n    withNormalizedCause(\n      withContext(orderNotFound({ orderId }), {\n        service: \"orders\",\n        operation: \"require_order\",\n      }),\n      cause,\n    ),\n    { requestId },\n  ),\n  { cause },\n);\n```\n\nThe author says the chain is explicit and composable. Another reviewer thinks people will miss the enrichment fields or stop attaching them because it is awkward.",
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
      "What should we recommend? We use `paymentDeclined(input, options?)` with every enrichment field optional. Support always needs `metadata.requestId` and `context.operation`, and contributors keep forgetting them because they rely on later composition helpers. The author says optional everything keeps the API flexible.",
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
      "Review this before I approve it. A function wraps a dependency call in try/catch, returns a fallback on failure, and does not rethrow, log, emit a span event or return an error result. The author says the fallback keeps the system resilient and extra signals would be noise.",
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
  {
    id: "error-model-small-script-stays-small",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt:
      "Do we need that? This script reads one local file, transforms it and exits. One caller, no API boundary, no retry loop, no shared logging pipeline. A reviewer wants an `AppError` hierarchy with stable codes, error ids, metadata, HTTP projections and factories before we ship.",
    expectedPrimary: "typescript-error-handling",
    must: [
      "Keeps the script on ordinary `Error` plus `cause` unless a real consumer needs more semantics",
      "Explains that codes, families, metadata, IDs, and protocol projections are earned by cross-module or boundary contracts",
      "Allows a small local message or contextual wrapper without introducing an application-wide framework"
    ],
    mustNot: [
      "Requires the full app error model for every TypeScript program",
      "Adds HTTP or correlation machinery with no consumer",
      "Rejects all future structured errors even if the script later gains real boundaries"
    ],
    tags: ["error-model", "earned-exception", "small-script"]
  },
  {
    // The swallow that actually exists. Empty catches are rare and obvious; a
    // catch that returns a stand-in and writes to console is neither, and it is
    // what a long-lived service is full of.
    id: "catch-returns-a-stand-in-and-writes-to-console",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Where is the problem? A partner says a whole category has been missing from their feed since a deploy in March. Dashboards are green. The same pattern is everywhere here: wrap the call, write a line to console in the catch, return an empty list so the caller carries on.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Names the stand-in return as the defect rather than the console line",
      "Requires a swallow to be an explicit outcome carrying a signal something acts on",
      "Distinguishes an empty result that is true from one that means the call failed"
    ],
    mustNot: [
      "Accepts the console line as sufficient because the failure is written down somewhere",
      "Replaces the pattern with a throw everywhere without asking what each caller can do"
    ],
    tags: ["real-world", "legacy", "silent-fallback", "green-dashboard"]
  },
  {
    id: "retry-loop-that-retries-a-declined-card",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Our payment client retries three times with backoff on any failure. Support has a customer whose card was declined and who now has three pending authorisations on their statement. The retry code is used by nine other clients.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-async"],
    must: [
      "Distinguishes a failure that cannot succeed on a second attempt from one that can",
      "Makes retryability an explicit property rather than inferred from the transport",
      "Notes the blast radius of changing shared retry behaviour"
    ],
    mustNot: [
      "Adds a special case for the declined status code",
      "Removes retry everywhere to be safe"
    ],
    tags: ["real-world", "payments", "retry-classification"]
  },
  {
    id: "same-failure-named-three-ways",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Three modules each define their own error for the same upstream timeout, with different names and different fields. A new dashboard is meant to count them together and cannot.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Treats one failure with three names as the defect",
      "Prefers a stable app-owned code over class identity"
    ],
    mustNot: [
      "Adds a fourth type to unify the other three without retiring them"
    ],
    tags: ["real-world", "legacy", "vocabulary-drift"]
  },
  {
    id: "unknown-error-becomes-an-empty-object",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A catch that does not recognise the error returns an empty object, which the caller spreads into the response. Clients have been receiving a two-hundred with nothing in it, and we only noticed from a partner's retry storm.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Treats an unrecognised failure that disappears into a value as the defect",
      "Keeps the unknown case visible and failing safely"
    ],
    mustNot: [
      "Adds more recognised branches and leaves the default as it is"
    ],
    tags: ["real-world", "silent-fallback"]
  },
  {
    id: "pressure-to-swallow-because-the-alert-is-noisy",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "This call fails for about one request in a thousand and always succeeds on the user's next attempt. The alert it raises wakes someone at night. The team wants it swallowed. Nobody has established why it fails.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Separates the alerting decision from the swallowing decision",
      "Requires a swallow to remain an explicit, counted outcome"
    ],
    mustNot: [
      "Silences it because the alert is noisy, while the cause is unestablished"
    ],
    tags: ["adversarial", "alert-fatigue"]
  },
  {
    id: "provider-error-shape-reaches-the-client",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A handler catches the SDK error and returns it as the response body. Our mobile app now branches on a field the provider added last quarter, and the provider changed it again this week.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-boundary-contract.md"],
    expectedSecondary: ["typescript-boundaries"],
    must: [
      "Treats the provider shape crossing the boundary as the defect",
      "Gives the boundary an owned response shape that survives provider change"
    ],
    mustNot: [
      "Pins the provider version as the fix",
      "Asks the mobile team to branch differently"
    ],
    tags: ["real-world", "leak", "provider-shape"]
  },
  {
    id: "every-failure-is-a-five-hundred",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Our handler maps everything to a five hundred. Validation failures, missing records and upstream timeouts all look the same to clients, and the mobile team retries all of them.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-boundary-contract.md"],
    expectedSecondary: [],
    must: [
      "Maps failures to what the caller can do about them",
      "Stops the client retrying what will fail identically"
    ],
    mustNot: [
      "Adds status codes without deciding what each means for the caller"
    ],
    tags: ["real-world", "boundary-mapping"]
  },
  {
    id: "internal-message-in-a-public-error",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "The error we return to clients includes the caught message, which for one path contains a connection string fragment. It has been like that for a year.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-boundary-contract.md"],
    expectedSecondary: ["typescript-security"],
    must: [
      "Stops the internal message reaching the public shape",
      "Treats the exposure as needing more than a code change"
    ],
    mustNot: [
      "Filters that one string and leaves the pass-through"
    ],
    tags: ["real-world", "security", "leak"]
  },
  {
    id: "which-failures-a-test-must-prove",
    bundle: "typescript-error-handling",
    rule: "error-boundary-contract",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "We agreed on the error contract. Now I need to decide which failures deserve a test and which are not worth the fixture.",
    expectedPrimary: "typescript-testing",
    expectedAll: ["typescript-testing/rules/contracts-and-characterization.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Treats choosing what to prove as a testing decision"
    ],
    mustNot: [
      "Re-derives the error contract instead of answering about coverage"
    ],
    tags: ["near-miss", "collision"]
  },
  {
    id: "validation-that-throws-inside-a-loop",
    bundle: "typescript-error-handling",
    rule: "throw-vs-result",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "We import a file of ten thousand rows. Row validation throws, so the first bad row aborts the batch and the operator gets one message. They want every bad row listed.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/throw-vs-result.md"],
    expectedSecondary: [],
    must: [
      "Treats an expected, per-item outcome as a value rather than an exception",
      "Keeps genuinely exceptional failures throwing"
    ],
    mustNot: [
      "Wraps each row in try/catch and calls that a result type"
    ],
    tags: ["real-world", "batch", "expected-failure"]
  },
  {
    id: "result-type-in-one-package-exceptions-in-the-next",
    bundle: "typescript-error-handling",
    rule: "throw-vs-result",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "One package returns a result object, the next throws, and the code between them converts back and forth twice. Both were written here, a year apart.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/throw-vs-result.md"],
    expectedSecondary: [],
    must: [
      "Treats one propagation style per package as the thing to settle",
      "Puts any conversion at a boundary rather than in the middle"
    ],
    mustNot: [
      "Declares one style universally correct without regard to the existing packages"
    ],
    tags: ["real-world", "legacy", "style-drift"]
  },
  {
    id: "throwing-for-control-flow-in-a-parser",
    bundle: "typescript-error-handling",
    rule: "throw-vs-result",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "A parser throws to unwind when it hits an unexpected token, and the caller catches it to try the next grammar. It is fast and it works.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/throw-vs-result.md"],
    expectedSecondary: [],
    must: [
      "Judges by whether the caller can act rather than by distaste for the mechanism",
      "Names what makes this acceptable or not in this specific shape"
    ],
    mustNot: [
      "Rejects it as control flow without weighing the caller's needs"
    ],
    tags: ["adversarial", "it-works-already"]
  },
  {
    id: "should-a-missing-record-throw",
    bundle: "typescript-error-handling",
    rule: "throw-vs-result",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "A lookup by id finds nothing. Should that throw, or return null?",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/throw-vs-result.md"],
    expectedSecondary: [],
    must: [
      "Answers from whether absence is expected for this caller"
    ],
    mustNot: [
      "Gives one answer for all lookups"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "correlation-id-lost-at-the-first-rethrow",
    bundle: "typescript-error-handling",
    rule: "error-shape-and-metadata",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "We attach a correlation id when a request arrives. By the time a failure reaches the logger it has been caught and rethrown twice and the id is gone, so support cannot tie a customer complaint to anything.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-shape-and-metadata.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Keeps the identifying metadata across rethrows",
      "Preserves the original cause rather than replacing it"
    ],
    mustNot: [
      "Adds the id at the logger, where it is no longer the request's"
    ],
    tags: ["real-world", "diagnosability"]
  },
  {
    id: "error-carries-the-whole-request",
    bundle: "typescript-error-handling",
    rule: "error-shape-and-metadata",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "To help debugging someone attached the full request object to the error. It now reaches our log pipeline, including headers, and the payload is large enough that some entries are truncated.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-shape-and-metadata.md"],
    expectedSecondary: ["typescript-security"],
    must: [
      "Treats attaching everything as both a leak and a diagnosability problem",
      "Chooses the fields that identify the failure"
    ],
    mustNot: [
      "Keeps the payload and raises the log size limit"
    ],
    tags: ["real-world", "over-attachment"]
  },
  {
    id: "codes-that-came-from-the-vendor",
    bundle: "typescript-error-handling",
    rule: "error-shape-and-metadata",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Our error codes are the upstream vendor's codes, passed through. The vendor renamed two of them in a minor release and our alerts stopped matching.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-shape-and-metadata.md"],
    expectedSecondary: [],
    must: [
      "Treats app-owned codes as what survives a vendor change",
      "Keeps the vendor value for diagnosis without branching on it"
    ],
    mustNot: [
      "Maps the two renamed codes and leaves the pass-through"
    ],
    tags: ["real-world", "vendor-coupling"]
  },
  {
    id: "adding-a-field-to-every-error",
    bundle: "typescript-error-handling",
    rule: "error-shape-and-metadata",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "A platform team wants every error in every service to carry six new fields for a compliance report. Most of our failures have nothing meaningful for four of them.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-shape-and-metadata.md"],
    expectedSecondary: [],
    must: [
      "Distinguishes fields that carry meaning from fields filled to satisfy a schema",
      "Offers a way to meet the requirement without inventing values"
    ],
    mustNot: [
      "Fills the four fields with placeholders"
    ],
    tags: ["adversarial", "mandate-pressure"]
  },
  {
    id: "new-service-copying-the-old-service-errors",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "We are starting a service beside an existing one. The quickest path is to copy the error classes from the old service, which nobody likes but everybody knows. The old ones carry three fields that only made sense for the old domain.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/define-app-error-semantics-early.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Decides the new service's failure semantics from its own callers",
      "Distinguishes borrowing a shape from inheriting a domain"
    ],
    mustNot: [
      "Copies the classes because familiarity is worth more than fit"
    ],
    tags: ["real-world", "greenfield-beside-legacy"]
  },
  {
    id: "small-script-asked-to-adopt-the-full-model",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "A one-file job that runs nightly and is read by two people is being asked to adopt the full error model: codes, families, metadata, boundary translation. It currently throws with a message.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/define-app-error-semantics-early.md"],
    expectedSecondary: [],
    must: [
      "Scales the model to the application rather than applying it uniformly",
      "Names what would make the fuller model earned here"
    ],
    mustNot: [
      "Imposes the whole model on a script with two readers"
    ],
    tags: ["adversarial", "over-application", "scale"]
  },
  {
    id: "errors-invented-per-module-for-two-years",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Every module invented its own errors as it was written. There are now forty error types, several meaning the same thing, and a new boundary has to translate all of them.",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/define-app-error-semantics-early.md"],
    expectedSecondary: [],
    must: [
      "Settles the shared semantics before the boundary translation is written",
      "Sequences the work so the boundary is not written twice"
    ],
    mustNot: [
      "Writes a forty-branch translation and calls it done"
    ],
    tags: ["real-world", "legacy", "at-scale"]
  },
  {
    id: "what-should-this-error-be-called",
    bundle: "typescript-error-handling",
    rule: "define-app-error-semantics-early",
    tier: "P1",
    mode: "bypass",
    difficulty: "obvious",
    prompt:
      "I have the failure modelled and the boundary sorted. I just cannot settle on a name for the class.",
    expectedPrimary: "typescript-coding-standards",
    expectedAll: ["typescript-coding-standards/rules/naming-and-semantic-center.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Treats this as a naming question"
    ],
    mustNot: [
      "Re-opens the error model"
    ],
    tags: ["near-miss", "collision", "naming"]
  },
  {
    id: "add-a-category-filter-to-the-partner-feed",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "add a category filter to the partner feed, partners keep asking for it",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-observability", "typescript-coding-standards"],
    must: [
      "Delivers the category filter that was asked for",
      "Reports that a failed fetch is returned as an empty feed, so a partner cannot tell an outage from an empty catalogue",
      "Says what it did not change, rather than fixing everything it noticed"
    ],
    mustNot: [
      "Copies the catch-and-return-empty shape into the new code path",
      "Rewrites the error handling instead of delivering the filter",
      "Delivers the filter and says nothing about the swallow"
    ],
    tags: ["real-world", "fixture", "feature-request", "incidental-defect"]
  },
  {
    id: "what-would-make-the-partner-feed-easier-to-test",
    bundle: "typescript-error-handling",
    rule: "error-classification",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "what would make this easier to test?",
    expectedPrimary: "typescript-error-handling",
    expectedAll: ["typescript-error-handling/rules/error-classification.md"],
    expectedSecondary: ["typescript-testing", "typescript-configs", "typescript-composition"],
    must: [
      "Names specific things that cannot be reached from a test, rather than giving general design advice",
      "Points at the failure path being unreachable because the catch turns it into an empty result",
      "Points at the url being read from the environment inside the call, so a test has to set the environment",
      "Grounds each claim in something visible in the code rather than a preference"
    ],
    mustNot: [
      "Answers with principles that would apply to any file",
      "Proposes a rewrite before naming what is hard and why",
      "Treats the existing passing test as evidence that the code is testable"
    ],
    tags: ["real-world", "fixture", "open-ended", "measure-the-problem"]
  },
] satisfies EvalScenario[];

export default scenarios;
