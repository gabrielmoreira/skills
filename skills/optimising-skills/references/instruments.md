# Instrument contracts

## Earn the instrument

Start with a question that existing observations cannot answer reliably. Reuse an
existing instrument only after checking its inputs, semantics and limits. A new script
is justified by a concrete missing observation or repeatable operation, not by wanting
a dashboard. A small fixed experiment does not need a general agent platform.

For every instrument record:

| Field | Required meaning |
| --- | --- |
| Observation | The actual event, artifact or state read, and its provenance |
| Transformation | Parsing, filtering, aggregation, sampling unit and denominator |
| Output | Values, error states and precision, including missing data |
| Licensed conclusion | The narrow question this result can answer |
| Excluded conclusion | What it cannot establish, especially quality and causation |
| Calibration | Real examples, planted errors and independently checked expected results |
| Reproduction | Versioned inputs, executable command, runtime and output artifact |

An instrument can deterministically produce a wrong conclusion. Determinism is a
reproducibility property, not semantic validity.

## Existing tools: contracts, not endorsements

- `tools/verify-skill.mjs` and `tools/mutate-skill.mjs` check declared structural
  invariants and whether planted structural defects trigger them. They do not prove
  instructional quality or validate arbitrary behavioural counters.
- `tools/scenario-confidence.mjs` scores prompt/fixture characteristics. Those proxies
  cannot identify whether a failing model output was caused by the rule or scenario.
  Do not use its high/low label as a causal verdict.
- `tools/route-baseline.mjs` measures lexical routing. A task it solves can still be
  a valid regression case; a task it misses can still be impossible or badly specified.
- `tools/outcome-check.mjs` compares artifacts for supported executable mutation cases.
  Its oracle does not automatically generalise to prose quality, architecture or safety.
- `scripts/coverage-audit.mjs` and `scripts/read-answers.mjs` can help inspect a suite
  and its answers. Confirm their parsing and the relevant input format before use.
- `scripts/session-extract.mjs` and `scripts/session-signal.mjs` describe recorded
  sessions. Their output is not evidence that opening a skill helped.

These are scope observations, not a completed correctness or security audit of the tools.
Use only the portion validated for the current question. Keep unsupported tools out of
an automated decision path even when their current output agrees with your hypothesis.

## Observe events honestly

A requested read, completed read, user invocation, automatic injection and textual mention
are different events. Count successful availability when measuring exposure; record failed
reads separately. A session's first skill may be mandated setup, not a spontaneous choice.
Several tasks can occur in one session, and one skill can be opened repeatedly for one task.

For a session extract, disclose supported harness versions, adapters, time source, window,
skipped files, duplicate handling and missing fields. Reconcile totals with grouped rows.
A window is chosen for the population of interest, not enlarged until a desired count appears.
Filesystem modification time is not automatically conversation time, especially after copying.

## Costs and uncertainty

Record input/output/cached tokens separately when supplied, elapsed time, tool calls and
provider-reported estimated cost. Avoid double-counting streaming updates, message-end events
and the final repeated transcript. Missing usage is unknown. Subscription billing, cache
reuse and list-price estimates may differ from incremental money paid.

Changing model, fallback, effort, context, tools, cache policy or permissions can change
cost and outcome. Freeze what can be frozen and record the rest. A shorter skill that
causes more tool calls or lost requirements is not automatically cheaper.

## Calibration that can fail

Test the actual boundary where the measurement can lie. For a promise oracle, execute
an implementation that returns the right happy-path value but leaks an early rejection;
verify it fails. For a trace counter, a quoted skill name in a tool result must not count
as a completed read. For aggregation, invalid trials must not disappear from the denominator.

Use materially different correct implementations to test overconstraint, and plausible
incorrect ones to test complacency. Keep known expected outcomes independent of the
candidate's wording. Record unsupported formats as errors rather than tolerant guesses.
A successful empty result must be distinguishable from command failure or truncated output.

## Data boundaries

Collect the least data the question requires. Public fixtures or newly generated synthetic
workspaces avoid importing private stores when they are sufficient. If private data is
necessary, authorisation and sanitisation precede transfer or display.

A word-shaped program, skill, task or tool name can identify private work. Hashing short
names is not a proof of anonymity. A deny list needs prior knowledge and can itself leak
private identifiers if committed. Keep private deny rules local; use explicit public
allowlists when appropriate, and preserve an unknown category.

Report "no matches detected by these checks" rather than "zero leaks" when residual
classes remain unverified. Never publish reasoning traces, credentials or raw private
messages as a side effect of measuring a public skill. Metadata-only extraction cannot
support semantic claims about the task that require the omitted content.
