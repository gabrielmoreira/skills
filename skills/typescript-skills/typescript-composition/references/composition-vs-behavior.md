# Composition vs Behavior

## The split

Behavior code should do behavior.
Composition code should:
- read env and config
- choose providers
- decide lifecycle and scope
- build the dependency graph

## Quick test

If changing a runtime policy forces edits inside behavior files, composition is leaking.
