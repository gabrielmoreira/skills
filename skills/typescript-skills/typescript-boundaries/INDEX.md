# TypeScript Boundaries Topic Index

**Use this topic where an external shape meets owned code.** Keep foreign semantics at the edge and expose a smaller local model inward.

**This table is a gate, not a checklist.** Match the left column against what you can see in the code.

- **Enter at the matched row, and read a second where the code matches two.** Say which of them owns the decision and why the other applies. What costs is reading every row, not reading two.
- **Containment against raw input.** Split by what the shape is: a vendor or generated type, against untrusted transport data. A payload may need both parsing and translation.
- **Mapping against naming.** Mapping decides whether a translation layer is earned. Naming decides what the result is called.

| If you see... | Read |
| --- | --- |
| provider, SDK, or generated type in business logic | `skill://typescript-skills/typescript-boundaries/rules/provider-containment.md` |
| raw request, env-like value, CLI arg, or untyped JSON passed inward | `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md` |
| proposed mapper or adapter | `skill://typescript-skills/typescript-boundaries/rules/earned-mapping.md` |
| local model named with provider vocabulary | `skill://typescript-skills/typescript-boundaries/rules/local-naming.md` |

**Default stance.** Translate at the edge when ownership or meaning changes. Do not add a mapper that only renames fields.

**Edges.**

- **General naming inside owned code belongs to coding standards.**
- **Retry and cancellation around a provider call belong to async.**
- **What a caller sees when translation fails belongs to error handling.**
- **Which dependency is selected, and how long it lives, belongs to composition.**
