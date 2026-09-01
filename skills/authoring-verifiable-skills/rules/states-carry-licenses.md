---
id: authoring-verifiable-skills.states-carry-licenses
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [five skills in this collection carrying a state table, and nine that do not]
---

# States Carry Licenses

Decision: **A state table belongs to a skill whose phases license different actions, and each row names what the reader may now do that it could not before.**

Use when:
- **A skill describes work that passes through phases**, where acting out of order is the failure it exists to prevent.
- **A rule says "not yet" to something a reader would otherwise do now.**
- **A skill is about stopping**, and nothing in it makes stopping declarable.
- **An agent is expected to report where it is** so a human can interrupt.

Do:
- **Give every row a Licenses column, and put something real in it.** The licence is the whole mechanism: `BLOCKED` permits one reproduction and reading, `EXPLAINED` permits proposing a fix. A state that forbids nothing is a label.
- **Name the state as the past participle of what plainly happened.** `RED`, `EXPLAINED`, `CLEARED`, `BUDGET SPENT`. A reader should not need the Means column to know which one they are in.
- **Make the terminal state a result.** `HANDED BACK` and `BUDGET SPENT` end the work honestly; a table whose only exit is success teaches the reader to keep going.
- **Say that the state is announced before each step.** A slide past a boundary is silent; an announcement is not, and that asymmetry is what the table buys.
- **Prefix the state with the skill, read as a path: `debug/RED`, `tdd/RED`.** Bare names collide across a collection, and the pairs that collide are the ones that run together — debugging a failing test, hitting a blocker mid-investigation. "I am in `EXPLAINED`" then names two licences at once.
- **Let the phases come from the sections the skill already has.** If they do not exist there, the skill has no phases and this is not its pattern.

Avoid:
- **A state on a skill that recognises and decides in one move.** A rule skill has no "you may not decide yet", so a state announces itself and restrains nothing.
- **An abstract participle.** `SHAPED` and `CHARACTERISED` need their own gloss to be read; `ENOUGH TO DECIDE` and `REPRODUCED` do not.
- **Two states whose names do not separate them.** `SECURED` beside `CONFIRMED` left the reader guessing which meant a copy existed elsewhere.
- **Imposing the table across a set.** Nine skills here have no phases, and inventing them costs attention and buys no constraint.

Verify:
- **Read the state names with the Means column covered.** Any you cannot place is misnamed.
- **Check each Licenses cell forbids something the previous state allowed**, or the row is decoration.
- **Confirm a terminal state exists that is not success.**
