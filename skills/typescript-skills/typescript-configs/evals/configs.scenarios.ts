import type { EvalScenario } from "../../evals/evals.types.ts";

const scenarios = [
  {
    id: "configs-env-non-null-bypass",
    bundle: "typescript-configs",
    rule: "parse-and-expose-config",
    tier: "P0",
    mode: "bypass",
    difficulty: "obvious",
    prompt: "PR review: a service now reads `process.env.EMAIL_API_KEY!` inside `sendReceipt`. The author says deploy always sets it and adding a parser is ceremony. Should this pass review?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: [
      "typescript-security"
    ],
    must: [
      "Rejects reading process.env directly inside service logic",
      "Rejects the non-null assertion as a proof substitute",
      "Requires parsing raw env once at the config boundary into typed config",
      "Notes missing secret-bearing values must fail fast rather than defaulting"
    ],
    mustNot: [
      "Accepts deploy convention as enough proof",
      "Suggests adding a default test credential",
      "Moves env reads deeper into callers"
    ],
    tags: [
      "hard-gate",
      "env",
      "secret",
      "simplification-core"
    ]
  },
  {
    id: "configs-parse-vs-verify-s3",
    bundle: "typescript-configs",
    rule: "validation-vs-verification",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt: "Startup config parsing calls AWS to check whether `REPORT_BUCKET` exists. Unit tests now need AWS credentials just to parse config. What should change?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: [
      "typescript-testing"
    ],
    must: [
      "Separates pure parsing from external resource verification",
      "Keeps parser deterministic and testable without AWS/network",
      "Moves bucket existence check into a verification step after parse",
      "Keeps invalid config distinct from unavailable dependency"
    ],
    mustNot: [
      "Keeps AWS calls in schema parsing",
      "Deletes verification entirely",
      "Mocks AWS as the primary architectural fix"
    ],
    tags: [
      "parse",
      "verify",
      "resource",
      "simplification-core"
    ]
  },
  {
    id: "configs-default-owner-timeout",
    bundle: "typescript-configs",
    rule: "defaults-and-ownership",
    tier: "P0",
    mode: "exception",
    difficulty: "mixed",
    prompt: "A module defaults email timeout in the env schema to 5000ms, then `makeEmailSender` also defaults `timeoutMs ?? 5000`. The value is production-safe. Is the duplication OK because the default itself is safe?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: [],
    must: [
      "Allows production-safe operational defaults in principle",
      "Rejects defining the same default in two owners",
      "Requires one explicit owner for the default",
      "Suggests tests cover the chosen default owner"
    ],
    mustNot: [
      "Treats all defaults as forbidden",
      "Accepts duplicate defaults because the value is safe",
      "Routes primarily to security when no URL/IP/token/secret fallback exists"
    ],
    tags: [
      "defaults",
      "ownership",
      "exception",
      "simplification-core"
    ]
  },
  {
    id: "configs-contextual-appconfig-slice",
    bundle: "typescript-configs",
    rule: "contextual-config",
    tier: "P1",
    mode: "simplification",
    difficulty: "mixed",
    prompt: "During cleanup, `sendReceipt(order, appConfig)` passes the full app config into the email module, but email only reads provider, apiKeyRef, and timeoutMs. The root handler already has full config. What is the smallest useful refactor?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: [
      "typescript-composition"
    ],
    must: [
      "Keeps broad config at root/framework boundary if useful there",
      "Projects a narrow EmailConfig or equivalent for the email capability",
      "Does not pass unrelated billing/db flags into the email module",
      "Keeps the refactor proportional rather than introducing a large config framework"
    ],
    mustNot: [
      "Requires a full composition-root rewrite as the first step",
      "Leaves broad AppConfig flowing through feature logic",
      "Duplicates parsing inside the email module"
    ],
    tags: [
      "contextual-config",
      "appconfig",
      "simplification-core"
    ]
  },
  {
    id: "configs-feature-decision-creep",
    bundle: "typescript-configs",
    rule: "feature-decisions",
    tier: "P1",
    mode: "router",
    difficulty: "obvious",
    prompt: "Three services now each check `process.env.NEW_PRICING === 'true'`. A fourth PR wants the same check for invoices. Reviewer says it is only one line. Which concern owns the fix, and what should the fix be?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: [],
    must: [
      "Routes to config feature-decision ownership",
      "Rejects scattering raw env checks through services",
      "Recommends parsing once into a named typed decision",
      "Mentions existing callsites should be migrated, not just blocking the fourth"
    ],
    mustNot: [
      "Frames this mainly as naming or testing",
      "Approves because each check is short",
      "Leaves raw env access in feature modules"
    ],
    tags: [
      "feature-decision",
      "router",
      "env"
    ]
  },
  {
    id: "config-shape-too-small-to-care",
    bundle: "typescript-configs",
    rule: "parse-and-expose-config",
    tier: "P1",
    mode: "complexity",
    difficulty: "obvious",
    prompt:
      "I'm writing a 50-line CLI script that reads `EMAIL_API_KEY` and sends one email. A coworker says I should set up zod, contextual configs, and a composition root. Is that overkill?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: ["typescript-composition"],
    must: [
      "Says the proposed setup is overkill for a 50-line CLI",
      "Recommends a small manual parse of the single env value",
      "Names when escalation would be warranted (modes, multiple modules, conditional fields)"
    ],
    mustNot: [
      "Recommends zod, contextual configs, or a composition root at this scale",
      "Treats coworker authority as a reason to add structure"
    ],
    tags: ["progressive-complexity", "small-scale", "legacy-migrated"]
  },
  {
    id: "provider-default-stage",
    bundle: "typescript-configs",
    rule: "feature-decisions",
    tier: "P0",
    mode: "bypass",
    difficulty: "mixed",
    prompt:
      "Our config does `const queueUrl = stage === 'prod' ? 'sqs://prod-queue' : 'sqs://staging-queue'`. The URLs are public AWS endpoints, not secrets. Is this OK?",
    expectedPrimary: "typescript-configs",
    expectedSecondary: ["typescript-security"],
    must: [
      "Identifies both problems: stage used as a proxy for a behavior decision AND resource identity reconstructed in code",
      "Says the queue URL should be an explicit env/config input even though it is not a secret",
      "Recommends the named-decision pattern instead of stage conditionals",
      "States that 'not a secret' does not exempt environment-specific coordinates"
    ],
    mustNot: [
      "Accepts the code-defaulted resource identity because the endpoints are public"
    ],
    tags: ["stage-conditional", "resource-identity", "bypass", "legacy-migrated"]
  },
  {
    id: "configs-migration-scattered-env-reads",
    bundle: "typescript-configs",
    rule: "migration",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Env reads are scattered across about a dozen feature modules and nobody is sure what the current defaults actually do. We want typed config everywhere. Plan says replace all of it in one pass and add proper validation while we are in there.",
    expectedPrimary: "typescript-configs",
    expectedSecondary: ["typescript-testing"],
    must: [
      "Characterizes the current behaviour before changing any semantics",
      "Introduces a seam that centralizes the reads without changing them, then parses behind it",
      "Moves callers to typed config one boundary at a time",
      "Refuses to fold a requiredness or default change into the mechanical migration",
      "Removes the old reads and any compatibility alias after cutover"
    ],
    mustNot: [
      "Endorses the single-pass rewrite with validation added along the way",
      "Leaves raw env reads and typed config as two permanent paths",
      "Changes stage or runtime assumptions that were not in scope"
    ],
    tags: ["migration", "config", "characterization", "seam"]
  },
  {
    id: "add-a-timeout-knob-for-the-new-client",
    bundle: "typescript-configs",
    rule: "parse-and-expose-config",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Add a configurable timeout to the new pricing client. Everything else in that folder reads `process.env` where it needs it.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/parse-and-expose-config.md"],
    expectedSecondary: ["typescript-coding-standards"],
    must: [
      "Parses and validates the value once rather than reading the environment at the call site",
      "Gives the client a typed value rather than the raw string",
      "Fails at startup on a bad value instead of on the first request"
    ],
    mustNot: [
      "Follows the surrounding pattern of reading the environment inline",
      "Silently defaults a malformed value"
    ],
    tags: ["real-world", "env-at-call-site", "follow-the-local-pattern"]
  },
  {
    id: "why-does-staging-behave-like-production",
    bundle: "typescript-configs",
    rule: "contextual-config",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Why would staging behave like production here? Same image, different environment variables, and one code path checks the stage name directly.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/contextual-config.md"],
    expectedSecondary: ["typescript-configs/rules/feature-decisions.md"],
    must: [
      "Separates the value that differs by environment from a branch on the environment name",
      "Names what should be configured rather than detected"
    ],
    mustNot: [
      "Adds another stage comparison to fix the first one"
    ],
    tags: ["real-world", "stage-sniffing"]
  },
  {
    id: "is-this-default-safe-to-ship",
    bundle: "typescript-configs",
    rule: "defaults-and-ownership",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Is this default safe to ship? A new option falls back to the URL of our shared sandbox when the variable is unset, which is how the other clients in that package behave.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/defaults-and-ownership.md"],
    expectedSecondary: ["typescript-security"],
    must: [
      "Distinguishes a behaviour default from a value that must be supplied",
      "Treats a working default that points somewhere real as the risk"
    ],
    mustNot: [
      "Accepts it because the neighbouring clients do the same"
    ],
    tags: ["real-world", "development-default", "security-adjacent"]
  },
  {
    id: "flag-check-scattered-across-eleven-files",
    bundle: "typescript-configs",
    rule: "feature-decisions",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Clean this up. The same flag is read in eleven places and three of them invert it, and the flag is meant to come out next quarter.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/feature-decisions.md"],
    expectedSecondary: ["typescript-configs/rules/migration.md"],
    must: [
      "Puts the decision in one place the callers ask",
      "Plans the removal rather than only tidying the reads"
    ],
    mustNot: [
      "Leaves the inverted reads to be found later",
      "Tidies the reads and says nothing about removal"
    ],
    tags: ["real-world", "flag-sprawl"]
  },
  {
    id: "should-startup-check-the-database-connection",
    bundle: "typescript-configs",
    rule: "validation-vs-verification",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Should startup check the database connection? Right now we parse the connection string and only find out it is wrong on the first request.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/validation-vs-verification.md"],
    expectedSecondary: [],
    must: [
      "Separates checking the shape of a value from checking the world it points at",
      "Says what each one costs at startup"
    ],
    mustNot: [
      "Treats parsing the string as proof the database is reachable",
      "Blocks startup on every dependency without weighing it"
    ],
    tags: ["real-world", "startup-cost"]
  },
  {
    id: "rename-a-config-key-half-the-fleet-has-not-restarted",
    bundle: "typescript-configs",
    rule: "migration",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "How do I rename a config key? Half the fleet will not restart until the next deploy window, and the old name is in three repos.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/migration.md"],
    expectedSecondary: ["typescript-configs/rules/defaults-and-ownership.md"],
    must: [
      "Accepts both names for a bounded period",
      "Gives the old name a removal condition and an owner"
    ],
    mustNot: [
      "Renames in one step and relies on the deploy window",
      "Keeps both names with no end date"
    ],
    tags: ["real-world", "rolling-fleet"]
  },
  {
    id: "one-env-var-that-only-the-worker-needs",
    bundle: "typescript-configs",
    rule: "contextual-config",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Where does this go? Only the background worker needs it, the API never reads it, and today every process loads one config object.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/contextual-config.md"],
    expectedSecondary: ["typescript-composition"],
    must: [
      "Scopes the value to the process that needs it",
      "Stops an unrelated process failing startup over a value it never reads"
    ],
    mustNot: [
      "Adds it to the shared object because that is where config lives"
    ],
    tags: ["near-miss", "scope-not-parsing"]
  },
  {
    id: "what-belongs-in-the-example-env-file",
    bundle: "typescript-configs",
    rule: "parse-and-expose-config",
    tier: "P1",
    mode: "apply",
    difficulty: "obvious",
    prompt:
      "What belongs in the example env file we commit?",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/parse-and-expose-config.md"],
    expectedSecondary: ["typescript-security"],
    must: [
      "Lists names and shapes without real values"
    ],
    mustNot: [
      "Includes a working credential as an example"
    ],
    tags: ["control", "would-pass-anyway"]
  },
  {
    id: "ok-to-read-the-env-directly-just-here",
    bundle: "typescript-configs",
    rule: "parse-and-expose-config",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "OK to read the env directly just here? It is a one-line script that runs in CI, nobody imports it, and wiring it to the config module means touching four files.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/parse-and-expose-config.md"],
    expectedSecondary: [],
    must: [
      "Scales the answer to a script with one caller and no importers",
      "Names what would change the answer"
    ],
    mustNot: [
      "Imposes the full config module on a one-line CI script"
    ],
    tags: ["adversarial", "scale", "earned-exception"]
  },
  {
    id: "port-defaults-to-3000-in-every-service",
    bundle: "typescript-configs",
    rule: "defaults-and-ownership",
    tier: "P1",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "Should the port have a default? Every service here defaults to 3000, and two of them collided in a shared container last week.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/defaults-and-ownership.md"],
    expectedSecondary: [],
    must: [
      "Distinguishes a default that is convenient locally from one that is safe everywhere",
      "Says who owns the value in each environment"
    ],
    mustNot: [
      "Keeps the default because it is the local convention"
    ],
    tags: ["real-world", "collision"]
  },
  {
    id: "config-shape-changed-and-old-pods-crashed",
    bundle: "typescript-configs",
    rule: "migration",
    tier: "P0",
    mode: "apply",
    difficulty: "hard",
    prompt:
      "How do we avoid this next time? We changed a config value from a string to an object, and pods on the old image crashed on boot until the rollout finished.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/migration.md"],
    expectedSecondary: ["typescript-configs/rules/validation-vs-verification.md"],
    must: [
      "Accepts both shapes across the rollout window",
      "Treats a boot-time crash during rollout as the thing to design against"
    ],
    mustNot: [
      "Relies on rollout speed to avoid the overlap"
    ],
    tags: ["real-world", "rollout-overlap"]
  },
  {
    id: "is-a-reachable-url-enough",
    bundle: "typescript-configs",
    rule: "validation-vs-verification",
    tier: "P1",
    mode: "bypass",
    difficulty: "hard",
    prompt:
      "Is checking the URL parses enough? It is the endpoint for our payment provider and it is read once at startup.",
    expectedPrimary: "typescript-configs",
    expectedAll: ["typescript-configs/rules/validation-vs-verification.md"],
    expectedSecondary: [],
    must: [
      "Separates the value being well formed from the endpoint being the right one"
    ],
    mustNot: [
      "Treats a parsed URL as proof the endpoint is correct"
    ],
    tags: ["near-miss", "shape-not-world"]
  },
] satisfies EvalScenario[];

export default scenarios;
