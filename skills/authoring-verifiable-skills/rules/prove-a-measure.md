---
id: authoring-verifiable-skills.prove-a-measure
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [five instrument defects found in one day, four caught before they were believed]
---

# Prove A Measure

Decision: **A measure MUST be watched returning a known-wrong answer on planted input before any number it produces is quoted, because a wrong check turns red and a wrong measure returns something plausible.** Proving a check with a mutation belongs to `rules/prove-it-with-checks.md`.

Use when:
- **A tool returns a number rather than a verdict.**
- **A number is about to enter a report, a commit message, or a decision.**
- **A measure searches text that contains the thing it searches for.** A transcript inlines every file the run read.
- **A rate moved and nothing about the subject changed.**
- **A conclusion rests on one field** nobody has watched being written.

Do:
- **Plant the way it could be fooled**, not a case it obviously handles.
- **Feed it the thing it must not count, and watch it not count it.**
- **Read the file it scored worst.** If that file is fine, the measure is not.
- **Check the number against a witness the measure did not produce.**
- **Say what it cannot see beside the number.** Half of one measure's input was encrypted, and the number was quoted with that stated rather than without it.
- **Throw a defective proxy away** rather than keep it beside the corrected one, because a number with a known defect gets quoted later without the caveat.

Avoid:
- **A generic sanity case standing in for a planted one.** One measure separated an abstract paragraph from a concrete one, passed, and still scored the most concrete file in the collection at 100% bare, because its instances were quoted phrases rather than backticks.
- **Believing a metric written to score the rewrite it is scoring.**
- **Reading an empty field as a finding.** A field computed, graded on, and never written down reads as the agent having done nothing.
- **Quoting a number before anything independent has agreed with it.**

Example (one instance, not the set):

```
what caught it                      what it caught
reading the worst-scoring file      typography counted as concreteness
a second field disagreeing          an empty list read as "opened nothing"
a gate refusing a commit            a home directory inside a baseline
a row passing for another's reason  a negative failed by another skill's rule
a planted transcript                a state counted from the file it read
```

None was caught by the number looking wrong.

Verify:
- **Run the planted case and watch the wrong answer come back.**
- **Name the witness** for every number that reached a conclusion.
- **Say which numbers have no witness yet**, rather than leaving them level with the rest.
