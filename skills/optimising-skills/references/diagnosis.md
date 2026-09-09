# Diagnosis and intervention

## Establish what needs to improve

Write the protected outcome before choosing a lever. A task might need correct
error propagation, a maintainable boundary, fewer unnecessary reads, or an
appropriate refusal. These are different objectives. Opening a rule is a possible
mediator, not the final outcome unless discovery itself is the question.

Use the complete instruction context: its trigger, action, rationale, exceptions,
example, verification and neighbouring rules. Search for the strongest nearby
qualification before calling an absolute contradictory. Quote exact source ranges
and record the inspected version. A score for bullets, length or keywords cannot
replace that reading.

For each proposed restriction ask: what hazard does it prevent, in which condition,
what does compliance cost, what exception is legitimate, and what fails without it?
A safety restriction may be justified without a frequency estimate. Do not infer
necessity merely because a checker can enforce the restriction.

## Select the evidence path

| Finding | Evidence needed | Claim licensed |
| --- | --- | --- |
| Two applicable clauses require incompatible actions | Full context and a counterexample satisfying both conditions | Textual inconsistency |
| A code example mishandles a documented failure | Reproduction in the stated runtime and a source for the semantics | Defective example under those conditions |
| A model output violates a task requirement | Actual task, environment, output and a valid oracle | That trial failed |
| The candidate improves behaviour | Controlled comparison, suitable outcomes and uncertainty | Effect within the tested setting |
| The owner prefers a different convention | Explicit preference and preserved contract | Preference-based change, not measured improvement |

Do not force an experiment to establish that contradictory text is contradictory.
Do not infer behavioural lift from repairing it either.

## Attribute cautiously

Use these observations to choose the next probe, not as automatic verdicts:

| Observation | Rival explanations | Discriminating observation |
| --- | --- | --- |
| No skill read appears | Not needed; user already supplied content; automatic injection; routing missed; read failed | Actual available context, task trigger and completed tool result |
| Entry read, no leaf opened | Flat skill; sufficient entry; unresolved reference; gate failure | Packaging shape and information the task actually needed |
| Rule available, task violated | Ambiguity; conflicting instruction; missing capability; environment failure; invalid judge | Prompt hierarchy, executed artifact and counterexample independent of the rubric |
| Correct outcome by another route | Legitimate alternative; shortcut violating a required safety boundary | User contract, including required effects and prohibited actions |
| Failure after a tool response | Partial result; stale state; pagination; parser error; bad reasoning | Raw response shape and independently inspected environment state |
| Trigger arises midway through work | Router not revisited in this harness; model ignores a reachable trigger | A trace showing the actual routing opportunities |

A manual invocation may express intent rather than repair a model failure. An open
late in a session may belong to a new task. Frequency, first-read rank and co-occurrence
are leads, not evidence of causation or a reason to merge two responsibilities.

## Check the owning layer

- **Instruction:** ambiguous scope, missing knowledge, conflicting example, excessive obligation.
- **Discovery/composition:** missing metadata, unavailable files, duplicate skill claims,
  interaction with higher-priority instructions or an always-loaded router.
- **Context/memory:** missing state, stale facts, truncation, retrieval, compaction or authority loss.
- **Tools/harness:** unavailable capability, schema mismatch, pagination handling, permissions,
  retries or incorrect preservation of provider protocol items.
- **Environment:** fixture incomplete, hidden state wrong, dependency absent, unstable external service.
- **Model:** capability, effort or protocol support differs from the assumed configuration.
- **Evaluation:** grader bug, impossible task, reward for a preferred route, contamination or bad denominator.

Model and harness changes are separate interventions. Record them, rather than
crediting a skill for their effects. Raising effort can be a valid alternative to a
longer prompt; compare quality and total cost rather than matching effort labels
across providers.

## Choose a mechanism

Start with the smallest coherent change that addresses the established problem:

- Narrow an absolute to its true conditions; carry exceptions into the final check.
- Supply missing task knowledge or a correct worked example, rather than stronger emphasis.
- Replace a vague prohibition with an executable positive procedure when the failure is
  not knowing how; retain explicit prohibitions where the unwanted action itself matters.
- Remove duplicate guidance when the contract is already supplied elsewhere, then inspect
  whether the removed part protected a boundary that the score does not cover.
- Change placement or discovery only when content is unavailable at the point of decision.
- Split responsibilities when distinct conditions genuinely need distinct instructions,
  not merely because the entry crossed a length target.

These are candidate interventions, not universal rankings. A nuance clause can clarify
scope or introduce confusion. Test the effect in the relevant setting. A collection's
past unsuccessful edits do not rule out a whole mechanism.

## Worked diagnostic boundary

A rule says a promise stored in a variable is owned. Its example starts two operations
but attaches a handler to the second only after awaiting the first. A rejecting second
operation can become unhandled while the first remains pending. Naming the variable
shows intent; it does not install a rejection observer.

The direct repair is to observe all started branches promptly, including early exits.
Whether that repair helps an agent generate better code is a second question. Test
artifact behaviour across success, early rejection, multiple rejection and dependency
ordering, rather than rewarding the words "Promise.all".
