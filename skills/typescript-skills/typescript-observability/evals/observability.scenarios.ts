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
  }
] satisfies EvalScenario[];

export default scenarios;
