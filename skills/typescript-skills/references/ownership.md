# Ownership

This file keeps routing authority in one place without a separate manifest. Each topic should have one canonical owner. Other skills may cross-link, but should not duplicate the rule.

## Topic Ownership

| Topic | Owner | Canonical entry |
| --- | --- | --- |
| Abstraction cost, local reasoning | `typescript-coding-standards` | `rules/abstraction-and-local-reasoning.md` |
| Function vs class choice | `typescript-coding-standards` | `rules/functions-vs-classes.md` |
| Naming by reader need, semantic center | `typescript-coding-standards` | `rules/naming-and-semantic-center.md` |
| Full cutovers and staged migration exceptions | `typescript-coding-standards` | `rules/cutovers.md` |
| Type narrowing over assertion (`!`, `as`, `as unknown as`, `@ts-ignore`) | `typescript-coding-standards` | `rules/type-narrowing-over-assertion.md` |
| Vertical discipline: blank lines, comment labels, extraction progression | `typescript-coding-standards` | `rules/vertical-discipline.md` |
| Provider, SDK, API, generated types | `typescript-boundaries` | `rules/provider-containment.md` |
| Raw input vs internal model | `typescript-boundaries` | `rules/raw-input-to-internal-model.md` |
| Earned boundary mapping | `typescript-boundaries` | `rules/earned-mapping.md` |
| Local names for provider-derived concepts | `typescript-boundaries` | `rules/local-naming.md` |
| Composition root and runtime decisions | `typescript-composition` | `rules/composition-root.md` |
| Dependency lifecycle, singleton, scope | `typescript-composition` | `rules/dependency-scope.md` |
| Ready dependency vs factory | `typescript-composition` | `rules/ready-instance-vs-factory.md` |
| Config parsing and typed exposure | `typescript-configs` | `rules/parse-and-expose-config.md` |
| Contextual module/feature config vs god app config | `typescript-configs` | `rules/contextual-config.md` |
| Config validation vs dependency verification | `typescript-configs` | `rules/validation-vs-verification.md` |
| Production-safe behavior defaults (timeouts, retries, limits) and config ownership boundaries | `typescript-configs` | `rules/defaults-and-ownership.md` |
| Feature flags, modes, and named behavior decisions | `typescript-configs` | `rules/feature-decisions.md` |
| Config migration from legacy env reads | `typescript-configs` | `rules/migration.md` |
| Meaningful logging and branch/outcome diagnostics | `typescript-observability` | `rules/meaningful-logging.md` |
| Tracing, OpenTelemetry, X-Ray, telemetry adapters | `typescript-observability` | `rules/tracing-boundary.md` |
| Secrets, environment-specific coordinates, URL/host/IP/endpoint/token/credential fallbacks, and secret sources | `typescript-security` | `rules/secrets-lifecycle.md` |
| Crypto mode/config choices | `typescript-security` | `rules/crypto-choices.md` |
| Redaction in errors/logs | `typescript-security` | `rules/redaction.md` |
| Local test style, behavior-first names, validation scope | `typescript-testing` | `rules/local-test-style.md` |
| Contract tests and characterization | `typescript-testing` | `rules/contracts-and-characterization.md` |
| Config injection in tests | `typescript-testing` | `rules/config-in-tests.md` |
| Composition-root smoke tests | `typescript-testing` | `rules/composition-root-tests.md` |

## Cross-reference Policy

- Cross-link with one sentence and a path to the owner.
- Do not restate another skill's rule unless the local exception changes the decision.
- If two skills seem to own the same decision, update this file or the root router first.
- Prefer one canonical rule plus focused snippets over repeated examples in multiple files.
