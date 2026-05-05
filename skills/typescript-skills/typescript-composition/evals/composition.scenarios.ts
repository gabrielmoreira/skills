import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "composition-ready-instance-vs-factory-stable-mailer",
    bundle: "typescript-composition",
    rule: "ready-instance-vs-factory",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A receipt sender currently receives `getMailer()` but every call returns the same app-scoped mailer. The author says using a factory everywhere is more flexible. Should we keep it?",
    expectedPrimary: "typescript-composition",
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Prefers a ready dependency when all construction inputs are already known at assembly time",
      "Rejects factories that only return the same stable singleton",
      "Explains when a factory would be earned, such as tenant/request/per-call/lifecycle variation",
      "Keeps provider selection or lifecycle policy at the composition boundary"
    ],
    mustNot: [
      "Treats generic future flexibility as enough reason to keep the factory",
      "Moves factory choice into behavior code",
      "Suggests a ready instance even when scope really varies per call"
    ],
    tags: ["ready-instance-vs-factory", "composition", "calibration"]
  },
  {
    id: "composition-singleton-captures-tenant-scope",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A helper caches `makeClient({ tenantId })` in a module-level singleton so later calls can reuse it. The author says client creation is expensive and this is a performance win. What should change?",
    expectedPrimary: "typescript-composition",
    expectedSecondary: ["typescript-performance", "typescript-testing"],
    must: [
      "Rejects app-singleton reuse when the dependency captures tenant or similarly scoped data",
      "Requires scope to match captured data such as request, tenant, transaction, or user context",
      "Allows reuse only when the dependency is safe for that longer lifetime",
      "Calls out cache ownership, invalidation, or cleanup if a cache is still needed"
    ],
    mustNot: [
      "Treats performance alone as enough reason for implicit global state",
      "Approves module-level singleton caching for tenant-scoped data",
      "Suggests module reset hacks as the primary fix"
    ],
    tags: ["dependency-scope", "singleton", "tenant-scope", "calibration"]
  },
  {
    id: "composition-root-provider-selection-in-behavior",
    bundle: "typescript-composition",
    rule: "composition-root",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "A `sendReceipt(order)` function reads env/config and chooses SES vs SMTP inside the behavior module. The author says that keeps everything in one place and avoids extra wiring. What should change?",
    expectedPrimary: "typescript-composition",
    expectedSecondary: ["typescript-configs"],
    must: [
      "Moves provider selection and construction to the composition root or edge assembly layer",
      "Passes a ready dependency or capability into behavior code",
      "Keeps config reading before construction and behavior after construction",
      "Preserves framework entrypoints or bootstrap files as acceptable edge assembly locations"
    ],
    mustNot: [
      "Approves env/config reads deep in behavior to choose dependencies",
      "Treats convenience or fewer parameters as enough reason to keep runtime selection in behavior code",
      "Recommends configured singleton imports inside behavior modules as the default fix"
    ],
    tags: ["composition-root", "provider-selection", "bootstrap", "calibration"]
  }
] satisfies EvalScenario[];

export default scenarios;
