---
id: treat-blockers-as-incidents.the-second-blocker
owner: treat-blockers-as-incidents
canonical: true
severity: hard-gate
references: [incident postmortem practice]
---

# The Second Blocker

Decision: **Clearing the first blocker proves the first blocker is gone, and nothing else.** Treat what appears behind it as independent until observed otherwise. Whether the first fix was a contortion belongs to `rules/workarounds-are-findings.md`.

Use when:
- **A fix worked and something new failed immediately.**
- **You are about to report the first repair as the resolution.**
- **The original command still does not complete**, though its first error is gone.
- **A retry gets further each time** without ever finishing.

Do:
- **Re-run the original command after every fix**, and read how far it now gets.
- **State the first fix as removing the first failure only.** Never as the repair.
- **Number the blockers and carry the count in the report.** Two found is a different story from one.
- **Establish each one separately.** A shared symptom is not a shared cause.
- **Where the second sits behind a third, stop and hand back.** Depth is the signal that the environment, not the command, is the subject.

Avoid:
- **Reporting a partial clearance as done.**
- **Assuming the second failure is a consequence of the first fix.** It is usually older than the fix.
- **Folding several blockers into one finding.** The next person hits them one at a time.

Verify:
- **Quote the original command's output after each fix**, showing how far it reached.
- **Name every blocker found, numbered**, each with its own state.
- **State plainly whether the original goal is now reachable.**
