# typescript-skills: what is still open

Two files, both about work that has not been done yet. Everything describing
work already finished was deleted, because a hand-maintained record of the
current state drifts the moment the tree changes.

- **`roadmap.md`** lists coverage gaps. Nine of them are still open, marked by
  the absence of a resolved status.
- **`evaluation-plan.md`** specifies the activation scenarios each topic needs.
  They are written: every topic carries an `evals/` directory, and the root one
  carries the shared types and the invariant suite.

## Where the current state actually comes from

Run the suite instead of reading about it:

```bash
node tools/check-all.mjs --report
```

That prints how many invariants pass, how many mutations are caught, and how
many files sit inside every shape target. Those numbers are measured on every
run, so they cannot go stale the way a written summary does.

## What was removed, and why

- **`cheatsheet.md`** restated every rule as a positive example, 1040 lines of
  it. Its own index already called it superseded by the rules themselves. A
  second copy of a rule disagrees with the first one eventually, and nothing
  announces which copy is stale.
- **`ownership.md`** mapped each topic to its owner. Every rule already carries
  `owner:` in its frontmatter, and the checker fails a rule whose owner does not
  match its directory. The enforced version replaces the written one.
- **`source-coverage.md`** tracked a migration that finished.
- **`review-notes.md`** described the tree as a draft not yet installed, which
  stopped being true when it was committed.
