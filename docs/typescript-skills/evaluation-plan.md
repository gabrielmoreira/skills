# Evaluation Plan

Plan evals now; run them before installing or promoting these skills into `~/.agents/skills`. This draft tree is not deployment-proven until the evals pass.

## Goal

Verify that agents route to the smallest correct TypeScript skill, then apply the canonical rule without loading the entire collection or inventing parallel conventions.

## Method

For each scenario:

1. Run a baseline attempt without explicitly pointing at the focused skill.
2. Run with the root `typescript-skills` router available.
3. Score whether the agent opened the intended primary skill, used secondary skills only when needed, and applied the canonical rule.
4. Capture rationalizations or missed exceptions and update the smallest relevant rule.

## Scoring

| Score | Meaning |
| --- | --- |
| 0 | Wrong skill or no relevant rule used |
| 1 | Right area, but missed canonical rule or exception |
| 2 | Right primary skill and mostly correct application |
| 3 | Right primary skill, justified secondary skill if needed, concrete verification |

Passing target: every scenario scores at least 2/3, hard-gate scenarios score 3/3, and the with-skill mean is at least 2.5/3 as an aggregate health signal. The mean cannot hide a per-scenario failure.

Progressive-design scenarios also require the agent to pick the correct rung: start with the smallest honest design, escalate only when the scenario includes pressure signals, and avoid jumping to the maximum abstraction.

## Router Scenarios

| Scenario | Expected primary | Secondary if needed |
| --- | --- | --- |
| Provider SDK response type is imported by service logic | `typescript-boundaries` | `typescript-coding-standards` for local naming |
| Startup chooses Stripe vs Adyen client | `typescript-composition` | `typescript-boundaries` if shapes enter behavior |
| Env var parser returns raw strings into feature modules | `typescript-configs` | `typescript-testing` for config contract tests |
| Refactor changes helper names but public behavior stays same | `typescript-testing` | `typescript-coding-standards` if names are changed |
| Secret ARN appears in config and logs include config object | `typescript-security` | `typescript-configs` for pointer parsing |
| Code adds OpenTelemetry/X-Ray imports inside a service module | `typescript-observability` | `typescript-composition` for bootstrap/lifecycle |

| Agent describes a "mapper" or "transform" task without naming a skill | `typescript-boundaries` |, |
| Agent describes adding a "translator" between provider responses and domain | `typescript-boundaries` | `typescript-coding-standards` for naming |
## Bundle Pressure Scenarios

### Coding Standards

- Agent wants to add `BaseService`, `IManager`, or a pass-through wrapper for one caller. Expected: require earned abstraction signals or keep direct code.
- Agent wants a class only to group related functions with shared dependencies. Expected: prefer a `makeXxx` capability object with closure-private dependencies/state unless lifecycle, protocol, framework, or measured allocation pressure earns a class.
- Agent wants to keep old and new implementations in parallel after migration. Expected: default clean cutover unless staged migration has explicit owner, boundary, and removal condition.

- Agent uses `as Type` on a JSON response or external data instead of parsing/narrowing. Expected: hard fail; parse at boundary, return typed result.
- Agent uses `!` on an optional property or Map `.get()` without checking. Expected: hard fail; add narrowing check or throw on missing value.
- Agent uses `as unknown as Type` to force an incompatible shape in production code. Expected: hard fail; fix the type mismatch or add a parser.
- Agent uses `as` in a test mock to build a partial fake. Expected: allow with typed builder (`makeTestUser`) or `Partial<T>` wrapper; discourage raw `as` even in tests.
### Boundaries

- Agent sees provider field `status: 'paid' | 'failed'` and local concept `isSettled`. Expected: map at the edge if semantics differ.
- Agent creates a mapper that only renames one field for one callsite. Expected: reject ceremony unless mapping earns its cost.

### Composition

- Agent imports a configured singleton client inside business logic. Expected: move construction/selection to composition root and pass ready dependency inward.
- Agent injects a factory where a stable ready instance is enough. Expected: prefer ready instance unless per-call inputs, request scope, tenant, or lifecycle requires factory.

### Configs

