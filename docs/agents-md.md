# Configuring your AGENTS.md

[`AGENTS.md`](../AGENTS.md) in this repository is one person's complete working
file. It is included as an example, not as something to copy whole.

**Every line is paid on every request.** An instruction file is loaded each
session, so a line that does not change behaviour is not free: it is a tax on
every turn. That is the only rule for deciding what to take.

## The short answer

**Copy one block.** The skills routing table. Without it, activation rests on
description matching alone, and on a machine carrying hundreds of skills that is
a coin flip.

**Consider two more.** Evidence and Deviation. Both are short, and the first one
gives the skills' output a vocabulary that stays stable across all of them.

**Read the rest and take what matches your setup.** Those blocks encode how one
person likes to work. Some of it will fit you and some will not.

## Block by block

| Block | Verdict | Why |
| --- | --- | --- |
| **Skills** | copy it | The collection needs it to route reliably |
| **Evidence** | copy it | Four words the skills' reports all use |
| **Deviation** | copy it | Short, universal, and prevents a common waste |
| **Asking** | take the stop list | The four stop conditions travel; the cadence is a dial |
| **Simplicity at the point of use** | probably | A real principle, three lines |
| **Continuity** | probably | Universal, small |
| **Sorting** | taste | One person's preference for handling unsorted input |
| **Gathering** | depends on tools | Token economy tied to specific tool shapes |
| **Delegation** | depends on harness | Only useful where subagents exist |
| **Commits** | yours already | Everyone has a convention; use your own |

## The three worth copying

**Skills.** Covered in the [README](../README.md). Trim the rows to what you
installed, because a row pointing at a skill that is not there is worse than no
row.

**Evidence.** Four words, never redefined:

```md
## Evidence

- **Confirmed.** Observed directly, cited.
- **Inference.** Reasoned from something Confirmed.
- **Gap.** Not found or not verified. Name the next concrete observation that would close it.
- **Recommendation.** Never stated as proof.

- **Quantify:** a count, a `file:line`, a measured value. An adjective where a
  number belongs is not a finding.
- **A claim at one layer is not evidence for a deeper one.**
```

Several skills report in these terms. Without the block their reports still work,
but the vocabulary drifts between them.

**Deviation.**

```md
## Deviation

**Following the pattern already in the code needs no justification.** Departing
from it does, and the burden sits entirely on the departure.

- **Continuing an established pattern is shallow work.** Match it and move on.
- **Introducing a second way to do something already done here is the expensive
  case.** It needs a stated reason and the alternative considered.
- **Raise it before writing it**, not after.
```

Three lines that prevent a recurring and expensive failure: an agent inventing a
second architecture beside the one already there.

## The one worth adapting

**Asking.** The cadence in the example, three asking turns per session, is a
personal dial. Set your own or drop it.

**The stop list travels unchanged.** These four are where an agent should stop
regardless of who is using it:

```md
**Four things stop for a human, and nothing else does.**

1. **Irreversible.** Discarding uncommitted work, deleting a branch, rewriting
   history, forcing at a remote, deleting a record.
2. **Security-sensitive.** A secret, a credential, an auth boundary, a new
   external dependency.
3. **Visible to other people.** A push to a shared branch, a merge, a publish, a
   comment on a change request.
4. **Every path is a guess.** Not merely unclear, which is a decision.

- **Everything else is decided and written down**, with the reason and what it
  costs if wrong.
```

**The rest of that block is about how questions are shaped.** Batching them,
offering options, carrying a recommendation. Useful, and clearly one person's
preference about being interrupted.

## The rest

**Sorting, Gathering, Delegation, and Commits are a worked example.** They are
worth reading because they are specific, and specific is what makes an
instruction change behaviour. They are not worth copying blind:

- **Gathering** assumes tools with output modes, limits, and offsets. Where your
  tools differ, the advice does not transfer cleanly.
- **Delegation** only applies where your harness has subagents. It is the longest
  block in the file and it is dead weight without them.
- **Commits** is a convention. You have one.
- **Sorting** is a preference about who decides what when context arrives in a
  heap.

## A minimal starting file

Everything above, at the smallest size that still changes behaviour:

```md
# Agent instructions

## Skills

**Reach for one when the work matches.** Name the one you opened and why, in one line.

| When | Skill |
| --- | --- |
| a change must be judged before it lands | `evidence-backed-review` |
| something is wrong and the cause is not yet known | `debugging-by-evidence` |
| a repository operation refused, or the state is unclear | `keep-git-work-recoverable` |
| written material must be created, corrected, or removed | `make-the-docs-trustworthy` |
| code should stay simple, testable, and sustainable | `maintainable-code` |

- **Not finding a match is an answer.** Do not stretch one to fit.
- **Two or more matching is normal.** The narrower one wins.

## Evidence

- **Confirmed.** Observed directly, cited.
- **Inference.** Reasoned from something Confirmed.
- **Gap.** Not verified. Name what would close it.
- **Quantify.** A count, a `file:line`, a measured value.

## Deviation

**Following the pattern already in the code needs no justification.** Departing
from it does. Raise it before writing it.

## Stop for a human

Irreversible actions, anything security-sensitive, anything other people will
see, and cases where every path is a guess. Everything else is decided, with the
reason written down.
```

Twenty-five lines. Add from the full example only where you can say what the
addition changes.
