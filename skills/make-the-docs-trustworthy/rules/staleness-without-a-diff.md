---
id: make-the-docs-trustworthy.staleness-without-a-diff
owner: make-the-docs-trustworthy
canonical: true
severity: hard-gate
references: [documentation as code, link checking, reproduction from source]
---

# Staleness Without A Diff

Decision: Settle a staleness claim before anything is edited.

- **Report it confirmed or refuted, with the artifact that settles it.**
- **A claim with nothing pointing at what changed is a suspicion.** Prose edited on suspicion invents
  fresh wrongness where there was one doubtful sentence.
- **Owns a sentence asserted to be untrue.** A file whose job can no longer be stated
  → `rules/one-artifact-one-job.md`.
- **Whether the document may be cited as a reason at all** → `rules/unreviewed-prose.md`.

Use when:

- Someone reports written material as wrong and names no change that made it so.
- A page cites a path, command, flag, or identifier you cannot find.
- A link in the material resolves to nothing.

Do:

- **Resolve claims one sentence at a time, against the system as it stands.** Run the command. Open
  the path.
- **Check the identifier is still exported.** Follow the link. Pages are not stale as a whole.
- **Name the settling artifact for each.** Command output, file and line, the missing export, the
  dead link.
- **Report refutations as explicitly as confirmations.** Silence reads as agreement, and the claim
  returns next month.
- **Delete the page rather than correct it where the subject itself is gone**, unless it records a
  decision (`rules/supersede-or-delete.md`).
- **Search the old name across all written material after a rename or a move.** Not only the page in hand.
- **Separate a claim about the prose from a claim about the system.** A page that correctly describes
  disliked behaviour is not stale, and that change belongs in the code.

Avoid:

- **Rewriting a paragraph because it reads as old.**
- **Sorting by modification date and editing the top of the list.** A file's age is not evidence
  about its content.
- **Reporting a page stale while naming nothing that disproves it.**

Example (one instance, not the set):
```
Claim: "the setup page is out of date"
  step 2  flag --strict     still accepted, help output line 14   refuted
  step 4  path <config-old> absent; contents moved to <config>    confirmed
  step 6  linked reference  target returns nothing                confirmed
3 claims received, 3 resolved, 1 refuted. Nothing edited before this table.
```

Verify:

- **Read every claim in the output.** Each one carries an artifact a reader can open or run.
- **Re-run each named command.** Its output still matches what was reported.
- **Count claims received against claims resolved.** The numbers match, refutations included.
