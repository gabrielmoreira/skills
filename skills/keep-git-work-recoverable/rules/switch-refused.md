---
id: keep-git-work-recoverable.switch-refused
owner: keep-git-work-recoverable
canonical: true
severity: hard-gate
references: [dirty working tree, stash discipline, worktree exclusivity]
---

# Switch Refused

Decision: A refused switch has two causes with no shared remedy. It is protecting uncommitted
work, or it is protecting another checkout's working tree. Neither remedy is a flag that makes
the refusal disappear. Owns a switch blocked after the name resolved. A name that never
resolved → `rules/resolve-the-ref.md`.

Use when:

- **The switch reports that local changes would be overwritten** and lists files.
- **The switch reports the branch is already checked out at another path.**
- **You are about to add `--force` or `-f`** or a flag that ignores other worktrees.

Do:

1. **Read which of the two refusals you got, in the tool's own words.** Treating them as one
   produces the wrong move roughly half the time.
2. **List the affected paths for a local-changes refusal.** Put three moves to the human and say
   what each costs. Then stop. The choice is theirs.
   - Commit them on this branch.
   - Park them.
   - Abandon them.
3. **Never park and proceed.** A stash is invisible to every later state check. "I stashed it and
   moved on" is how the work is lost. Offer it. Do not take it.
4. **Report the other path for an already-checked-out refusal.** Offer two moves.
   - Work in that workspace.
   - Start a new branch here from that branch's tip.
5. **Propose pruning the stale registration** where the other workspace's path no longer exists
   That is bookkeeping rather than a branch change.
6. **Report the files the refusal names that you never touched.** They are someone else's edits
   They change whose decision this is.

Avoid:

- **`--force` or any flag that discards the working tree so the switch succeeds.**
- **A flag that ignores other worktrees.** It trades a clear refusal for one branch checked out twice.
- **Reporting success after a stash without saying a stash now exists.**

Example (one instance, not the set):

```
Refusal    switch refused: local changes to 3 files would be overwritten
           <config>, <handler>, <fixture>
Options    commit here      keeps them, adds a commit on this branch
           park them        recoverable, invisible to later state checks
           abandon them     unrecoverable
Blocked    Which of the three? Nothing moves until you answer.
```

Verify:

- **Read the report.** It names which of the two refusals occurred, quoting the tool.
- **Confirm no override or discard flag reached any command this session.**
- **Confirm the report names any stash that was made** and what it holds.
