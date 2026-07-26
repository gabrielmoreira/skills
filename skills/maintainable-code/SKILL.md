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

Make real complexity visible and remove accidental complexity. Prefer the repository's proven conventions; apply these defaults only where they improve flow, boundaries, testing, or re-entry.

## Language

Reply in the user's language. Keep persistent repository content in the project's established language; default to clear international English when no convention exists.

## Principles

### 1. Investigate before changing

Trace the current behavior, entry points, dependencies, tests, and local patterns. Reuse a fitting pattern; do not create a second architecture or abstract every similarity.

### 2. Design from observable proof

Define how the result will be demonstrated before implementation. Sketch the main path, build the smallest coherent core, then wire boundaries. Treat the plan as provisional: revise it when implementation reveals a better contract, data shape, or user experience.

### 3. Keep the main flow obvious

Use as few layers as the problem needs. Keep essential decisions and context close; move secondary detail behind well-named units.

For service-style applications, a useful default is:

```text
composition root → route → use case → focused subtask → connector
```

Do not impose this spine on libraries, framework-led applications, pipelines, or small scripts when their native structure is clearer.

### 4. Make effects and dependencies explicit

Keep network, files, process state, time, randomness, and external services at visible boundaries. Pass stateful, replaceable, lifecycle-sensitive, or I/O dependencies explicitly.

Do not inject stable pure utilities or constants merely to satisfy a pattern. Avoid globals and broad context objects that hide what a unit actually needs; shared contexts are acceptable when they are the deliberate extension contract.

### 5. Keep mechanisms generic and dependencies deliberate

Generic engines must not absorb caller-specific business values. Put variability in contracts, configuration, data, or extension points.

Adopt maintained libraries when they remove meaningful complexity; avoid dependencies for trivial work and homemade substitutes for hard, solved problems. Contain a library when its vocabulary should not become the application's vocabulary.

### 6. Organize around the axis of change

Prefer feature or domain folders in product applications because they reveal behavior and keep related changes together. Prefer technical or capability-based organization in libraries, infrastructure, and framework packages when that is the natural public boundary.

### 7. Keep units cohesive

A function, class, or module needs one coherent purpose, not one tiny step. Extract parsing, validation, transitions, retries, and formatting when doing so clarifies the main flow. Do not scatter a single decision across helpers just to make functions shorter.

Keep small deterministic support functions pure by default. Isolate state machines, schedulers, retry controllers, and similar mini engines from business values and hidden I/O.

### 8. Optimize file layout for re-entry

Follow the repository's local order. Without a convention, place the public or main path before secondary detail and arrange helpers in the order they are needed. Treat blank-line groups as a prompt to inspect cohesion, not an automatic extraction rule.

### 9. Use stable domain language

Reuse the domain's established vocabulary. Choose familiar precise terms, and name related operations symmetrically so nearby names are predictable. Do not rename valid framework or domain terms merely to enforce stylistic uniformity.

### 10. Communicate progressively

Present the useful answer or decision first, then supporting detail and risk. For full response-style guidance, use `skill://progressive-reading`.

## Check

Before applying a principle, ask whether it fits the project's scale, framework, and existing contracts. A justified exception is better than ceremonial compliance; make the reason visible.
