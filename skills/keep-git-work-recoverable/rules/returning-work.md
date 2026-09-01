---
id: keep-git-work-recoverable.returning-work
owner: keep-git-work-recoverable
canonical: true
severity: hard-gate
references: [linked worktrees, lost update, working copy drift]
---

# Returning Work

Decision: **A second workspace is borrowed.** Check it is current before writing in it, carry what
it needs to run, and close it in the report that opened it. Creating one →
`rules/isolate-or-work-in-place.md`. Removing one safely → `rules/removing-work.md`.

Use when:
- **Work is finishing somewhere other than where it started.**
- **You are about to write in a workspace you did not open in this session.**
- **A command that works in the main checkout fails here.**
- **More than one workspace exists for related work.**

Do:
- **Establish how far behind it is before writing in it.** A workspace opened days ago does not
  hold what landed since, so a change built on it and pushed removes that difference without
  anyone rejecting it. Compare against what it tracks and say the answer.
- **Treat a fresh checkout as a checkout, not an environment.** Dependencies, build output and
  untracked local configuration do not come with it, and their absence reads as a broken tool
  rather than a missing step. Name what the original has that this one does not.
- **Land what is here before opening anywhere else.** A second workspace opened while the first
  still holds unlanded work is how one fix gets written twice and lost once.
- **Close it in the same report that created it**, saying where the work landed and whether the
  workspace is gone or still standing and why.

Avoid:
- **Writing in a workspace whose age nobody established**, so the push silently removes what
  someone else landed.
- **Opening a new one to escape a state you have not read.** A stash, a commit, or one question
  usually costs less than a second checkout nobody closes.
- **Carrying an untracked config file across without saying so**, leaving the next reader unable
  to tell it is not in the repository.
- **Leaving it open because the task succeeded**, so its unlanded difference is found by whoever
  opens that branch next.

Exceptions:
- **A workspace the environment provides MAY stay open**, where it is named and its purpose is
  recorded.
- **A workspace MAY outlive one task** where it holds work in progress that is reported as such.

Example (one instance, not the set):

```
<workspace-b>  tracks <topic>, 14 commits behind it, opened 6 days ago
               untracked here and not in the original: none
               untracked in the original and not here: .env.local
Rebased onto <topic> before writing. Landed as <sha>. Workspace removed.
```

Verify:
- **State how far behind each workspace was, and against what.**
- **Confirm every workspace opened this session is closed, or is explained.**
- **Confirm nothing that ran only in the original is assumed to run here.**
