---
name: maintainable-code
description: >-
  Use when designing, reviewing, refactoring, or implementing code that should stay
  simple, testable, readable, and sustainable. Applies principles for investigating
  before changes, keeping few layers, making I/O explicit, using dependencies
  deliberately, organizing by feature, naming consistently, and presenting plans
  progressively.
when_to_use: >-
  Use when the user asks for maintainable code, sustainable code, architecture
  principles, refactoring guidance, dependency decisions, feature-folder structure,
  pure/support helpers, mini engines, clear business flow, naming consistency, or
  progressive work plans. Also use when code mixes business logic with I/O, hides
  dependencies, overuses generic contexts, adds unnecessary layers, spreads external
  library APIs through the system, or fragments logic into too many tiny helpers.
---

# Simple, Testable, Maintainable Code Principles

Use these principles to keep code simple, testable, readable, and sustainable.

Core stance: clear business flow, explicit I/O, no hidden dependencies, no unnecessary fragmentation.

They are organized in the order of a change: first how to approach the work, then how to shape the system, then how to write the code, then how to name things, and finally how to communicate plans.
## Language Policy

During an agent session, reply in the language the user is using.

When writing code, comments, documentation, plans, or any other persistent repository content, write in English by default unless the user explicitly asks for another language.


The arc is:

```txt
think → shape → write → name → explain
```

## Overview

| Family | Principles |
| --- | --- |
| **A — Process** | **1.** Investigate before you change.<br>**2.** Plan from the test; build the core first.<br>**3.** Aim at the final experience; loop back when you learn. |
| **B — Architecture** | **4.** Keep few layers: clear flow, explicit I/O.<br>**5.** Inject dependencies explicitly; watch what crosses the layers.<br>**6.** Keep the generic generic.<br>**7.** Choose external dependencies deliberately.<br>**8.** Organize by feature, not by technical type. |
| **C — Implementation** | **9.** Give each unit one coherent responsibility.<br>**10.** Keep support pure; isolate technical mini engines.<br>**11.** Lay out files top-down. |
| **D — Naming & Language** | **12.** Reuse the domain's vocabulary.<br>**13.** Write repository content in international, intermediate English.<br>**14.** Name with symmetry. |
| **E — Communication** | **15.** Present plans progressively. |

---

## A — Process

### 1. Investigate before you change.

Read how the system works today before changing it. The pattern you need often already exists somewhere: find it, understand it, and follow it when it still fits.

DRY matters, but do not turn every similarity into an abstraction. Reuse should protect the existing design, not create a second architecture or add layers the system does not need.

### 2. Plan from the test; build the core first.

Before coding, ask how the change will be tested. Sketch the main flow in rough pseudocode, especially across the main parts of the system: routing, use case, subtasks, connectors, and entry point.

Design connector interfaces early, but build the core behavior first. Start with the business flow and the subtasks that make it readable. Then wire routing, connectors, and the composition root. This keeps most of the work focused on behavior instead of infrastructure.

### 3. Aim at the final experience; loop back when you learn.

Keep the final experience in view while building: UX for the user, DX for the developer, API shape for consumers, CLI behavior for operators, and integration contract for external systems.

The plan from #2 is a starting point, not a prison. If implementation reveals that the UX, DX, data shape, or architecture is wrong, return to the design with what you learned and adjust the plan.

---

## B — Architecture

### 4. Keep few layers: clear flow, explicit I/O.

Prefer one clear spine:

```txt
composition root → routing → use cases → subtasks → connectors
```

The composition root creates connectors and wires dependencies. Routing chooses the flow. Use cases hold the main business flow. Subtasks move secondary details out of that flow when they make it harder to read. Connectors handle the outside world: env, args, process spawn, process I/O, fetch, files, random, time, external services, and any other I/O.

Prefer pure logic when it is natural: data in, decision out, no I/O. But do not force purity or split code into tiny functions when that makes the business flow harder to understand. Use cases and subtasks may coordinate ports or infrastructure dependencies when needed, as long as those dependencies are explicit and injected.

The goal is not purity for its own sake. The goal is cohesive business flow, clear dependencies, and controlled side effects. Keep the spine; do not invent layers or micro-abstractions the code has not earned.

### 5. Inject dependencies explicitly; watch what crosses the layers.

Dependencies should enter through constructors, factories, parameters, or the composition root. Avoid hidden globals and avoid business code reaching directly into infrastructure APIs.

Also watch the data structures moving through the layers. Avoid god objects and large context objects passed everywhere. They hide dependencies and make every function look like it depends on the whole system.

A shared context can make sense in systems built for extensibility, plugins, workflow execution, or framework-like behavior. In those cases, the context is part of the extension contract. For ordinary business services, prefer explicit dependencies and explicit data.

### 6. Keep the generic generic.

If a component is an engine, framework, runner, executor, or other generic mechanism, do not solve one runtime case by hardcoding case-specific values into it. Generic code should not know business-specific data that belongs to callers, configuration, or runtime input.

Solve the problem at the right abstraction level: improve the contract, configuration, data model, extension point, or caller responsibility. Do not protect a local shortcut by damaging a generic design.

### 7. Choose external dependencies deliberately.

Open-source dependencies are good when they reduce real complexity and are clearly stronger than what the team should build itself. Prefer dependencies that are widely adopted, battle-tested, actively maintained, quick to patch, and have a good security record.

Keep the dependency surface small, but not by replacing mature libraries with complex, fragile, or overly technical custom code. Avoid dependencies for trivial problems; avoid handmade solutions for hard problems that mature libraries already solve well.

