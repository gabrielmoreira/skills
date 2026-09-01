---
id: make-the-docs-trustworthy.record-what-code-cannot-show
owner: make-the-docs-trustworthy
canonical: true
severity: default
references: [architecture decision records, design rationale capture, tribal knowledge]
---

# Record What Code Cannot Show

Decision: Write the record at the moment the decision resolves, not in a later documentation pass.

- **Carry only the three things code cannot show.** A constraint invisible at the call site. A.
  deliberate deviation from the obvious path. An alternative a future reader will re-propose.
- **The reasons live in someone's head for about a day**, and the diff will not recover them.
- **Owns the first writing of a record.** Every answer after that one → `rules/supersede-or-delete.md`.
- **A fact an artifact already renders, and so is never written** → `rules/restatement-is-drift.md`.

Use when:

- A constraint forced the shape of something and appears nowhere in the code.
- The obvious approach was rejected for a reason a reader would not guess.
- An alternative was raised, dropped, and will be raised again.

Do:

- **Apply the three-part worth-recording test owned by
  `evidence-backed-review/rules/docs-and-skills-freshness.md`.** Never restate that test here.
- **Say the test was not applied where that rule is not installed.** Never invent one.
- **Write the record in the same change as the code it explains.**
- **Name the rejected alternative, and the condition that would reopen it.**
- **State what was not decided**, so open ground is not read as closed.
- **Keep the constraint concrete.** The limit, the number, the external system that imposes it.
- **Write the record now where the decision resolves in conversation.** Name the change it awaits,
  even though the code lands later.

Avoid:

- **A record reconstructed a week later from the diff.** It recovers what changed and none of why, which is the only part the code could not already show.
- **Leaving the reasoning in the change description**, where no later reader looks, so the decision is re-argued by people who cannot find that it was settled.
- **A record listing the benefits of the chosen path and naming nothing rejected**, which reads as advocacy and gives the next reader no way to reopen it responsibly.

Exceptions:

- Record a constraint imposed by a system outside this repository. Do that even where the choice was
  cheaply reversible. Nobody here can re-derive it.

Example (one instance, not the set):
```
Constraint   the upstream feed caps one batch at 500 rows
             nothing at the call site shows the cap
Deviation    we page in 500s, where the code alone would suggest streaming
Rejected     streaming. Reopens if the feed lifts the cap or offers a token.
NOT decided  whether the retry policy moves with the paging
Written in the same change as the paging code. Worth-recording test applied.
```

Verify:

- **Read the record.** It names one rejected alternative and one thing not decided.
- **Look for the stated constraint in the code it explains.** Visible there means the record is restatement.
- **Confirm the record and the code it explains appear in the same change.**
