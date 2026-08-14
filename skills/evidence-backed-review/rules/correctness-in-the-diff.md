---
id: evidence-backed-review.correctness-in-the-diff
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [line-by-line hunk reading, removed-invariant audit, caller impact analysis]
---

# Correctness in the Diff

Decision: Most defects that ship are visible in the hunk that introduced them. The second
largest group sits in the lines that hunk deleted. Ask every changed line one question, and
account for every deletion. Owns whether the changed code works. Whether it matches the
written convention → `rules/standards-conformance.md`.

Use when:

- Any hunk changes logic, a condition, a loop bound, an assignment, or an error path.
- The diff deletes or replaces lines.
- A hunk sits inside a function you have not read.

Do:

1. **Read each changed line and name what would make it wrong.** These shapes recur. They are illustrative, not the set.
   - An inverted or wrong condition.
   - An off-by-one on a bound.
   - A dereference where nearby lines show the value can be absent.
   - A missing await.
   - A check that treats zero as absent.
   - A wrong variable copied from the line above.
   - An error swallowed in a catch that should propagate.
2. **Read the whole enclosing function, not only the hunk.** A defect in an unchanged line of a
   touched function is in scope. This change re-exposes it, and the next reader will assume it
   was looked at.
3. **Name the invariant each deleted or replaced line enforced.** Then find where the new code
   re-establishes it. Not finding it is the finding: a removed guard, a dropped error path, a
   validation narrowed without saying so.
4. **Find the callers of each changed function.** Name what the change does to them.
   - A new precondition.
   - A changed return shape.
   - A new thrown error.
   - An ordering it now depends on.

Avoid:

- **A review that read the shape of the change and never its lines.**
- **Reporting a defect with no path from a line this diff changed.**
- **Reading "the tests pass" as evidence a line is right.** The test may not reach it.
- **Treating a hunk as read because you understood its intent.**

Example (one instance, not the set):
```
Important: <handler>:41 `if (!count)` treats a count of 0 as missing and
falls through to the default. The line above proves 0 is reachable.
Important: the diff deletes the length check at <parser>:12. Nothing in the
new code re-establishes it; a payload over the limit now reaches the decoder.
```

Verify:

- **Confirm every hunk was read line by line**, not summarised.
- **Account for every deleted line.** It was re-established, deliberately dropped, or it is a finding.
- **Read each finding.** It names the input or state that triggers it, not just the shape.
