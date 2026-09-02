---
name: evidence-backed-review
description: >-
  Judge a change before it lands: a branch, a pull request, a diff against a base
  point, or uncommitted work. Says what was not inspected rather than calling it
  clean. Covers what was actually asked for, security and abuse paths, whether the
  tests prove what they claim, broken contracts and callers outside this
  repository, and stale docs. Every finding at file:line, and it never edits. Use
  when the user says "review this", "check this before I commit", "does this hold
  up", or hands over a branch before opening it, always about code that
  changed. Not for prose with no diff behind it, explaining code, formatting-only
  passes, running the linter or tests, writing the commit message or changelog for
  a change, responding to a review of your own work, or a change whose author
  is asking how to add the test that was never written, which is a test-first
  decision rather than a review.
---

# Evidence-Backed Review

**Core principle.** Every finding cites what you observed. Every axis you did not inspect is named.

- **A review that inspected nothing reads like a review that found nothing.** Only the first line of the report separates them.
- **The weight sits in *Verify before critiquing* and *Finding eligibility*.** Everything else routes to them, or reports what they produced.
- **You opened this in the middle of something.** This is how to do that work, not a replacement for it.

## The request sets the floor

**Write the request down as the task list before matching a single row.** One item per thing it named, in its words. Rows from the table below are added to that list, never substituted for it.

- **A list built from this gate answers this gate.** Six things were asked for and the table has ten rows, so a list built from rows is complete and wrong.
- **Everything the request named is owed back by name**, each one found or each one reported as not inspected. An axis it named with no rule here is still owed.
- **Read the list again before the report.** By then the range, the diff and ten rules have been in front of you, and those six things have not.
- **Cheap evidence crowds out what matters.** A local run is one command away and a pipeline is not, so the near one gets cited and the far one dropped. Distance is not a reason, and a green suite says it ran, not that the change was worth making.

## Read-only guard
- **You MUST NOT mutate anything:** not the working tree, the index, the current commit, or a branch. Inspect another revision in a separate worktree.
- **Send nothing.** No comment on the change request, no work item, no notification, no commit.
- **Report a finding, never apply it.** This holds when the fix is one character.

## Mode selection
| Mode | The request looks like | Budget and output |
| --- | --- | --- |
| `review` | judging a change that already exists as commits: a branch, an open change request, "review since `<point>`", including your own | every gated axis → verify each finding → severity-ordered, for a reader who did not write the code |
| `pre-commit` | work not yet committed: "check this before I commit", a dirty or staged tree | every gated axis, most reshapable first → re-verify after each code move → blocking-first actions |
| `focused` | another task surfaced one review risk and nobody asked for a review | 1 rule → no status → findings plus the axes left uninspected |

- **Stay quiet on a range already reviewed** with nothing changed since.
- **Stay quiet on a `focused` risk the user already declined.**

## Detect the range before anything else
- **Never ask what the revision history answers.** Base is the point named in the request, otherwise the trunk merge-base.
- **Read the range as `<point>...<tip>`.** Three dots compares against the merge-base.
- **In `pre-commit` the range is the staged content against the current commit.**
- **Name unstaged edits separately.** Never judge them as if they were landing.
- **Confirm the point resolves and the range is non-empty** before any further work.
- **Read the declared build and test result for this range first**, then open `rules/execution-and-pipeline.md` for what to do with it.
  - A failure is the review's first finding, labelled relayed. It was reported to you, not observed by you.
  - A check nobody ran is a Gap.

## Which rules to read
**This table is a gate, not a checklist.** Read every row, then act on the matches, hardest to undo first. Reading a row costs nothing; the row you skipped is where the coverage went.

- **A row names the signal and the belief it undoes, never the remedy.** A row carrying the remedy gets read instead of the rule.
- **When in doubt, read it, and widen mid-run without ever narrowing.** Under-reading is the expensive mistake: a range that changed a boundary and produced nothing was scoped wrong.
- **`focused` reads one matched row** whatever the signals say, names the rest as uninspected, and says so.

| If you see... | and the belief that is usually wrong | Read |
| --- | --- | --- |
| the request is **"before I commit"** / "check this first"; nothing pushed, tree dirty or staged | that `git diff` shows the change, the staged half is invisible to it | `rules/pre-commit-self-review.md` |
| **any hunk** changing a condition, a bound, an assignment, or an error path; lines deleted or replaced | that reading the new line tells you what changed, the deleted one carried the case you are about to lose | `rules/correctness-in-the-diff.md` |
| one diff both **restructures and adds behaviour**; unrelated files, or ~1000 changed lines in one change | that a large diff reviewed carefully is reviewed, the move hides the edit inside it | `rules/scope-and-slicing.md` |
| a **changed exported signature**, route, schema, event payload, config key, or a removed field | that the caller ships with you, it deploys on its own schedule and to its own version | `rules/contracts-and-consumers.md` |
| a **`README`, doc page, example, comment**, or instruction file still describing behaviour this diff changed | that documentation drifts harmlessly, the next reader follows it against the new code | `rules/docs-and-skills-freshness.md` |
| **callers of that changed contract** outside this package, or feature-specific logic landing in a shared module | that the repository shows you the callers, the ones that matter are in another repository | `rules/dependent-teams.md` |


## What you have not established

**Nothing in a diff announces an absence**, so no gate fires on these and none is in the table. Each states something about you rather than the code, and only looking discharges it. Report each by name, checked or not.

