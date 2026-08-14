# TypeScript Testing Topic Index

**Use this topic when a change needs tests that protect behaviour without freezing incidental implementation.**

**This table is a gate, not a checklist.** Match the left column against what you can see in the change.

- **One rule per row.** Enter at the matched row.
- **Style against contracts.** Style decides where the test goes and what it looks like. Contracts decide what it is allowed to assert.
- **Read both before a risky refactor.** Characterize the behaviour first, then change the structure.

| If you see... | Read |
| --- | --- |
| new test, unfamiliar style, naming, coverage scope | `skill://typescript-skills/typescript-testing/rules/local-test-style.md` |
| refactor, brittle assertion, public contract question | `skill://typescript-skills/typescript-testing/rules/contracts-and-characterization.md` |
| tests reading or mutating `process.env` | `skill://typescript-skills/typescript-testing/rules/config-in-tests.md` |
| bootstrap or composition-root wiring | `skill://typescript-skills/typescript-testing/rules/composition-root-tests.md` |

**Default stance.** Test caller-visible behaviour and boundary contracts. Follow the local style, characterize uncertain behaviour before a risky refactor, and use a lighter proof where a test would only mirror wiring.

**Edges.**

- **How config is parsed and shaped belongs to configs.**
- **What the composition root assembles belongs to composition.**
- **Which errors a caller can distinguish belongs to error handling.**
- **Whether a boundary needs a mapper at all belongs to boundaries.**
