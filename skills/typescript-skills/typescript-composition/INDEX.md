# TypeScript Composition Topic Index

**Use this topic when deciding which dependencies exist, how long they live, or which runtime implementation gets selected.**

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **One rule per row.** Enter at the matched row.
- **A row naming two destinations means read both.**

| If you see... | Read |
| --- | --- |
| provider or client selected inside behavior code | `skill://typescript-skills/typescript-composition/rules/composition-root.md` |
| singleton, cache, pool, memoization, request scope | `skill://typescript-skills/typescript-composition/rules/dependency-scope.md` |
| ready dependency versus factory | `skill://typescript-skills/typescript-composition/rules/ready-instance-vs-factory.md` |
| logger, tracer, or exporter construction | `skill://typescript-skills/typescript-observability/INDEX.md` and `skill://typescript-skills/typescript-composition/rules/composition-root.md` |

**Default stance.** Assemble runtime choices at the edge, and pass ready dependencies inward unless construction must vary per call.

**Edges.**

- **Retry and cancellation mechanics belong to async.**
- **Redaction belongs to security.**
- **What goes inside an assembled unit belongs to coding standards.**
