# Async ownership pilot

## Question and scope

Does the corrected pair of TypeScript rules improve produced code when the relevant
guidance is supplied? This component comparison is not a test of natural discovery,
production prevalence, or the causal contribution of the optimisation method.
The defect was identified by the earlier textual audit and independently reproduced
in Node. Applying a documented method to that known defect does not establish that
the method discovered it.

The initial design is a source-guided correction followed by a feasibility comparison,
not gradient descent or an optimisation search. One development family cannot establish
search quality. A separate method comparison must give method-assisted and unaided
optimisers the same starting material and judge their resulting work independently.
Retrospectively counting already-known bad claims can illustrate calibration, but is
selected development evidence, not an independent efficacy evaluation.

## Inputs and execution

The registered root contains `baseline.md`, `candidate.md` and `registration.json`.
The two guidance files are frozen copies, not reads from the edited working tree.
The registration identifies model, effort, OMP and Node versions, repeated trials,
timeout, outcome, guardrails and decision rule. It also hashes both arms, task fixtures,
the executable oracle, the complete runner including aggregation, and `pilot-trace.mjs`
as `traceHash`. Register the complete per-run isolation configuration as `overlay`;
the runner requires it rather than silently inheriting context-discovery defaults.

From the repository root:

```sh
node skills/optimising-skills/scripts/async-ownership-pilot.mjs --calibrate <calibration-directory>
node --test skills/optimising-skills/scripts/async-ownership-pilot.test.mjs
node skills/optimising-skills/scripts/async-ownership-pilot.mjs --run <registered-root> --split development --label development
node skills/optimising-skills/scripts/async-ownership-pilot.mjs --run <registered-root> --split confirmation --label confirmation
node skills/optimising-skills/scripts/async-ownership-pilot.mjs --summarise <registered-root>
```

Supply an already working OMP through `--omp <executable>` when necessary. No command
installs dependencies, reads credential files or changes a user profile. The model calls
use the existing authorised runtime. Store outputs in an authorised ignored directory.
Never overwrite an existing run label. Retain the registration preceding an amendment;
record when, why and whether experimental outcomes had already been observed.

Each workspace receives `TASK.md`, `GUIDANCE.md` and `solution.ts`. The agent can use
read/edit/write; it has no test oracle or model grading feedback. Rules, other skills,
extensions, memories and automatic model fallback are disabled. The task remains
binding when guidance conflicts with it. Raw events, stderr, artifact hashes, usage
when available and each mechanical grade remain on disk.

These are exposure controls, not an operating-system sandbox. A post-run trace check
cannot reverse a forbidden access; path syntax and all supported tool payload forms
must be verified before making a stronger isolation claim. Use only public synthetic
material, never private traces, in this pilot.

## Families and protected outcomes

| Family | Role | Observable contract |
| --- | --- | --- |
| pipeline | development | Independent reads overlap; dependent work starts after auth, without waiting for config; all rejections remain observed |
| guarded | confirmation | Cache hit performs no remote IO; uncached independent work overlaps without losing failures |
| batch | confirmation | Bounded independent reads overlap; empty input has no effects; result order and rejection ownership hold |
| ordered | confirmation, negative control | Transaction order and failure propagation remain correct even without returned-value dependence |

Tasks explicitly state the consumer's requirements. Omitting them to make a baseline
lose would change the question into guessing missing requirements. This can make both
arms succeed: report saturation rather than weakening the tasks after looking at results.
These are four fixed synthetic families, not four random samples of production work.
Different data/control-flow families still share the async-ownership mechanism.

## Oracle and analysis calibration

The oracle executes the submitted artifact in Node and returns behavior checks without
knowing the arm. It accepts alternative implementations. Controls include late observers,
swallowed errors, extra cache/empty-input effects, wrong ordering and no-op output.
Calibration establishes sensitivity to those controls, not universal grader correctness.
It does not grade prose, naming, maintainability, natural skill activation or all runtime
faults. A legitimate crash/hang can fail a task; failure to run the evaluator is invalid.

The analysis controls defend clustered sampling, the exact sign probability, invalid
attempt accounting and duplicate trial detection. They were watched failing before the
aggregation was corrected. They do not validate the experimental population assumptions.

## Uncertainty, invalid attempts and decisions

Report per-family successes/attempts, all failed check categories, paired wins/losses/ties,
mean within-family pass differences, costs and missing usage. Repeats share one task;
assertions and repeats do not become independent task samples.

