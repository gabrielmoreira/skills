---
id: keep-git-work-recoverable.resolve-the-ref
owner: keep-git-work-recoverable
canonical: true
severity: default
references: [remote-tracking refs, symbolic ref lookup, refspec disambiguation]
---

# Resolve the Ref

Decision: Classify what the failed name is before a second attempt. Each class has exactly one
legal move, and rerunning the command is not one of them. Owns a name that did not resolve. A
name that resolved and was then blocked → `rules/switch-refused.md`. A classification resting on
refs you could not refresh → `rules/stale-refs.md`.

Use when:

- **A command reports an unknown or invalid pathspec or revision or reference.**
- **A branch is expected to exist and does not appear locally.**
- **You are about to run the same command again with the same name.**

Do:

1. **Put the name in exactly one of six classes.**
   - Local branch.
   - Remote-tracking ref.
   - Remote-only branch never fetched.
   - Tag.
   - Commit id.
   - Nothing.
2. **Switch to a local branch.** For a remote-tracking ref, create a local branch tracking it.
3. **Treat a remote-only name as unresolvable until a sync succeeds.** Until then whether it
   exists at all is unverified.
4. **Say first that checking out a tag or a commit id detaches the head.** Name the branch to
   create if work continues there.
5. **Report a name in the nothing class as not found.** List the nearest existing names you can
   find. Do not guess a corrected spelling and act on it.
6. **Read the trunk's real name from the repository** rather than assuming a conventional one. A
   failure against an assumed trunk is a failure of the assumption rather than of the ref.
7. **Spell the full ref path where a name is ambiguous** between a tag and a branch. Do not let
   precedence pick.

Avoid:

- **Rerunning the failed command unchanged**, or with a slash added or removed on a hunch.
- **Reading "not found locally" as "does not exist"** when no successful sync stands behind it.
- **Creating a branch at the current head to satisfy a name expected to carry work.**

Example (one instance, not the set):

```
Name <release-candidate> did not resolve. Classified once:
  local branch          no
  remote-tracking ref   no
  remote-only           unknown; no sync has succeeded this session
  tag / commit id       no
Class: remote-only. Unresolvable until a fetch succeeds; existence unverified.
Nearest local names: <release-2>, <release-hotfix>. Neither assumed.
```

Verify:

- **Read the report.** The name carries exactly one of the six classes.
- **Confirm the trunk and remote names used came from a command.**
- **Confirm at most one attempt per name**, or that any second attempt followed a classification.
