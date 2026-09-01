---
id: treat-blockers-as-incidents.never-destroy-to-proceed
owner: treat-blockers-as-incidents
canonical: true
severity: hard-gate
references: [incident postmortem practice]
---

# Never Destroy to Proceed

Decision: **Nothing is deleted, reset, rotated, or overwritten to make a command succeed.** Version-controlled state belongs to `keep-git-work-recoverable`. A detour that avoids removal belongs to `rules/workarounds-are-findings.md`.

Use when:
- **A suggested fix begins with removing something**: a cache, a lock file, an environment, a credential, a container, a config.
- **A tool proposes a clean, a prune, a reset, or a force.**
- **A credential is about to be replaced** before the replacement is known to work.
- **Untracked or generated state stands between you and a green command.**

Do:
- **Copy it aside first, and say where.** Recovery beats confidence.
- **Prove the replacement works before removing what it replaces.** Both, briefly, is safer than neither.
- **Prefer the additive move.** A second environment, a scoped override, a temporary path.
- **Where removal is genuinely required, the developer decides.** Record who did.
- **Name what was created that is not yours to keep.** The machine returns to its shape.

Avoid:
- **Deleting a lock file, a cache, or an environment** to pass an error whose mechanism is unknown.
- **Rotating or revoking a credential before the new one is Confirmed working.**
- **Removing another tool's state because it appeared in your error output.**
- **Force in any of its spellings**, where a bounded alternative exists.

Exceptions:
- **A file this session created MAY be removed** by this session.
- **A documented reset step MAY be run.** Name the document. The thing reset must be reproducible.

The destructive route and the additive one, on the same blocker:

```
  proposed   delete the cache, the lock file, and the installed tree, reinstall
  additive   install into a scoped prefix beside it, run the command from there
```

The first is faster when it works and unrecoverable when it does not. The
second leaves both in place, and the developer decides which one to keep.

Verify:
- **Name everything removed, and where its copy is.**
- **Confirm the replacement was observed working** before the original went.
- **State what on this machine is not in the shape it was found in.**
