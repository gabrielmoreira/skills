---
name: optimising-skills
description: >-
  Change a skill that already exists, when something says it underperforms and
  you are about to act on that. Covers doubting the number before spending on
  it, classifying which kind of failure this is, choosing the form of the fix
  from the failure class, running the change as one registered experiment, and
  reverting on the condition you wrote down first. Use when a skill fires on
  work it excludes, misses work it claims, is read and then disobeyed, scores
  badly on its own scenarios, or when you are about to cut instructions from it
  because a newer model looks like it no longer needs them. Most changes of this
  kind fail, and the ones that fail quietly are the ones that were never
  predicted. Not for writing a skill that does not exist yet, not for splitting
  or renaming one, and not for judging a change already made, which is a review.
---

# Optimising Skills

**Core principle.** A change to a skill is an experiment, and the number that motivated it is the first thing to doubt.

- **This is the second half of a pair.** Writing a skill so it can be proved belongs to `authoring-verifiable-skills`. This owns what happens after: a skill exists, evidence says it underperforms, and something is about to change.
- **The weight sits in *Is the number real* and *Match the form to the failure*.** Everything after them is bookkeeping; everything before them is guessing.
- **You opened this in the middle of something.** Name the skill under change and the evidence that sent you here, then return to that work when this closes.

## Say which state you are in

**You MUST report it every time.** Each state licenses only what it names.

| State | Means | Licenses |
| --- | --- | --- |
| `opt/UNVERIFIED` | a number says a skill underperforms and the instrument that produced it has not been checked | checking the instrument, reading answers, nothing that edits a skill |
| `opt/MEASURED` | the instrument was watched refusing a planted case, and the number survived | classifying the failure |
| `opt/CLASSIFIED` | the failure class is named from an observable, not from the score | choosing a form and writing a prediction |
| `opt/PREDICTED` | the change, the expected direction, and the revert condition are written down before the run | applying one change and running it |
| `opt/DECIDED` | the result is in and compared against what was predicted | keeping, reverting, or recording it unproven |
| `opt/UNPROVEN` | the run finished inside the noise floor | saying so, and nothing that claims a gain |

- **No state is reached by assumption.** Each names an observation you made.
- **`opt/DECIDED` requires the prediction to have been written before the run**, not reconstructed after it.

## Which phase applies

**This table is a gate, not a checklist.** Match the left column against what you have.

| If you see... | Go to |
| --- | --- |
| a score, a rate, or a pass count that has not been separated from the tool that produced it | §1 Is the number real |
| a verified number and no named cause | §2 What kind of failure is this |
| a named failure class and an urge to reword something | §3 Match the form to the failure |
| a chosen change and no written prediction | §4 One variable, registered first |
| a finished run | §5 Decide, and say which |
| an intention to remove instructions because a newer model looks capable enough | §6 Subtraction, and what it costs to get wrong |

## 1. Is the number real

**A wrong check turns red. A wrong measure returns something plausible and it reaches a report.** `authoring-verifiable-skills/rules/prove-a-measure.md` owns the general obligation; this is where it gets spent.

- **Feed the measure the thing it must not count, and watch it not count it.** A measure with no planted case is an opinion with a number attached.
- **Read the answer the run produced, not only the verdict.** Every material finding in this collection's own history came from reading a transcript, and none came from the number looking wrong. `scripts/read-answers.mjs` prints them.
- **Check the suite before trusting a green result from it.** A scenario whose prompt refers to work the workspace does not contain is unanswerable, and the honest refusal scores as failure. `scripts/coverage-audit.mjs` reports the axes.
- **Balance is a precondition, not a nicety.** A suite that only tests when a skill should fire produces a skill that fires on everything, and the score will not say so.
- **Name the noise floor before reading a delta.** Two untouched skills moving by one sample of three is what noise looks like here.

## 2. What kind of failure is this

**Name the class from what the run did, not from the score.** The fix that repairs one class measurably damages another.

