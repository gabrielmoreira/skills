---
id: typescript-coding-standards.vertical-discipline
owner: typescript-coding-standards
canonical: true
severity: default
references: [Newspaper Metaphor (Clean Code), Extract Method, Template Method (GoF)]
---

# Vertical Discipline

Decision: Minimize vertical noise inside functions. Blank lines between blocks often signal extraction opportunities. When a function must stay unified, replace blank separators with short comment labels.

Use when:
- A function has blank lines separating logical blocks.
- A method requires scrolling to read fully.
- Code reviewers or agents add blank lines to "organize" a long function.
- A function body grows past roughly 25-30 lines with visual gaps.

Start here:
- Remove blank lines between tightly related statements.
- If removal makes intent unclear, add a short comment label on the line where the blank was.

Escalate when:
- Two or more blank-separated blocks have distinct responsibilities.
- The function body exceeds one screen (~40-50 lines) even after removing blanks.
- A block repeats across callers.

Complexity ladder:
1. Remove blank lines; code reads fine without them.
2. Replace blank line with a short comment label (`// validate`, `// persist`, `// notify`).
3. Extract a named function for the block — template method when the skeleton is the interesting part.
4. Compose via small functions called in sequence when the orchestration is the only top-level concern.

Do:
- Keep functions readable without scrolling when practical.
- Use comment labels instead of blank lines when separation is needed inside a function.
- Extract when comment labels reveal distinct responsibilities that repeat or grow.
- Prefer template method or composed calls when the skeleton of the algorithm is the design, not the steps.

Avoid:
- Blank lines as visual "breathing room" inside short functions.
- Large functions held together by blank-line separation instead of extraction.
- Extracting trivially small blocks just to avoid all blank lines — extraction must earn itself.
- Deep nesting to avoid extraction; flatten with early return and then extract.

Exceptions:
- Top-level module structure (between imports, between exported declarations) uses blank lines normally.
- Test files may use blank lines between Given/When/Then when it improves scan readability, but prefer comment labels.
- A function with 2-3 lines per block and no scrolling pressure does not need extraction.

Example:

Before — blank lines as separators:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrder(input);

  const saved = await deps.db.save(validated);

  await deps.mailer.send(saved.email, formatReceipt(saved));

  await deps.audit.record("order-processed", { orderId: saved.id });

  return saved;
}
```

After — no blanks needed, it reads fine:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrder(input);
  const saved = await deps.db.save(validated);
  await deps.mailer.send(saved.email, formatReceipt(saved));
  await deps.audit.record("order-processed", { orderId: saved.id });
  return saved;
}
```

When a longer function needs visual structure — comment labels instead of blank lines:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  // validate
  const validated = validateOrder(input);
  if (!validated.email) throw new MissingEmailError(input.id);
  // persist
  const saved = await deps.db.save(validated);
  const receipt = formatReceipt(saved);
  // notify
  await deps.mailer.send(saved.email, receipt);
  await deps.audit.record("order-processed", { orderId: saved.id });
  return saved;
}
```

When comment labels reveal extractable responsibilities — template method:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateAndPrepare(input);
  const saved = await persistOrder(validated, deps.db);
  await notifyOrderProcessed(saved, deps);
  return saved;
}
```

Verify:
- Check functions for unnecessary blank lines between tightly related statements.
- Check long functions with blank separators for extraction opportunities.
- Check that remaining blank-line separators are replaced with comment labels when the function stays unified.
- Check the function fits on one screen or close to it.
