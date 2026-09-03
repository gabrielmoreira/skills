# Where this is at

I am not saying what should be. I am saying how I feel about these things right
now, and most of it is unresolved.

If you came here from the README wondering whether to use any of this: it is
mine, it changes, and it is honest about not being finished.

## What this repository is

Personal skills, improved for my own use at work and on my own projects. They
incorporate what I have learned so far, and they will be good in some situations
and bad in others.

**No commitment to stability.** No versioning policy. Nothing here promises to
keep working the way it worked last month, because the whole point is that it
changes when I learn something.

**No commitment to token cost either.** What there is instead is an attempt at a
balance I can live with, between the quality of what comes back and what it costs
me to get it. That balance is personal and it moves.

## What I actually believe about agents deciding alone

I am not yet very in favour of a model making decisions on its own without good
guidelines. That is a preference, not a finding.

And I understand the problem with it: **without tests I cannot know whether the
guidelines are necessary.** Some of them may be doing nothing. Some may be
making things worse. I would rather find out than defend them.

Part of the testing is evals and fixtures, which live in this repository. The
other part is daily use and real pain, which does not. For that I read back the
session logs my agent writes and look at what actually happened, rather than at
what I remember happening.

## What I run this on

**omp is my main coding agent, about 95 percent of the time**, and it is well
ahead for me. Claude is second. I also use antigravity, codex and copilot
occasionally, for specific reasons or because of which subscription is available.
I like all of them, some more than others.

On models: I would use the best available all the time if I could. I cannot. The
cost is prohibitive. At work there is a little more flexibility, within a fixed
list. Personally the subscription cost is the limit, so I use the best I can
rather than the best there is.

I tried to keep these skills from depending too hard on my harness, for some
portability. **It is inevitable that my preferences leak in anyway**, in which
models and which harness I test against.

## Why the language keeps changing

I have ADHD, and possibly other things. So from time to time I have to go back
and optimise how the agents talk to me: what comes first, how much arrives at
once, what gets restated.

I have not reached anything I would call ideal. I keep researching and keep
adjusting. Two skills here came out of that, and they are as much for me as for
anyone.

## The things I have not settled

**Where ephemeral work goes.** I use a `.local` folder in my projects for
temporary files, scripts and throwaway reports, rather than the machine's temp
directory or the harness's. That way I can see what is going on and inspect it. I
am considering `.scratch` instead, having found no common convention. Every so
often I need a cleanup, or to promote something into a committed document, and I
have not worked out a good rule for either.

**State tracking.** Same story. Not settled.

**How much to lean on the harness.** My agent's own auto-learning and memory
compensate for a great deal, which makes it unclear how much of that job belongs
in skills at all.

**Token techniques.** I am avoiding compressed notation and similar techniques
for now, preferring an aggressive shell optimiser. I do not know how good that
choice is. What I do know is that I am wary of spending weeks tuning token cost
and losing the thing that matters, which is whether any of this delivers value.

A cost limit does bring creativity, and it teaches you a lot about your agents,
your models and your harness. It is also, sometimes, a way of avoiding the harder
question.

## Deterministic scripts, not projects

I wanted everything deterministic. Scripts for everything. But they kept turning
into projects, and a project is something you maintain and become attached to.

**Attachment is what stops you experimenting.** Once a thing is organised well
enough to defend, you defend it instead of replacing it, and prototyping speed is
the first thing you lose.

So now: small deterministic scripts, focused and self contained, composed quickly
and thrown away. Skills where adaptation and a margin for error are the point.
Not a framework.

That tension does not resolve. It just gets managed, and I do not always manage
it well.

## What I recycle, and when

Every so often the tooling, the skills and the instruction files need going
through again: reading how they were actually used, comparing against what other
people are doing, and throwing out what stopped earning its place.

This repository is the current pass. There will be another.
