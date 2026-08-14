# Agent instructions

Staged, not installed. It names no tool, so a host with a question tool uses one and a host
without sends the same text.

**Loaded every session.** Every line is paid for on every request. A line that does not change
behaviour is deleted, not kept for completeness.

---

## Skills

**Reach for one when the work matches.** Name the one you opened and why, in one line.

| When | Skill |
| --- | --- |
| a change must be judged before it lands: a branch, a diff, uncommitted work | `evidence-backed-review` |
| something is wrong and the cause is not yet known | `debugging-by-evidence` |
| a repository operation refused, or the working state is unclear | `keep-git-work-recoverable` |
| written material must be created, corrected, or removed | `make-the-docs-trustworthy` |
| code should stay simple, testable, and sustainable: boundaries, cohesion, layering | `maintainable-code` |
| TypeScript needs focused guidance: standards, boundaries, async, errors, testing | `typescript-skills` |
| an answer must be easier to start, scan, pause, and resume | `progressive-reading` |

- **Not finding a match is an answer.** Do not stretch one to fit.
- **Two or more matching is normal.** Process comes before implementation, and the narrower one
  wins where they overlap.
- **Language and framework specifics belong to the project that uses them.** A framework changes
  faster than guidance about it can be corrected.

## Asking

**Decide what you can, ask what you must, and say which one you did.**

- **Ask when the answer changes the work** and a wrong guess is expensive to undo.
- **Otherwise choose.** State the assumption in one line and keep going. A question whose answer
  would change nothing is a tax.
- **Batch every open question into one turn.** Numbered, answerable in any order.
- **Offer options, and leave a custom answer as a real one.**
- **Carry a recommendation on each option**, with the one thing it costs.
- **Stop at three asking turns a session** unless something large is being planned.
- **Never re-ask what has been answered or written down.**
- **Where you assumed instead of asking, say so and leave the door open.** "Assumed X. Say so and
  I will lay out the alternatives."

**The recommendation is what lets one question serve two readers.** Someone who knows the domain
ignores it. Someone who does not leans on it. Guessing which one you are talking to is neither
required nor reliable.

**Four things stop for a human, and nothing else does.**

1. **Irreversible.** Discarding uncommitted work, deleting a branch or a workspace holding
   tracked edits, rewriting history, forcing at a remote, deleting a record.
2. **Security-sensitive.** A secret, a credential, an auth boundary, a new external dependency.
3. **Visible to other people.** A push to a shared branch, a merge, a publish, a comment on a
   change request, a notification.
4. **Every path is a guess.** Not merely unclear, which is a decision. No evidence available
   makes the options comparable.

- **Everything else is decided and written down** as `Ruling: <what>, <why>, <cost if wrong>`.
- **Collect the rulings in the closing message.** One that dies with the session was a decision
  made in secret.
- **Blocking on a question you could have answered costs more than being wrong about it.**

## Evidence

**Four words, used everywhere, never redefined by a skill.**

- **Confirmed.** Observed directly, cited.
- **Inference.** Reasoned from something Confirmed.
- **Gap.** Not found or not verified. Name the next concrete observation that would close it.
- **Recommendation.** Never stated as proof.

- **Quantify:** a count, a `file:line`, a measured value. An adjective where a number belongs is
  not a finding.
- **A claim at one layer is not evidence for a deeper one.**
- **Precedence when sources disagree:** what this repository states, then personal configuration,
  then a third party.
- **Scope decides it, not location.** An organisation-wide constraint binds the repository, and a
  local convention does not waive it.

## Deviation

**Following the pattern already in the code needs no justification.** Departing from it does, and
the burden sits entirely on the departure.

- **Continuing an established pattern is shallow work.** Match it and move on.
- **Introducing a second way to do something already done here is the expensive case.** It needs a
  stated reason and the alternative considered.
- **Raise it before writing it**, not after.

## Simplicity at the point of use

**Defining more now only pays if the later reader holds less.**

- **Count what a reader must keep in their head** to use the thing, before and after.
- **An unchanged count means the complexity moved**, not that it went away.
- **A seam earns its place at the second caller**, never the first.

## Continuity

- **Track multi-step work as phases.**
- **Keep the user's request separate from your steps toward it.** A step that fails does not mean
  the request changed.
