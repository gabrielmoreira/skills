---
id: keep-git-work-recoverable.locate-yourself
owner: keep-git-work-recoverable
canonical: true
severity: hard-gate
references: [worktree topology, environment overrides, submodule detection]
---

# Locate Yourself

Decision: Fix which repository and which checkout the commands hit before any state is
believed. Every later observation inherits this answer. A wrong one describes a different
repository. Owns naming where you are. Whether you should be working somewhere else →
`rules/isolate-or-work-in-place.md`.

Use when:

- **You cannot say which checkout this is.**
  - The main one.
  - A linked workspace.
  - A submodule pretending to be one.
- **The current branch name comes back empty.**
- **Paths or refs look like they belong to another repository.**

Do:

1. **Read the environment before anything else.** Any one of these silently retargets every command.
   - `GIT_DIR`.
   - `GIT_COMMON_DIR`.
   - `GIT_WORK_TREE`.
2. **Unset the ones that are set, or name what each points at.** Believe no state before that.
3. **Compare `--git-dir` against `--git-common-dir`.** Equal means the main checkout. Different
   means a linked workspace or a submodule. That test alone cannot separate the two.
4. **Split those two with `--show-superproject-working-tree`.** A non-empty answer means a
   submodule. Its trunk and its remote and its branches are its own rather than the parent's.
5. **Treat an empty `--show-current` as a detached head.** Record the commit id and report it as
   detached. It is not a failed command.
6. **Read the trunk's name from the remote's head ref.** Read the remote's name from the
   configured list. Never take either from habit.
7. **State the checkout kind and the branch or detached commit and the top-level path.** One
   line. Before acting.

Avoid:

- **A state report with no location behind it.**
- **Inferring the checkout kind from a `.git` file against a `.git` directory.** Both appear for
  workspaces and for submodules.
- **Reading an empty current-branch name as an error.** Rerunning the command changes nothing.
- **Carrying an inherited `GIT_DIR` into a subprocess.** Its output is then reported as this
  repository's state.

Example (one instance, not the set):

```
GIT_DIR, GIT_COMMON_DIR, GIT_WORK_TREE   all unset
--git-dir vs --git-common-dir            differ: workspace or submodule
--show-superproject-working-tree         empty: workspace, not a submodule
--show-current                           empty: detached at 9f2c1ab
trunk from the remote head ref           <trunk>
Here: linked workspace, detached at 9f2c1ab, top level <workspace-b>.
```

Verify:

- **Read the environment for the three variables.** Each is unset, or its target is named in the report.
- **Confirm a linked-workspace claim was separated from submodule by a superproject check.** The
  git-dir comparison alone cannot do it.
- **Confirm the trunk and remote names in the report came from a command** rather than a default.
