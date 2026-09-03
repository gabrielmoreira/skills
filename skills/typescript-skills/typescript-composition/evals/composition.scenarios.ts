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
      "an account is being quoted the wrong price and the response names the right account. src/ is the whole module and the suite is green.",
    expectedPrimary: "typescript-composition",
    expectedSecondary: ["typescript-performance", "typescript-testing"],
    must: [
      "Finds that rate-client.js builds once and returns that instance to every later account, whose endpoint, credentials and margin were captured from whichever account arrived first",
      "Explains why the response still names the right account: the id comes from the argument and the price comes from the captured client",
      "Rejects app-singleton reuse when the dependency captures tenant or similarly scoped data",
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
  },
  {
    id: "request-scoped-vs-singleton",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "this handler is about to go behind a lot more traffic. anything here going to bite us? src/ is the whole service.",
    expectedPrimary: "typescript-composition",
    must: [
      "Finds that session.js holds the actor in a module-level variable shared by every in-flight request",
      "Names what happens when two overlap: the second beginRequest overwrites the first, and whichever endRequest lands first clears it for both",
      "Says the green suite does not cover it, because the tests await one request at a time",
      "Recommends carrying the actor inward on the call rather than beside it"
    ],
    mustNot: [
      "Recommends AsyncLocalStorage as the first answer instead of a later escalation",
      "Calls the code fine because the tests pass",
      "Treats it as a locking or race-condition problem to solve with a mutex"
    ],
    tags: ["dependency-scope", "request-scope", "module-state", "legacy-migrated"]
  },
  {
    id: "where-does-this-client-get-built",
    bundle: "typescript-composition",
    rule: "composition-root",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Where should this client be built? Right now each handler constructs its own, and they each read the config again.",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/composition-root.md"],
    expectedSecondary: ["typescript-configs"],
    must: [
      "Assembles once at the edge and passes the ready thing inward",
      "Stops each handler re-reading configuration"
    ],
    mustNot: [
      "Introduces a container as the first move",
      "Leaves construction in the handlers and shares the config object"
    ],
    tags: ["real-world", "construction-scattered"]
  },
  {
    id: "singleton-that-remembers-the-last-tenant",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why would one tenant see another tenant's data? The client is created once at module load and carries the tenant it was built with.",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/dependency-scope.md"],
    expectedSecondary: ["typescript-security"],
    must: [
      "Ties the lifetime of the object to the lifetime of what it holds",
      "Treats request-scoped state in a process-scoped object as the defect"
    ],
    mustNot: [
      "Adds a reset call between requests",
      "Blames the caller for reusing the client"
    ],
    tags: ["real-world", "scope-mismatch", "cross-tenant"]
  },
  {
    id: "factory-or-just-the-thing",
    bundle: "typescript-composition",
    rule: "ready-instance-vs-factory",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Should this export a factory or the instance? Every caller today builds it with the same arguments.",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/ready-instance-vs-factory.md"],
    expectedSecondary: [],
    must: [
      "Chooses from whether callers vary the construction",
      "Keeps the ready instance while nothing varies"
    ],
    mustNot: [
      "Exports a factory in case someone needs different arguments later"
    ],
    tags: ["real-world", "speculative-factory"]
  },
  {
    id: "the-clock-is-hard-coded-everywhere",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Make the scheduling testable. `Date.now()` is called in nine places across the module and the tests use fake timers to cope.",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/dependency-scope.md"],
    expectedSecondary: ["typescript-testing"],
    must: [
      "Passes the clock in rather than reaching for it",
      "Treats nine reaches as one dependency, not nine changes"
    ],
    mustNot: [
      "Keeps the fake timers and calls it handled"
    ],
    tags: ["real-world", "ambient-dependency"]
  },
  {
    id: "container-because-the-wiring-got-long",
    bundle: "typescript-composition",
    rule: "composition-root",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Should we bring in a DI container? The composition root is 200 lines of wiring and two people said it is getting hard to follow.",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/composition-root.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Asks what the container would relieve that ordering and naming would not",
      "Names the cost of indirection at the assembly point"
    ],
    mustNot: [
      "Adds the container because the file is long"
    ],
    tags: ["adversarial", "length-pressure"]
  },
  {
    id: "two-instances-when-there-should-be-one",
    bundle: "typescript-composition",
    rule: "ready-instance-vs-factory",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why are there two connection pools? The module exports a factory, two callers call it, and the metrics show double the connections we configured.",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/ready-instance-vs-factory.md"],
    expectedSecondary: ["typescript-composition/rules/dependency-scope.md"],
    must: [
      "Connects a factory called twice to two independent resources",
      "Decides which lifetime the resource should have"
    ],
    mustNot: [
      "Lowers the pool size to make the numbers match"
    ],
    tags: ["real-world", "duplicate-resource"]
  },
  {
    id: "does-this-helper-need-injecting",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "Does a pure formatting helper need to be injected?",
    expectedPrimary: "typescript-composition",
    expectedAll: ["typescript-composition/rules/dependency-scope.md"],
    expectedSecondary: [],
    must: [
      "Keeps a pure function as a direct import"
    ],
    mustNot: [
      "Injects it for symmetry with the other dependencies"
    ],
    tags: ["control", "would-pass-anyway"]
  },  {
    id: "composition-skip-explaining-the-existing-wiring",
    bundle: "typescript-composition",
    rule: "composition-root",
    tier: "P0",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "walk a new joiner through how our container wires the request handler, nothing needs changing",
    nearMiss:
      "Every noun here belongs to this topic: a container, wiring, a request handler. But nothing is being decided. No dependency is chosen, no lifetime is set, and the request is explicitly not to change anything, so no rule in this topic has a decision to make.",
    activation: {
      layer: "topic",
      target: "typescript-composition",
      shouldActivate: false,
      forbiddenRoutes: [],
    },
    expectedPrimary: "typescript-composition",
    must: ["Describes the existing assembly as it stands without proposing a different one"],
    mustNot: ["Turns the walkthrough into a redesign of the composition root"],
    tags: ["activation", "negative", "explanation-not-decision"],
  },
  {
    id: "composition-skip-retry-around-the-injected-client",
    bundle: "typescript-composition",
    rule: "dependency-scope",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "the payments client is injected at the root already, i just need it to back off and retry twice on a timeout",
    nearMiss:
      "It names an injected dependency and the composition root, which is this topic's subject, and the change lands on that dependency. But what has to be decided is retry and backoff mechanics, which this topic's own edges hand to async; the assembly is settled and is not what the question is about.",
    activation: {
      layer: "topic",
      target: "typescript-composition",
      shouldActivate: false,
      forbiddenRoutes: [],
    },
    expectedPrimary: "typescript-async",
    must: ["Treats the retry policy as an async decision rather than an assembly one"],
    mustNot: ["Rewires the composition root to solve a timeout"],
    tags: ["activation", "negative", "edge-to-async"],
  },
] satisfies EvalScenario[];

export default scenarios;
