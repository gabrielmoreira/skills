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
  }
] satisfies EvalScenario[];

export default scenarios;
