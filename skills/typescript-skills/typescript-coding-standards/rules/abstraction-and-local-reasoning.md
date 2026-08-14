---
id: typescript-coding-standards.abstraction-and-local-reasoning
owner: typescript-coding-standards
canonical: true
severity: default
references: [YAGNI, Rule of Three, Locality of Behavior]
---

# Abstraction and Local Reasoning

Decision: Add an abstraction only when it makes the caller easier to understand and gives one clear place to enforce a real policy.

Use when:
- Adding a wrapper, helper, interface, base type, manager, registry, or service layer — especially when a name would remove real reader burden by naming a domain decision, not just a line of code.
- The same decision or policy already appears in two or more owned places.
- A caller must know order, defaults, retry/failure policy, or provider detail that should be owned elsewhere.

Do:
- Keep code direct and local when one caller can understand the behavior without hidden sequencing or repeated policy.
- Stop at the first step of this ladder that works: local named helper for repeated unsafe detail → module-level function for one reusable policy → small object/factory when dependencies or lifecycle must be assembled → interface/class only for a real boundary, plugin seam, lifecycle, identity, or published API.
- Extract the smallest abstraction that owns one policy or variation point, name it after the decision it protects, and keep the semantic center visible at the callsite or one jump away.

Avoid:
- Thin wrappers that only rename an existing call, or moving code away just to make a file look shorter.
- Interfaces with one implementation and no real boundary pressure, or `Base*`/`Manager`/`Helper`/`Util` names that hide the real decision.

Exceptions: a one-implementation interface is fine at a real boundary (test seam, provider seam, plugin seam, published API); a small helper is fine when it removes duplicated unsafe detail and has a specific name.

Example — direct when policy isn't repeated; escalate once retry/audit policy repeats (don't jump straight to `BaseEmailService`/`EmailManager` unless identity or lifecycle is real):

```ts
// direct, single caller:
await mailer.send({ to: user.email, template: "welcome" });

// escalated, policy now repeats across callers:
export async function sendAuditedWelcomeEmail(input: { mailer: Mailer; audit: AuditLog; user: User }) {
  await retry(() => input.mailer.send({ to: input.user.email, template: "welcome" }));
  await input.audit.record("welcome-email-sent", { userId: input.user.id });
}
```

Verify:
- Identify the policy the abstraction owns in one sentence, and confirm callers know less after the change.
- Check the abstraction has more than naming value.
- If removed, a real repeated policy or boundary problem should return.
