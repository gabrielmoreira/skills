# Roadmap

This roadmap lists coverage gaps, improvements to existing rules, and alignment with recognized best practices. For current tree state (counts of rules, references, evals), see `references/review-notes.md`. Items are ordered by priority within each phase.

---

## Phase 1 — High-priority gaps

New bundles or rules covering areas with no canonical guidance today.

### 1.1 Error handling strategy (status: resolved)

Resolved: canonical guidance now lives in `typescript-error-handling`.

Canonical rules:
- `define-app-error-semantics-early.md` — define a canonical app-owned error model, structured attachments, factories, and enrichment helpers before the codebase fragments.
- `throw-vs-result.md` — choose one propagation style per package while reusing the same canonical error data.
- `error-classification.md` — classify by semantic family and explicit retry mode instead of technical origin alone.
- `error-shape-and-metadata.md` — structure root semantic payload, normalized cause data, metadata, retry/http extensions, and runtime-cause guidance.
- `error-boundary-contract.md` — project canonical internal errors into safe public boundary shapes with explicit redaction.

Pressure signals that motivated the bundle remain relevant:
- `raw-input-to-internal-model` requires distinguishable failures but does not define app error semantics by itself.
- `validation-vs-verification` separates parse from verification but does not own the full error contract.
- Testing covers failure-shape assertions but does not own project-wide error semantics.
### 1.2 Async control and cancellation (status: resolved)

Resolved: canonical guidance now lives in `typescript-async`.

Canonical rules:
- `parallel-and-dependencies.md` — sequential await only when values depend on previous results; independent work runs in parallel; unbounded/rate-limited work uses bounded concurrency.
- `cancellation-and-abort.md` — pass `AbortSignal` as a cancellation capability and propagate it through fetches, waits, effects, and composed operations.
- `cleanup-and-teardown.md` — release acquired resources deterministically with `finally`, dispose protocols, or `using`/`await using` when runtime support is verified.
- `process-lifecycle.md` — handle SIGTERM/SIGINT with readiness flip, drain, ordered shutdown, hard deadline, and observability flush.
- `retry-and-backoff.md` — retry only classified backoff-retryable failures; honor upstream hints; require idempotency/deduplication for retried mutating operations.

Pressure signals that motivated the bundle remain relevant:
- Observability covers trace/log signals but not concurrency control.
- Composition covers dependency lifecycle but not operation-level cancellation, cleanup, and retry mechanics.
### 1.3 Module and package surface design

Status: no coverage.
Suggested bundle: rules inside `typescript-coding-standards` or dedicated bundle `typescript-modules`.

Candidate rules:
- `package-surface.md` — barrel files, `index.ts` as explicit public API, re-export policy. Progressive: no barrel until external consumers exist, barrel earned when package boundary justifies it.
- `circular-dependency-prevention.md` — dependency direction, layering, how to detect and break cycles.
- `import-side-effects.md` — side-effect imports are boundaries; isolate them, do not hide inside pure modules.

Pressure signals:
- Cutovers mentions re-export cleanup but not package structure.
- Composition assumes a clean dependency graph but does not teach how to maintain it.

### 1.4 API contract design

Status: no coverage.
Suggested bundle: `typescript-api-contracts`.

Candidate rules:
- `error-shape-contract.md` — REST status codes and error body shape, GraphQL error extensions, stable error codes. Cross-link with error-handling.
- `pagination-and-versioning.md` — cursor vs offset, backward compatibility, versioning strategy. Progressive: no versioning until a real breaking change, cursor when dataset grows.
- `idempotency.md` — idempotency keys, retry safety, at-least-once semantics.

Pressure signals:
- Boundaries covers provider shapes entering the code, but not shapes the code itself exposes.
- Testing mentions API seams but not the contract design.

### 1.5 Database and ORM boundaries

Status: no coverage.
Suggested bundle: `typescript-persistence` or rules inside `typescript-boundaries`.

Candidate rules:
- `repository-boundary.md` — repository as boundary between domain and persistence. ORM entities do not leak into business logic. Progressive: direct query functions, repository module when queries grow, explicit transaction boundary when multi-step.
- `migration-safety.md` — backward-compatible migrations, deploy-order awareness, data migration vs schema migration.
- `query-discipline.md` — N+1 detection, DataLoader/batching for GraphQL, query builder vs raw SQL boundaries.

Pressure signals:
- Provider containment teaches not to leak SDK types but does not cover ORM entities specifically.
- Config validation-vs-verification separates parse from verify, but database connection is the most common verification.

