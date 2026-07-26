# TypeScript Testing Topic Index

Use this topic when a TypeScript change needs tests that protect behavior without freezing incidental implementation details.

## Rule Routing

| If you see... | Read |
| --- | --- |
| new test, unfamiliar package style, test naming, Given/When/Then, coverage scope | `skill://typescript-skills/typescript-testing/rules/local-test-style.md` |
| refactor, brittle assertion, helper-name assertion, public contract question | `skill://typescript-skills/typescript-testing/rules/contracts-and-characterization.md` |
| tests reading or mutating `process.env` | `skill://typescript-skills/typescript-testing/rules/config-in-tests.md` |
| test around bootstrap/composition/root wiring | `skill://typescript-skills/typescript-testing/rules/composition-root-tests.md` |

## Owns

- Local test style, behavior-first names, and validation scope.
- Contract tests and behavior-first assertions.
- Characterization before risky refactors.
- Config injection and env mutation in tests.
- Composition-root smoke tests.

## Does Not Own

- Config parser design: read `skill://typescript-skills/typescript-configs/INDEX.md`.
- Dependency lifecycle decisions: read `skill://typescript-skills/typescript-composition/INDEX.md`.
- Provider boundary design: read `skill://typescript-skills/typescript-boundaries/INDEX.md`.

## Default

Test caller-visible behavior and boundary contracts. Start from the local test style, use behavior-first names, and characterize uncertain behavior before refactoring.
