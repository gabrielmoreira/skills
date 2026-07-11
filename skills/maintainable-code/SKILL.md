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

Core stance: clear business flow, explicit I/O, no hidden dependencies, no unnecessary fragmentation. Code should help the reader recover context after interruption — keep real complexity visible, remove avoidable cognitive load. Good architecture makes the right place obvious: design the invitation, not only the rule.

The principles follow the order of a change:

```txt
think → shape → write → name → explain
```

## Language Policy

Reply in the language the user is using. Write code, comments, documentation, plans, and any other persistent repository content in English unless the user explicitly asks for another language.

## Overview

| Family | Principles |
| --- | --- |
| **A — Process** | **1.** Investigate before you change.<br>**2.** Plan from the test; build the core first.<br>**3.** Aim at the final experience; loop back when you learn. |
| **B — Architecture** | **4.** Keep few layers: clear flow, explicit I/O.<br>**5.** Inject dependencies explicitly; watch what crosses the layers.<br>**6.** Keep the generic generic.<br>**7.** Choose external dependencies deliberately.<br>**8.** Organize by feature, not by technical type. |
| **C — Implementation** | **9.** Give each unit one coherent responsibility.<br>**10.** Keep support pure; isolate technical mini engines.<br>**11.** Lay out files top-down for re-entry. |
| **D — Naming & Language** | **12.** Reuse the domain's vocabulary.<br>**13.** Write repository content in international, intermediate English.<br>**14.** Name with symmetry. |
| **E — Communication** | **15.** Present plans progressively. |

---

## A — Process

### 1. Investigate before you change.

Read how the system works today before changing it. The pattern you need often already exists: find it and follow it while it still fits. DRY matters, but do not turn every similarity into an abstraction — reuse should protect the existing design, not create a second architecture or add layers the system does not need.

### 2. Plan from the test; build the core first.

Before coding, ask how the change will be tested. Sketch the main flow in rough pseudocode across the main parts: routing, use case, subtasks, connectors, entry point. Design connector interfaces early, but build the business flow and its subtasks first; then wire routing, connectors, and the composition root. Plan for re-entry as well as first-pass reading: a maintainer should recover the next step from the structure, names, and tests without rebuilding the whole context mentally.

### 3. Aim at the final experience; loop back when you learn.

Keep the final experience in view while building: UX for users, DX for developers, API shape for consumers, CLI behavior for operators, integration contracts for external systems. The plan from #2 is a starting point, not a prison — when implementation reveals the UX, data shape, or architecture is wrong, return to the design with what you learned.

---

## B — Architecture

### 4. Keep few layers: clear flow, explicit I/O.

Prefer one clear spine:

```txt
composition root → routing → use cases → subtasks → connectors
```

The composition root creates connectors and wires dependencies. Routing chooses the flow. Use cases hold the main business flow. Subtasks move secondary detail out of that flow. Connectors own the outside world: env, args, process I/O, fetch, files, random, time, external services.

Prefer pure logic when it is natural (data in, decision out), but do not force purity or split code into tiny functions when that makes the flow harder to read. Use cases and subtasks may coordinate injected infrastructure when needed. Keep the main path and its essential context close; move secondary detail down, behind a named subtask, or out to a connector — the reader should not jump across many files to reconstruct one business decision. The goal is cohesive flow, explicit dependencies, controlled side effects, and fewer forced context reloads, not purity or layer count for their own sake.

### 5. Inject dependencies explicitly; watch what crosses the layers.

Dependencies enter through constructors, factories, parameters, or the composition root — no hidden globals, no business code reaching directly into infrastructure APIs. Watch the data too: god objects and large context objects passed everywhere hide dependencies and make every function look like it depends on the whole system. A shared context is acceptable as an extension contract (plugins, workflow engines, framework-like systems); ordinary business services take explicit dependencies and explicit data.

### 6. Keep the generic generic.

Engines, frameworks, runners, executors, and other generic mechanisms must not solve one runtime case by hardcoding case-specific values. Generic code should not know business-specific data that belongs to callers, configuration, or runtime input. Solve the problem at the right abstraction level — contract, configuration, data model, extension point, or caller — instead of damaging a generic design to protect a local shortcut.

### 7. Choose external dependencies deliberately.

