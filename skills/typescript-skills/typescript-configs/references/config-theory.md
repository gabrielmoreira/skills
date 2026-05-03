# Config Theory

## Core split

Keep these concerns separate:
- raw input collection
- config parsing
- dependency verification
- dependency resolution

## Useful defaults

The simplest useful default is usually:
- read raw input at the edge
- parse into a smaller internal model
- pass validated config slices inward

## Main question

When deciding where to validate, ask:

**Do raw env values already match what the app needs?**

- If yes, env-first validation may be enough.
- If no, build the config object first and validate that.

## Main risk

The most common config failure is hidden meaning:
- defaults that have no clear owner
- raw env spread across the codebase
- flags changing requiredness without a clear boundary
- resource checks mixed into parsing