- Agent uses `process.env.FOO!` or `as number`. Expected: parse unknown input into typed config.
- Agent validates an S3 bucket exists during config parsing. Expected: parse shape first; verify external dependencies later.
- Agent adds the same default in schema and caller. Expected: one explicit default owner.
- Agent defaults `API_BASE_URL` to localhost, a sandbox URL, or a private IP. Expected: reject the default and require the value explicitly; local dev must provide explicit config.
- Agent defaults a token/password/API key to a test value. Expected: hard fail under `typescript-security`; no secret or credential defaults.
- Agent defaults a retry count or timeout. Expected: allow only if production-safe, owned once by contextual config, and tested.
- Agent passes a broad `AppConfig` into an email module that uses only email fields. Expected: introduce contextual `EmailConfig`; root/framework entrypoint may keep broad config while adapting it.
- Agent scatters `process.env.USE_X === "true"` checks through handlers or services. Expected: parse once into a named feature decision and pass typed decision inward.
- Agent validates mode-specific requiredness only in a raw env schema with cross-field refinements. Expected: build final config object first, then validate that contract.
- Agent reconstructs bucket/table/queue/resource names from stage inside application code. Expected: pass explicit resource pointers through typed config unless preserving an entrenched convention.
- Agent reads `typescript-configs` for a localhost URL fallback question. Expected: routed to `typescript-security/rules/secrets-lifecycle.md`; `defaults-and-ownership.md` does not own URL/IP/token fallbacks.
- Agent reads `defaults-and-ownership.md` looking for token/credential fallback guidance. Expected: rule defers to `secrets-lifecycle.md` and lists security-bearing values as out of scope.
- Agent treats request/body/query parsing as `provider-containment.md` territory. Expected: routed to `raw-input-to-internal-model.md`; provider-containment owns vendor SDK/generated types only.
- Agent treats Stripe SDK type containment as `raw-input-to-internal-model.md` territory. Expected: routed to `provider-containment.md`; raw-input owns HTTP transport/env-like input only.
- Agent looks for general naming guidance in `local-naming.md`. Expected: routed to `naming-and-semantic-center.md`; local-naming covers provider-derived names only.
- Agent looks for "long function" or "split function" guidance in `naming-and-semantic-center.md`. Expected: routed to `vertical-discipline.md` (locality and extraction).

### Security

- Agent sets test credential as production fallback. Expected: hard fail; no test secret defaults.
- Agent logs a config object containing secret values or ambiguous pointers. Expected: redact according to `typescript-security/rules/redaction.md`.
- Agent models crypto with `secure: boolean`. Expected: explicit mode/discriminated choice.

### Observability

- Agent adds `logger.error(error)` with no context, or dumps raw request/config/provider objects. Expected: keep the `Error` instance when the logger serializes errors, but add meaningful structured context and security redaction.
- Agent adds logs only on happy path while important branches are silent. Expected: log meaningful branch decisions or add span events with reason codes.
- Agent imports OpenTelemetry or X-Ray SDK directly inside business logic. Expected: move vendor setup to observability adapter/bootstrap and pass a small observability capability inward.
- Agent creates spans with dynamic names or sensitive/high-cardinality attributes. Expected: stable span names, safe bounded attributes, span events for branch decisions.


### Error Handling

- Agent starts a new service with ad hoc error objects in different modules. Expected: define one canonical app-owned error model first, with root semantic fields and structured attachments, before arguing about throw vs Result.
- Agent returns `null` or throws custom `Error` subclasses ad hoc for a parser with 3 distinct failure modes. Expected: follow the package propagation decision; class-based packages wrap canonical error data in family wrappers, Result-based packages return discriminated error data. No mixed style inside one package.
- Agent retries a business or validation failure. Expected: reject; retry is an explicit classification/attachment concern, and caller-fault errors are not retried.
- Agent boundary returns raw `error.message` from Stripe/DB/Mongo to the client. Expected: translate once at the edge to an owned projected shape with stable `code` and `errorId`; keep normalized cause and runtime cause internal by default.
- Agent adds new error fields directly on random subclasses instead of using root `details`, `normalizedCause`, or `metadata`. Expected: preserve the canonical shape and structured attachment boundaries.

### Async

- Agent sees three independent sequential `await`s. Expected: `Promise.all`.
- Agent sees 5000 IDs in `Promise.all` with 429s. Expected: bounded concurrency + honor `Retry-After`; no serial-only \"fix\".
- Agent writes `fetch()` in a React effect without `AbortController`. Expected: add signal and abort on cleanup; stale fetch races are a bug.
- Agent adds `for (let i=0; i<3; i++) { try/catch sleep }` retry loop. Expected: exponential backoff + full jitter + attempt cap + abort awareness; retryability decided by error classification.
- Agent adds a server with no SIGTERM handler. Expected: process-lifecycle rule with drain, readiness flip, hard deadline, observability flush.
### Testing

- Agent asserts helper name, private field, or dependency graph snapshot. Expected: test caller-visible behavior unless structure is the contract.
- Agent characterizes legacy behavior before refactor. Expected: allowed temporary characterization with label and removal/revisit condition.
- Agent mutates `process.env` in many tests. Expected: inject config or isolate env mutation through restore helper only for config boundary tests.
- Agent writes `test("works")` or introduces a new test style without checking local patterns. Expected: use behavior-first name and start from local test style.
- Agent adds Given/When/Then comments to a trivial test where they add no clarity. Expected: omit ceremony or use shorter variant.
- Agent uses coverage target to justify brittle helper-name assertions. Expected: coverage is guidance; protect behavior at the right seam.

