# Authoring Checklist

Use this checklist before shipping or editing a bundle.

## Source quality
- Is this grounded in real code, real incidents, or real review feedback?
- Does this teach something the model would likely get wrong without the skill?

## SKILL.md
- Is the `name` spec-compliant and matched to the directory?
- Does the `description` say what the skill does and when to use it?
- Is `SKILL.md` short and routing-focused?
- Is there a quick-reference table when that would make routing faster?

## Rules
- Is each rule one real decision?
- Does each rule start with `✅ Prefer` and `⚠️ Avoid`?
- Are examples small enough to understand in one read?
- Are red flags or gotchas included only when they earn their place?

## Snippets
- Is the snippet copyable?
- Is the snippet teaching faster than prose would?
- Is it self-contained enough that a reader can reuse the pattern without guessing missing pieces?

## References
- Are references one level deep from `SKILL.md`?
- Did theory stay out of the rule unless truly needed?

## Evaluation
- Are there realistic should-trigger and should-not-trigger prompts?
- Does it have at least one main content eval?
- Did you inspect traces, not only final outputs?

## Packaging
- Would this directory make sense as a standalone skill bundle?
- Are all paths portable with forward slashes?
