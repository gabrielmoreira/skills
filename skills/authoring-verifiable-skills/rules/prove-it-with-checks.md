---
id: authoring-verifiable-skills.prove-it-with-checks
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [mutation testing, differential testing against a reference implementation]
---

# Prove It With Checks

Decision: **A check suite proves nothing until a deliberately broken skill fails it for the right reason, so every check MUST have a mutation that makes it, and only it, turn red.** Proving a measure, which returns a number rather than a verdict, belongs to `rules/prove-a-measure.md`.

Use when:
- **A skill is being added or changed**, which is every time.
- **A check has never been watched fail.**
- **A suite is green** and nobody can say what it would catch.
- **A skill has no scenarios**, so its routing is a claim rather than a result.
- **Frontmatter is being edited**, where a break is invisible to a line-by-line reader.

Do:
- **Validate frontmatter with a strict parser that is built in.** No dependency, and it runs on every skill on every run.
- **Make that parser fail on anything it does not understand.** One that skips the line it cannot read reports a valid document while the key nobody validated quietly does nothing.
- **Write one mutation per check.** It injects exactly the defect that check exists to catch.
- **Assert the right check turned red**, not merely that something did.
- **Report a mutation that no longer applies as stale**, because a check nobody has seen fire is decoration.
- **Report a missing scenario suite as UNPROVEN**, never as passing.
- **Keep mutations structural rather than anchored to strings**, so they survive a rewrite of the skill.
- **Cross-check the built-in parser against a full implementation** where one is available, and skip cleanly where it is not.

- **Select a description on scenarios it was not tuned against.** Keep the version scoring best on the held-out half, not the last one written.

Avoid:
- **Tuning against every scenario you measure on.** It passes because it was fitted to those prompts.
- **Trusting a green run.** Green means the checks did not fire, which is also what a check that cannot fire looks like.
- **A check with no mutation.** It is an opinion with a pass label.
- **Loosening a check because one instance is defensible.** Reword the instance, or the check stops holding everywhere else.
- **Moving a threshold to make a file pass.** Move it only where the measurement itself is wrong, and record the reason in the code.

Exceptions:
- **An outcome case instructs where an activation scenario asks**, since an answer leaves nothing to score. C-14 still binds, and a paraphrase defeats it: the script catches names and stated verdicts, a restated decision is read by a person.
- **A measurement MAY be corrected when it measures the wrong thing.** A line ceiling that counts frontmatter scores a formatting choice rather than the document, and fixing that is not loosening.

Example (one instance, not the set):

```bash
node tools/check-all.mjs            # everything, across the collection
node tools/verify-skill.mjs <dir>   # structural invariants, frontmatter included
node tools/mutate-skill.mjs <dir>   # each check fires for its own reason
node tools/readability.mjs --skill <dir>
node tools/check-yaml-parity.mjs    # optional cross-check, skips when absent
```

Verify:
- **Run the mutations and read which check caught each one.**
- **Confirm every scenario suite covers every rule** with at least one positive case.
- **Say plainly what has not been run.** Scenarios that exist but have never executed make routing declared, not proved.
