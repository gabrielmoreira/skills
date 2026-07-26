# Authoring Checklist

Use this checklist when creating or editing a TypeScript skill rule.

## Required Rule Shape

Every canonical rule is operational: it tells the agent what to choose, when to choose it, and how to verify it. Say each idea exactly once — no restating the Decision inside Do, no restating Do inside Verify.

```md
---
id: bundle.rule-name
owner: bundle-name
canonical: true
severity: hard-gate | default | advisory
references: [recognized sources]
---

# Human-readable title

Decision: One sentence that chooses the default behavior.

Use when:
- Deterministic trigger (include escalation signals here when the right answer changes with scale)

Do:
- Imperative rule (a compact numbered ladder may appear here when progression IS the rule)

Avoid:
- Concrete anti-pattern

Exceptions:
- Behavior-changing deviation only (omit the section if none)

Example:
- At most one compact example; a wrong-vs-right contrast only when essential. Elide non-essential bodies with `/* ... */`.

Verify:
- Max 4 checks not already stated above
```

`Decision:`, `Use when:`, `Do:`, `Avoid:`, `Verify:` are mandatory markers (enforced by `evals/check-invariants.ts`). `Start here:` / `Escalate when:` / `Complexity ladder:` are optional — use a compact ladder only when structure-proportional-to-pressure is the rule's core, and fold escalation signals into `Use when:` otherwise.

## Style Rules

- Keep the root `skill://typescript-skills/SKILL.md` as a router, not an essay. Keep each internal `INDEX.md` as a topic router, not a skill.
- Minimalism is structure proportional to pressure, not refusal to abstract. Guard both failure modes: over-engineering (jumping to framework/registry hierarchies) and under-engineering (hiding behind "simple" after repeated pressure).
- Respect framework conventions (Next.js, React Native/Expo, NestJS); show where owned boundaries begin behind the framework edge.
- Replace subjective terms with signals; do not rely only on words like `earned`, `small`, or `clean`.
- If a rule has legitimate exceptions, write them; do not phrase defaults as absolutes.
- If a rule is a hard safety gate, say so directly and make verification concrete.
- When examples depend on scale, label them simple, medium, large, or framework-shaped.

## Rule Severity

| Severity | Use for | Language |
| --- | --- | --- |
| `hard-gate` | Security, secrets, correctness claims, parsing unknown input before use | Direct prohibition and required verification |
| `default` | Design preferences with real exceptions | Default plus escalation criteria |
| `advisory` | Naming/rationale guidance | Recommendation plus examples |

## Before Adding a New Rule

- Search existing rules for the same decision; each topic has exactly one canonical owner (the topic `INDEX.md` `Owns` sections define ownership).
- If an existing rule owns it, edit that rule instead of adding a parallel one.
- If the new topic crosses bundles, update the tie-breakers in `skill://typescript-skills/SKILL.md`.

## Before Promoting the Installed Skill

- `node evals/check-invariants.ts` exits 0.
- Add or update scenarios in the topic's `evals/*.scenarios.ts`; run at least one routing and one pressure scenario for the changed topic.
