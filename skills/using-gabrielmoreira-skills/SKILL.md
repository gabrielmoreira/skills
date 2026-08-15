---
name: using-gabrielmoreira-skills
description: >-
  Read at the start of a task, before following any procedure from this
  collection. Holds one person's decisions rather than a recommendation: where
  generated files go, which skill wins when two match, where the ceremony is not
  wanted, and what the portable skills deliberately leave open. Machine-specific
  on purpose. Use when a skill in this collection needs a location, a precedence,
  or a default it does not carry itself. Not a summary of the other skills, and
  not a substitute for reading the one that matched.
---

# Using Gabriel Moreira's Skills

**Core principle.** The other skills say how to do the work. This one says how *I* want it done, and it is the only file here that is allowed to be opinionated.

- **Nothing here is a recommendation.** It is one person's configuration, named after him so nobody mistakes it for advice.
- **The skill that matched still owns its subject.** This resolves what that skill left open, and never overrides it.
- **You opened this in the middle of something.** This is how to do that work, not a replacement for it. Name what you were doing before you start, and return to it when this is done.

## Where generated files go

| What | Where | Committed |
| --- | --- | --- |
| scratch, temps, generated plans, abandoned investigations | `.local/` at the repository root | never |
| a learning anyone cloning this repository would need | `docs/learnings/` | yes |
| a learning only this machine has | `~/.agents/learnings/` | never |
| anything a skill produces and does not place | ask, then record the answer here |

- **`.local/` is ignored, in `.gitignore` or in the exclude file.** Set that up before writing to it.
- **One question decides between the two learnings directories.** Would a colleague cloning this repository hit the same thing? Yes goes inside, no goes outside.
- **Report the path chosen and whether it is tracked**, every time.

## Which skill wins

**Only genuinely ambiguous pairs belong here.** Everything else is settled by the skills themselves.

| Situation | Open | Not |
| --- | --- | --- |
| a command failed for a reason that is not the change being made | `treat-blockers-as-incidents` | `debugging-by-evidence` |
| a test fails because the behaviour is missing | `test-first-by-evidence` | `treat-blockers-as-incidents` |
| a defect in the code being changed | `debugging-by-evidence` | `treat-blockers-as-incidents` |
| where a test goes for behaviour being added | `test-first-by-evidence` | `debugging-by-evidence` |
| where a test goes to pin a defect | `debugging-by-evidence` | `test-first-by-evidence` |
| judging work that already exists as commits | `evidence-backed-review` | `maintainable-code` |
| designing work that does not exist yet | `maintainable-code` | `evidence-backed-review` |

- **Where two still match, read both.** Under-reading costs the work; over-reading costs one file.

## What I do not want

- **No ceremony on a one-line change** whose failure mode is visible on reading it.
- **No workaround reported as a fix.** Say the tool is broken and let me decide.
- **No review that closes on local test and lint output.** Numbers are not a judgment.
- **No skill's procedure replacing the thing I asked for.** Answer what I asked, then say what else you found.
- **No em dash anywhere**, in any file, in any message.

## Defaults the portable skills leave open

- **The primary agent is omp.** Others are secondary, and a procedure that only works in one of them is not finished.
- **Skills are not proven until a run shows it.** A green structural suite says the files are well formed and nothing about behaviour.
- **A number without its interval invites reading noise as movement.** Report both.
- **Where a measurement and my opinion disagree, the measurement wins**, and the opinion gets rewritten here.

## Hooks, when they exist

- **Nothing here installs itself.** No configuration is written, and no session tool is registered without being asked.
- **Where the harness offers a way to re-read this between turns, propose it and let me decide.** An instruction that only lives in the system prompt is read once and forgotten by some models.
- **Until then, name the procedure you are following in your first line of work**, so a lapse is visible to me rather than silent.

## Routing

- **This file resolves; it does not instruct.** The matched skill owns its subject.
- **Where this file has no answer, say so** rather than inventing one, and the gap gets filled here.
- **A direct instruction from me outranks anything here.**
