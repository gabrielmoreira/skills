# TypeScript Skills

This folder is a namespace for small, focused TypeScript skills.

The installable skill directories in this namespace are the `typescript-*` folders.
Shared ecosystem references live in top-level `references/`.

## How to use this namespace

1. Start from the bundle that best matches the problem.
2. Read that bundle's `SKILL.md` first.
3. Follow the rule that matches the decision in front of you.
4. Open a snippet when code teaches faster than prose.
5. Open a reference only when you need more depth.

## Which bundle should I open?

- Config shape, defaults, env, or parse-vs-verify questions → `typescript-configs/`
- Dependency assembly, factories, lifecycle, or provider selection → `typescript-composition/`
- DTOs, provider semantics, local models, or translation at the edge → `typescript-boundaries/`
- Characterization tests, config contract tests, or avoiding brittle test assertions → `typescript-testing/`
- Secrets, redaction, crypto-sensitive settings, or risky security defaults → `typescript-security/`
- Naming, abstraction, function-vs-class, local reasoning, or cutover hygiene → `typescript-coding-standards/`

## What each installable skill usually contains

- `SKILL.md`
- `rules/`
- `snippets/`
- `references/`
- `evals/evals.json` for content behavior
- `evals/trigger-evals.json` for skill-trigger checks

## Current bundles

- `typescript-configs/` — config parsing, ownership, defaults, exposure, and config type safety
- `typescript-composition/` — composition roots, dependency assembly, lifecycle, and provider selection
- `typescript-boundaries/` — raw input vs local models, edge translation, and naming by local meaning
- `typescript-testing/` — characterization tests, contract tests, and boundary-safe testing
- `typescript-security/` — secret sources, redaction, crypto-adjacent choices, and safe runtime checks
- `typescript-coding-standards/` — naming, earned abstractions, local reasoning, and semantic clarity

## Namespace rules

- keep `SKILL.md` small
- keep rules atomic
- put theory in `references/`
- prefer snippets when code teaches faster than prose
- keep bundle ownership clear and overlap low
