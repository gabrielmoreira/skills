# Historical optimisation attempts

Original observations are preserved below. Reverting a candidate for failing a
registered adoption rule does not prove its entire mechanism ineffective.

## The record

```
1  an exclusion moved from the tail into the trigger
   skill      keep-the-thread-across-boundaries
   predicted  two named negatives stop firing
   measured   1 of 4 negatives shut before, 1 of 4 after; the positive fell 3/3 to 2/3
   outcome    reverted

2  the missing case added to the trigger list, in the body's own words
   skill      treat-blockers-as-incidents
   predicted  a flaky-suite negative moves off zero
   measured   0/3 before, 0/3 after; routing identical, every sample to the same neighbour
   outcome    reverted

3  a discriminator added inside the skill, in a block built for that shape
   skill      test-first-by-evidence
   predicted  a coverage-chasing negative moves off zero
   measured   0/3 to 1/3, inside the noise floor; positives fell
   outcome    reverted

4  a gate row in the router naming the situation in the scenarios' own terms
   skill      the router
   predicted  two scenarios of an unreachable mode start firing
   measured   0/5 to 0/5 on both; negatives across five skills fell 68% to 60%
   outcome    reverted

5  a keyword added to an instruction that carried none
   skill      five skills with a state table
   predicted  the announcement rate rises
   measured   36% to 40%, intervals [29-43] and [33-47], overlapping
   outcome    kept on the owner's instruction, with no gain established
```

## What the record establishes

**These attempts did not establish the intended improvements.** Some observations
also show regressions. The comparison conditions and small samples limit what
can be inferred; the rows are not evidence that instruction text cannot help.

**The retained change was preference-based.** No gain was established, and the
reported measurement did not detect a cost. Absence of detected cost is not a
general guarantee of non-inferiority.

## What each one ruled out

- **Attempt 1:** moving this exclusion did not improve these negatives in this
  comparison. The positive drop is a regression signal, not a universal law of placement.
- **Attempt 2:** naming this case did not move three observed samples. That does
  not establish that descriptions never influence selection.
- **Attempt 3:** the change was declared inside the observed noise floor and
  positives fell. This is insufficient evidence for adoption, not proof that
  discriminators cannot repair compliance.
- **Attempt 4:** the trace was interpreted as a routing opportunity absent from
  this harness mode. Verify that architectural condition before applying the
  explanation elsewhere; a zero score alone cannot establish unreachability.

## The candidates nobody has tried

Hypotheses not evaluated by the comparisons above, not the only options remaining.

- **The name.** Whether a more discriminating name helps remains untested. Name
  changes also affect references and discovery, so the intervention is broader
  than replacing one description sentence.
- **Ownership.** Two skills competing for an unanchored question may need one of
  them to stop claiming it, which is a decision for the owner rather than a
  wording change.
- **Accepting the behaviour.** A skill that opens on an adjacent case and then
  declines costs a load. That cost is measurable and may be smaller than the
  alternative.
- **The architecture.** If a trigger requires a routing opportunity this harness
  never supplies, another prose edit cannot create that runtime capability.

## How to add to this record

One block per attempt, in the shape above. The prediction goes in before the
run, not after it. A result inside the noise floor is written as such rather
than rounded toward the outcome that was hoped for.
