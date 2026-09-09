# Experiments and decisions

## Register the comparison

Keep a dated record before the run containing:

- the problem, causal hypothesis, plausible rival and expected user benefit;
- baseline and candidate hashes, task-family provenance, selection/confirmation membership;
- model/provider, effort, harness version, prompt hierarchy, available tools and skill set;
- initial state, permissions, context/memory policy, timeouts and relevant runtime versions;
- primary outcome, cost measures, regression guardrails, invalid-trial policy and decision rule;
- planned repeats, arm order and the conditions for stopping or acquiring more evidence.

A threshold needs a task rationale. It is not justified by being round or easy to check.
If variance is unknown, a labelled exploratory run can estimate feasibility and noise;
those observations cannot then masquerade as untouched confirmation.

## Choose controls for the question

**Current versus candidate** asks whether the proposed change helps. Add **no skill**
when the question is the skill's contribution, or when both versions may merely repeat
what the model already knows. A no-skill arm must have otherwise equivalent task context,
permissions and tools. Do not hide necessary task facts from it.

A lexical router can describe vocabulary shortcuts, not task correctness. A known-good
implementation calibrates the oracle, not the model. An untouched neighbouring task can
reveal drift or regressions, but its stability does not prove all confounds absent.

Pair arms on tasks and initial state. Interleave or randomise arm order so time, cache
warming, load or changing services do not line up with the candidate. A baseline rerun is
valuable when service behaviour can change; record why a frozen historical run is comparable
before reusing it. Pin model fallback off or stop when a different model serves a trial.

## Pick the intervention scale

A coherent one-mechanism change makes attribution easier. It need not be one line.
Fixing an example and its contradicting ownership rule can be one intervention. Record
all components. If several independent levers change together, the result belongs to the
bundle unless an ablation or factorial design separates their effects.

Candidate mechanisms include scope clarification, a corrected procedure, examples that
teach missing distinctions, removal of duplicate instructions, altered discovery, and
reduced tool exposure. Effects may interact: removing a warning can work alone and fail
when another skill suppresses the remaining safeguard. Test important interactions rather
than assuming each component has an independent additive effect.

Automatic prompt optimisation can generate candidates from development errors, search
several alternatives and select them using held-out selection data. Natural-language
"gradients" are feedback-driven edits, not numerical derivatives with a guarantee of descent.
Keep candidate generation, selection and final confirmation distinct. Beam width, number
of candidates and stopping conditions are experiment choices, not universal skill rules.

## Run a recoverable iteration

Use the project's existing artifact location. A minimal iteration record holds the
registration, frozen arms/configuration, task inputs, raw trial outputs, verifier results,
usage/latency and the keep/revise/revert decision. Hash inputs and the scored artifact.
Do not edit a live arm while it is being read. Reproduce a saved failure without silently
regenerating the output or substituting a newly changed task.

For the next iteration:

1. Compare observations with the registered prediction, including guardrails.
2. Inspect the actual failure, not only its label. Rule out an invalid task or grader.
3. Decide whether the next candidate addresses new evidence or merely repeats an unsuccessful edit.
4. Record what the previous run established and what it did not. Preserve nulls and regressions.
5. Freeze the next candidate and repeat on development data. Acquire confirmation only after selection.

A past local null requires a new rationale for repeating an identical comparison, but it
cannot forbid all future uses of a technique on other tasks or models.

## Decide without manufacturing a win

- **Keep for demonstrated benefit:** the primary outcome meets the stated bar, relevant
  guardrails hold, and the comparison is valid. State the tested scope.
- **Keep as an objective repair or explicit preference:** record that reason separately;
  lack of behavioural lift does not undo a proven semantic correction.
- **Keep for cost reduction:** demonstrate preserved outcomes against a justified margin,
  and measure total task cost rather than prompt length alone.
- **Revise:** a specific observed failure supplies a new hypothesis. Confirmation that
  informs revision is now development evidence.
- **Revert:** the registered harm occurs or the change does not justify its added burden.
  This operational decision is not proof that the entire mechanism is ineffective.
- **Inconclusive:** insufficient discrimination, sample size, scope or valid trials. Report
  what observation would resolve it. Never round this toward the preferred conclusion.

Stop when the question is answered at its required precision, the remaining uncertainty
cannot affect the authorised decision, a guardrail is violated, the instrument is invalid,
or further work requires a different layer or authority. Do not use an arbitrary number
of flat iterations as evidence that the search space is exhausted.

## Adoption and transfer

A forced-read pilot does not establish normal discovery. A fixture experiment does not
establish production prevalence. A single model/effort does not establish portability.
Move from component tests to normal harness composition and broader tasks in separate
comparisons when those claims matter. Retain rollback information and revisit evidence
when the model, task distribution, tool protocol or surrounding instructions change.

A rollout or shadow comparison needs its own privacy, permissions and side-effect policy.
Do not send private traces to a model or publish them merely because a local scanner found
no matches. The instrument contract owns what was actually sanitised.