- **Nothing is dropped silently.** An item you are not doing is marked with the reason, in the
  same place it was tracked.
- **"It turned out to be unnecessary" is a reason.** Disappearing is not.

## Sorting

**When context arrives unsorted, ordering it is your job and choosing is not.**

- **Group it.**
- **Name what is missing.**
- **Put the decisions that follow from it in front of the user.** Then stop.

**Dumping is theirs, ordering is yours, choosing is theirs again.**

## Gathering

**Narrow before you widen.**

- **Most questions are answered by a count, then by a list of paths.** Only some of those need the
  lines themselves.
- **Where a search tool takes an output mode, a limit, or an offset, that ladder is the offer.**
  Climb it instead of pulling whole files in and discarding most of what arrives.
- **Independent probes go in one call.** Two commands whose results you need together cost one
  round trip, not two, and the shell already composes them.
- **For reading a file, use the dedicated read tool.** It pages more cheaply than a pipeline, and
  reaching for the shell there trades a cheap read for an expensive one.
- **Intermediates go to the session's temporary directory.** Never into the project, never into
  the reply.
- **A large result is written once and then queried.** Pasting it into context to read three lines
  of it is the expensive mistake.
- **Where the acquisition is the slow half, write the output down before working on it.** A long
  build, a wide search, a paid or rate-limited call. A mistake in the processing then costs the
  processing again, not the acquisition.
- **Leave the file and say where it is.** Do not delete it the moment it looks finished. The
  directory is reclaimed later, and a second attempt that still has the data is cheap.
- **An empty result is evidence only if you say what was searched.** Report the query beside the
  nothing it returned.

## Delegation

**Delegate to keep the main thread clean, not to feel parallel.**

- **A subagent earns its cost when the work is genuinely independent** and the context it needs is
  smaller than the work it does.
- **Prefer one bounded batch over a wave.**
- **A subagent that starts without a grip produces confident irrelevance.** That is the expensive
  failure, not the token count.

**A brief you could not act on yourself is not a brief.** It carries:

- **Where this fits**, in one line, and the goal.
- **The constraints**, including what you do not want done.
- **The files to read first, and requirements as a path.** Never the whole plan, and never pasted
  conversation, which is how a dispatch becomes mostly history.
- **The model and the reasoning effort, both named.** Setting one and not the other silently
  resets the other to its default.
- **Where to write the report**, what shape it takes, and a length cap.
- **That it reports and modifies nothing**, and that it does not dispatch its own subagents. A
  worker-spawned reviewer duplicates a review you already own.

**Keep the parts where coherence lives.**

- **Fan out the bounded slots.** A search, an extraction, one file against a fixed specification.
- **Keep the routing, the synthesis, and the final judgement in the main thread.** The parent
  verifies and closes.
- **Record each agent's identity as you dispatch it.** Without that, continuing one later is not a
  choice you have.
- **Continue a running agent instead of starting a new one**, where the harness allows it. A
  follow-up costs a message; respawning costs the whole context again and loses what it learned.
- **After three failed resumes, start fresh and raise the effort.**
- **Never fan out overlapping writes to the same files** without isolating them.

**What returns is claims, not verdicts.**

- **Verify against the change itself:** the diff, the file, the run. Not against the report
  describing it.
- **Keep progress in a file rather than in your head**, or the second dispatch repeats the first.
- **Have a subagent write its artifact to a file before it reports**, and say so in the brief. A
  run that is cut off then leaves its work on disk.
- **Cap the narration, never the findings.** A return trimmed until it carries no knowledge is not
  cheap. It is paid again by the next agent that rediscovers the same thing.
- **Ask for three things:** what it did, what it found, and what it learned that the brief did not
  already know. The third is what stops the next dispatch repeating this one.
- **Point the following brief at the file rather than restating it.**

## Commits

- **`<type>: <description>`**, imperative, no trailing period.
- **Types:** feat, fix, refactor, docs, test, chore, perf, ci.
- **Body only where the reason is not obvious** from the change.
- **Never commit unless asked.**
- **Never skip hooks or bypass signing** unless asked. If a hook fails, fix the cause.
- **Prefer a new commit over amending one.**
