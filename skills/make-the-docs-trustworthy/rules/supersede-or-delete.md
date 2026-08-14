---
id: make-the-docs-trustworthy.supersede-or-delete
owner: make-the-docs-trustworthy
canonical: true
severity: hard-gate
references: [append-only history, superseding records, deprecation notice]
---

# Supersede Or Delete

Decision: A recorded decision is never edited into today's answer.

- **Write a new record naming the one it replaces.** Leave the original in place with a pointer forward.
- **Editing it destroys the evidence that the old answer was right at the time.** The next reader
  re-argues it from nothing.
- **A how-to whose subject was removed is deleted instead.** There is nothing to preserve.
- **Owns every answer after the first.** The first writing of a record
  → `rules/record-what-code-cannot-show.md`.

Use when:

- A recorded decision has been reversed, narrowed, or replaced.
- A page explains how to use something that no longer exists.
- A record's reasoning still holds but its conclusion no longer does.

Do:

- **Supersede a decision in three parts.** The new record names the old one. The old record gains a
  forward pointer and a status. Neither is edited in substance.
- **State in the new record what changed since.** The constraint that lifted, the measurement that
  arrived. Not only the new answer.
- **Delete a how-to, tutorial, or reference whose subject is gone**, in the same change that removes
  the subject.
- **Ask whether a reader would want to know why the old answer was chosen**, when unsure which
  applies. Yes means supersede.
- **Keep the superseded record findable at its original location**, under its original identifier.

Avoid:

- **Editing a decision record's conclusion in place and keeping its original date.**
- **Deleting a record because its answer is no longer the answer.**
- **A superseding record that names no predecessor**, leaving two answers that both look current.

Exceptions:

- A record that was wrong when it was written is corrected in place, with a note stating what it
  previously said. That is mistaken, not overtaken.

Example (one instance, not the set):
```
0007  caller-supplied retry policy     status: superseded by 0019
0019  retries move back to the client  supersedes 0007
      changed since: the gateway began retrying, so two layers stacked
      NOT decided: whether batch jobs adopt the same policy
0007 stays at its original path, under its original identifier, unedited.
```

Verify:

- **Open the superseded record.** It carries a forward pointer and a status.
- **Search the subject of a deleted page.** Nothing remains that instructs a reader to use it.
- **Walk the chain back from the newest record.** Every pointer resolves, and only one record claims
  to be current.
