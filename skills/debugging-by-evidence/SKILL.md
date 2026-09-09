---
name: debugging-by-evidence
description: >-
  Investigate failures with evidence at the layer that can answer the question.
  Form testable hypotheses from reports, logs and code; use reproduction, replay,
  fault injection or tracing without requiring the whole incident to recur.
  Separate observed triggers from conditional handling defects, protect affected
  contracts, and stop when the evidence supports the scoped decision. Use for
  broken, intermittent, hanging or newly slow behaviour whose cause is unknown.
  Not for judging an existing change or fixing an unrelated environment blocker.
---

# Debugging by Evidence

**Core principle.** Test the claim needed for the decision, not every unknown in the incident.

- **A hypothesis chooses an experiment; it is not a confirmed cause.** Reports, logs and code can supply falsifiable hypotheses before a local reproduction.
- **Use complementary layers of evidence.** An incident record shows occurrence; a controlled experiment can show defective handling without identifying the original trigger.
- **You opened this in the middle of something.** This is how to do that work, not a replacement for it. Name what you were doing before you start, and return to it when this is done.

## Choose a signal for the question
- **Start with the reported failure and available evidence.** A local passing run does not erase a recorded incident.
- **Choose reproduction, replay, controlled fault injection or tracing by what each can establish.** They are alternatives, not a mandatory ladder.
- **Keep the handling under test real.** Inject a justified dependency outcome or schedule, then assert the caller-visible contract.
- **Record the command, conditions and result.** Label injected conditions; do not report them as observed production events.

## What you may write, and when
- **Before a supported repair, writes are limited to authorised diagnostic tests and instrumentation.** Controlled changes to inputs, dependency outcomes or scheduling are experiments, not production fixes.
- **Preserve the baseline.** Change the condition under investigation, not the handling whose correctness you are testing. Isolate substitutions and retain the original evidence.
- **The licence stops at the workspace boundary.** No commit, branch move, remote action or deployment. Remove temporary instrumentation; retain useful regression tests.

## Establish before the first run
- **Never ask what the environment answers.** Three things settle the setup, and the environment already holds two of them.
  - The symptom in the user's own words, quoted.
  - The command the project already declares for running that surface.
  - Whether the failure is reported as constant or occasional, and which conditions or observations are available.
- **Distinguish a reported rate from a measured one.** Measure frequency only when it informs the decision; label unknown frequency rather than requiring repeated failures before investigating.

- **Say the budget out loud before the first probe.** How far you intend to go, in probes or in minutes, stated where I can see it. A bounded investigation I can interrupt is worth more than an unbounded one that arrives finished.
- **Each next probe needs a decision it can inform.** Stop, change the seam or hand back when another run cannot answer the remaining question within scope.

## Which rules to read
**One rule per row.** Match the left column against the symptom or the state you are in.

- **The match sets where to start.** Evidence determines what is justified next; the states are not a sequence every investigation must traverse.
- **Read a rule when its decision is needed.** Stopping and authority limits apply from every state.
- **Where two rows both look like the symptom, read both.** Under-reading costs a whole loop. Over-reading costs one file.
- **Read every row, then act on the matches, hardest to undo first.** Reading a row costs nothing; the row you skipped is where the coverage went.

| If you see... | Read |
| --- | --- |
| **no local run shows the reported failure**, or a loop is slow, noisy, intermittent or unavailable | `rules/runnable-signal.md` |
| a **failing experiment includes irrelevant setup** that obscures the claim | `rules/minimising.md` |
| **one explanation already feels obvious**, or you are about to test the first thing that came to mind | `rules/rival-hypotheses.md` |
| choosing between **observation and a controlled change** to a dependency, input or schedule | `rules/probing.md` |
| the failure **surfaces far from where it starts**, or a **valid dependency outcome leads to invalid caller behaviour** | `rules/fix-at-the-source.md` |
| a **handling defect is demonstrated** and a test must protect it, even if the original trigger remains unknown | `rules/regression-seam.md` |
| attempts **stop informing the decision**, regressions challenge the repair, or a required observation is unavailable | `rules/stopping-and-escalating.md` |

**Discriminators.**

