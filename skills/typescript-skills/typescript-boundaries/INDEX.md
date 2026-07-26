# TypeScript Boundaries Topic Index

Use when external shapes meet owned code. Keep foreign semantics at the edge and expose smaller local models inward.

| If you see... | Read |
| --- | --- |
| provider, SDK, or generated type in business logic | `skill://typescript-skills/typescript-boundaries/rules/provider-containment.md` |
| raw request, env-like value, CLI arg, or untyped JSON passed inward | `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md` |
| proposed mapper or adapter | `skill://typescript-skills/typescript-boundaries/rules/earned-mapping.md` |
| local model named with provider vocabulary | `skill://typescript-skills/typescript-boundaries/rules/local-naming.md` |

Provider containment covers foreign SDK types; raw-input handling covers untrusted transport data. A payload may need both parsing and translation.

Default: translate at the edge when ownership or meaning changes. Do not add a mapper that only renames fields.