Adopt libraries that reduce real complexity and are widely adopted, battle-tested, actively maintained, and quick to patch. Avoid dependencies for trivial problems; avoid handmade solutions for hard problems mature libraries already solve well. The more a dependency owns state, affects architecture, touches security, or spreads its vocabulary through the system, the higher the adoption bar. When useful but not semantically central, hide it behind a small support layer; embrace it directly only when it deserves to become part of the project's shared language.

### 8. Organize by feature, not by technical type.

Prefer folders named after product or domain features, not framework roles like `models`, `controllers`, `services`. Repeating the feature name in filenames is fine when it helps clarity (`billing/billing.model.ts`, `billing/billing.use-case.ts`). The folder structure should reveal the product before it reveals the framework.

---

## C — Implementation

### 9. Give each unit one coherent responsibility.

A function, class, or module should have one clear reason to exist — but not every small step needs its own function. Keep the main business logic together when reading it in one place is clearer than jumping across tiny helpers. Extract subtasks when they remove secondary detail from the main flow: parsing, normalization, validation, enrichment, retries, state transitions, formatting. Prefer pure subtasks; allow explicit infrastructure dependencies when that keeps the design simpler and the effect visible. Do not mix unrelated concerns in one body; do not fragment a cohesive flow just to look clean.

### 10. Keep support pure; isolate technical mini engines.

Small helpers — validation, parsing, normalization, type guards, deterministic formatting — stay small, deterministic, and free of external I/O by default. Mini engines are bigger than a helper and smaller than a framework: state machines, workflow runners, queue controllers, concurrency limiters, retry controllers, schedulers. Keep them as isolated technical primitives: they may manage technical state and lifecycle, but no hardcoded business values and no hidden I/O. When a library fills this role, wrap it behind a small semantic layer or embrace it deliberately per #7.

### 11. Lay out files top-down for re-entry.

Main function at the top; below it, the functions it calls in order of first use; then the functions those call; and so on — general to specific:

```txt
mainFunction
  helperUsedFirst
  helperUsedNext
    subHelper
```

Blank-line groups inside a body are not a defect, but they are a signal: name what each group does, and when the names are real responsibilities, extract the secondary detail instead of keeping visual sections. The file should read in the order the reader needs and give clear re-entry points after interruption.

---

## D — Naming & Language

### 12. Reuse the domain's vocabulary.

Define the main concepts and taxonomy early, then carry those terms into the code consistently. Do not invent new words for concepts the system already named. Prefer familiar software terms when they are accurate enough — a broadly understood word beats a precise but obscure one.

### 13. Write repository content in international, intermediate English.

Write code names, comments, docs, and plans in English an intermediate non-native reader can follow: no rare idioms or advanced-only vocabulary. Widely used technical terms are the exception — their popularity already gives readers context.

### 14. Name with symmetry.

Related things get parallel names: same verb choices, same verb-or-noun order, same singular/plural pattern unless there is a clear reason to differ. Symmetry makes code predictable — a reader should guess nearby names before opening the file: `createUser` / `updateUser` / `deleteUser` / `findUser`, never `createUser` / `userUpdate` / `removeUsers` / `getSingleAccount`.

---

## E — Communication

### 15. Present plans progressively.

Useful answer first; then context, details, edge cases, caveats, risks, and tradeoffs in the order the reader needs them. Short paragraphs, plain language, one main idea per paragraph; headings and bullets only when they reduce effort. Keep important nuance without becoming dense, corporate, over-polished, or artificially brief. Orient the reader, show the main path, reveal secondary detail when it helps the next decision. The goal is a more oriented reader, not a more impressed one.

---

## Cross-references

- **#4 and #9** are the same instinct at different scales: clear system flow, coherent local units.
- **#6 and #10** protect generic mechanisms from absorbing business-specific shortcuts.
- **#7 and #10** decide when to build, adopt, wrap, or embrace reusable technical behavior.
- **#2, #11, and #15** all protect re-entry: tests, file order, and plans help the reader resume after losing context.
- **#12, #13, and #14** make code easier to recognize, search, discuss, and extend.

## Before applying these principles

Apply deliberately. If you break one, make the reason visible: clearer flow, safer dependency boundaries, simpler testing, fewer forced context reloads, or less accidental complexity.
