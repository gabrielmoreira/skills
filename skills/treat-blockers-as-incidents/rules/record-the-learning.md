---
id: treat-blockers-as-incidents.record-the-learning
owner: treat-blockers-as-incidents
canonical: true
severity: hard-gate
references: [incident postmortem practice]
---

# Record the Learning

Decision: **Write the record while the investigation runs, not once it ends.** The ones worth reading are the ones that ran out of room, and those produce nothing if the writing waits. Correcting written material that has drifted belongs to `make-the-docs-trustworthy`.

Use when:
- **Enough is understood to save someone the same afternoon.**
- **A ceiling was reached** and the work is being handed back incomplete.
- **A blocker was cleared** by anything less obvious than reading its error message.
- **The same blocker has now happened twice.**

Do:
- **Give it a date and a specific name**, so a folder of these stays searchable.
- **Record the symptom, the confirmed cause or the confirmed limitation, and the evidence for each.** Where no cause was established, say that plainly.
- **List the alternatives considered and why each was rejected.** That is the part the next reader cannot reconstruct.
- **Write the recovery steps as commands someone can run**, with what healthy output looks like.
- **State the stop conditions**: the states where the next person should investigate rather than retry.
- **Separate what was observed from what was inferred**, and leave the remaining uncertainty in.

Avoid:
- **Writing it at the end.** An investigation that loses its way leaves nothing behind, and it had the most to teach.
- **Recording a secret, a token, a credential value, or raw output carrying one.**
- **A second copy of a fact that already exists somewhere.** Point at the first.
- **Placeholders left in.** An unfinished marker in a record is worse than a shorter record.
- **Claiming a resolution the evidence does not support.** Half of these honestly end unresolved.

Verify:
- **Name the file and its path**, and say whether it is tracked.
- **Confirm the symptom, the cause or the limitation, and the evidence are all present.**
- **Search the text for placeholders and for anything credential-shaped**, and say the search was run.
- **State one concrete verification that was performed**, and every material unresolved limitation.
