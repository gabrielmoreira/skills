---
id: treat-blockers-as-incidents.stop-conditions
owner: treat-blockers-as-incidents
canonical: true
severity: hard-gate
references: [incident postmortem practice]
---

# Stop Conditions

Decision: **Stop on a state you can name, never on a count of attempts.** A counter stops a correct fourth attempt and permits three wrong ones. Deciding whether this failure is yours at all belongs to `rules/whose-failure-is-it.md`.

Use when:
- **The same command fails again** after a change meant to fix it.
- **A fix moved the error** rather than removing it.
- **The next step needs something you cannot observe**: a credential, a permission, a machine you are not on.
- **Guidance is coming from memory or from chat** rather than an observed record.

Do:
- **Stop and hand back when the mechanism is still unknown after the budget you declared.**
- **Stop when the next attempt would need a secret printed, transmitted, or pasted anywhere.**
- **Stop when the replacement carries broader permissions than what it replaces.** A wider credential that works is a worse outcome than a narrow one that does not.
- **Stop when one tool authenticates and its neighbour does not.** That asymmetry names the boundary, and guessing past it widens the blast radius.
- **Stop when the owner of the tool, package, or channel is unknown.** Installing from an unidentified source is worse than the blocker.
- **Stop when the fix would change shared configuration** that other people depend on.
- **Stop when each attempt is producing a new unrelated error.** The ground is moving and more attempts will not settle it.
- **Say which condition fired**, and what would unblock it.

Avoid:
- **Retrying the same command unchanged.** The second run fails for the reason the first one already gave.
- **Counting attempts as the rule.** Name the state instead.
- **Widening permissions, weakening a check, or disabling a protection** to get past it.
- **Continuing because you are nearly there.** Nearly there is where the budget quietly disappears.

Exceptions:
- **A transient network failure MAY be retried once**, and the retry is recorded.

A fix that moved the error rather than removing it:

```
  before   Error: cannot find module 'imaging'
  after    Error: 'imaging' loaded, but its native binding targets another ABI
```

The module is found now, and the command still does not run.

Verify:
- **Name the condition that stopped you**, quoting the observation behind it.
- **State the one thing that would unblock it**, concretely enough for someone else to do.
- **Confirm no secret, permission, or shared setting was changed** on the way here.
