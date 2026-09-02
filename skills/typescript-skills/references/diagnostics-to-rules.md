# Diagnostics to Rules

**Entry point for a reported diagnostic**, when the tool named a problem and no rule name obviously matches it. Built from the diagnostics actually observed in this codebase, not from the full rule set of either tool.

- **This is an entry, not a substitute for the topic index.** Enter here, then read the rule and its index for the surrounding decisions.
- **A diagnostic is a symptom.** The rule owns the decision behind it, which is usually larger than the one line the tool flagged.
- **A row missing here is not a gap in the collection.** The last section says what is deliberately unowned.

| Reported diagnostic | Read |
| --- | --- |
| `no-floating-promises`, `no-misused-promises`, `await-thenable`, `require-await`, `sonarjs/no-try-promise` | `skill://typescript-skills/typescript-async/rules/promise-ownership.md` |
| `prefer-nullish-coalescing`, `prefer-optional-chain`, `no-unsafe-optional-chaining`, `sonarjs/no-undefined-argument`, `TS18048` | `skill://typescript-skills/typescript-coding-standards/rules/absence-and-defaults.md` |
| `no-require-imports`, `sonarjs/unused-import`, an unused `no-unused-vars` import, `TS2307`, `TS2305`, `TS2314`, `TS2724` | `skill://typescript-skills/typescript-coding-standards/rules/imports-and-module-graph.md` |
| `no-deprecated`, `sonarjs/deprecation` | `skill://typescript-skills/typescript-coding-standards/rules/cutovers.md` |
| `consistent-type-assertions`, `no-unnecessary-type-assertion`, `non-nullable-type-assertion-style`, an active `@ts-expect-error`, `TS2352` | `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md` |
| `no-explicit-any`, `no-unsafe-argument`, `no-unsafe-assignment`, `no-unsafe-call`, `no-unsafe-member-access`, `no-unsafe-return`, `TS18046`, `TS70xx` implicit any, **where the value came from outside** | `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md` |
| the same set, **where the value is owned** | `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md` |
| `TS2322`, `TS2339`, `TS2345`, `TS2353`, `TS2551`, `TS2554`, `TS2722`, `TS2739`, `TS2740`, `TS2741`, `TS2769`, a shape that does not match, **across a provider or transport edge** | `skill://typescript-skills/typescript-boundaries/rules/provider-containment.md` |
| `no-useless-catch`, `sonarjs/no-ignored-exceptions`, `preserve-caught-error`, `prefer-promise-reject-errors` | `skill://typescript-skills/typescript-error-handling/rules/error-classification.md` |
| `no-unsafe-enum-comparison`, `no-duplicate-enum-values`, `sonarjs/different-types-comparison`, `sonarjs/no-small-switch` | `skill://typescript-skills/typescript-coding-standards/rules/exhaustive-narrowing.md` |
| `sonarjs/no-hardcoded-secrets`, `no-hardcoded-passwords`, `no-hardcoded-ip`, `no-clear-text-protocols`, `x-powered-by` | `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md` |
| `sonarjs/pseudo-random`, `sonarjs/slow-regex` | `skill://typescript-skills/typescript-security/rules/crypto-choices.md` |
| `sonarjs/cognitive-complexity`, `no-identical-functions`, `no-nested-conditional`, `no-nested-functions`, `prefer-single-boolean-return` | `skill://typescript-skills/typescript-coding-standards/rules/abstraction-and-local-reasoning.md` |
| `sonarjs/no-dead-store`, `sonarjs/no-commented-code`, `no-useless-assignment`, `no-warning-comments` | `skill://typescript-skills/typescript-coding-standards/rules/vertical-discipline.md` |
| `no-shadow`, `no-redeclare`, `sonarjs/no-globals-shadowing`, `sonarjs/class-name` | `skill://typescript-skills/typescript-coding-standards/rules/naming-and-semantic-center.md` |
| `no-console` | `skill://typescript-skills/typescript-observability/rules/meaningful-logging.md` |
| any `jest/` rule, `sonarjs/no-skipped-tests` | `skill://typescript-skills/typescript-testing/INDEX.md` |

**Deliberately unowned.**

- **Style and idiom.** `array-type`, `consistent-generic-constructors`, `consistent-indexed-object-style`, `dot-notation`, `no-inferrable-types`, `prefer-includes`, `prefer-regexp-exec`, `prefer-string-starts-ends-with`, `no-var`, `prefer-const`, `no-irregular-whitespace`, `sonarjs/concise-regex`, `no-nested-template-literals`.
- **Apply the tool's own fix.** These carry no design decision, so a rule for them would be the linter restated.
- **Where a suppression is being considered instead**, that is a decision, and `skill://typescript-skills/typescript-coding-standards/rules/type-narrowing-over-assertion.md` owns it.
