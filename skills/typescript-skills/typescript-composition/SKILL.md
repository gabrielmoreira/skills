---
name: typescript-composition
description: Use when TypeScript work involves dependency construction, composition roots, factories, lifecycle, scope, singletons, caching, or runtime provider selection.
---

# TypeScript Composition

Use this skill when code decides what dependencies exist, how long they live, or which runtime implementation is selected.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| provider/client selected inside behavior code | `rules/composition-root.md` |
| singleton, cache, pool, memoization, request scope | `rules/dependency-scope.md` |
| question of ready dependency vs factory | `rules/ready-instance-vs-factory.md` |
| logger/tracer/exporter lifecycle or provider setup | `../typescript-observability/SKILL.md` plus `rules/composition-root.md` |

## Owns

- Composition roots and runtime decisions.
- Dependency lifecycle and scope.
- Ready dependency vs factory decisions.
- Provider/client selection at startup or assembly time.

## Does Not Own

- Provider response/request type mapping: use `../typescript-boundaries/SKILL.md`.
- Config parsing that feeds construction: use `../typescript-configs/SKILL.md`.
- Composition-root tests: use `../typescript-testing/SKILL.md`.
- Meaningful logging/tracing design: use `../typescript-observability/SKILL.md`.

## Default

Assemble dependencies at the edge. Pass ready dependencies inward unless construction must vary at call time.
