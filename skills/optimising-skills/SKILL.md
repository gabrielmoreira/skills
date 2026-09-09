---
name: optimising-skills
description: >-
  Improve an existing skill when there is a concrete defect, an observed task
  failure, unnecessary work, or a proposed behavioural change. Separate textual
  correctness from effectiveness; check the task, environment and evaluator
  before blaming instructions; choose an intervention, compare it against a
  baseline, and decide with bounded evidence. Use for skill ablations, confusing
  triggers, unreliable guidance, regressions, and evaluating whether a rewrite
  helps. Not for creating a new skill, reviewing a completed change, or repairing
  a runtime failure by adding prompt instructions.
---

# Optimising Skills

**Improve the work the skill helps produce, not its score on its own rules.**

A contradiction can be corrected by reasoning and reproduction. A claim of better
agent behaviour needs a comparison. Neither a green checker nor following this
procedure establishes that a skill helped.

## Choose the depth the question needs

| What you have | Read |
| --- | --- |
| a contradictory rule, misleading example, or suspected cause of failure | [Diagnosis and intervention](references/diagnosis.md) |
| a score, proposed eval, judge, or scenario whose validity is uncertain | [Evaluation design](references/evaluation.md) |
| a justified candidate ready for comparison, ablation, or repeated improvement | [Experiments and decisions](references/experiments.md) |
| a measurement tool, session trace, cost claim, or missing observation | [Instrument contracts](references/instruments.md) |
| a recommendation attributed to a vendor, paper, or another collection | [Evidence and transfer](references/evidence.md) |
| a claim that a wording approach has already been disproved | [Historical attempts](references/falsified.md) |

Read the applicable method, not every file by default. The table selects depth;
it does not make every typo correction run an experiment.

## Make the current state visible

Say the state when entering or changing a phase, with its evidence and next action.
These are evidence boundaries, not a requirement to narrate every tool call.

| State | What is established | What it permits next |
| --- | --- | --- |
| `opt/UNVERIFIED` | A reported problem, not yet a checked cause | Inspect the observation and instrument |
| `opt/MEASURED` | A checked observation or reproducible semantic contradiction | Distinguish competing explanations |
| `opt/CLASSIFIED` | A bounded diagnosis, with alternatives and gaps | Choose a repair or behavioural hypothesis |
| `opt/PREDICTED` | A frozen intervention, comparison and decision rule | Run the authorised comparison |
| `opt/DECIDED` | Evidence supports a scoped keep, revise or revert decision | Apply within authority and record the limits |
| `opt/UNPROVEN` | The intended benefit remains unsupported | Preserve nulls, acquire discriminating evidence or stop without a win claim |

An objective repair can move from a checked contradiction to `opt/DECIDED` without
a behavioural experiment. A phase name never supplies missing evidence.

## Begin with a decision, not a metric

State the skill, the concrete problem, the user outcome at risk, and the evidence.
If the only complaint is a word count or personal preference, do not present it as
measured harm. A preference can still justify a change when its owner chooses it.

Choose the appropriate path:

- **Objective repair:** quote the incompatible conditions or reproduce the broken
  example. Repair the source and affected references. Check the same failure no
  longer occurs. Claim corrected semantics, not improved model performance.
- **Behavioural hypothesis:** specify what should change in produced work, why,
  what would count against it, and which other outcomes must not regress. Follow
  the experimental path below.
- **Fault outside the skill:** retain the evidence and hand the repair to the
  owning layer. A missing dependency, truncated tool response or broken grader is
  not repaired by a stronger MUST.

## The experimental path

1. **Check the observation.** Inspect the task, initial state, actual output and
   evaluator. Establish that the task is solvable and the failure is real.
2. **Name competing explanations.** Routing, unavailable content, instruction
   ambiguity, model capability, conflicting rules, harness, environment and judge
   are hypotheses until discriminating evidence supports one.
3. **Register a candidate.** Freeze the baseline, task families, relevant runtime
   settings, intended benefit, regression limits and decision rule before results.
4. **Compare on development cases.** Change a coherent mechanism, retain failures,
   inspect produced artifacts, and investigate unexpected regressions. More trials
   reduce sampling noise; more distinct tasks test breadth. They are not substitutes.
5. **Lock and confirm.** Choose using development/selection evidence. Confirm the
   frozen candidate on cases not used to choose it. If confirmation informs another
   edit, it has become development data; do not reuse it as independent proof.
6. **Decide and bound the claim.** Keep, revise, revert, or leave inconclusive.
   Report task outcomes, effect, uncertainty, costs, regressions and tested scope.
   Stop or change the question when further observations cannot inform the decision.

No automatic revert, publication, data transfer, or spending beyond the authorised
workflow is licensed by these steps. Preserve the baseline and ask where authority
or an irreversible consequence is genuinely unresolved.

## What a useful result includes

- A concrete artifact or observed task outcome, not a declaration of compliance.
- A comparison with equivalent task inputs and explicit control of other changes.
- Results by relevant failure category, including refusals and safety constraints.
- The sample unit, missing/invalid trials, effect and uncertainty, not only a mean.
- Total task cost where available; unknown billing is unknown, not zero.
- The reason for the final decision and what observation would justify revisiting it.

A safe textual correction may stand even if behavioural lift is undetected. A
cheaper candidate may be useful if the relevant outcomes are preserved under a
stated non-inferiority margin. Neither is a licence to call an inconclusive score a win.

## Boundaries

- Creating, splitting or renaming a skill belongs to `authoring-verifiable-skills`.
- Reviewing an existing change belongs to `evidence-backed-review`.
- Diagnosing an unknown runtime failure belongs to `debugging-by-evidence` or the
  environment-blocker procedure, according to where the failure occurs.
- Manual invocation is not inherently a routing defect. A late first read is not
  proof that a router caused it. A flat skill need not open a separate rule file.
- Source recommendations are conditional inputs. See the evidence register before
  transferring instructions about context, tool loading or reasoning protocols.
- A successful pilot supports its tested setting, not this method's universal efficacy.
