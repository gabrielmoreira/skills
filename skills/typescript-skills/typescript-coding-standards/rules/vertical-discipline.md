---
id: typescript-coding-standards.vertical-discipline
owner: typescript-coding-standards
canonical: true
severity: default
references: [Newspaper Metaphor (Clean Code), Step-Down Rule (Clean Code), Extract Method (Fowler), Single Level of Abstraction Principle (SLAP), Template Method (GoF)]
---

# Vertical Discipline

Decision: When a function needs visual structure to be readable, walk a small ladder — comment labels first, then extraction by responsibility, then template method. Prefer a top-down / step-down file layout: outer orchestration first, deeper helpers below in the order the reader encounters them. Blank lines are not a defect on their own; they often point to where extraction is hiding.

Use when:
- A function has visually distinct blocks (validation / persist / notify, parse / decide / emit).
- A function doesn't fit on one screen and is hard to scan.
- Reviewers add headings, blank lines, or comments to "organize" a long function.
- The same block recurs in two or more functions, or one function mixes levels of abstraction.
- A reader must jump up and down the file to follow helpers that could read top-down instead.

Ladder:
1. Read the function as one unit — if it summarizes in one sentence and fits on a screen, leave it alone.
2. Label blank-line groups inline (`// validate`, `// persist`, `// notify`) as a cheap test of "one thing or many?" Forced-feeling labels mean the function is fine as-is.
3. If labels map to clear, specific names (`validateOrderInput`, not `doWork`), extract one helper per label (Extract Method).
4. Compose the top-level function from helpers at one level of abstraction (template method / SLAP) — orchestrators orchestrate, doers do.
5. Move helpers behind a module boundary once they grow their own contracts.

Escalate past step 2 when a block calls 2-3+ collaborators, repeats across callers, or the function still needs scrolling after labeling.

Do:
- Use comment labels as a discovery tool, not decoration — they're free and reveal extraction candidates.
- Extract by responsibility and naming clarity, not by visual gap or line count.
- Use early return to flatten nesting before deciding to extract.
- Put the outer entrypoint first, deeper helpers below, while the file still reads as one unit.
- Within the same helper depth, order helpers the way the caller encounters them (`a` before `b`, `b1` before `b2`).
- Let blank lines exist where they aid readability.

Avoid:
- Extracting trivially small blocks just to shorten a function.
- Hiding orchestration inside a deep call chain when top-down reading would be clearer.
- Replacing a clear blank-line block with a vague `// section` comment that adds no information.
- Naming extracted helpers `processStep1`, `doWork`, `handleIt`.
- Putting orchestration below deep helpers, or reordering same-depth helpers arbitrarily.

Exceptions:
- Module-level blank lines (between imports/exports) and test Given/When/Then spacing are normal.
- A short function with 2-3 lines per visual group needs no extraction — the structure is the design.
- Tightly-related tiny helpers may stay adjacent for local comprehension even if not in perfect call order; recursion or required export order can override step-down layout.

Example:

Before — blank-line groups are candidate extractions:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  // validate
  if (!input.email) throw new MissingEmailError(input.id);
  if (input.items.length === 0) throw new EmptyCartError(input.id);
  const normalized = { ...input, email: input.email.toLowerCase() };
  // persist
  const saved = await deps.db.transaction(async (tx) => {
    const order = await tx.orders.insert(normalized);
    await tx.items.insertMany(order.id, normalized.items);
    return order;
  });
  // notify
  await deps.mailer.send(saved.email, formatReceipt(saved));
  await deps.audit.record("order-processed", { orderId: saved.id });
  return saved;
}
```

After — labels turned out to be real responsibilities; extracted top-down, orchestration first:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrderInput(input);
  const saved = await persistOrder(validated, deps.db);
  await notifyOrderProcessed(saved, deps);
  return saved;
}

function validateOrderInput(input: OrderInput): NormalizedOrder { /* ... */ }
async function persistOrder(order: NormalizedOrder, db: DB) { /* ... */ }
async function notifyOrderProcessed(order: SavedOrder, deps: NotifyDeps) { /* ... */ }
```

Verify:
- Did labels feel natural, or forced? Forced usually means the function is fine as one unit.
- Does each extracted helper's name say what it does, not how?
- Can a reader scroll top to bottom without hunting upward for the next helper, with same-depth helpers in caller order?
- Did the function shrink because responsibilities moved out, or only because lines disappeared? Only the first is real.
