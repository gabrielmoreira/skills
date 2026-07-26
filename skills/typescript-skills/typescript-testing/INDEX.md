# TypeScript Testing Topic Index

Use when a TypeScript change needs tests that protect behavior without freezing incidental implementation.

| If you see... | Read |
| --- | --- |
| new test, unfamiliar style, naming, coverage scope | `skill://typescript-skills/typescript-testing/rules/local-test-style.md` |
| refactor, brittle assertion, public contract question | `skill://typescript-skills/typescript-testing/rules/contracts-and-characterization.md` |
| tests reading or mutating `process.env` | `skill://typescript-skills/typescript-testing/rules/config-in-tests.md` |
| bootstrap or composition-root wiring | `skill://typescript-skills/typescript-testing/rules/composition-root-tests.md` |

Default: test caller-visible behavior and boundary contracts. Follow local style, characterize uncertain behavior before risky refactors, and use a lighter proof when a test would only mirror wiring or implementation detail.
