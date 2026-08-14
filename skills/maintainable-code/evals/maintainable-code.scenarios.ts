import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

const scenarios = [
  {
    id: "maintainable-code-god-context-refactor",
    bundle: "maintainable-code",
    rule: "inject-dependencies-explicitly",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "Our services all receive a single `ctx` object that carries the db pool, logger, feature flags, current user, request id, an event bus, and a grab-bag `ctx.extras`. A teammate says it's convenient because you never have to change signatures. We're adding a new `invoiceReminder` service now, should it take `ctx` too?",
    expectedPrimary: "maintainable-code",
    must: [
      "Recommends explicit dependencies (constructor/factory/parameters) for the new service instead of the god context",
      "Explains that a broad context hides what the function actually depends on and makes everything look coupled to the whole system",
      "Acknowledges the legitimate exception: shared contexts are acceptable as extension contracts (plugins, workflow engines, framework-like systems)",
      "Keeps the advice proportional, does not demand a big-bang rewrite of every existing service"
    ],
    mustNot: [
      "Approves passing the god context because 'it is the existing pattern' without flagging the cost",
      "Recommends inventing a second parallel architecture instead of an incremental path"
    ],
    tags: ["dependencies", "god-object", "p0"]
  },
  {
    id: "maintainable-code-generic-engine-hardcode",
    bundle: "maintainable-code",
    rule: "keep-the-generic-generic",
    tier: "P0",
    mode: "bypass",
    difficulty: "mixed",
    prompt:
      "We have a generic `WorkflowRunner` that executes steps from config. One customer (ACME) needs a 90-second delay before their export step. The fastest fix is `if (tenantId === 'acme') await sleep(90_000)` inside the runner, it ships today and it's just three lines. Deadline is Friday. OK to merge?",
    expectedPrimary: "maintainable-code",
    must: [
      "Rejects hardcoding the tenant-specific case inside the generic runner",
      "Explains that generic mechanisms must not know business-specific data that belongs to callers, configuration, or runtime input",
      "Proposes a right-level alternative such as a per-step or per-tenant delay in configuration or an extension point",
      "Addresses the deadline pressure without surrendering the design (the config-level fix is comparably small)"
    ],
    mustNot: [
      "Accepts the shortcut because it is only three lines or temporary",
      "Proposes an over-engineered plugin framework when a config field is enough"
    ],
    tags: ["generic", "hardcode", "bypass", "p0"]
  },
  {
    id: "maintainable-code-fragmentation-pushback",
    bundle: "maintainable-code",
    rule: "one-coherent-responsibility",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "A reviewer wants my 40-line `registerUser` use case split so every function is under 10 lines: `checkEmailFormat`, `checkEmailUnique`, `hashPassword`, `buildUserRecord`, `saveUser`, `emitUserCreated`, `buildResponse`. The flow is linear and each helper would be called exactly once. Is smaller always better here?",
    expectedPrimary: "maintainable-code",
    must: [
      "Says no, a cohesive linear business flow can stay together when reading it in one place is clearer",
      "Distinguishes extracting real secondary detail (parsing, validation, formatting) from fragmenting the main flow into single-use micro-functions",
      "Mentions the reader cost of jumping across many tiny helpers to reconstruct one business decision"
    ],
    mustNot: [
      "Endorses a hard line-count rule as the criterion for extraction",
      "Swings to the opposite extreme and rejects all extraction even for genuine subtasks"
    ],
    tags: ["fragmentation", "responsibility", "p1"]
  },
  {
    id: "maintainable-code-dependency-adopt-wrap-decision",
    bundle: "maintainable-code",
    rule: "choose-dependencies-deliberately",
    tier: "P1",
    mode: "complexity",
    difficulty: "mixed",
    prompt:
      "I need a retry-with-backoff helper for three HTTP calls in our billing sync. Options on the table: (a) write our own little retry loop, (b) add a popular retry library and use its API directly everywhere, (c) add the library but hide it behind a small `retry()` helper of ours. Which way would you go and why?",
    expectedPrimary: "maintainable-code",
    must: [
      "Weighs build vs adopt using maturity, adoption, and maintenance of the library versus the real complexity of the problem",
      "Applies the wrap-vs-embrace criterion: hide the library behind a small support layer when its vocabulary should not spread through the system",
      "Treats the retry mechanism as an isolated technical mini engine that must not absorb business-specific values or hidden I/O"
    ],
    mustNot: [
      "Recommends hand-rolling a complex mechanism a mature library already solves well, or adds a heavy dependency for a trivial need, without weighing either",
      "Lets the library's API spread through business code without noting the coupling cost"
    ],
    tags: ["dependencies", "mini-engine", "wrap", "p1"]
  },
  {
    id: "maintainable-code-plan-progressive-and-structure",
    bundle: "maintainable-code",
    rule: "plan-from-the-test",
    tier: "P2",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "We're starting a new `subscriptions` feature in our Node service (folders currently: `controllers/`, `services/`, `models/`, `utils/`). Outline how you'd plan and structure the work before writing code.",
    expectedPrimary: "maintainable-code",
    must: [
      "Starts by asking how the change will be tested and sketches the main flow before coding",
      "Builds the core business flow before wiring routing and infrastructure",
      "Recommends feature-based organization for the new work instead of spreading it across technical-type folders",
      "Presents the plan progressively: main path first, secondary detail after"
    ],
    mustNot: [
      "Jumps straight to scaffolding controllers/models across type folders without a plan",
      "Produces a dense wall-of-detail plan with no prioritized main path"
    ],
    tags: ["process", "structure", "planning", "p2"]
  }
] as const satisfies readonly EvalScenario[];

export default scenarios;
