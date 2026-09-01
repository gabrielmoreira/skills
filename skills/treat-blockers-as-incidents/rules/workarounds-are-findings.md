---
id: treat-blockers-as-incidents.workarounds-are-findings
owner: treat-blockers-as-incidents
canonical: true
severity: hard-gate
references: [Continuous Delivery (Humble and Farley), postmortem practice]
---

# Workarounds Are Findings

Decision: **A route around a broken tool is a finding about the tool, never a repair of it.** Report it as one, beside the blocker it did not remove. What appears once the detour clears belongs to `rules/the-second-blocker.md`. Removing state to get past it belongs to `rules/never-destroy-to-proceed.md`.

Use when:
- **A flag, a pin, or an environment variable is chosen** because an error went away, not because its meaning was read.
- **A file is copied by hand** into a place a tool was supposed to fill.
- **A command is replaced by a different command** that does something adjacent.
- **The shell needs several attempts, quoting tricks, or a wrapper** to run one ordinary thing.
- **The fix requires steps nobody would write in a setup guide.**

Do:
- **Name the contortion out loud.** Say what the clean path was and why it is unavailable.
- **State the mechanism you observed**, or say you did not observe one. A workaround with no mechanism is a guess that happened to pass.
- **Say what the workaround does not fix.** The next person on this machine, on this repository, in this pipeline.
- **Keep the original command in the report** so the next attempt can be compared against it.
- **Where the contortion is more than one step, stop and hand back.** The decision belongs to the developer.

Avoid:
- **Reporting a workaround as a repair.** The blocker is still there and now nobody is looking for it.
- **Stacking a second workaround on the first.** Two unexplained detours is not progress, it is a second unknown.
- **A pinned version chosen to make a message disappear**, with no note saying which message.
- **Silence about the smell.** "It works now" hides the finding that had the most value.

Exceptions:
- **A documented, supported alternative is not a workaround.** Say where it is documented.
- **A one-line detour MAY be taken without a handback**, provided the mechanism is Confirmed and the note is written.

Each of these stopped an error without anyone reading it:

```
  --force                          the tool was refusing for a reason
  --ignore-engines                 a version constraint someone wrote on purpose
  TLS_REJECT_UNAUTHORIZED=0        a certificate problem, disabled everywhere
  copying the artifact by hand     the step that should produce it still fails
```

Verify:
- **Quote the command that failed and the one that succeeded.**
- **Name the mechanism, or record a Gap saying it was not established.**
- **State what remains broken for the next person**, in one line.
