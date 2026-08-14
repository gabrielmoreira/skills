---
id: authoring-verifiable-skills.gate-not-checklist
owner: authoring-verifiable-skills
canonical: true
severity: hard-gate
references: [measured read cost across four skills, routing tables in five reference collections]
---

# Gate Not Checklist

Decision: **The table maps what an agent can see in the work to the one file that decides, so a rule is read when its row's signal is present and not otherwise.**

Use when:
- **A skill has more than one rule.**
- **An index routes concepts** the agent would have to already know to match.
- **Every run opens every rule**, so a three-line change pays what a nine-hundred-line change pays.
- **Two rows could both be true** for the same piece of evidence.
- **A skill is being split**, and the new boundary needs stating.

Do:
- **Put an observable symptom in the left column**, matched by looking at the diff, the error, or the call site.
- **Include the literal tokens that will be on screen.** Identifiers, API names, error strings, syntax. The highest-precision signal available.
- **One row per rule, one rule per row.**
- **Make rows mutually distinguishable.** Where two could both fire, add the discriminator to both or merge the rules.
- **State the default stance under the table**, so an agent that stops there still acts correctly.
- **Name the topic's edges.** An index that quietly claims a neighbour's territory steals routing from it.
- **Report an absent signal as not-applicable, naming the signal.**
- **Keep the gate inside `SKILL.md`.** A separate index costs a read per activation and serves no external consumer.

Avoid:
- **A concept name in the left column.** "Error taxonomy" is vocabulary; "a retry loop that retries a stable 400" is evidence.
- **A default of "read them all".** That is a table of contents with extra steps, not routing.
- **A tie-breaker table past a dozen rows**, which means the topic split is wrong.
- **A gate with fewer rows than rules**, which leaves one unreachable.

Exceptions:
- **A skill with one topic MAY have no gate**, holding its decisions in the entry file.
- **A multi-topic skill routes to topic directories**, where a separate `INDEX.md` per topic is real routing rather than an extra hop.

Example (one instance, not the set):

| Bad, a concept | Good, something visible |
| --- | --- |
| anti-corruption layer | a provider SDK type appearing in business logic |
| lifecycle management | `SIGTERM` arriving while jobs are in flight |

Verify:
- **Check every rule file has a row, and every row a rule.**
- **Read the left column as an agent would.** If matching it needs the taxonomy, rewrite it as evidence.
- **Confirm no two rows could fire on the same evidence** without a discriminator.
- **Confirm the default stance under the table is correct on its own.**
