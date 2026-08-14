---
id: evidence-backed-review.scope-and-slicing
owner: evidence-backed-review
canonical: true
severity: default
references: [Small changelist practice, Refactoring catalogue, Deep module design]
---

# Scope and Slicing

Decision: A change is reviewable when it is one self-contained modification. One thing, its
tests, the system working. Size it by the concepts a reader holds, not by lines. Two subjects
hide each other. Shape and size are owned here. Convention → `rules/standards-conformance.md`.
Pre-publish ordering → `rules/pre-commit-self-review.md`.

Use when:

- The diff contains a refactor and new behaviour together.
- The diff passes ~300 changed lines, or adds to a file already past ~300.
- Edits appear in files the change had no reason to touch.

Do:

- **Split a refactor plus new behaviour into two changes.** Land the refactor first.
- **Read the changed-line count against the size ladder.** File size is an inspection signal, never a cap.
  - ~100 changed lines reads comfortably in one sitting.
  - ~300 holds only where it is one logical change.
  - ~1000 splits into separate changes.
- **Pick the split by dependency shape.**
  - **Stack.** Sequential dependencies, each built on the last.
  - **By file group.** Separate owners per group.
  - **Horizontal.** Layered work, with the shared code landing first.
  - **Vertical.** Feature slices, each one working end-to-end.
- **Count the concepts a reader holds before and after a restructuring.** An unchanged count
  means complexity moved, not reduced.
- **Rank the moves that reduce that count.**
  - Make a branch, mode, or layer disappear first.
  - Delete an abstraction second.
  - Splitting a file ranks last.
- **Keep an opportunistic improvement where all three hold.**
  - It sits in a file this change already modifies.
  - It changes no behaviour of its own.
  - It adds no second subject to the review.
- **Put everything else on the noticed-but-not-touching list.**

Avoid:

- **Tidying imports or modernising syntax** in files the change only reads.
- **Reporting that something is complex** without naming the move that reduces it.
- **Introducing a seam for the first adapter.** Two adapters make it real. One does not.

Exceptions:

- A hotfix, a whole-file deletion, or a mechanical refactor may be any size. The reader
  verifies intent, not lines.

Example (one instance, not the set):
```text
Proposed: move 300 lines of date helpers into three files to "clean up".
Concepts held: 5 before, 5 after -> relocated. Rejected; the named move is
deleting the legacy-format branch: 5 -> 3, one file, no new seam.
```
Verify:

- **Name the one thing in a single sentence with no "and".** Needing "and" means two changes.
- **Read the produced slices.** Each one builds, carries its tests, and works alone.
- **Check the noticed-but-not-touching list exists.**
- **Check every kept edit sits in a file already modified.**
