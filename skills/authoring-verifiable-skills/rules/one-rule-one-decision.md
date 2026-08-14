---
id: authoring-verifiable-skills.one-rule-one-decision
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [rule anatomy across five reference collections]
---

# One Rule One Decision

Decision: **A rule file owns exactly one decision and states it in five blocks, in order: `Decision:`, `Use when:`, `Do:`, `Avoid:`, `Verify:`.** How densely that decision reads belongs to `rules/readable-in-one-pass.md`.

Use when:
- **A rule is being written or repaired.**
- **A rule has grown a second decision**, usually visible as two unrelated things in `Do:`.
- **A rule restates its neighbour**, so a reader cannot tell which one owns the call.
- **A rule is over the word budget**, which is almost always the second decision showing.
- **A block is missing**, most often `Verify:`.

Do:
- **Say each idea exactly once.** No restating `Decision:` inside `Do:`, no restating `Do:` inside `Verify:`.
- **Make `Decision:` a single sentence** a reader could act on with nothing else open.
- **Make `Use when:` observable.** Conditions in the work, not a description of the topic.
- **Make `Do:` the choice**, `Avoid:` the failure it prevents, and `Verify:` the check that catches it afterwards.
- **Name the sibling in `Decision:` where two rules sit close**, and have that sibling name this one back. Demarcation that only points one way leaves a gap.
- **Keep a rule inside its budget.** Under 450 words of prose, under 600 words read including any example, and 24 to 70 lines of prose.
- **Put `Exceptions:` and an `Example` between `Avoid:` and `Verify:`** where they earn their room.

Avoid:
- **Two decisions in one file.** Split it, and give each half its own row in the gate.
- **A rule that no run ever opens.** After ten real runs that is a merge candidate, not a rule.
- **A `Verify:` that repeats `Do:` in the past tense.** A check is something that can come back negative.
- **An overall verdict inside a rule.** Status belongs to the router, which is the only thing that saw every axis.
- **An example that carries the file.** Where the read budget fails but the prose budget passes, the example has become the content.

Exceptions:
- **A rule MAY hold most of its content in a worked example** where showing beats telling. Its prose will be short, and that is not thinness: the read budget still bounds it.

Example (one instance, not the set):

```md
Decision: **One sentence that decides.**

Use when:
- **An observable condition.**

Do:
- **The choice, in bold, then the detail.**

Avoid:
- **The failure this prevents.**

Verify:
- **A check that can come back negative.**
```

Verify:
- **Check all five blocks are present and in order.**
- **Check the word and line budgets**, and read what pushed a rule over rather than trimming adjectives.
- **Check every sibling named in a `Decision:` names this rule back.**
- **Ask what single decision this file owns.** If the answer needs "and", the file is two rules.
