---
id: typescript-coding-standards.abstraction-and-local-reasoning
owner: typescript-coding-standards
canonical: true
severity: default
references: [YAGNI, Rule of Three, Locality of Behavior]
---

# Abstraction and Local Reasoning

Decision: **Add an abstraction only where it makes the caller easier to understand and gives one clear place to enforce a real policy.** Where the result sits, and how the flow reads afterwards, belongs to `skill://typescript-skills/typescript-coding-standards/rules/vertical-discipline.md`.

Use when:
- **Something structural is being added.**
  - A wrapper or a helper.
  - An interface or a base type.
  - A manager, a registry, or a service layer.
- **The same decision or policy already appears in two or more owned places.**
- **A caller must know something it should not.**
  - Ordering.
  - Defaults.
  - Retry or failure policy.
  - Provider detail.

Do:
- **Keep code direct and local** where one caller can follow it without hidden sequencing or repeated policy.
- **Stop at the first step of this ladder that works.**
  - A local named helper, for repeated unsafe detail.
  - A module-level function, for one reusable policy.
  - A small object or factory, once dependencies or lifecycle must be assembled.
  - An interface or class, only for a real boundary, plugin seam, lifecycle, identity, or published API.
- **Extract the smallest abstraction that owns one policy or variation point.**
- **Name it after the decision it protects**, not after the code it moved.
- **Keep the semantic centre visible** at the callsite, or one jump away.

Avoid:
- **A thin wrapper that renames an existing call.**
- **Moving code away to make a file look shorter.**
- **An interface with one implementation and no boundary pressure.**
- **A name that hides the decision.** `Base`, `Manager`, `Helper`, `Util`.

Exceptions:
- **A one-implementation interface is fine at a real boundary.** A test seam, a plugin seam, or a published API.
- **A small helper is fine** where it removes duplicated unsafe detail and has a specific name.

Example (one instance, not the set):

```ts
// Direct, while there is one caller and no repeated policy.
await mailer.send({ to: user.email, template: "welcome" });

// Escalated, because retry and audit policy now repeat across callers.
export async function sendAuditedWelcomeEmail(input: { mailer: Mailer; audit: AuditLog; user: User }) {
  await retry(() => input.mailer.send({ to: input.user.email, template: "welcome" }));
  await input.audit.record("welcome-email-sent", { userId: input.user.id });
}
```

Verify:
- **Name the policy the abstraction owns, in one sentence.** Being unable to is the finding.
- **Confirm callers know less after the change than before it.**
- **Check the abstraction has more than naming value.**
- **Check that removing it would bring back a real repeated policy or boundary problem.**
