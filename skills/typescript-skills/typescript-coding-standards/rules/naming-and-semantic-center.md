---
id: typescript-coding-standards.naming-and-semantic-center
owner: typescript-coding-standards
canonical: true
severity: advisory
references: [Ubiquitous Language (DDD), Intention-Revealing Names (Clean Code)]
---

# Naming and Semantic Center

Decision: Name code by what the reader needs to understand at the callsite, and keep the important decision visible.

Use when:
- A name describes implementation instead of meaning.
- A boolean, mode, status, or branch hides the behavior that matters.
- A reader must open several helpers to learn what the code really does.
- Local code uses provider/framework words that are not local meaning.

Do:
- Name by local meaning, caller promise, or policy.
- Put the important conditional, mode, or choice where the reader naturally looks.
- Prefer specific names over role words like `handle`, `process`, `manage`, or `data`.
- Keep names stable when they describe local meaning rather than current implementation.

Avoid:
- Names that only repeat type information.
- Names borrowed from providers when local semantics differ.
- Hiding the domain decision behind generic helper chains.
- Abbreviations that require private context.

Exceptions:
- Preserve external field names at edge modules when matching wire/provider shape is the point.
- Keep standard vocabulary when the ecosystem term is clearer than a local invention.

Verify:
- Ask what a tired maintainer would infer from the name without opening the implementation.
- Check whether the name remains true if the implementation changes.
- If a branch changes behavior, check that its name exposes the behavioral difference.