- **You have not established whether the pipeline runs what this change now needs**, a green check you did not open is not evidence → `rules/execution-and-pipeline.md`
- **You have not established that the written standard says what you assume** → `rules/standards-conformance.md`, **nor that a quoted requirement has matching code, or this code any requirement** → `rules/spec-conformance.md`
- **You have not established that this change was asked for**, a capability nobody requested arrives looking like diligence → `rules/motivation-and-necessity.md`
- **You have not established which security question this repository never answers** → `rules/security-and-abuse-paths.md`, absence of a finding is not absence of a path, **nor what another team documents about this surface** → `rules/external-sources.md`

**Discriminators.**

- **Standards against security:** a convention departed from, against a caller who can reach what they should not.
- **Standards against docs:** which side is wrong, the new code or the prose gone stale behind it.
- **Contracts against dependent teams:** is the boundary change safe, against who outside must act.
- **Standards against spec:** what was written down, against what was asked.
- **Standards against external sources:** where the rule lives, never whether it counts.

**Default stance.**

- **Where no row matches, review the diff against the request that produced it** and say what you did not inspect. Completeness is reported against the axes below, never against the table.
- **Report, never edit.** The working tree ends the run exactly as it started.
- **Every finding lands at `file:line`**, and every axis you did not inspect is named as not inspected.
- **One status, decided by the weakest axis**, never by the count of clean ones.

## Verify before critiquing
- **Confirm a finding before reporting it.** Reproduce it, or read the actual code path.
- **Emit exactly one label:** `confirmed-with-code-path`, `plausible-mechanism`, `not-reproduced`, `insufficient-detail`.
- **`plausible-mechanism` is a defect you can name a path to but cannot run here:** a race, a nil on a rare but reachable branch, zero treated as absent, an off-by-one on a bound nothing excludes.
- **Report it with the state that would produce it.** Never refute it for failing to reproduce; that is what the label is for.
- **`not-reproduced` and `insufficient-detail` are Gaps or Questions.**

## Finding eligibility
- **Candidates MUST be gathered without this gate.** Apply the gate only when you decide what to report.
- **Filtering while you look is the dominant cause of misses.** The same pass that finds a defect talks itself out of it.
- **All five hold, or it is not reported at all**, and it is not downgraded to a Nit.
1. It touches changed code, or code reachable from changed code.
2. It states a concrete impact path: what breaks, leaks, slows, or rots.
3. It cites an exact `file:line`.
4. The recommended fix is smaller than the problem it solves.
5. No existing guard, type, or caller already handles it. Say which one you checked.

**Severity:** Critical (fix now), Important (before merge), Optional, Nit, Question.
- **A Nit is never Critical.**
- **Important covers** dead code, a test asserting only that nothing threw, and gratuitous `any`.
- **One structural problem plus ten nits means the structural problem is the review.**

## The four words for a claim
- **Confirmed.** Observed directly, cited.
- **Inference.** Reasoned from something Confirmed.
- **Gap.** Not found or not verified. State the next concrete observation and nothing else.
- **Recommendation.** Never proof.
- **Where nothing records the fact at all**, say so and name who could answer. A gap no observation can close is a question, not a search.
- **A claim at one layer is never evidence for a deeper one.** The ladder is owned by `rules/contracts-and-consumers.md`, and authority written outside this repository by `rules/external-sources.md`.
- **Quantify every claim:** a count, a `file:line`, a measured value.
- **Evidence has to reach the reader.** A path is evidence only if the person reading the report can open it. Otherwise quote the line.

## End with exactly one status
- **`PASS`.** Every gated axis was inspected and nothing eligible was found.
- **`ISSUES_FOUND`.** At least one eligible finding.
- **`INCOMPLETE`.** Something in scope could not be inspected. Name it, name what blocked it, and list what you tried before calling it blocked.
- **There is no partial pass.** A false `PASS` ships broken code. A false `ISSUES_FOUND` costs one more human look, and the asymmetry is not close.
- **One item you cannot resolve stops the run.**
- **`focused` emits no overall status.** It reports its findings, names the axes it did not inspect, hands the interrupted task back, and offers a full mode when a second risk appears.
- **Zero findings is a scope error** on a range that changed a boundary, altered a convention, or passed ~300 lines. Re-scope and re-run.

## Output contract

```
review        Scope: base…tip, file count, commit summary
              Axes: reviewed | not-applicable + the absent signal | evidence-unavailable
              Findings: severity · file:line · impact path · fix
              Gaps: each stating the next observation that would close it
              Teams to notify: who and why, identified, not notified
              Sound: what was checked and found sound
pre-commit    Actions: blocking first, each with file:line
              Draft description: claim · source of the requirement · alternative rejected · what is out of scope
focused       Risk inspected, findings, and the axes left out: no verdict

```
- **Report two channels, not one.** Findings pass the gate. **Noticed** is ungated: if it made you pause, it goes there, unranked and unresolved.
- **Every finding is location, impact, fix.**
- **Every mode closes asserting nothing was mutated:** no file, comment, work item, commit, deployment, or mirror synced.
- **A full mode also closes with the run status.**

## Delegating a check
- **A subagent receives the pre-built diff, pinned range, and explicit constraint.** Never your conclusion, never pre-judged bias, and never session history.
- **Mandate anti-suppression:** its prompt instructs reporting all observations and modifying nothing.
- **What returns is evidence to re-check against the code**, never a verdict.
- **It opens no further seat.** Re-running an unchanged artifact past a fresh reviewer is stalling, not diligence.

## Do not skip this when
- **The change is three lines.** A three-line diff removes a guard as easily as a large one.
- **You wrote it yourself.** That is the case the reader trusts most and checks least.
- **The tests are green.** They may not reach the changed line.
- **You are in a hurry.** That is when a false clean bill costs the most.

## Routing
- **Read a selected rule in full.** Say which one you opened, in one line, and interpret it yourself.
- **A direct instruction from the user outranks anything here,** including a `hard-gate`.
