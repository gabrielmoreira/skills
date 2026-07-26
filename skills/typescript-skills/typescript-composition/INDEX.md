# TypeScript Composition Topic Index

Use this topic when code decides what dependencies exist, how long they live, or which runtime implementation is selected.

## Rule Routing

| If you see... | Read |
| --- | --- |
| provider/client selected inside behavior code | `skill://typescript-skills/typescript-composition/rules/composition-root.md` |
| singleton, cache, pool, memoization, request scope | `skill://typescript-skills/typescript-composition/rules/dependency-scope.md` |
| question of ready dependency vs factory | `skill://typescript-skills/typescript-composition/rules/ready-instance-vs-factory.md` |
| logger/tracer/exporter lifecycle or provider setup | `skill://typescript-skills/typescript-observability/INDEX.md` plus `skill://typescript-skills/typescript-composition/rules/composition-root.md` |

## Owns

- Composition roots and runtime decisions.
- Dependency lifecycle and scope.
- Ready dependency vs factory decisions.
- Provider/client selection at startup or assembly time.

## Does Not Own

- Provider response/request type mapping: read `skill://typescript-skills/typescript-boundaries/INDEX.md`.
- Config parsing that feeds construction: read `skill://typescript-skills/typescript-configs/INDEX.md`.
- Composition-root tests: read `skill://typescript-skills/typescript-testing/INDEX.md`.
- Meaningful logging/tracing design: read `skill://typescript-skills/typescript-observability/INDEX.md`.

## Default

Assemble dependencies at the edge. Pass ready dependencies inward unless construction must vary at call time.
