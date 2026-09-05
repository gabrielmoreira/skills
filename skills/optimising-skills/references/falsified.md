# Falsified

Every change tried on this collection, its prediction, its result, and whether
it stayed. A lever measured twice does not get a third run without a new reason.

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

**Editing instruction text did not move behaviour in four attempts across three
mechanisms.** A skill description, a rule inside a skill already open and being
followed, and the router's own gate table. Two of the four cost something.

**The one change that stayed is not evidence against that.** It was kept because
the owner asked for the behaviour and the measurement found no cost. The commit
says so.

## What each one ruled out

- **Where an exclusion sits does not change what fires.** Attempt 1. The three
  failing negatives were each named in the description's own exclusion clause,
  and moving that test into the first clause of the trigger changed nothing.
- **Naming the missing case does not admit it.** Attempt 2. The body already
  covered the case in a sentence the run had read.
- **A discriminator inside an opened skill does not repair compliance.** Attempt
  3. The rules were read, the state was announced, and the forbidden thing
  happened anyway.
- **A gate row cannot fire at a moment the architecture never returns to.**
  Attempt 4. The router is read once, at the start; the mode it was meant to
  reach triggers during work already under way.

## The candidates nobody has tried

Ordered by what the record leaves standing.

- **The name.** Every failure above was on a skill whose name describes a purpose
  rather than a moment. Untested, and a rename is expensive because references
  break.
- **Ownership.** Two skills competing for an unanchored question may need one of
  them to stop claiming it, which is a decision for the owner rather than a
  wording change.
- **Accepting the behaviour.** A skill that opens on an adjacent case and then
  declines costs a load. That cost is measurable and may be smaller than the
  alternative.
- **The architecture.** A trigger that fires mid-task needs something that
  re-enters the routing decision. Nothing in a file can supply that.

## How to add to this record

One block per attempt, in the shape above. The prediction goes in before the
run, not after it. A result inside the noise floor is written as such rather
than rounded toward the outcome that was hoped for.