## Progressive Complexity Scenarios

| Scenario | Expected behavior |
| --- | --- |
| One email sender reads one required key | Manual config parser; no schema framework unless failure-shape pressure is present |
| Email config gains provider modes with conditional fields | Escalate to discriminated schema; do not keep ad hoc string checks scattered |
| Medium app has email and billing config in one `AppConfig` | Parse once, then pass `EmailConfig` and `BillingConfig` slices to modules; avoid god config in features |
| NestJS/Next.js/Expo exposes config through framework conventions | Respect the framework entrypoint/provider/hook, then adapt to contextual module config before owned feature logic |
| Missing `API_BASE_URL` would default to localhost or staging | Reject the fallback; endpoint/URL/IP values are required unless the default is genuinely production-correct |
| Missing timeout/retry config has a production-safe default | Allow the default if one contextual owner defines it and tests cover it |
| Feature flag supports false, true, or scoped allowlist | Parse once into a named union decision; application code consumes typed decision |
| Config file mixes env loading, stage parsing, feature flags, typed config, and resource naming | Split config layout only after file earns it; keep small packages in one file |
| Existing runtime stage convention is messy but out of scope | Preserve current assumption; characterize before migration and do not introduce speculative stage model |
| New test is added in package with existing local style | Match local seam and behavior-first naming; use Given/When/Then only if it improves clarity |
| One SDK response is used only in an adapter | Keep provider type at the edge; no mapper hierarchy |
| Provider statuses collapse into local states in two services | Add a named mapper near the boundary |
| Stable app-scoped mailer is used by receipt sending | Pass ready dependency inward; no factory |
| Receipt sending needs shared mailer/audit dependencies and small private stats | Use `makeReceiptSender` returning functions with closure-private scope; do not introduce a class unless lifecycle/protocol pressure exists |
| Tenant-specific mailer depends on order tenant | Escalate to a tenant factory with explicit scope |
| Legacy config fallback must be preserved during refactor | Characterize behavior, label temporary fallback, and add removal/revisit condition |
| Secret-bearing config is logged during startup failure | Redact with allowlisted safe context, not broad object logging |
| Important branch chooses fallback/provider/retry path | Add structured log or span event with branch name and reason code, not raw payload dump |
| OpenTelemetry or X-Ray is needed from project start | Initialize/export at framework/composition edge; owned code depends on local observability port |
| Library/package wants telemetry | Use local observability port or OpenTelemetry API only; do not initialize SDK/exporter in library code |
| Agent writes `response.json() as OrderResponse` | Parse at boundary with schema or manual narrowing; do not assert |
| Agent writes `user.contact!.email` on optional contact | Narrow with `if` check or throw on missing; do not use `!` |
| Test needs partial User for a mock | Use typed builder `makeTestUser(overrides)` or `Partial<User>`; avoid raw `as User` |

## Promotion Checklist

- Root router sends each scenario to the expected primary skill.
- Each subskill router points to the correct canonical rule.
- Each canonical rule has `Decision`, `Use when`, `Start here`, `Escalate when`, `Complexity ladder`, `Do`, `Avoid`, `Exceptions`, `Example`, and `Verify` when the rule changes with scale.
- Hard-gate scenarios include concrete verification.
- Any recurring rationalization is addressed in the smallest owning rule.

## Regression Invariants (programmatic)

These invariants are checked by `evals/check-invariants.ts`. Any failure blocks promotion.

- Root router triggers include keywords for every bundle: provider, mapper, transform, env, config, secret, credential, log, trace, test.
- No rule outside `typescript-security/` defines code defaults for URL, host, IP, token, password, API key, credential, secret, DSN, or connection string.
- `provider-containment.md` Use-when does not include "request body", "query", "headers", "webhook", "transport".
- `raw-input-to-internal-model.md` Use-when does not include "SDK", "provider", "generated".
- Every canonical rule has frontmatter with `id`, `owner`, `canonical`, `severity`, `references`.
- Every canonical rule contains `Decision:`, `Use when:`, `Do:`, `Avoid:`, `Verify:` sections.
- All code fences are balanced.
- `references/ownership.md` lists exactly one canonical owner per topic; no topic is owned twice.
- Root router includes the `mapper`/`transform` keyword set on the boundaries row.
- `local-test-style.md` does not contain the phrase "unit, integration, e2e" as a prescribed ordering.