The more a dependency owns state, affects architecture, touches security, or spreads its vocabulary through the system, the higher the adoption bar. When useful but not semantically central, hide it behind a small support layer. Embrace it directly only when it deserves to become part of the project's shared language.

### 8. Organize by feature, not by technical type.

Prefer folders named after product or domain features, not after framework roles like `models`, `controllers`, `services`, or `repositories`. A tree organized only by technical type tells the reader little about what the system does.

It is fine to repeat the feature name in filenames when it helps clarity:

```txt
billing/
  billing.model.ts
  billing.use-case.ts
  billing.controller.ts

users/
  users.model.ts
  users.use-case.ts
  users.controller.ts
```

The folder structure should reveal the product before it reveals the framework.

---

## C — Implementation

### 9. Give each unit one coherent responsibility.

A function, method, class, or module should have one clear reason to exist. But that does not mean every small step needs its own function. Keep the main business logic together when reading it in one place is clearer than jumping across many tiny helpers.

Extract subtasks when they remove secondary detail from the main flow: parsing, normalization, validation, enrichment, retries, state transitions, formatting, or technical coordination. Prefer subtasks to be pure, but allow explicit infrastructure dependencies when that keeps the design simpler and the effect visible.

Do not mix unrelated concerns in one body just because they happen in sequence. But also do not fragment a cohesive flow into micro-functions just to look clean.

### 10. Keep support pure; isolate technical mini engines.

Some support code is a small helper: validation, parsing, normalization, type guards, deterministic formatting, and simple pure transformations. Keep this code small, deterministic, and free of external I/O by default.

Some support code is bigger than a helper and smaller than a framework: state machines, workflow runners, queue/dequeue controllers, concurrency limiters, retry controllers, decorators, schedulers, and similar mechanisms. Keep these as isolated technical primitives. They may manage technical state and lifecycle, but they should not hardcode business-specific runtime values or perform hidden I/O.

A mini engine can be internal or external. When adopting a library for this role, either wrap it or embrace it deliberately. Wrap it behind a small semantic support layer when its API should not spread through the system. Embrace it directly only when it is mature, widely adopted, stable, and valuable enough to become part of the project's shared language.

### 11. Lay out files top-down.

Put the main function of the file at the top. Below it, place the functions it calls, in order of first use; then the functions those functions call; and so on.

The file should read from general to specific:

```txt
mainFunction
  helperUsedFirst
  helperUsedNext
    subHelper
```

Keep function bodies free of blank lines; when a function wants visual sections, extract the secondary detail. The file should read in the order the reader needs to understand it.

---

## D — Naming & Language

### 12. Reuse the domain's vocabulary.

Define the main concepts and taxonomy as early as possible, then carry those terms into the code consistently. Avoid inventing new words for concepts the system already named.

Prefer familiar software terms when they are accurate enough. A slightly broader term that most developers understand is often better than a very precise term that feels obscure or academic. Precision is valuable, but not when it makes the code harder to read.

### 13. Write repository content in international, intermediate English.

Write code names, comments, documentation, plans, and other persistent repository content in English that an intermediate non-native reader can follow. Avoid rare idioms, overly fluent expressions, or vocabulary that only advanced speakers catch.

Technical software terms are the exception. If a technical term is widely used in the industry, use it. Its popularity already gives readers context.

### 14. Name with symmetry.

Related things should be named in parallel. Keep the same verb choices, the same verb-or-noun order, and the same singular or plural pattern unless there is a clear reason to differ.

Symmetry makes code predictable. A reader should be able to guess nearby names before opening the file:

```txt
createUser
updateUser
deleteUser
findUser
```

Avoid accidental asymmetry:

```txt
createUser
userUpdate
removeUsers
getSingleAccount
```

---

## E — Communication

### 15. Present plans progressively.

Start with the useful answer first. Then layer context, details, edge cases, caveats, risks, and tradeoffs in the order the reader needs them.

Use short paragraphs, plain language, and one main idea per paragraph. Use headings and bullets only when they reduce effort. Keep important nuance, but do not make the answer dense, corporate, over-polished, or artificially brief.

The goal is to leave the reader more oriented, not more impressed.

---

## One line each

1. Investigate before you change.
2. Plan from the test; build the core first.
3. Aim at the final experience; loop back when you learn.
4. Keep few layers: clear flow, explicit I/O.
5. Inject dependencies explicitly; avoid hidden globals and god contexts.
6. Keep the generic generic; do not hardcode one case into an engine.
7. Choose external dependencies deliberately.
8. Organize by feature, not by technical type.
9. Give each unit one coherent responsibility.
10. Keep support pure; isolate technical mini engines.
11. Lay out files top-down.
12. Reuse the domain's vocabulary.
13. Write repository content in international, intermediate English.
14. Name with symmetry.
15. Present plans progressively.

---

## Cross-references

- **#4 and #9** are the same instinct at different scales: clear system flow and coherent local units.
- **#4 and #5** work together: few layers only stay clear when dependencies and data crossing those layers are explicit.
- **#6 and #10** protect generic mechanisms: engines and support primitives should not absorb business-specific shortcuts.
- **#7 and #10** decide when to build, adopt, wrap, or embrace reusable technical behavior.
- **#11 and #15** share the same reader-first idea: top-down in code, most-useful-first in prose.
- **#12, #13, and #14** make the code easier to recognize, search, discuss, and extend.

## Before applying these principles

Apply these principles deliberately. If you break one, make the reason visible: clearer flow, safer dependency boundaries, simpler testing, or less accidental complexity.
