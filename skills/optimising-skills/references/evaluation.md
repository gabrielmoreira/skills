# Evaluation design

## Define the contract before the candidate

Record the user outcome, required inputs, permissible alternatives, prohibited effects,
and evidence that success is possible. Use an executable reference or independently
checked worked solution where feasible. Its implementation is not the only acceptable
answer. Missing prerequisites should produce a justified refusal, not a fabricated result.

Separate three questions:

1. **Discovery:** does the harness expose and select appropriate guidance?
2. **Conditional usefulness:** given relevant guidance, does produced work improve?
3. **End-to-end usefulness:** with normal discovery and surrounding instructions, does the
   whole task improve, including costs and failures?

A forced-read component experiment answers the second question only. A routing score
cannot answer the third. An easy task remains a useful regression control even if a
lexical baseline also solves its routing; it simply offers little evidence of difficult
semantic discrimination.

**Method contribution is a fourth question.** Give method-assisted and unaided
optimisers the same starting skill, evidence, permitted tools and feedback. The
control should receive a competent neutral task, not deliberately poor advice.
Only method exposure differs. Freeze each resulting candidate and compare the work
it helps produce on cases neither optimiser used for selection. The optimisation
attempt is a sample unit; hundreds of checks on one chosen rewrite are not hundreds
of independent demonstrations of the method. Include optimisation cost and refusals.
A known defect can be a legitimate input, but cannot become a discovery claim.

Retrospectively applying the method to claims that informed its design is useful
calibration material, not confirmation. A method that correctly rejects those claims
has not yet demonstrated that it generates better skills on new work.

## Build realistic task families

Use reported defects, authorised and sanitised traces, public tasks, or explicitly labelled
synthetic fixtures. Include the state the task needs: files, dependency contracts, permissions,
initial records and tool responses. Keep the environment consistent across turns.

Select relevant dimensions rather than generating a Cartesian product without purpose:

- normal success, empty/absent input and boundary values;
- plausible ambiguous instructions and valid alternative solutions;
- tool failure, delayed rejection, partial batch success, pagination and incomplete results;
- refusal when a prerequisite or authority is missing;
- conflicts between new guidance and existing required behaviour;
- recovery after a failed action without duplicate side effects.

Perturbations must preserve the intended API contract. A fake asynchronous dependency
that can never reject will not test rejection ownership. A simulated environment is a
hypothesis: compare important transitions against the real runtime before trusting it.
Do not claim a fixture reproduces production prevalence or all failure modes.

## Separate selection from confirmation

Assign whole task families before candidate selection. Renamed entities, parameter changes,
and paraphrases of the same solution belong to one family, not independent evidence.
Hashing scenario IDs does not establish this separation. Preserve provenance and inspect
near duplicates by meaning, not just lexical overlap.

Development data can be examined freely for improvement. Selection data chooses candidates
and therefore is not untouched confirmation. A final set stays out of candidate decisions.
If its results inspire another edit, label it development and obtain new confirmation cases.

Independence has several dimensions. Say who designed cases, who changed the skill, who
constructed the oracle, which outputs each could see, and where access was technically
restricted versus merely procedurally withheld. A second answer from the same model is
not an independent expert replication. Same-author synthetic fixtures remain a limitation
even when candidate labels are hidden.

## Choose and challenge the grader

Prefer observable outputs and final environment state. For code, execute the produced
implementation. Keep the oracle outside the candidate-editable workspace. Check the
returned value, error identity, persisted state and required ordering rather than the
presence of a particular API, phrase or number of edits.

Before evaluating a candidate, challenge the grader with:

- at least one working implementation and, where feasible, a materially different correct one;
- a known defect for each important protected behaviour;
- an empty/no-op response, a swallowed error, a plausible but incorrect artifact, and a
  broken prerequisite where applicable;
- irrelevant verbosity and assertions of success without the underlying result.

Record which defects it detected and which remain invisible. Mutations validate the
specific checks they exercise, not the completeness of the rubric. A test error or a
missing runtime is not a meaningful negative control.

When judgement cannot be mechanical, freeze an anchored rubric and calibrate against
expert-reviewed cases with known disagreements. Hide candidate identity, randomise order,
allow ties/abstention and preserve reasons. Check position, verbosity and style sensitivity
by swapping order or changing irrelevant presentation. Report unresolved grader disagreement;
do not pick the judge that favours the candidate. Route/trajectory constraints are legitimate
when the task actually requires them, for example approval or prohibition of secret disclosure.

### Reuse a judgement protocol, not a universal quality score

For prose, document placement or architectural advice, reuse the comparison record
and grading procedure. Replace the domain contract and calibration anchors, not the
whole experiment platform. A mechanical oracle is one implementation, not a boundary
on which skills can be improved.

Prepare a packet containing the task and initial files, authoritative constraints,
accepted alternatives, protected outcomes, and anonymised final artifacts. Keep
method/arm names and self-reported scores out of the grading view. Each criterion
returns `met`, `not met` or `unknown`, an artifact location and the supporting fact.
Separate required constraints from preference; never average a critical violation
away with several cosmetic successes. A location or quote supports inspection but
does not replace the judgement.

For example, when a repository names a canonical setup document, an accurate update
in that document and an accurate linked subsection can both be acceptable. A polished
new competing source, an unsupported configuration claim, and a summary saying the
document was updated when no artifact changed are negative calibration examples.
An absent repository placement policy can make a choice genuinely uncertain; the
grader must not invent that policy to obtain a binary answer.

Have domain reviewers establish the expected calibration decisions and disagreements
before candidate grading. Include correct alternatives, attractive wrong answers and
insufficient-evidence cases; then swap presentation order and irrelevant style. If
the actual grader does not distinguish those anchors, revise the instrument before
using it. Report scope and unresolved disagreements. A written rubric that nobody
has exercised is still unvalidated, just like an unrun executable oracle.

## Sampling and summaries

Balance coverage of important failure classes, not necessarily counts at 50/50. Report
class-specific results and, if justified, a separately weighted deployment estimate with
its weights and source. A positive/negative ratio alone neither causes nor proves overfiring.

Distinguish task, trial, assertion, tool call and session. Repeated rollouts on one task
estimate run variability, not breadth over tasks. Assertions within one artifact are correlated.
Do not treat hundreds of trace records as hundreds of independent successes.

For binary tasks report successes/attempts per arm and paired wins/losses/ties. For a chosen
primary measure report its effect and interval, the interval method and sampling unit. A
paired task-level bootstrap can describe sampled-task variation when there are enough
families; with very few families report raw effects and the broad limits rather than a
precise population claim. A binomial interval assumes independent Bernoulli trials and
should not silently replace a clustered analysis.

Predeclare the meaningful improvement or acceptable non-inferiority margin and why it
matters. Overlapping arm intervals are not themselves a test of the paired difference.
No detected difference does not establish equivalence. A clean suite may be saturated:
retain it as a regression check, then seek relevant discriminating tasks, not artificial
tricks chosen only to make the baseline lose.

## Validity failures

Unexpected model/provider, truncated output, failed runner startup, invalid initial state,
missing artifacts or evaluator failure are separately recorded. Preserve the denominator
of attempted trials; do not silently drop inconvenient outcomes or count them as skill failures.
An artifact that genuinely hangs or crashes under a valid task can be a task failure; a
harness that could not run the artifact is an infrastructure failure. Explain the distinction.

Before interpreting scores, inspect representative successes, failures, all unexpected
regressions and grader disagreements. Confirm that the checked artifact is the one the
agent produced, not a later repaired copy.
