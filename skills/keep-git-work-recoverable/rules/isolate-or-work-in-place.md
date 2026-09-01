---
id: keep-git-work-recoverable.isolate-or-work-in-place
owner: keep-git-work-recoverable
canonical: true
severity: default
references: [linked worktrees, workspace isolation, environment-provided sandboxes]
---

# Isolate or Work in Place

Decision: Take the isolation the environment already provides. Create one yourself only where
there is none. A second layer over the first doubles the state someone must later account for.
Owns whether to work here or elsewhere. Naming the checkout you stand in →
`rules/locate-yourself.md`. Disposing of one → `rules/removing-work.md`. What is owed once one is open →
`rules/returning-work.md`.

Use when:

- **The task needs a second branch checked out** while this working tree stays as it is.
- **The harness already placed you in a scratch checkout.** Or it exposes its own command for making one.
- **Two tasks would otherwise edit one working tree at the same time.**

Do:

- **List the isolation that already exists before creating any.** Use what you find.
  - An already-isolated checkout.
  - A mechanism the harness provides.
  - A workspace already dedicated to this branch.
- **Create a linked workspace where isolation is genuinely absent** and the branch here must not
  be switched. It costs a checkout and no history.
- **Check the path is ignored before creating one inside the repository.** One check stands
  between you and committing an entire second checkout.
- **Work in place when nothing else holds this working tree** and the branch you need is already
  checked out here.
- **Reuse the workspace already dedicated to a branch rather than adding a second.** A branch is
  checked out in at most one place.
- **Record every workspace you create in the report.** Give its path and why it exists. An
  unrecorded workspace is one nobody can later remove safely. Forgetting it is the whole cost of
  creating it.

Avoid:

- **Creating a workspace inside the workspace a harness already handed you.**
- **Switching the branch of a checkout you did not create** to dodge the cost of a new one.
- **Omitting a created workspace from the report because the task succeeded.**

Exceptions:

- **Reading another branch without changing it needs no workspace.** Read the ref directly.

Example (one instance, not the set):

```
Isolation already present:
  harness mechanism    none exposed
  <workspace-a>        holds <topic-branch>
  this working tree    holds <trunk>, must not be switched
Reused <workspace-a> for <topic-branch>; a branch is checked out in one place.
Created <workspace-c> for <second-branch>. Path confirmed ignored.
Report: <workspace-c>, created for <second-branch>, mine to remove.
```

Verify:

- **List the workspaces.** Every one present is either pre-existing or named in the report.
- **Confirm the report says which isolation was used** and whether it was found or created.
- **Confirm no branch appears checked out in two places.**
