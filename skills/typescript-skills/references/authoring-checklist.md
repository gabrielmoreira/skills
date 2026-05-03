# Authoring Checklist

Use this checklist when creating or editing a TypeScript skill rule.

## Required Rule Shape

Every canonical rule should be operational: it must tell the agent what to choose, when to choose it, when to stop, and how to verify it.

```md
---
id: bundle.rule-name
owner: bundle-name
canonical: true
severity: hard-gate | default | advisory
---

# Human-readable title

Decision: One sentence that chooses the default behavior.

Use when:
- Deterministic trigger
- Deterministic trigger

Start here:
- Smallest honest solution for the first version.

Escalate when:
- Concrete pressure signal that proves the first version is no longer enough.

Complexity ladder:
1. First useful form.
2. Next smallest stronger form.
3. Higher form only after stronger pressure.

Do:
- Imperative rule
- Imperative rule

Avoid:
- Concrete anti-pattern
- Concrete anti-pattern

Exceptions:
- Allowed deviation and required evidence

Example:
- One small bad/good or start/escalate example when the rule affects code shape.

Verify:
- How to prove adherence
```

## Complexity Ladder Rule

Minimalism is structure proportional to pressure, not refusal to abstract.

For design rules where the right answer changes as a project grows, include:

- `Start here`: the smallest correct design.
- `Escalate when`: observable signals that the current form is no longer enough.
- `Complexity ladder`: the next level, not the maximum framework.
- `Example`: one small code shape that shows the first level and the escalation trigger.
- `Application shape`: examples should make clear whether they target a simple script, medium modular app, large multi-team app, or framework-shaped app.

This prevents two common agent failures:

- over-engineering: jumping from direct code to framework/registry/adapter hierarchy;
- under-engineering: hiding behind "simple" after repeated pressure appears.
- framework-hostile abstraction: fighting Next.js, React Native/Expo, NestJS, or similar conventions instead of using their entrypoints as boundaries.

## Style Rules

- Keep `SKILL.md` files as routers, not essays.
- Put long rationale in references only when it is still needed.
- Use ASCII labels: `Decision`, `Use when`, `Start here`, `Escalate when`, `Complexity ladder`, `Do`, `Avoid`, `Exceptions`, `Example`, `Verify`.
- Avoid emoji prefixes as required syntax.
- Prefer one canonical good/bad or start/escalate example over repeated variants.
- When examples depend on scale, label them as simple, medium, large, or framework-shaped.
- Replace subjective terms with signals. Do not rely only on words like `earned`, `small`, `edge`, `clean`, or `real`.
- If a rule has legitimate exceptions, write the exception. Do not phrase it as an absolute.
- If a rule is a hard safety gate, say so directly and make verification concrete.
- Respect framework conventions, but show where owned module boundaries begin behind the framework edge.

## Rule Severity

| Severity | Use for | Language |
| --- | --- | --- |
| `hard-gate` | Security, secrets, correctness claims, parsing unknown input before use | Direct prohibition and required verification |
| `default` | Design preferences with real exceptions | Default plus escalation criteria |
| `advisory` | Naming/rationale guidance that improves readability | Recommendation plus examples |

## Before Adding a New Rule

- Check `references/ownership.md` for the canonical owner.
- Search existing rules for the same decision.
- If an existing rule owns it, edit that rule instead of adding a parallel rule.
- If the new topic crosses bundles, update root `SKILL.md` tie-breakers.

## Before Promoting to Installed Skills

- Add or update evaluation scenarios in `references/evaluation-plan.md`.
- Run at least one routing scenario and one pressure scenario for the changed skill.
- Record whether the agent opened the intended focused skill and applied the canonical rule.
