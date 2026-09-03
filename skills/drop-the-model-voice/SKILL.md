---
name: drop-the-model-voice
description: >-
  Write the prose a software team reads so it sounds like the engineer who did
  the work: a review comment, a pull request description, an incident write-up,
  a status update, a release note, a wiki page, a design proposal, or an
  announcement to the team. Covers claims the evidence does not carry, sales
  language where a report belongs, a missing actor, a run-up before the point,
  a defence against an objection nobody raised, decorative formatting, and the
  shape each kind of message arrives in. Use when the user says "this sounds
  like AI", "too corporate", "make it sound human", "rewrite this comment",
  "write the update", "draft the incident report", or "post this to the team".
  Not for whether the document should exist or is true, and not for making a
  dense answer easier to enter. Prose that reads as generated is discounted
  before it is judged, and in a review comment or an incident report being
  discounted is the whole cost.
---

# Drop the Model Voice

**Core principle.** The reader must be able to tell that somebody who did the work wrote this.

- **The default voice sells.** Left alone, a model markets a change instead of reporting it, and a reader who has seen that voice discounts what follows.
- **Removal is most of the work.** Nearly every fix below deletes something. What remains is the sentence that was underneath.
- **Everything is inlined here on purpose.** These patterns arrive together: a draft that sells also has a run-up and decorative bolding. Splitting them into files a hop away would charge for four hops to fix one paragraph.
- **You opened this in the middle of something.** This is how to do that work, not a replacement for it. Name what you were doing before you start, and return to it when this is done.

## The three that fire on almost every draft

- **A claim with no number, no name, and no artifact.** "Significantly improves performance." Say what you measured or cut the sentence.
- **A run-up before the point.** "Let's dive into how this works." The next sentence was the message.
- **A closing that adds nothing.** "This sets us up well for the next phase." End on the last fact.

## Claims the work does not carry

**Every claim of importance, improvement, or impact names its measurement, artifact, or person, or the sentence goes.**

- **Cut a superlative standing in for a number.** Significantly, dramatically, substantially, greatly.
- **Cut the importance sentence.** "Marks a pivotal moment", "underscores the importance of", "sets the stage for".
- **Cut the unattributed authority.** "Experts recommend", "industry best practice", "it is widely considered".
- **Cut a guess dressed as a finding.** "It likely fails under load" where nothing was loaded. Say what the sources do not show instead.
- **Cut the optimistic close.** "Positions the team well", "exciting times ahead".
- **Keep a labelled estimate**, with its basis. Keep an opinion in your own voice: "I would not ship this on a Friday" needs no citation, "the team does not ship on Fridays" does.

```
Sells:   This refactor significantly improves maintainability.
Shows:   The retry logic was in four files and is now in one. Three had
         drifted; the one in the worker had a different backoff.
```

## Selling where a report belongs

**Describe a change in the words you would use at a desk, not the words a product page would use.**

- **Use `is`, `are`, and `has`.** Not serves as, stands as, boasts, features, offers, represents.
- **Cut the brochure vocabulary** where it is doing praise. Seamless, robust, powerful, elegant, comprehensive, best-in-class, delightful.
- **Cut a trailing participle that carries the meaning.** "...ensuring reliability", "...enabling faster delivery". More than one in a paragraph is the pattern.
- **Cut the third item added to round out a group of three.** A real list of three stays three.
- **Cut "not only X but also Y"** where X and Y are one point, and finish clipped negatives: "without forcing the user to guess", not "no guessing".
- **Write the specific claim a saying stands in for.** "Symmetric layouts feel predictable", not "symmetry is the language of trust".
- **Keep domain vocabulary.** A robust estimator, an elegant proof.

## The missing actor

**Where something happened, the sentence says what made it happen.** In an incident report that is the fact the reader came for.

- **Name the component, command, job, or person.** "The scheduler retries", not "retries are performed".
- **Give the trigger a subject.** "A deploy at 14:02 replaced the config map", not "a configuration change was introduced".
- **Separate three things in a write-up.** What changed, what the system then did, what people then did.
- **In a review comment, point at the line and say what it does.**
- **Cut the dropped subject.** "Not supported." "Deprecated in favour of the new flow." By what, since when.
- **Cut "it was decided that."** Somebody decided.
- **Keep the passive where the actor is unknown, irrelevant, or a person a blameless write-up leaves unnamed.** Name the team or the change instead; the mechanism still gets a subject.

```
Hides:   An issue was identified in the export path and a fix was applied.
Names:   The nightly export wrote to a temp directory the cleanup job
         removes at 02:00. Nine runs lost their output.
```

## The run-up

**Words that arrive before the point and do not carry it are deleted, and the point becomes the first sentence.**

