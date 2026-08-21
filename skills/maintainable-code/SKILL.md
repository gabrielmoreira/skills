---
name: maintainable-code
description: >-
  Decide where code goes and which direction it points: where a new module
  belongs, whether a dependency may flow that way, what stays behind a boundary,
  whether an abstraction has been earned yet, and when a long flow should stay in
  one piece. Covers investigating before changing, proving a technical unknown
  before choosing the placement, keeping effects and dependencies explicit, and
  recording the compromise when existing architecture forces one. Use when the
  user says "where should this live", "is this the right structure", "should I
  split this", "this file is doing too much", or "clean this up", and when code
  hides I/O, passes a broad context object, hardcodes one caller into a generic
  mechanism, or grows a second architecture beside the first. Not for judging a
  change that already exists, and not for language-specific idiom. Structure
  chosen while a technical unknown is still open is a guess wearing the costume
  of design.
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
- **Where the existing architecture forces a placement you would not choose, write that down as you make it**, with the placement you would have preferred. Recorded at the compromise it becomes an item; left in the conversation it is never the improvement proposed once the work is green.
- **Do not abstract every similarity you notice.** Two things looking alike is not evidence they change together.

## 2. Design from observable proof

- **Decide how the result will be demonstrated before implementing it.**
- **Sketch the main path, build the smallest coherent core, then wire the boundaries.**
- **Treat the plan as provisional.** Revise it when the implementation reveals a better contract, data shape, or user experience.
- **When the unknown is technical, prove it before choosing where the code lives.** An isolated probe answers the question without paying for placement twice. Placement chosen before the unknown is resolved is a guess wearing the costume of design.
- **When the unknown is only structural, the target is already known**, so restructure first and then build into it.
- **A probe may be harvested, but never its status.** Keep the working path through a hostile integration if rederiving it is expensive; the code can survive, the fact that nothing has proven it cannot.

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
- **Name the direction each module may depend in, and let a tool refuse the rest.** Two files with one responsibility each and one direction between them is already a module; a package is the same boundary when it must be enforced rather than agreed.
- **Prefer a cycle check the project runs over a rule people remember.** Bidirectional dependency has no legitimate exception, which makes it the cheapest boundary to enforce and the first one worth wiring into the build.

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
