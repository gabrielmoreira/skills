import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "observability-error-instance-without-context",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A code review shows `logger.error(error)` on failure and `console.log(payload)` in a fallback branch. The author says the logger already prints the stack, so extra fields are unnecessary. What should change?",
    expectedPrimary: "typescript-observability",
    expectedSecondary: ["typescript-security"],
    must: [
      "Allows passing the real Error instance when the logger serializes errors well",
      "Still requires meaningful structured context such as operation, reason, or safe IDs",
      "Rejects raw payload or broad object dumps",
      "Makes branch or fallback choice observable when it matters operationally"
    ],
    mustNot: [
      "Treats passing Error instance itself as the anti-pattern",
      "Approves `console.log(payload)` or broad object dumps",
      "Treats stack visibility as a substitute for structured context"
    ],
    tags: ["meaningful-logging", "error-instance", "branch-decision", "calibration"]
  },
  {
    id: "observability-vendor-tracing-in-business-logic",
    bundle: "typescript-observability",
    rule: "tracing-boundary",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A service module imports OpenTelemetry and starts spans directly around business helpers. Span names include customer IDs so support can find traces quickly. The author says tracing is easier if the service owns it. What should change?",
    expectedPrimary: "typescript-observability",
    expectedSecondary: ["typescript-composition", "typescript-security"],
    must: [
      "Moves vendor tracing SDK setup behind an observability adapter or bootstrap edge",
      "Requires stable span names rather than dynamic IDs",
      "Keeps owned code on a small observability capability or local port",
      "Treats sensitive or high-cardinality attributes as a deliberate exception, not the default"
    ],
    mustNot: [
      "Approves vendor tracing imports inside business logic as the normal design",
      "Approves dynamic span names containing IDs as the default",
      "Treats support/debug convenience as enough reason to put tracing ownership in the service layer"
    ],
    tags: ["tracing-boundary", "vendor-sdk", "span-naming", "calibration"]
  },
  {
    id: "log-streaming-question",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Our containerized Node.js service writes logs to `/var/log/app.log` via Winston's file transport, and a sidecar ships them to our log aggregator. Is this the right architecture?",
    expectedPrimary: "typescript-observability",
    must: [
      "Recommends writing structured logs to stdout/stderr and letting infrastructure route them (Twelve-Factor XI)",
      "Says the application should not own log shipping, file transports, or rotation",
      "Mentions the sidecar/aggregator can consume stdout via the container runtime"
    ],
    mustNot: [
      "Recommends keeping the file transport for safety"
    ],
    tags: ["stdout", "twelve-factor", "log-routing", "legacy-migrated"]
  },
  {
    id: "why-cant-we-tell-which-partner-this-failed-for",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why can we not tell which partner this failed for? The log line says the request failed and gives the status code.",
    expectedPrimary: "typescript-observability",
    expectedAll: ["typescript-observability/rules/meaningful-logging.md"],
    expectedSecondary: ["typescript-error-handling"],
    must: [
      "Names the identifying fields the line would need to be actionable",
      "Distinguishes a line that records an event from one that supports a decision"
    ],
    mustNot: [
      "Adds the whole request object to the line",
      "Raises the log level and calls it fixed"
    ],
    tags: ["real-world", "unactionable-log"]
  },
  {
    id: "console-everywhere-in-this-package",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Improve the logging in this package. It is console calls throughout, and the platform team wants structured output next quarter.",
    expectedPrimary: "typescript-observability",
    expectedAll: ["typescript-observability/rules/meaningful-logging.md"],
    expectedSecondary: ["typescript-composition"],
    must: [
      "Treats stdout as the transport and structure as the change",
      "Keeps the migration bounded rather than rewriting every call at once"
    ],
    mustNot: [
      "Introduces a logging framework as the first move without asking what consumes the output"
    ],
    tags: ["real-world", "console-at-scale", "measured-shape"]
  },
  {
    id: "should-this-slow-path-get-a-span",
    bundle: "typescript-observability",
    rule: "tracing-boundary",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Should this get a span? It is an in-process transform between two calls that are already traced, and it takes about eight milliseconds.",
    expectedPrimary: "typescript-observability",
    expectedAll: ["typescript-observability/rules/tracing-boundary.md"],
    expectedSecondary: [],
    must: [
      "Ties the decision to whether a boundary was crossed",
      "Weighs the span against what it would let someone answer"
    ],
    mustNot: [
      "Adds a span because the code is slow relative to its neighbours"
    ],
    tags: ["real-world", "span-inflation"]
  },
  {
    id: "trace-shows-the-gateway-and-nothing-else",
    bundle: "typescript-observability",
    rule: "tracing-boundary",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Where did the rest of the trace go? We see the gateway span and then nothing until the response, and there are three services in between.",
    expectedPrimary: "typescript-observability",
    expectedAll: ["typescript-observability/rules/tracing-boundary.md"],
    expectedSecondary: ["typescript-async"],
    must: [
      "Looks for the context not being propagated across the calls",
      "Names where the propagation has to happen rather than adding spans"
    ],
    mustNot: [
      "Adds spans inside the gateway to fill the gap"
    ],
    tags: ["real-world", "broken-propagation"]
  },
  {
    id: "log-line-carries-the-auth-header",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Fix this before I approve it. The debug line prints the whole outgoing request, headers included, and it is on in staging.",
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/redaction.md"],
    expectedSecondary: ["typescript-observability"],
    must: [
      "Treats a credential reaching a log as the finding"
    ],
    mustNot: [
      "Answers only about the shape and usefulness of the line"
    ],
    tags: ["near-miss", "collision", "redaction-not-shape"]
  },
  {
    id: "is-one-line-per-request-too-much",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Is one log line per request too much for a service handling a few hundred requests a minute?",
    expectedPrimary: "typescript-observability",
    expectedAll: ["typescript-observability/rules/meaningful-logging.md"],
    expectedSecondary: [],
    must: [
      "Answers from what the line is for rather than from volume alone"
    ],
    mustNot: [
      "Gives a fixed rate as the answer"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "add-a-span-around-everything-so-we-can-see",
    bundle: "typescript-observability",
    rule: "tracing-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Can we just span everything? We had an incident nobody could explain and the director wants full visibility by Friday.",
    expectedPrimary: "typescript-observability",
    expectedAll: ["typescript-observability/rules/tracing-boundary.md"],
    expectedSecondary: ["typescript-observability/rules/meaningful-logging.md"],
    must: [
      "Names what full instrumentation costs, in volume and in reading",
      "Offers what would have answered that specific incident"
    ],
    mustNot: [
      "Agrees to blanket instrumentation because the request came from above",
      "Refuses without offering a way to answer the incident"
    ],
    tags: ["adversarial", "post-incident-pressure"]
  },
  {
    id: "observability-skip-redacting-bearer-token",
    bundle: "typescript-observability",
    rule: "meaningful-logging",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "the incoming authorization header is showing up in our debug logs, how do we strip the bearer token before writing the log line?",
    nearMiss:
      "It touches log lines and debug output, which is this topic's domain. But the decision to scrub credentials and prevent secret leakage is a security redaction requirement, which this topic's own Edges hand to security.",
    activation: {
      layer: "topic",
      target: "typescript-observability",
      shouldActivate: false,
      forbiddenRoutes: [],
    },
    expectedPrimary: "typescript-security",
    expectedAll: ["typescript-security/rules/redaction.md"],
    must: ["Treats secret and credential scrubbing as a security redaction policy"],
    mustNot: ["Treats credential leakage merely as a log verbosity or formatting preference"],
    tags: ["activation", "negative", "edge-to-security"],
  },
  {
    id: "observability-skip-tracer-provider-lifecycle",
    bundle: "typescript-observability",
    rule: "tracing-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "where in the service bootstrap should the open telemetry tracer provider be instantiated and registered as a global singleton?",
    nearMiss:
      "It names an OpenTelemetry tracer provider, which touches distributed tracing. But where dependencies are created and how lifetimes are managed at startup is assembly wiring, which this topic's own Edges hand to composition.",
    activation: {
      layer: "topic",
      target: "typescript-observability",
      shouldActivate: false,
      forbiddenRoutes: [],
    },
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/INDEX.md"],
    must: ["Positions telemetry SDK instantiation at the process composition root"],
    mustNot: ["Treats startup instantiation as a tracing span boundary question"],
    tags: ["activation", "negative", "edge-to-composition"],
  },
] satisfies EvalScenario[];

export default scenarios;
