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

1. **Read each changed line and probe what would make it wrong.** Probe neighboring values and inverted conditions; record negative probe results in the report.
   - An inverted or wrong condition, or an off-by-one on a bound.
   - A dereference where nearby lines show the value can be absent; distinguish no-signal from confirmed-safe by reading the guard.
   - A missing await, or a check treating zero as absent.
   - A copied variable pointing to the wrong binding.
2. **Apply the three-class error taxonomy to every catch or fallback:**
   - *Propagate:* caller owns recovery or boundary reporting.
   - *Log-and-continue:* degradation is isolated and observable.
   - *Swallow:* silent failure concealing defects is a finding.
3. **Read the whole enclosing function, not only the hunk.** A defect in an unchanged line of a touched function is in scope when re-exposed.
4. **Name the invariant each deleted or replaced line enforced.** Re-establish it or report the dropped guard or narrowed validation.
5. **Find callers of each changed function.** Check new preconditions, altered return shapes, thrown errors, and order dependencies.

Avoid:

- **A review that read the shape and never the lines.** Line-by-line hunk reading is the method; shape review finds what the summary would have told you anyway.
- **Assuming confirmed-safe without reading the guard**, so a removed invariant passes as unchanged behaviour.
- **Reporting a defect with no path from a line this diff changed**, which spends the author's attention on something they cannot act on here.
- **Reading "the tests pass" as evidence a line is right.** The test may not reach it, and green over an unreached line says only that nothing exercised it.
- **Treating a hunk as read because you understood its intent.**

Example (one instance, not the set):
```
Important: <handler>:41 `if (!count)` treats a count of 0 as missing and
falls through to the default. Probe: passing count=0 triggers the fallback.
Important: the diff deletes the length check at <parser>:12. Nothing in the
new code re-establishes it; a payload over the limit reaches the decoder.
```

Verify:

- **Confirm every hunk was read line by line**, and probe outcomes are cited.
- **Distinguish confirmed-safe guards from uninspected signal paths.**
- **Account for every deleted line.** It was re-established, dropped by design, or is a finding.
- **Check catch blocks follow the three-class error taxonomy.**
