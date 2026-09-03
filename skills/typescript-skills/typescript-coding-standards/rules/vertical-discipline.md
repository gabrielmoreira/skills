---
id: typescript-coding-standards.vertical-discipline
owner: typescript-coding-standards
canonical: true
severity: default
references: [Newspaper Metaphor (Clean Code), Step-Down Rule, Extract Method (Fowler), Single Level of Abstraction]
---

# Vertical Discipline

Decision: **Make the main path easy to follow.** Respect the file's local order, and where none exists apply the Step-Down Rule. Whether a thing should exist at all belongs to `skill://typescript-skills/typescript-coding-standards/rules/abstraction-and-local-reasoning.md`.

Use when:
- **A function mixes decisions, infrastructure, and formatting.**
- **A reader must jump through helpers** to reconstruct one flow.
- **Comments or blank-line sections are compensating** for unclear responsibilities.
- **A repeated block represents one nameable operation.**

Do:
- **Read the function whole first.** Cohesive code that reads well stays together.
- **Use a short stage comment** where extracting would hide the context.
- **Apply Extract Method once a block has a stable name, contract, or test value.** All three, ideally.
- **Keep a helper near its caller**, unless reuse or ownership gives it a better home.
- **Prefer the repository's convention** over a universal top-down layout.

Avoid:
- **Extracting every visual block**, or enforcing a one-screen function.
- **A template method or a class hierarchy for simple sequencing.**
- **Violating Single Level of Abstraction**, forcing readers to simulate low-level mechanics while following decisions.
- **Reordering an established file** only to satisfy a style preference.

Exceptions:
- **A generated or vendored file keeps its own order.**
- **A long switch or a state table MAY stay long** where splitting it would hide the very thing being read.

Example (one instance, not the set):

```ts
// The main path reads as one story; each stage sits below it.
export async function settleOrder(order: Order) {
  const payment = await capturePayment(order);
  const receipt = buildReceipt(order, payment);
  await deliverReceipt(receipt);
  return receipt;
}
```

Verify:
- **Check the primary behaviour can be summarised without much jumping.**
- **Check every extraction improved cohesion** or created a real boundary.
- **Check comments explain intent or a stage**, never syntax.
- **Check the result matches local organisation** and is easier to re-enter.
