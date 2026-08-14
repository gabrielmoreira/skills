---
id: keep-git-work-recoverable.stale-refs
owner: keep-git-work-recoverable
canonical: true
severity: hard-gate
references: [remote-tracking staleness, non-interactive credential prompts, sandboxed egress]
---

# Stale Refs

Decision: A sync that did not demonstrably succeed downgrades every claim resting on remote
state. The report says so rather than retrying until the wording softens. Owns the status of
remote-dependent claims. A name that will not resolve because it was never fetched →
`rules/resolve-the-ref.md`. What an unverified claim forbids you to delete →
`rules/removing-work.md`.

Use when:

- **A fetch failed or was denied by the sandbox or stalled or never ran this session.**
- **A command sat waiting on credentials** in a shell with nobody to answer it.
- **You are about to say a branch exists or is already merged or is up to date.**

Do:

- **Require a sync that exited zero this session** before stating any remote-dependent claim as
  observed. Age counts too. Refs fetched before someone else pushed are stale.
- **Tag each affected claim unverified.** Name the single observation that would settle it. That
  is usually a successful fetch of that specific ref.
- **Attempt a sync at most twice**, and only where the second attempt changes something.
  - A different remote.
  - An explicit refspec.
  - A non-interactive credential mode.
- **Make a credential wait fail fast.** Disable prompting rather than letting a non-interactive
  shell hang.
- **Read the remote's name and how many are configured.** There may be several or none. With
  none, remote claims are unknown rather than unverified.
- **Separate "the network refused" from "the ref is absent".** Only the second is a fact about
  the repository.
- **Prune, or say the claim rests on an unpruned ref.** A sync that does not prune leaves the ref
  behind after the branch is deleted upstream. "The branch exists" then passes as observed and is
  false.

Avoid:

- **A retry loop on the same command and credential and remote.**
- **Stating local-only knowledge in remote vocabulary.** "Already merged" and "up to date" both do this.
- **Reading empty output from a failed command as an empty result set.**

Example (one instance, not the set):

```
Sync: fetch exited 128, egress denied. No second attempt would differ.
  "<topic> is already merged"   unverified   settles on a fetch of <topic>
  "<trunk> is up to date"       unverified   settles on a fetch of <trunk>
  "<old> still exists"          unverified   rests on an unpruned ref
Fact about the repository: none of the three. The network refused.
```

Verify:

- **Read the report.** Every remote-dependent sentence carries a tag.
- **Confirm the session shows at most two sync attempts** and that they differ.
- **Confirm the remote's name was read rather than assumed.** A repository with no remote is
  reported as having none.
