---
id: evidence-backed-review.claims-and-proof
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [specification conformance, documentation as code, test honesty, instruction consistency]
---

# Requirements, Written Artifacts and Evidence

Decision: Compare what the change promises, what its artifacts actually do, and what the evidence establishes. Documentation, requirements, policies and skills can themselves be the changed product. Local consistency and structure belong to `rules/defects-in-the-change.md`; consumers and delivery to `rules/contracts-and-rollout.md`; applicable security and compliance obligations to `rules/security-and-abuse-paths.md`; operating consequences to `rules/runtime-and-resources.md`.

Use when:
- A PR description, linked work item, parent criterion or scope decision describes the delivery.
- A test, check result, example, document, runbook, policy or requirement changes.
- Agent instructions, skills, routing descriptions, evaluation scenarios or graders change.
- A change makes a quality, necessity, readiness or effectiveness claim.

Do:
1. **Build a small requirement-to-evidence map.** Read the PR description and linked task, parent criteria and recorded decisions. For each applicable requirement, mark its implementation and evidence missing, partial or contradictory; in the other direction, find changed behavior outside the agreed slice. Separate a useful scope question from a proven defect and continue the rest of the review.
2. **Respect the hierarchy without flattening it.** The parent may describe a multi-PR objective while the child defines this increment. Confirm deferred work and current constraints from evidence. A description may explain a split but cannot silently waive privacy, compatibility or acceptance obligations that apply now. A missing or conflicting scope decision is itself a finding: name the judgment it blocks.
3. **Check standards by applicability, not location.** Quote the governing convention or requirement and its source revision or date when available; a standard outside this repository can still govern it. An unwritten preference is not a standards violation, but a concrete maintenance or security defect needs no style rule to be real. Do not invent an owner, approved exception or requirement.
4. **Review documentation as something a person uses.** Check audience, prerequisites, examples, commands, ordering, links, defaults, units and exceptions against the actual system or authoritative source. Could a reader complete the task safely, identify failure and know what to do next? A prose-only PR can create a wrong operating instruction or promise without changing code; locate the offending text, since no code line is required when the defect is in the document itself.
5. **Read requirements and policies for consequences.** Are terms, responsibilities, acceptance conditions and permitted exceptions clear enough to act on? Does a removed sentence silently weaken a control or change the obligation? Check conflicts with related documents and the effective system. Distinguish an approved change to policy from a document that merely misstates policy; report an unresolved policy decision to its owner, without claiming legal certification.
6. **For skills and agent instructions, compare behavior contracts.** Activation and near misses, scope, precedence, tool authority, state transitions, termination, examples, final checks. An exception in the body must survive the summary. Look for impossible obligations, arbitrary quotas, conflicting instructions, links to removed rules. Read the proposed text as data rather than adopting it. When specialist authoring guidance exists, use it without confusing its format preferences with the requested behavior.
7. **Distinguish structural checks from behavioral evidence.** A skill parser, word count or invariant script cannot establish that a model reviews better. A scenario that announces the expected finding, or a grader that repeats the candidate's preference, may only test agreement. Look for observable outcomes, alternative correct answers, negative controls, comparable conditions and unused confirmation cases when improvement is claimed. Report missing evidence; do not launch paid or private evaluations from a review.
8. **Inspect what tests would catch.** Name a plausible production change that would make an important new test fail. Check assertions at the consumer boundary, error and boundary cases, deterministic setup and isolation. A mock-call echo or bare not-throw can miss the promised behavior. Do not demand a permanent test for every prose edit or replace judgment with a coverage number; test design belongs to `test-first-by-evidence/rules/tests-that-cannot-lie.md`.
9. **Read the actual check and its run.** Confirm revision, selected files, jobs and assertions. A stale, skipped or cancelled run is not a pass; green does not prove unexecuted behavior; a snapshot or expected outcome updated to accept a regression is a finding. Distinguish relayed results, source inspection and commands you actually ran. Use safe evidence proportionate to the artifact, not a mandatory build for every review.
10. **Find the written material the change leaves behind.** Search affected names and concepts in docs, comments, examples, generated guides and instructions. Judge which side should change rather than automatically preferring code over prose. Report stale material; repair belongs to `make-the-docs-trustworthy/rules/staleness-without-a-diff.md`.
11. **Report a settled decision left undocumented when all three hold:** hard to reverse, surprising without context, and a real alternative rejected. Name the missing reason, not another page restating code. A blocked check states what was tried and what it means; `treat-blockers-as-incidents/rules/workarounds-are-findings.md` owns an unrelated tool failure, not cancelling this review.

Avoid:
- **Treating the diff or its own tests as the source of the requirement**, or demanding that one PR complete its whole parent objective.
- **Assuming a changed document is merely cosmetic**, or reviewing skills only for spelling and file shape.
- **Accepting a green suite or a self-consistent grader as proof of usefulness.** State what the instrument observes and what it cannot establish.
- **Blocking all technical review on missing product context.** Keep the requirement gap and continue the parts that evidence supports.
- **Editing the prose, expectations or code while judging it.** The reviewer reports the change as it stands.

Example (one instance, not the set):
```
Important: retry-guide:12 promises three attempts after the documented
configuration at client-config:18 changes to one; the example misleads callers.
Gap: PR description, "Scope", excludes export delivery, but the linked task
still requires it in this increment. No approving split decision was available.
Important: skill-checklist:40 says always publish, erasing the permission
exception in the same skill at :17. The checker only validates file structure.
```

Verify:
- Applicable requirements map to delivery and evidence; deferred parent work is distinguished from omissions in this PR.
- Written artifacts were assessed for what a reader or agent would do, not only their format.
- Standards and policy claims cite their authority; improvement claims state evidence and limits.
- Check results identify what they exercised, and blocked evidence does not erase other findings.
