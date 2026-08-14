# Authoring Checklist

**How a skill is written and proved lives in `authoring-verifiable-skills`.** Read that first. This file carries only what is specific to this tree.

## What this tree adds

**Frontmatter, on every rule.**

```md
---
id: topic.rule-name
owner: topic-name
canonical: true
severity: hard-gate | default | advisory
references: [recognized sources]
---
```

- **`id` ends with the filename**, and starts with the owner. The checker enforces both.
- **`owner` matches the directory.** A mismatch fails.
- **`references` names outside sources.** It is a citation field, so a vendor name is fine here and nowhere else.

**Severity, which the general guide does not define.**

| Severity | Use for | Language |
| --- | --- | --- |
| `hard-gate` | security, secrets, correctness claims, parsing unknown input before use | direct prohibition, concrete verification |
| `default` | a design preference with real exceptions | the default, plus when to escalate |
| `advisory` | naming and rationale guidance | a recommendation, which loses to an established local convention |

**Framework reality.**

- **Respect the framework's conventions**, and show where owned boundaries begin behind its edge.
- **Label an example by scale** where the right answer changes with it. Simple, medium, large, or framework-shaped.
- **Guard both failure modes.** Jumping to a registry hierarchy, and hiding behind "simple" after the pressure has repeated.

## Before adding a rule

- **Search the existing rules for the same decision.** Each topic has exactly one canonical owner.
- **Edit the rule that owns it** rather than adding a parallel one.
- **Update the tie-breakers in the root router** where the new topic crosses two.

## Before promoting

```bash
node tools/check-all.mjs typescript-skills
node skills/typescript-skills/evals/check-invariants.ts
```

- **Both must exit clean.** The first is the portable suite, the second is this tree's own 27 invariants.
- **Add or update scenarios** in the topic's `evals/*.scenarios.ts`.
- **Run at least one routing scenario and one pressure scenario** for the changed topic.