### 1.6 Type system design (status: resolved)

Resolved: positive type-system guidance now lives in `typescript-coding-standards`:
- `rules/branded-and-opaque-types.md` — nominal typing for domain primitives
- `rules/exhaustive-narrowing.md` — discriminated unions + `assertNever`
- `rules/generics-and-conditional-types.md` — generics with minimum constraints, mapped + conditional types, `infer`
Future positive type-system gaps should be added only when they are not already covered by the resolved rules above.

Pressure signals that motivated the bundle remain relevant:
- Type narrowing covers assertions and boundary proof; these rules cover positive type design.
- Config and boundary rules use discriminated unions as examples, but this bundle owns when to choose and enforce them.

---

## Phase 2 — Medium-priority gaps

Smaller rules or areas that affect day-to-day agent work less frequently.

### 2.1 Build and package system

Candidate rules:
- `esm-cjs-interop.md` — `package.json` exports, module resolution, dual publish.
- `tree-shaking-safety.md` — side-effect annotations, barrel file cost, dead code.
- `tsconfig-discipline.md` — strict mode, path aliases, composite projects.

### 2.2 Monorepo and workspace boundaries

Candidate rules:
- `workspace-dependency-direction.md` — shared package ownership, cross-package import hygiene, internal vs published packages.
- `coordinated-cutovers.md` — multi-package migration, versioning of internal shared packages.

### 2.3 Performance, streaming, and memory

Candidate rules:
- `streaming-and-backpressure.md` — when to stream vs buffer, Node.js streams, backpressure.
- `hot-path-discipline.md` — allocation awareness, lazy loading, batching.

### 2.4 Code documentation and comment policy

Candidate rules:
- `comment-policy.md` — TSDoc/JSDoc for public API, invariant/rationale comments (`// SAFETY:`, `// WHY:`), stale comment cleanup.

### 2.5 Dependency hygiene and supply chain

Candidate rules:
- `dependency-policy.md` — version pinning, lockfile discipline, audit, peer dependency boundaries, minimize transitive risk.

### 2.6 CI/CD and delivery contracts

Candidate rules:
- `pipeline-contracts.md` — build/test/lint gates, artifact versioning, rollout checks, schema/config change safety.

---

## Phase 3 — Best practice alignment

Areas where the current tree covers the topic but alignment with recognized practices can improve.

### 3.1 Node.js runtime lifecycle (status: resolved)

Resolved: `typescript-async/rules/process-lifecycle.md` covers SIGTERM/SIGINT handlers, readiness flip, draining in-flight work, ordered resource shutdown, a hard deadline before forced exit, fail-loud unhandled error hooks, and observability flush before exit.

Remaining action: keep cross-links aligned with observability when tracing/log flushing guidance changes.

### 3.2 Twelve-Factor alignment (alignment: adequate)

Specific gaps:
- **Log streaming**: resolved. `meaningful-logging.md` Do-list now states: write structured logs to stdout/stderr; runtime/infra routes them (Twelve-Factor XI).
- **Dev/prod parity**: defaults-and-ownership prohibits dev defaults but does not mention parity explicitly. Consider a note in `review-notes.md` or `defaults-and-ownership.md`.
- **Port binding / concurrency**: out of immediate scope; framework-shaped apps already cover partially.

### 3.3 OWASP alignment (alignment: adequate)

Specific gaps:
- **Input validation / injection**: `raw-input-to-internal-model` parses inputs but does not mention injection prevention (SQL, NoSQL, command, SSRF). Add rule in `typescript-security`:
  - `input-safety.md` — SSRF prevention, parameterized queries, command injection, allowlist over denylist.
- **Authorization**: no rule covers authorization boundaries, RBAC/ABAC patterns, or permission checks. Candidate rule:
  - `authorization-boundary.md` — authorization as a boundary concern, not hidden in business logic.

### 3.4 Testing Trophy alignment (alignment: adequate)

Status: resolved.
- The tree does not prescribe unit/integration/e2e proportions. `local-test-style.md` previously preferred "unit, integration, e2e/API-driven" which diverged from the Testing Trophy.
- Resolved: `local-test-style.md` now says "Choose the test seam by what behavior changed; do not impose a fixed unit/integration/e2e proportion." The seam depends on the change.

### 3.5 TypeScript Handbook alignment (alignment: adequate)

