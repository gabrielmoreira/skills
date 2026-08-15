---
name: maintainable-code
description: >-
  Use when designing, reviewing, refactoring, or implementing code that should
  stay simple, testable, readable, and sustainable. Covers investigation,
  architecture, dependency boundaries, cohesive units, naming, and clear plans.
  Also use when code hides I/O or dependencies, adds unnecessary layers, mixes
  business and infrastructure concerns, or fragments one flow across tiny helpers.
---

# Maintainable Code

**Core principle.** Make real complexity visible, and remove the complexity nothing required.

- **The repository's proven conventions come first.** Apply these defaults only where they improve flow, boundaries, testing, or re-entry.
- **The weight sits in *Investigate before changing* and *Make effects and dependencies explicit*.** The other eight are easier to apply, and easier to skip, once those two hold.
- **You opened this in the middle of something.** This is how to do that work, not a replacement for it. Name what you were doing before you start, and return to it when this is done.

## Language

- **Reply in the user's language.**
- **Keep persistent repository content in the project's established language.**
- **Default to clear international English** where no convention exists.

## 1. Investigate before changing

- **Trace what is already there** before touching it.
  - Current behaviour.
  - Entry points.
  - Dependencies.
  - Tests.
  - Local patterns.
- **Reuse a pattern that fits.**
- **Do not create a second architecture beside the first.**
- **Do not abstract every similarity you notice.** Two things looking alike is not evidence they change together.

## 2. Design from observable proof

- **Decide how the result will be demonstrated before implementing it.**
- **Sketch the main path, build the smallest coherent core, then wire the boundaries.**
- **Treat the plan as provisional.** Revise it when the implementation reveals a better contract, data shape, or user experience.

## 3. Keep the main flow obvious

- **Use as few layers as the problem needs.**
- **Keep the essential decisions and their context close together.**
- **Move secondary detail behind a well-named unit.**

For service-style applications, a useful default is:

```text
composition root -> route -> use case -> focused subtask -> connector
```

- **Do not impose that spine where the native structure is clearer.** Libraries, framework-led applications, pipelines, and small scripts each have one.

## 4. Make effects and dependencies explicit

- **Keep these at visible boundaries.**
  - Network and files.
  - Process state.
  - Time and randomness.
  - External services.
- **Pass a dependency explicitly when it is stateful, replaceable, lifecycle-sensitive, or does I/O.**
- **Do not inject a stable pure utility or a constant just to satisfy a pattern.**
- **Avoid globals and broad context objects**, which hide what a unit actually needs.
- **A shared context is fine where it is the deliberate extension contract.**

## 5. Keep mechanisms generic and dependencies deliberate

- **A generic engine must not absorb business values belonging to one caller.**
- **Put the variability in a contract, configuration, data, or an extension point.**
- **Adopt a maintained library where it removes meaningful complexity.**
- **Avoid a dependency for trivial work**, and avoid a homemade substitute for a hard problem that is already solved.
- **Contain a library where its vocabulary should not become the application's vocabulary.**

## 6. Organize around the axis of change

- **Prefer feature or domain folders in product applications.** They reveal behaviour and keep related changes together.
- **Prefer technical or capability-based organisation in libraries, infrastructure, and framework packages**, where that is the natural public boundary.

## 7. Keep units cohesive

- **A function, class, or module needs one coherent purpose**, not one tiny step.
- **Extract a concern where it clarifies the main flow.** Parsing, validation, transitions, retries, formatting.
- **Do not scatter one decision across helpers to make functions shorter.**
- **Keep small deterministic support functions pure by default.**
- **Isolate mini engines from business values and hidden I/O.** State machines, schedulers, retry controllers.

## 8. Optimize file layout for re-entry

- **Follow the repository's local order.**
- **Without a convention, put the public or main path before secondary detail**, and arrange helpers in the order they are needed.
- **Treat a blank-line group as a prompt to inspect cohesion**, never as an automatic extraction rule.

## 9. Use stable domain language

- **Reuse the domain's established vocabulary.**
- **Choose familiar precise terms.**
- **Name related operations symmetrically**, so a nearby name is predictable.
- **Do not rename a valid framework or domain term to enforce stylistic uniformity.**

## 10. Communicate progressively

- **Present the useful answer or decision first**, then the supporting detail, then the risk.
- **For full response-style guidance, use `skill://progressive-reading`.**

## Before applying any of this

- **Ask whether the principle fits this project's scale, framework, and existing contracts.**
- **A justified exception beats ceremonial compliance.**
- **Make the reason visible** so the next reader does not undo it.
