---
name: typescript-testing
description: Use when TypeScript work involves tests, local test style, behavior-first names, characterization before refactor, config tests, composition-root smoke tests, boundary contracts, or brittle structure assertions.
---

# TypeScript Testing

Use this skill when a TypeScript change needs tests that protect behavior without freezing incidental implementation details.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| new test, unfamiliar package style, test naming, Given/When/Then, coverage scope | `rules/local-test-style.md` |
| refactor, brittle assertion, helper-name assertion, public contract question | `rules/contracts-and-characterization.md` |
| tests reading or mutating `process.env` | `rules/config-in-tests.md` |
| test around bootstrap/composition/root wiring | `rules/composition-root-tests.md` |

## Owns

- Local test style, behavior-first names, and validation scope.
- Contract tests and behavior-first assertions.
- Characterization before risky refactors.
- Config injection and env mutation in tests.
- Composition-root smoke tests.

## Does Not Own

- Config parser design: use `../typescript-configs/SKILL.md`.
- Dependency lifecycle decisions: use `../typescript-composition/SKILL.md`.
- Provider boundary design: use `../typescript-boundaries/SKILL.md`.

## Default

Test caller-visible behavior and boundary contracts. Start from the local test style, use behavior-first names, and characterize uncertain behavior before refactoring.
