---
id: typescript-coding-standards.vertical-discipline
owner: typescript-coding-standards
canonical: true
severity: default
references: [Newspaper Metaphor (Clean Code), Step-Down Rule (Clean Code), Extract Method (Fowler), Single Level of Abstraction Principle (SLAP), Template Method (GoF)]
---

# Vertical Discipline

Decision: When a function needs visual structure to be readable, walk a small ladder — comment labels first, then extraction by responsibility, then template method. Prefer a top-down / step-down file layout: put outer orchestration first, then place deeper helpers below in the order the reader encounters them whenever practical. Blank lines are not a defect on their own; they often point to where extraction is hiding.

Use when:
- A function has visually distinct blocks (validation / persist / notify, parse / decide / emit, fetch / transform / return).
- A function does not fit on one screen and is hard to scan.
- Reviewers add headings, blank lines, or comment labels to "organize" a long function.
- The same block recurs in two or more functions.
- One function mixes levels of abstraction (high-level orchestration next to low-level field plucking).
- A reader must jump up and down the file to follow helpers that could be arranged top-down.

Start here:
- Read the function as one unit. If you can summarize it in one sentence and it fits on a screen, leave it alone.
- If blank-line groups exist and each group has a real name, label the groups inline with `// validate`, `// persist`, `// notify`. Comment labels are the cheapest way to test "is this really one thing or many?"
- If the labels feel forced or each label maps to one obvious helper, that is the signal to extract.

Escalate when:
- Two or more labeled blocks have distinct responsibilities and the names would be specific (`validateOrderInput`, `persistOrder`, `notifyOrderProcessed`).
- A block calls more than 2-3 collaborators or repeats across callers.
- The orchestration is the only top-level concern; the steps belong elsewhere.
- The function still needs scrolling after labels.

Complexity ladder:
1. Single small function with blank-line groups — leave it alone if it fits and reads.
2. Add comment labels (`// validate`, `// persist`, `// notify`) to test whether the groups are really separate responsibilities.
3. If labels point to clear names, extract one helper per labeled block (Extract Method).
4. Compose the top-level function from helpers at one level of abstraction (template method / SLAP).
5. Move helpers behind a module boundary when they grow their own contracts.

Do:
- Use comment labels as a discovery tool — they cost nothing and reveal extraction candidates.
- Extract by responsibility and naming clarity, not by visual gap or line count.
- Use early return to flatten nested conditionals before deciding to extract.
- Keep one level of abstraction per function: orchestrators orchestrate, doers do.
- Put the outer entrypoint first and place deeper helpers below it when the file still reads as one unit.
- Within the same helper depth, prefer the order the reader encounters in the caller (`a` before `b`, `b1` before `b2`, `c1` before `c2`).
- Let blank lines exist where they aid readability — they are not a defect.

Avoid:
- Extracting trivially small blocks just to shorten a function.
- Hiding orchestration inside a deep call chain when reading top-down would be clearer.
- Treating blank-line removal as a goal in itself.
- Replacing a clear blank-line block with a vague `// section` comment that adds no information.
- Naming extracted helpers `processStep1`, `doWork`, `handleIt`.
- Putting top-level orchestration below deep helpers when a reader could follow the file top-down instead.
- Reordering same-depth helpers arbitrarily so the reader must hunt for the next step.

Exceptions:
- Top-level module structure (between imports, between exported declarations) uses blank lines normally.
- Test files commonly use blank lines between Given/When/Then; that is fine when scanning is the priority.
- A short function with 2-3 lines per visual group needs no extraction; the structure is the design.
- Small strongly-related helpers may stay adjacent for local comprehension even if the exact call-depth order is not perfect.
- Mutually recursive helpers or framework-mandated export order may override ideal step-down layout.

Example:

