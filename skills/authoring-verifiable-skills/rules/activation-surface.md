---
id: authoring-verifiable-skills.activation-surface
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [frontmatter survey across five reference collections, YAML 1.2 plain scalars]
---

# Activation Surface

Decision: **The `description` is the only text a harness reads before loading anything, so it MUST answer one question: should this be opened for the work in front of me right now?**

Use when:
- **A skill is new.**
- **A skill never triggers**, or triggers on turns unrelated to it.
- **Two skills match the same request**, and selection between them is a coin flip.
- **A description is edited**, a rename included, since that is half the surface.
- **A description contains a colon or a quote**, which is where it silently stops parsing.

Do:
- **Lead with the conditions, not the identity.** The agent matches a situation, not a title.
- **Name the nouns the agent has on screen.** A provider response, a flaky test, a migration. Not the abstractions the skill uses internally.
- **Add the exclusion clause** naming the near miss that would otherwise steal activation. It buys more precision than any number of added triggers.
- **Quote the phrasings a user really types.**
- **Spend characters on the rules that would otherwise be invisible.** Aim near 500 characters, treat 700 as the ceiling.
- **Write it as a folded block**, `description: >-`, with the text indented beneath.
- **Carry `name` and `description` and nothing else.** Across five reference collections those two appear in every skill and no other key passes 60 percent.

Avoid:
- **A single-line description containing `: `.** YAML reads that as a nested mapping and rejects the file, so whether the skill loads depends on how forgiving each harness parser is.
- **Too broad.** "Use when writing code" matches everything, so selection becomes a coin flip.
- **Ceremony naming.** "Use when following the review protocol" describes the skill's own ritual, so it only matches people who already know it exists.
- **Summarising the workflow.** A description that restates the body becomes a shortcut the agent follows instead of reading the body.
- **Stacked synonyms and "make sure to use this whenever".** Push raises false activation faster than recall.
- **A company, repository, or path.** Restate it as an observable condition.

Exceptions:
- **A skill MAY decline automatic discovery** with `disable-model-invocation`, staying reachable by command. More than half the skills in two carefully maintained collections do that.

Example (one instance, not the set):

```yaml
description: >-
  Judge a change before it lands: a branch, a pull request, or uncommitted work.
  Says what was not inspected rather than calling it clean. Use when the user
  says "review this" or hands over a branch. Not for explaining code, running
  the linter, or responding to a review of your own work.
```

Verify:
- **Parse the frontmatter with a strict parser**, never with a line-by-line reader that skips what it cannot understand.
- **Check the description names an observable condition**, not the skill's own vocabulary.
- **Check the exclusion clause names an installed neighbour.**
- **Confirm a must-not-activate scenario exists** for each neighbour named.
- **Under-triggering and over-triggering are both defects.** Tune with scenarios, never adjectives.
