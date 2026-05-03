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
- You are adding a wrapper, helper, interface, base type, manager, registry, or service layer.
- The same decision or policy appears in multiple owned places.
- A caller must know too much about sequencing, defaults, retries, naming, or provider detail.
- A local file is hard to reason about because important behavior is scattered.

Start here:
- Keep code direct and local when one caller can understand the behavior without hidden sequencing or repeated policy.

Escalate when:
- The same policy appears in two or more places.
- A caller must know order, defaults, retry/failure policy, or provider details that should be owned elsewhere.
- A name can remove real reader burden because it names a domain decision, not just a line of code.

Complexity ladder:
1. Direct code in the caller.
2. Local named helper for repeated unsafe detail.
3. Module-level function for one reusable policy.
4. Small object/factory when dependencies or lifecycle must be assembled.
5. Interface/class only for a boundary, plugin seam, lifecycle, identity, or published API.

Do:
- Keep direct code when it is clearer than a named abstraction.
- Extract the smallest abstraction that owns one policy or variation point.
- Name the abstraction by the decision it protects, not by a generic pattern word.
- Keep the semantic center visible at the callsite or one jump away.

Avoid:
- Thin wrappers that only rename an existing call.
- Interfaces with one implementation and no boundary pressure.
- `Base*`, `Manager`, `Helper`, or `Util` names that hide the real decision.
- Moving code away only to make a file look shorter.

Exceptions:
- A one-implementation interface is acceptable at a real boundary, such as test seam, provider seam, plugin seam, or published API.
- A small helper is acceptable when it removes duplicated unsafe detail and has a specific name.

Example:

Start direct when the policy is not repeated:

```ts
await mailer.send({ to: user.email, template: "welcome" });
```

Escalate when retry and audit policy repeats:

```ts
export async function sendAuditedWelcomeEmail(input: {
  mailer: Mailer;
  audit: AuditLog;
  user: User;
}) {
  await retry(() =>
    input.mailer.send({ to: input.user.email, template: "welcome" }),
  );

  await input.audit.record("welcome-email-sent", { userId: input.user.id });
}
```

Do not jump straight to `BaseEmailService` or `EmailManager` unless identity, lifecycle, or multiple implementations are real.

Verify:
- Identify the policy the abstraction owns in one sentence.
- Check that callers know less after the change.
- Check that the abstraction has more than naming value.
- If the abstraction is removed, there should be a real repeated policy or boundary problem that returns.
