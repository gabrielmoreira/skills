---
id: keep-git-work-recoverable.removing-work
owner: keep-git-work-recoverable
canonical: true
severity: hard-gate
references: [squash-merge detection, reachability analysis, merge-base ancestry]
---

# Removing Work

Decision: Remove only on positive evidence the commits reached the trunk or a remote. Ancestry is
a false negative. Squashed and rebased work is not an ancestor of the trunk, so that check calls
landed work unmerged. Owns removal of a workspace or a branch. The claim status a failed sync
leaves → `rules/stale-refs.md`. Creating one → `rules/isolate-or-work-in-place.md`.

Use when:

- **A workspace or branch is to be deleted or pruned or cleaned up.**
- **Something is described as already merged or done or no longer needed.**
- **An ancestry check reports the branch is not merged.**

Do:

1. **Establish positive evidence.** Absence of a signal is not evidence.
   - The branch's patches are present on the trunk.
   - Its tip is reachable from a ref on a remote you successfully synced.
2. **Compare the branch's changes against the trunk where the trunk squashes or rebases.**
   Ancestry cannot answer there. It has landed when it introduces nothing the trunk lacks.
3. **Treat an empty comparison as Unknown when its base does not resolve.** A base that does not
   resolve returns empty too, and empty is never landed.
4. **Read uncommitted state inside each workspace's own path.** Run it from elsewhere and you
   describe a different tree.
5. **Stop the removal on uncommitted tracked edits.** Report the paths and hand the decision
   over. Do not park them to clear the way.
6. **Report untracked files as their own case.** Scratch output and new source nobody added look
   identical. Only the human can separate them.
7. **Remove only workspaces whose provenance you can account for.** List the rest and leave them.
   - One created this session.
   - One you can tie to a recorded task.
8. **Answer whether two branches would merge cleanly without mutating anything.** No trial merge
   is needed.

Avoid:

- **Inverting the evidence test to save time.** An agent that does it deletes everything.
- **Deleting on an ancestry check alone**, or force-deleting after the safe delete refused.
- **Removing a workspace with a flag that skips the dirty-tree check.**
- **Accepting an unverified merge claim as grounds for removal.**

Example (one instance, not the set):

```
is-ancestor <topic> <trunk>   exit 1     "not merged"
cherry <trunk> <topic>        all "-"    every patch is already on the trunk
=> landed by squash. Ancestry alone would have called this unmerged work.
Blocked: the workspace holds 2 modified tracked files. Removal is yours to call.
```

Verify:

- **Read the report.** Each removal names the evidence class that authorised it.
- **Confirm no force flag and no skip-checks flag reached a removal command.**
- **Confirm every workspace left in place is listed** with the reason it was left.
