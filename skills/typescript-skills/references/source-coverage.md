# Source Coverage

This file maps the analyzed source docs from `C:/Users/Gabriel/.agents/skills/typescript-skills` to the simplified tree. Use it during migration to confirm no rule was silently dropped.

## Root References

| Source | Simplified location |
| --- | --- |
| `README.md` | root `SKILL.md` |
| `references/authoring-checklist.md` | `references/authoring-checklist.md` |
| `references/ecosystem-map.md` | `references/ownership.md` |
| `references/naming-and-ownership.md` | `references/ownership.md` |

## Coding Standards

| Source | Simplified location |
| --- | --- |
| `rules/earn-abstractions.md` | `typescript-coding-standards/rules/abstraction-and-local-reasoning.md` |
| `rules/preserve-local-reasoning.md` | `typescript-coding-standards/rules/abstraction-and-local-reasoning.md` |
| `rules/prefer-functions-unless-classes-earn-it.md` | `typescript-coding-standards/rules/functions-vs-classes.md` |
| `rules/name-by-reader-need.md` | `typescript-coding-standards/rules/naming-and-semantic-center.md` |
| `rules/keep-semantic-center-visible.md` | `typescript-coding-standards/rules/naming-and-semantic-center.md` |
| `rules/do-full-cutovers.md` | `typescript-coding-standards/rules/cutovers.md` |
| `references/abstraction-guide.md` | covered by coding rules; move only unique examples later |
| `references/naming-guide.md` | covered by `naming-and-semantic-center.md` |
| `references/red-flags.md` | distributed into `Avoid` sections |

## Boundaries

| Source | Simplified location |
| --- | --- |
| `rules/avoid-provider-types-deep-in-owned-code.md` | `typescript-boundaries/rules/provider-containment.md` |
| `rules/translate-foreign-semantics-at-the-edge.md` | `typescript-boundaries/rules/provider-containment.md` |
| `rules/boundary-mapping-only-when-earned.md` | `typescript-boundaries/rules/earned-mapping.md` |
| `rules/name-local-models-by-local-meaning.md` | `typescript-boundaries/rules/local-naming.md` |
| `rules/raw-input-vs-internal-model.md` | `typescript-boundaries/rules/raw-input-to-internal-model.md` |
| `references/*` | covered by boundary rules; move unique examples to snippets later if evals need them |

## Composition

| Source | Simplified location |
| --- | --- |
| `rules/composition-root-owns-runtime-decisions.md` | `typescript-composition/rules/composition-root.md` |
| `rules/keep-provider-selection-at-the-edge.md` | `typescript-composition/rules/composition-root.md` |
| `rules/pass-ready-dependencies-inward.md` | `typescript-composition/rules/ready-instance-vs-factory.md` |
| `rules/choose-factories-vs-ready-instances.md` | `typescript-composition/rules/ready-instance-vs-factory.md` |
| `rules/avoid-hidden-singletons-in-app-logic.md` | `typescript-composition/rules/dependency-scope.md` |
| `rules/keep-lifecycle-and-scope-out-of-behavior.md` | `typescript-composition/rules/dependency-scope.md` |
| `references/*` | covered by composition rules; move unique lifecycle examples later if evals need them |

## Configs

| Source | Simplified location |
| --- | --- |
| `rules/exposure-validated-config.md` | `typescript-configs/rules/parse-and-expose-config.md` |
| `rules/type-safety-parse-dont-assert.md` | `typescript-configs/rules/parse-and-expose-config.md` |
| `rules/where-to-validate.md` | `typescript-configs/rules/validation-vs-verification.md` |
| `rules/parse-shapes-verify-later.md` | `typescript-configs/rules/validation-vs-verification.md` |
| `rules/defaults-single-owner.md` | `typescript-configs/rules/defaults-and-ownership.md` |
| `rules/modularity-global-vs-local.md` | `typescript-configs/rules/contextual-config.md` and `typescript-configs/rules/defaults-and-ownership.md` |
| `rules/migration-incremental.md` | `typescript-configs/rules/migration.md` |
| `rules/start-simple.md` | `typescript-configs/rules/parse-and-expose-config.md` |
| framework/app-scale config concepts from references | `typescript-configs/rules/contextual-config.md` |
| feature flag named-decision guidance from supplied project skill | `typescript-configs/rules/feature-decisions.md` |
| explicit resource pointer guidance from supplied project skill | `typescript-configs/rules/validation-vs-verification.md` |
| config file layout and runtime assumption guidance from supplied project references | `typescript-configs/rules/parse-and-expose-config.md` and `typescript-configs/rules/migration.md` |
| `references/*` | covered by config rules; move unique gotchas into eval scenarios or snippets later |

## Security

| Source | Simplified location |
| --- | --- |
| `rules/load-secrets-later-than-config.md` | `typescript-security/rules/secrets-lifecycle.md` |
| `rules/avoid-test-secrets-as-defaults.md` | `typescript-security/rules/secrets-lifecycle.md` |
| `rules/keep-crypto-choices-explicit.md` | `typescript-security/rules/crypto-choices.md` |
| `rules/redact-secrets-in-errors-and-logs.md` | `typescript-security/rules/redaction.md` |
| `references/*` | covered by security rules; move pointer tables/snippets later if evals need them |

## Observability

| Source | Simplified location |
| --- | --- |
| user-requested logging/tracing guidance | `typescript-observability/SKILL.md` |
| meaningful/actionable logging concepts | `typescript-observability/rules/meaningful-logging.md` |
| OpenTelemetry/X-Ray boundary guidance | `typescript-observability/rules/tracing-boundary.md` |
## Testing

| Source | Simplified location |
| --- | --- |
| `rules/test-config-contracts.md` | `typescript-testing/rules/contracts-and-characterization.md` |
| `rules/characterize-before-refactor.md` | `typescript-testing/rules/contracts-and-characterization.md` |
| `rules/avoid-brittle-structure-assertions.md` | `typescript-testing/rules/contracts-and-characterization.md` |
| `rules/inject-config-in-tests.md` | `typescript-testing/rules/config-in-tests.md` |
| `rules/test-composition-roots-lightly.md` | `typescript-testing/rules/composition-root-tests.md` |
| `references/testing-boundaries-vs-internals.md` | `typescript-testing/rules/contracts-and-characterization.md` |
| local test style, behavior-first names, Given/When/Then guidance from supplied project skill | `typescript-testing/rules/local-test-style.md` |
