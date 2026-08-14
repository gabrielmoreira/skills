---
id: debugging-by-evidence.stopping-and-escalating
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [attempt budgets, escalation criteria, known unknowns]
---

# Stopping and Escalating

Decision: Three attempted fixes that each break something else mean the shape is wrong. Those
three attempts are the finding. A fourth buys a fourth problem, not an answer. Owns when to
stop and what the stop is made of. Where any single fix belongs → `rules/fix-at-the-source.md`.

Use when:

- **A fix turned the loop green and turned a different check red.** Twice.
- **The next step needs an observation you cannot make.**
  - A log you cannot reach.
  - A system you cannot run.
  - A state that no longer exists.
- **Each attempt has been smaller and more local than the one before it.**

Do:

1. **Count an attempt whenever a written fix broke something else.** Reverting it does not reset
   the count.
2. **Name what changed since the last run before you repeat anything.** Nothing changed means the
   next step is a different hypothesis.
   - Re-running an unchanged command is the same attempt.
   - So is rewriting a fix against a hypothesis nothing has touched.
3. **Record each attempt as three fields.**
   - The change, at `file:line`.
   - The check that went red.
   - What that pairing says about the structure.
4. **Stop writing fixes at the third.** Name the structural change the three attempts point to.
   - The boundary sits in the wrong place.
   - One job is split across two units.
5. **Name the missing observation for anything you cannot see.** Name the one action that would
   produce it, and who can take that action. Then stop.
6. **Reason no further past a named gap.** A chain continued through it carries that doubt into
   every later link.

Avoid:

- **Restarting the count after a revert.**
- **Swapping a plausible assumption in for the missing observation** and carrying on.
- **Treating the stop as a failure to report.** Three attempts with their consequences is a result.

Exceptions:

- **An attempt that failed for an unrelated reason does not count.** A typo, a stale build, a
  wrong flag. Correct it and re-run.

Example (one instance, not the set):

```
1  <cache>:44   added guard      -> expiry check red      two jobs, one unit
2  <cache>:61   moved guard      -> eviction check red    same two, other side
3  <store>:12   bypassed cache   -> stale-read check red  callers need both
Stop. Lookup and expiry live in one unit; separating them is the change.
```

Verify:

- **Count the recorded attempts.** Three that broke something else must be followed by a stop.
- **Read each entry.** It carries its `file:line`, its red check, and what it says about structure.
- **Confirm every named gap carries the one action that would settle it.**