Specific gaps:
- **Strict mode**: no rule requires `strict: true` in tsconfig. Add in `type-narrowing-over-assertion.md` or future `tsconfig-discipline.md`.
- **Exhaustiveness**: resolved via `typescript-coding-standards/rules/exhaustive-narrowing.md`.

---

## Phase 4 — Improvements to existing rules

Redundancies, ambiguities, and simplification opportunities in what already exists.

### 4.1 High redundancy: parse-and-expose + contextual-config

Problem: both teach "avoid AppConfig god object" with similar examples (`EmailConfig`, `BillingConfig`, `RuntimeConfig`).

Options:
- A) Move AppConfig avoidance guidance to `contextual-config.md` and narrow `parse-and-expose-config.md` to focus on parsing/typing/exposure. Parse-and-expose cross-links "see contextual-config for module slicing".
- B) Merge both into one rule. Risk: rule becomes too large.

Recommendation: option A. Parse-and-expose becomes smaller and more focused.

### 4.2 High redundancy: defaults-and-ownership + secrets-lifecycle

Problem: both prohibit localhost/sandbox/test-token defaults. Ownership.md assigns URL/IP/token fallbacks to security, but the configs router also sends those triggers to defaults-and-ownership.

Options:
- A) Defaults-and-ownership focuses on "defaults as production policy" (timeouts, retries, flags). Security owns URL/IP/credential/token/secret fallbacks completely. Defaults cross-links security for those.
- B) Keep duplication and accept the maintenance cost.

Recommendation: option A. Reduces conflict surface and aligns with ownership.md.

### 4.3 Medium redundancy: parser purity repeated in 3 rules

Problem: "do not fetch secrets in the parser" appears in `parse-and-expose-config`, `validation-vs-verification`, and `secrets-lifecycle`.

Action: keep the main prohibition in `validation-vs-verification` (parser purity) and in `secrets-lifecycle` (secret timing). `Parse-and-expose-config` cross-links both instead of repeating.

### 4.4 Medium redundancy: naming split coding-standards vs boundaries

Problem: `naming-and-semantic-center` and `local-naming` cover similar ground on "name should reflect local meaning, not provider/framework vocabulary".

Action: coding-standards owns naming in general. Boundaries `local-naming` focuses specifically on renaming concepts coming from providers/SDKs at the entry point. Add a demarcation sentence in each rule stating where the other's responsibility begins.

### 4.5 Medium redundancy: migration reuses cutover + characterization

Problem: `migration.md` repeats owner/removal-condition from `cutovers.md` and the characterization test pattern from `contracts-and-characterization.md`.

Action: `migration.md` cross-links both instead of restating. Keep only config-specific migration guidance (seam introduction, runtime assumption stability, env-read centralization).

### 4.6 Medium redundancy: provider-containment vs raw-input-to-internal-model

Problem: ownership boundary between provider SDK shapes and raw transport input (request/body/query/header) is not crisp.

Action: `provider-containment` owns SDK/API/generated types. `raw-input-to-internal-model` owns HTTP request/response/transport shapes, env-like input, and framework-provided objects. Add a demarcation line in the boundaries SKILL.md.

### 4.7 Improvement: root router missing "mapper" keyword

Problem: eval #12 noted that the root router does not mention "mapper" explicitly in triggers.

Action: add "mapper, mapping, transform" to the boundaries line in the root router.

### 4.8 Improvement: cross-link composition <-> coding-standards

Problem: eval #10 noted that the `makeReceiptSender` pattern lives in composition but `functions-vs-classes` in coding-standards also teaches `makeXxx`. Cross-link could be more explicit.

Action: add cross-link from `functions-vs-classes.md` to `composition/rules/ready-instance-vs-factory.md` and vice versa, one sentence each.

### 4.9 Improvement: eval system modernization

Action: replace the legacy monolithic behavioral eval file with phased, per-bundle scenario manifests after stabilizing current thresholds and invariants. Prioritize candidate-vs-gold regression checks so future rule simplification preserves critical behavior.

---

## Promotion criteria

Each roadmap item only advances to installed skills when:
1. Rule written following `references/authoring-checklist.md`.
2. Ownership updated in `references/ownership.md`.
3. Router(s) updated — root and/or bundle SKILL.md.
4. At least 2 eval scenarios added to `references/evaluation-plan.md` or the successor per-bundle scenario manifest.
5. Evals pass the current promotion gate: every scenario scores at least 2/3, hard-gates score 3/3, and the with-skill mean is at least 2.5/3.
6. Source coverage updated if rule came from external material.
7. No conflict with existing rules (check conflict audit).
