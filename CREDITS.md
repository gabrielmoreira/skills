# Credits

Nothing here was invented from nothing. This page names what it was built on, so
a reader can go to the source rather than to this restatement of it.

Two kinds of debt, and they are different in kind. **Prior work that shaped a
skill directly** is named with what it contributed. **Ideas the rules stand on**
are the established terms and practices the guidance assumes a reader already
knows, cited in each rule's own `references:` frontmatter.

---

## Prior work that shaped a skill

### `drop-the-model-voice`

- [**Wikipedia, "Signs of AI writing"**](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
  maintained by WikiProject AI Cleanup. The pattern catalogue: what generated
  prose actually does, drawn from reviewing a great deal of it.
- [**`humanizer`, by blader**](https://github.com/blader/humanizer). Turning that
  catalogue into a skill, and much of how the patterns group. The false-positive
  discipline is theirs too, and it is the part most collections skip.

**What this collection added**: the software framing, so the subject is a review
comment and an incident write-up rather than prose in general; the shape each
kind of message arrives in; and the precedence rules for a voice the user asks
for, which come from measuring what happens when a skill flattens one.

---

## Collections this one learned from

These are agent-skill collections whose approach shaped how this one is built,
rather than material it copied. Where a technique here resembles one of theirs,
they got there first.

- [**obra/superpowers**](https://github.com/obra/superpowers). An agentic skills
  framework and development methodology.
- [**mattpocock/skills**](https://github.com/mattpocock/skills). Skills for real
  engineers, straight from the author's own agent directory.
- [**addyosmani/agent-skills**](https://github.com/addyosmani/agent-skills).
  Production-grade engineering skills for AI coding agents.
- [**WorldFlowAI/everything-claude-code**](https://github.com/WorldFlowAI/everything-claude-code).
  Agents, commands, skills, rules and hooks as one toolkit.

**Two more belong here and are not linked yet.** A collection referred to as
*Ring*, and the *caveman* terse-answer skill, which is where this collection's
own result-first register comes from. Searching turned up several candidates for
caveman and nothing conclusive for Ring, and a citation guessed at is worse than
a gap that says so. Both get a link when the right repository is confirmed.

## The ideas the rules stand on

Each rule carries its own `references:` frontmatter naming what it assumes. The
recurring ones, which is to say the ones the collection leans on hardest:

**Design and structure.** Anti-Corruption Layer, Bounded Context and the rest of
domain-driven design. Composition Root and Object Lifetime, from Mark Seemann.
Dependency Injection, Extract Method, Feature Toggles and Strangler Fig, from
Martin Fowler. Interface Segregation and the rest of SOLID. Indirection, from
GRASP. Hexagonal Architecture. Clean Architecture. Locality of Behavior. Deep
module design.

**Writing code people can read.** Newspaper Metaphor, Step-Down Rule and
Intention-Revealing Names, from Clean Code. Single Level of Abstraction. Rule of
Three.

**Types.** Parse, don't validate. Making illegal states unrepresentable.
Discriminated unions, branded types and nullish coalescing, from the TypeScript
Handbook. Nominal typing. Errors are values, from Go. Result and Either types,
from Rust, Scala and fp-ts.

**Tests.** Characterization Tests, from Michael Feathers. Listen to the tests,
from Freeman and Pryce. Arrange-Act-Assert. DAMP over DRY. Consumer-driven
contracts. Defect-driven testing.

**Running things.** Twelve-Factor. Continuous Delivery, from Humble and Farley.
Distributed Tracing, from the Dapper paper. The OpenTelemetry specification.
Exponential backoff with jitter. Fail Fast. Kubernetes pod termination
semantics. Node process events and ESM interop.

**Security.** OWASP on cryptographic failures, logging, and secrets management.
RFC 9457 Problem Details. W3C Trace Context.

**Working.** Architecture Decision Records. Five whys. Conventional commits.
Documentation as code. Failure modes from resilience engineering.

---

## A note on what is not here

**No material from any employer, client or private repository is in this
collection.** Where a scenario is derived from real work, it is derived from the
shape of a situation and never its content: the domain changes, the mechanism
changes, and the names, paths, hosts and vendors do not travel. A scenario that
cannot be traced to a source says `invented`, and most of them do.
