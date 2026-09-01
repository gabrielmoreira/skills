---
id: evidence-backed-review.execution-and-pipeline
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [Continuous Delivery (Humble and Farley)]
---

# Execution and Pipeline

Decision: **A change is unproven until something ran it where it will actually run.** Local test and lint output is evidence about the machine you are on. Judging whether the tests prove what they claim belongs to `rules/spec-conformance.md`.

Use when:
- **The range is pushed**, or exists as a change request.
- **The repository declares a pipeline**: a workflow file, a build config, a deployment step.
- **The request named execution**, a run, a build, a deploy, or a pipeline.
- **A local run is the only evidence offered** for a change that ships somewhere else.

Do:
- **Perform mechanical verification in review mode.** Run build, lint, and test commands before commenting. Capture raw command outputs directly.
- **Name the pipeline for this range and its state.** Passing, failing, running, or never started.
- **Open the failing job log and quote captured output.** Never paraphrase failure text from memory. Cite the exact failing step, line, and log excerpt.
- **Report a pipeline that never ran as a Gap.** Place it in the first line of the status.
- **Separate what you observed from what was relayed.** A green check you did not open was reported to you.
- **Check that the pipeline runs what this change now needs.** A missing dependency, variable, or migration is a finding.
- **Name missing commands or permissions when unreachable.** An unreachable check is a named Gap, never silence.

Avoid:
- **Paraphrasing a failure instead of quoting the captured text**, which turns a reproducible fact into a claim the author has to take on trust.
- **Claiming local runs prove production correctness.** The difference between the two environments is exactly where the failure lives.
- **Counting green checks without opening one**, so a job that passed by doing nothing counts the same as one that ran.
- **Reading a skipped or cancelled job as a pass**, which is how a required check silently stops being required.
- **Waiting in silence while runs stay in progress**, leaving the author unable to tell review from absence.
- **Letting a passing suite substitute for judging merit.** Continuous Delivery buys confidence that the change works, never that it was worth making.

Exceptions:
- **A repository with no pipeline MAY close on local evidence**, provided the review says no pipeline exists.
- **A `focused` pass MAY name the pipeline as uninspected** rather than reach it.

Verify:
- **Name the run and its state**, or the Gap and what blocked reaching it.
- **Quote the failing step and its captured output**, so the author can reproduce it without asking.
- **Say which evidence was observed and which was relayed.**