Step 1 — original function with blank-line groups:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  if (!input.email) throw new MissingEmailError(input.id);
  if (input.items.length === 0) throw new EmptyCartError(input.id);
  const normalized = { ...input, email: input.email.toLowerCase() };

  const saved = await deps.db.transaction(async (tx) => {
    const order = await tx.orders.insert(normalized);
    await tx.items.insertMany(order.id, normalized.items);
    return order;
  });

  await deps.mailer.send(saved.email, formatReceipt(saved));
  await deps.audit.record("order-processed", { orderId: saved.id });
  return saved;
}
```

Step 2 — label the groups with comment labels. The labels are a discovery tool:

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

Step 3 — labels turned out to be real responsibilities; extract one helper per label:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrderInput(input);
  const saved = await persistOrder(validated, deps.db);
  await notifyOrderProcessed(saved, deps);
  return saved;
}

function validateOrderInput(input: OrderInput): NormalizedOrder {
  if (!input.email) throw new MissingEmailError(input.id);
  if (input.items.length === 0) throw new EmptyCartError(input.id);
  return { ...input, email: input.email.toLowerCase() };
}

async function persistOrder(order: NormalizedOrder, db: DB) {
  return db.transaction(async (tx) => {
    const saved = await tx.orders.insert(order);
    await tx.items.insertMany(saved.id, order.items);
    return saved;
  });
}

async function notifyOrderProcessed(order: SavedOrder, deps: NotifyDeps) {
  await deps.mailer.send(order.email, formatReceipt(order));
  await deps.audit.record("order-processed", { orderId: order.id });
}
```

When extraction does not earn itself — short function with internal blank-line groups stays as-is:

```ts
function buildEmailHeaders(message: Message) {
  const headers = new Headers();
  headers.set("from", message.from);
  headers.set("to", message.to.join(","));

  if (message.replyTo) headers.set("reply-to", message.replyTo);
  if (message.inReplyTo) headers.set("in-reply-to", message.inReplyTo);

  return headers;
}
```

Contrast — harder to read because the entrypoint is buried below helpers:

```ts
function validateOrderInput(input: OrderInput): NormalizedOrder {
  if (!input.email) throw new MissingEmailError(input.id);
  if (input.items.length === 0) throw new EmptyCartError(input.id);
  return { ...input, email: input.email.toLowerCase() };
}

async function persistOrder(order: NormalizedOrder, db: DB) {
  return db.transaction(async (tx) => {
    const saved = await tx.orders.insert(order);
    await tx.items.insertMany(saved.id, order.items);
    return saved;
  });
}

async function notifyOrderProcessed(order: SavedOrder, deps: NotifyDeps) {
  await deps.mailer.send(order.email, formatReceipt(order));
  await deps.audit.record("order-processed", { orderId: order.id });
}

async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrderInput(input);
  const saved = await persistOrder(validated, deps.db);
  await notifyOrderProcessed(saved, deps);
  return saved;
}
```

Top-down / step-down ordering inside one file:

```ts
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrderInput(input);
  const saved = await persistOrder(validated, deps.db);
  await notifyOrderProcessed(saved, deps);
  return saved;
}

function validateOrderInput(input: OrderInput): NormalizedOrder {
  if (!input.email) throw new MissingEmailError(input.id);
  if (input.items.length === 0) throw new EmptyCartError(input.id);
  return { ...input, email: input.email.toLowerCase() };
}

async function persistOrder(order: NormalizedOrder, db: DB) {
  return db.transaction(async (tx) => {
    const saved = await tx.orders.insert(order);
    await tx.items.insertMany(saved.id, order.items);
    return saved;
  });
}

async function notifyOrderProcessed(order: SavedOrder, deps: NotifyDeps) {
  await deps.mailer.send(order.email, formatReceipt(order));
  await deps.audit.record("order-processed", { orderId: order.id });
}
```

Verify:
- Did comment labels feel natural, or forced? Forced labels usually mean the function is fine as one unit.
- Does each extracted helper have a name that says what it does, not how?
- Are orchestration and low-level steps at different levels of abstraction in the file?
- Can a reader scroll from top to bottom without repeatedly hunting upward for the next helper?
- At the same depth, do helpers appear in the same order the caller uses them?
- Did the function shrink because responsibilities moved out, or only because lines disappeared? Only the first is real.
