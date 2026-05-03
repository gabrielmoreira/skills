# Naming and Ownership

## Naming goals

Names should help the reader answer three questions quickly:
- what kind of thing is this?
- who owns it?
- where should it change?

## Bundle naming

Each real skill directory must be spec-compliant:
- lowercase
- hyphenated
- same as the `name` field in `SKILL.md`

Examples:
- `typescript-configs`
- `typescript-composition`
- `typescript-boundaries`

## Rule naming

Rule titles should describe the decision the reader is making.

Prefer:
- `Parse Env First`
- `Build Config First, Then Validate`
- `Pass Validated Config, Not process.env`

Avoid:
- vague names
- pattern ceremony
- titles that require deep theory to decode

## Ownership rule

A bundle owns a topic when it is the main place a reader should go to learn that topic.

Use a brief cross-link only when the current bundle would be misleading without it.