| What the transcript shows | Class | Where the fix can live |
| --- | --- | --- |
| the skill was never opened, and another was | routing | the router gate, the name, or the scenario's own territory |
| the skill was opened and no rule of its own was entered | reach | the gate table inside the skill |
| the skill was opened, its rules were read, and the forbidden thing happened anyway | compliance | the form of the instruction, and §3 decides which |
| the answer did the right thing by a different route | scenario | the scenario asserts a path where its own criteria are about content |
| the prompt names a state the workspace lacks | fixture | the scenario, not the skill |
| the trigger fires at a moment the architecture never revisits | unreachable | nothing inside the skill repairs this |

- **A scenario that does not route is not automatically a routing defect.** Read the prompt before accusing the skill.
- **An unreachable trigger is a finding, not a bug to fix.** A condition that arrives after the routing decision has been made cannot be reached by any wording, and saying so is the result.

## 3. Match the form to the failure

**The form is chosen from the class, and the wrong form is measurably worse than no guidance.**

| Failure being repaired | Form that fits | Form that backfires |
| --- | --- | --- |
| knows the rule, breaks it under pressure | prohibition, plus the rationalisations named and a red-flag list | soft preference wording |
| complies, and the output has the wrong shape | a positive recipe stating what the output is, in order | a list of prohibitions |
| omits an element from something already produced | a required slot in the structure being filled | a reminder in prose beside it |
| behaviour should depend on a condition | a conditional keyed to an observable predicate | an unconditional rule with exemption clauses |

- **A nuance clause reopens the negotiation.** Appending one to a recipe that worked degraded it from consistent to noisy. Express a real exception as its own conditional on something observable.
- **An exemption does not scope.** A limit that says it excludes one part still suppresses that part. Restructure so the rule cannot reach it.
- **Match the freedom to the fragility.** Prose where several routes are valid, a parameterised procedure where one pattern is preferred, an executable script where the sequence is fragile and a deviation is a defect.
- **A final check that is stricter than the body erases the body.** Six skills in this collection ended that way. Carry the exception into the check, or narrow the rule until the check is true.

## 4. One variable, registered first

**Write the prediction where it can embarrass you.** A result read against a memory of what you expected is not a result.

- **One change per run.** Two changes and one number cannot be attributed, and the run buys nothing.
- **State the revert condition in the same breath as the change.** Name the measure that would send it back, and the value that counts as sent back.
- **Predict every measure the change could move, not only the target.** A gain on the target and a loss elsewhere is the common shape, and an unpredicted measure is the one nobody checks.
- **Keep the before and the after on the same scenarios.** A sample that changed between runs makes the delta unreadable.
- **Do not edit a skill while a run reads it.** The run loads the files live, and half the samples will see each version.

## 5. Decide, and say which

- **Falsified goes back.** The condition you wrote is the condition, and a reason found afterwards to keep it is the failure this whole procedure exists to prevent.
- **Inside the noise floor is `opt/UNPROVEN`, not a small win.** Say the interval, say the sample, and leave it level with nothing.
- **A null with no cost can still be kept on an owner's instruction.** Record that the reason is the instruction and that no gain was established, in the commit, where the next reader meets it.
- **Record what was tried and failed.** `references/falsified.md` is that record here, and it is what stops the third attempt at a lever already measured twice.

## 6. Subtraction, and what it costs to get wrong

**Removing an instruction that a newer model no longer needs is a real gain, and the same move on a weak suite removes something load-bearing while the score stays green.**

- **The suite is the precondition.** Subtract only against coverage you have a reason to trust, and §1 is that reason.
- **Remove one group at a time and rerun the same scenarios.** A block removed wholesale cannot be attributed either.
- **Minimal is not short.** The target is the smallest set of high-signal instructions that still produces the behaviour, which is a different quantity from the shortest file.
- **A threshold is a diagnostic, not an acceptance criterion.** A measure written to score a rewrite gets satisfied by that rewrite, and the argument the prose carried is what pays.

## Where the evidence is

- **`references/evidence.md`** carries the sources, what each one established, and what it did not.
- **`references/falsified.md`** carries every change tried here, its prediction, its result, and whether it stayed.

## Routing

- **A skill that does not exist yet belongs to `authoring-verifiable-skills`.** So does splitting, renaming, or repairing one on structure alone.
- **Judging a change that already exists belongs to `evidence-backed-review`.**
- **Ground you cannot name yet belongs to `bound-the-unknown`.** Come back when there is a number to doubt.
- **A direct instruction from the owner outranks anything here.**
