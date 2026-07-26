---
id: typescript-coding-standards.vertical-discipline
owner: typescript-coding-standards
canonical: true
severity: default
references: [Newspaper Metaphor (Clean Code), Step-Down Rule (Clean Code), Extract Method (Fowler), Single Level of Abstraction Principle (SLAP), Template Method (GoF)]
---

# Vertical Discipline

Decision: Make the main path easy to follow. Respect local file order; when none exists, place orchestration before supporting detail and extract only genuine responsibilities.

Use when:
- A function mixes decisions, infrastructure, and formatting.
- Readers must jump through helpers to reconstruct one flow.
- Comments or blank-line sections compensate for unclear responsibilities.
- Repeated blocks represent one nameable operation.

Do:
- First read the function as a whole; leave cohesive code together.
- Use short comments for stages when extraction would hide context.
- Extract a block when it has a stable name, contract, or independent test value.
- Keep helpers near their caller unless reuse or ownership gives them a better home.
- Prefer repository and framework conventions over a universal top-down layout.

Avoid:
- Extracting every visual block or enforcing one-screen functions.
- Template-method or class hierarchies for simple sequencing.
- Mixing abstraction levels that force the reader to simulate infrastructure while following a decision.
- Reordering established files only to satisfy this style preference.

Verify:
- The primary behavior can be summarized and followed without excessive jumping.
- Every extraction improves cohesion or creates a real boundary.
- Comments explain intent or stages, not syntax.
- The result matches local organization and is easier to re-enter.