- **Signal against minimising.** Signal chooses a runnable observation or experiment. Minimising removes irrelevant setup once a useful signal exists.
- **Hypotheses against probing.** Name the prediction before the probe. Independent questions may proceed at different layers; keep their evidence separate.
- **Source against seam.** Source decides where a supported repair belongs. Seam decides which contract its test protects.

**Default stance.**

- **Use the cheapest adequate evidence**, not the cheapest check regardless of what it proves.
- **Keep independent fronts bounded.** Source analysis, a handling test and environment observation need not wait for each other when their inputs are available. Do not mix overlapping experimental edits.
- **Do not assert more than was tested.** A conditional handling defect can justify a scoped repair without establishing what triggered a past incident.

## Say what the evidence permits
**Report state when it changes**, with the established claim and remaining gap.

| State | Means | Licenses |
| --- | --- | --- |
| `debug/NO-SIGNAL` | A reported failure, but no runnable check yet | Inspect records and code, form hypotheses, construct a controlled experiment |
| `debug/RED` | A run violates a relevant contract under recorded conditions | Compare explanations and test the mechanism; label observed versus injected conditions |
| `debug/MINIMISED` | Irrelevant setup has been removed from a useful failing check | An optional reduced experiment, not a prerequisite for every repair |
| `debug/EXPLAINED` | Evidence supports the mechanism and the scope of a repair | Apply the authorised repair; keep unobserved incident triggers explicit |
| `debug/RESOLVED` | The demonstrated defect is corrected and affected contracts checked | Close that defect with the tested scope; do not claim the historical trigger was identified unless it was |

- **Do not minimise for its own sake.** Stop reducing when the experiment is understandable and sufficient for the decision.
- **A gap blocks only claims and actions that depend on it.** Investigate another independent layer when useful; do not keep chasing the same unavailable observation.
- **A passing run has limited scope.** No event observed is not proof that an intermittent event cannot occur.

## Match the conclusion to the evidence

- **Occurrence:** a reliable incident record or reproduction shows the failure happened in those conditions.
- **Handling:** a controlled test shows how real code reacts to a specified condition. A dependency outcome must be compatible with its contract; an invented behaviour is not a reproduction.
- **Historical cause:** identifying the trigger of the original incident needs evidence of that trigger, not just a test that forces it.
- **Repair:** removing a defective dependency or branch needs a failing contract check and compatibility checks. It need not require a trigger-rate estimate.
- **Tuning:** retries, backoff or timeout changes need evidence relevant to recovery, timing, load and side effects. A forced error alone does not justify the chosen values.

For each causal claim, cite the code or observed event, the discriminating result and what remains unknown. A plausible alternative need not be eliminated if it does not change the justified repair; record that boundary.

## When to stop instead of trying again
- **Name what another run could change.** Repetition can estimate variability under stated conditions, but is not automatically progress toward the cause.
- **Treat new regressions as evidence against the repair**, not automatic proof that the architecture is wrong.
- **Stop when the scoped decision is supported**, an essential observation is inaccessible, the investigation limit is reached, or the next step needs new authority. Report unresolved questions without blocking unrelated supported work.

## Output contract

```
Symptom      as reported, with the available incident evidence
State        the established claim and the next justified action
Experiments  conditions, real code exercised, observed or injected inputs, results
Mechanism    supported causal links at file:line, including conditional claims
Not shown    historical trigger, frequency or compatibility still unverified
Fix          the scoped change and affected callers/contracts
Proof        the failing contract check before and after, relevant adjacent checks,
             and removal of temporary instrumentation
```

- **Report what you observed, not what you avoided.**
- **Never open with "fixed".** The reader needs the chain first. A fix stated before its cause reads as a guess that happened to work, and sometimes it is one.

## Do not skip this when
- **The cause seems obvious.** That is the anchor this skill exists to break.
- **Someone already reported the failure.** Use their evidence; do not demand a fresh local occurrence before reasoning about it.
- **The fix is one line.** A one-line fix to the wrong line is still wrong.
- **You are in a hurry.** Guessing is what produces the second and third attempt.

## Routing
- **The table above selects the rule and its order.** Read a selected rule in full, interpret it yourself, and say which one you opened in one line.
- **Rival explanations MAY be tested in parallel.** Ranking them and judging what a result means is not delegated.
- **A direct instruction from the user outranks anything here.**
- **Once a fix exists it stops being a symptom and becomes a change.** Hand it to a review of the diff rather than judging it here.
