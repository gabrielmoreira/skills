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
- **Name the pipeline for this range and its state.** Passing, failing, running, or never started.
- **Open the failing job's log.** A red name is not a finding until you can say which step and which line.
- **Report a pipeline that never ran as a Gap**, in the first line of the status rather than at the end.
- **Separate what you observed from what was relayed.** A green check you did not open was reported to you.
- **Check the pipeline runs what this change now needs.** A new dependency, environment variable, service, or migration that no job performs is a finding.
- **Where the pipeline is unreachable, name the command or permission that was missing.** An unreachable check is a Gap with a name, never a silence.

Avoid:
- **Offering local test and lint output as proof the change works.** It proves the code runs on a machine that already had everything installed.
- **Counting green checks without opening one.**
- **Reading a skipped or cancelled job as a pass.**
- **Waiting in silence.** A run still in progress is reported as in progress, with the time it started.
- **Letting a number stand in for a judgment.** A suite that passes says nothing about whether the change was the one worth making.

Exceptions:
- **A repository with no pipeline MAY close on local evidence**, provided the review says no pipeline exists.
- **A `focused` pass MAY name the pipeline as uninspected** rather than reach it.

Verify:
- **Name the pipeline, the run, and its state**, or name the Gap and what blocked reaching it.
- **Quote the failing step and the line** behind every pipeline finding.
- **State which evidence you observed and which was relayed to you.**