The runner reports a two-sided exact sign calculation on non-tied family effects and a
95% Hoeffding reference bound on the mean family effect, whose range is [-1, 1]. Both
require independence assumptions that convenience fixtures do not establish for a
production population. The deliberately broad bound avoids the false precision of an
all-positive bootstrap with only a few families. Show raw effects beside the calculation.
Nine positive and three negative independent family effects give p = 0.14599609375,
not a five-percent result. Three positive families give p = 0.25 even with twelve winning
repeated pairs. Neither result licenses a broad efficacy claim.

An invalid attempt remains quarantined with its time, available usage and counterpart;
it is not counted as a valid failure or replaced until success. Finish other predeclared
trials. Missing pairs and invalid rates must remain visible. A clean complete-case result
cannot establish improvement if exclusions could reverse it. Configuration or instrument
faults require a separately recorded repair and amended protocol, not silent retries.

The first registration is explicitly exploratory and underpowered for family-level
confirmation. It can show concrete fixed-task changes and saturation, and verify whether
a larger comparison has a discriminating signal. A demonstrated benefit requires a
predeclared practically meaningful effect, uncertainty consistent with that claim and
no protected category regression. A semantic correction can be retained separately even
when behavioural utility remains unproven. Do not report the present comparison as proof
that this method generates better skills or transfers to another model/effort.

## Observed first comparison and isolation incident

The first recorded comparison used `openai-codex/gpt-5.6-terra`, low effort,
four repeats on each of four fixed families: both arms passed 16/16 artifacts.
Development had four paired ties; confirmation had twelve. No correctness gain
was observed. This is not evidence that the correction or every wording change
is ineffective, nor does it establish equivalence outside the exercised cases.

The original example emitted an unhandled rejection despite the caller catching
the final result. The corrected source example, executed with the same schedule,
reported the original error with no escaped rejection. That proves the example
repair, not improved model performance.

The trace audit itself then failed planted controls: it ignored destinations in
hashline `edit` payloads and treated internal resource URIs as ordinary local paths.
A corrected auditor classified all five tested controls correctly, where the old
one misclassified three. A replay audit of the 32 artifact runs found no forbidden
tool accesses and no changed artifact hashes. That does not establish that no
instructions were injected automatically at session startup.

The subsequent method-generation comparison exposed this separate gap: three of
four optimisers attempted to read installed skills outside their workspaces.
All four outputs were retained; the lone valid attempt was not selected as evidence
of method benefit. `--no-skills` and `--no-rules` do not disable context-file
discovery. OMP documents a separate `disabledProviders` control for its discovery
adapters. A new per-run configuration must disable those sources without disabling
the intended model backend or copying credentials. Preserve the old population;
do not silently pool it with a repaired run.

These observations require checking both automatic input exposure and tool-driven
access. A clean access log cannot prove that the initial prompt was clean. The
method's utility remains unproven until its independent comparison produces
interpretable outcome evidence.

The context-discovery distinction is documented in OMP's
[context-file reference](https://github.com/can1357/oh-my-pi/blob/b2f25dbfe1e30197bae311cd8a0bccbc381f5c7b/docs/context-files.md).
Local registrations, raw outputs and incident records are retained in the
authorised ignored experiment directory, not published as sanitised traces.

## Isolated method-comparison result

The corrected configuration produced four valid optimisation attempts: two unaided
and two supplied with the method, all receiving the same starting rules and technical
evidence. Their frozen guidance was tested on three families not shown to them, with
two coding repetitions per arm per optimiser pair. Both arms passed 12/12 artifacts,
with twelve paired ties. A corrected replay audit of all 24 downstream traces found
no forbidden accesses or changed artifact hashes.

Including optimisation and downstream coding, the unaided arm used 384,590 reported
tokens and an estimated cost of 0.4145176; the method-assisted arm used 522,260 tokens
and an estimated cost of 0.4577448. Tokens include cache reads, and the estimate is not
verified incremental subscription billing. Two optimiser pairs do not establish
population precision or future amortisation.

**Utility was not demonstrated.** This comparison provides no correctness advantage
for the method, and its total observed costs were higher. It does not prove universal
ineffectiveness or justify abandoning all wording interventions. Retain the objective
example correction separately. Do not promote the method across other skills based
on this pilot, or repeat unchanged trials until a favourable result appears.