- **Cut the announcement.** "Let's dive in", "here's what you need to know", "without further ado".
- **Cut the praise.** "Great question", "you're absolutely right", "excellent point".
- **Cut the assistant furniture.** "I hope this helps", "let me know if", "would you like me to", "as of my last update".
- **Cut a first line that restates the heading.** Let the heading work once.
- **Cut the staged pause.** A standalone "Honestly?" or "Look," before a routine point. Inside a sentence these are ordinary.
- **Keep a real greeting in a real message to people**, and keep a genuine scope statement: "this covers the read path only" tells the reader something.

## The defence nobody asked for

**An objection gets answered where somebody raised it, and an alternative gets discussed where somebody would choose it.**

- **Cut "this isn't really about X", "I'm not saying that Y", "don't get me wrong".**
- **Cut "a tempting approach would be", "one might be tempted to", "some would suggest"** where the option appears once and never again. State the constraint directly instead.
- **Cut stacked hedges.** One qualifier is a confidence level; three is noise, and usually repairs an earlier overstatement.
- **Keep an alternative a reader would weigh**, with the reason it lost. A design document comparing real options is the genre, not the pattern.
- **Keep a named objection.** "Two reviewers asked why this is not a queue" earns its paragraph.
- **A direct negative claim is not a defence.** "The client is not thread-safe" is a fact.

## Formatting that means nothing

**Every mark encodes something true about the content, or it comes off.**

- **No em dash or en dash**, and no spaced hyphen or double hyphen standing in for one. Use a comma, a colon, parentheses, or two sentences.
- **Sentence case in headings.** Capitalise the first word and proper nouns.
- **Cut a bold label that repeats the sentence after it.** Three bold headings over three restatements is one paragraph.
- **Bold only what a scanning reader must not miss.** Read the bold words alone: they should form the summary.
- **Cut emoji used as decoration.** A status marker with an agreed team meaning is content.
- **Straight quotes** where the file, the code, or the surrounding text uses them.
- **Drop the hyphen after the noun.** "The report is high quality", not "high-quality".
- **A house style, an agreed emoji convention, or a bold-label list whose labels are the index all outrank this section.**

## The shape each kind arrives in

**Decide the shape before writing, and keep it.** A reader who knows the format reads faster and notices what is missing.

| Kind | Shape | Length |
| --- | --- | --- |
| review comment | the line, what it does, what you want instead | two or three sentences |
| pull request description | what changed, why, what to look at first, how it was checked | a short paragraph per heading |
| incident write-up | what changed, what the system did, what people did, what is different now | one screen |
| status update | progress, plans, problems, each with a number where one exists | one to three sentences each |
| release note | what a user can now do, what broke, what to migrate | a line per item |
| team announcement | the decision, who it affects, what to do, where to ask | under a screen, links carry the depth |
| design proposal | the problem, the options with tradeoffs, the choice, what it costs | as long as the options need |
| FAQ answer | the question in one line, the answer in two, the source | a pair per question |

- **Match the team's existing format** where one exists. This table is the fallback.
- **A status update reports the period, not the backlog.** What shipped, what is next, what is blocking.
- **Put the links in.** A message that names a document without pointing at it makes every reader search.

## What one tell proves

**Nothing.** A single dash, one formal word, or one heading in title case is how many people write. Several tells in one passage is the signal.

- **Do not flag polish.** Clean grammar means somebody edited it.
- **Do not flag a dry register.** Reference material is meant to be dry.
- **Do not flag one transition word.** A single "however" is a word, not a pattern.
- **Do not flag deliberate repetition** used for rhythm.

## What a person keeps that a model removes

- **Uneven sentence length.** A steady mid-length cadence is itself a tell.
- **An unresolved feeling.** "This is probably fine and it still bothers me" is information about confidence.
- **A specific, useless-looking detail.** The exact command, the odd number, the thing that happened once.
- **An aside or a self-correction.** These rarely survive a generated draft.

## Never rewrite these

- **Quoted text.** An error string, a log line, somebody's comment, a user's words.
- **Identifiers.** Paths, commands, flags, API names, versions, hashes.
- **A phrase being discussed rather than used.** Naming a bad pattern requires spelling it.
- **Text written before generated prose existed.**

## Before you return it

- **Point at the evidence for each claim of impact.** No pointer means the claim goes.
- **Delete the first sentence and read again.** If nothing was lost, it was a run-up.
- **Read the last sentence alone.** If it survives deletion, delete it.
- **Search for the dash characters** and remove each one no writing sample licenses.
- **Check nothing was added.** A rewrite that gained a number, a date, a name, or a citation invented it.
- **Check nothing was lost.** Sounding less like a brochure must not mean saying less.

## Routing

- **Whether the document should exist, is true, or belongs in this file is settled elsewhere.** This skill owns how it reads once those are answered.
- **Making a dense answer easier to enter is a different job**, and pacing, ordering, and paragraph size belong to it. This skill owns voice and shape.
- **A writing sample from the user outranks every line here.** Match their habits, including the ones this would otherwise remove.
- **A direct instruction from the user outranks anything here.**

The pattern catalogue behind this is Wikipedia's "Signs of AI writing", maintained by its AI cleanup project. This restates it for software prose and adds the shapes a team expects.
