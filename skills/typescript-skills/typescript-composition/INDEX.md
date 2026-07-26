# TypeScript Composition Topic Index

Use when deciding which dependencies exist, how long they live, or which runtime implementation is selected.

| If you see... | Read |
| --- | --- |
| provider or client selected inside behavior code | `skill://typescript-skills/typescript-composition/rules/composition-root.md` |
| singleton, cache, pool, memoization, request scope | `skill://typescript-skills/typescript-composition/rules/dependency-scope.md` |
| ready dependency versus factory | `skill://typescript-skills/typescript-composition/rules/ready-instance-vs-factory.md` |
| logger, tracer, or exporter construction | `skill://typescript-skills/typescript-observability/INDEX.md` and `skill://typescript-skills/typescript-composition/rules/composition-root.md` |

Default: assemble runtime choices at the edge. Pass ready dependencies inward unless construction must vary per call.
