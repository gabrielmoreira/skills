import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

const scenarios = [
  {
    id: "maintainable-activation-broad-context-refactor",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "Review this service refactor. Every function now receives one broad context object; I want clearer dependencies and easier tests without adding layers for their own sake.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: true,
    },
    must: ["Selects maintainability guidance for the explicit dependency, testability, and proportionality tradeoff"],
    mustNot: ["Treats the request as a mechanical code edit"],
    tags: ["activation", "positive", "dependencies"],
  },
  {
    id: "maintainable-activation-module-ownership",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "Help restructure this module so ownership is obvious, behavior stays testable, and we do not create abstractions that hide the business flow.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: true,
    },
    must: ["Selects maintainability guidance because module ownership and abstraction depth are central"],
    mustNot: ["Optimizes only for fewer lines"],
    tags: ["activation", "positive", "ownership"],
  },
  {
    id: "maintainable-activation-naming-and-cohesion",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "This package has inconsistent names, scattered helpers, and unclear boundaries. Propose the smallest durable cleanup that follows the repository's existing conventions.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: true,
    },
    must: ["Selects maintainability guidance for cohesion, naming, boundaries, and convention reuse"],
    mustNot: ["Proposes an unrelated architecture rewrite"],
    tags: ["activation", "positive", "cohesion"],
  },
  {
    id: "maintainable-skip-literal-typo",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "exception",
    difficulty: "mixed",
    prompt: "Change the typo in this user-facing string from 'recieve' to 'receive'. Do not touch anything else.",
        nearMiss:
      "A string edit is a change to a source file, which is this skill's subject. But nothing about structure, boundaries, or cohesion is in play: one token changes and the surrounding design is untouched.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: false,
    },
    must: ["Leaves broad maintainability guidance unloaded for a literal one-token edit"],
    mustNot: ["Expands the typo fix into refactoring or review"],
    tags: ["activation", "negative", "mechanical-edit"],
  },
  {
    id: "maintainable-skip-query-diagnosis",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Explain why this SQL query returns zero rows with these parameters. Diagnose the current behavior only; do not redesign or refactor the data layer.",
        nearMiss:
      "Diagnosing a data layer sounds like the boundary and cohesion questions this skill owns, and the words are all here. But the ask is why current behaviour happens, not whether the design is right, and it forbids redesign outright.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: false,
    },
    must: ["Leaves maintainability guidance unloaded because the request is bounded diagnosis without design work"],
    mustNot: ["Substitutes architecture advice for root-cause analysis"],
    tags: ["activation", "negative", "diagnosis"],
  },
  {
    id: "maintainable-skip-disposable-script",
    bundle: "maintainable-code",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt:
      "Write a disposable eight-line script that renames these five local files once. It will be deleted immediately afterward; no library or reusable API is needed.",
        nearMiss:
      "'No reusable API is needed' names the exact tension this skill arbitrates. It names it in order to close it: eight lines deleted immediately have no future reader to protect, and that reader is the entire reason the guidance exists.",
    activation: {
      layer: "public-skill",
      target: "maintainable-code",
      shouldActivate: false,
    },
    must: ["Leaves architecture-level maintainability guidance unloaded for explicitly disposable code"],
    mustNot: ["Introduces reusable layers or framework structure"],
    tags: ["activation", "negative", "disposable"],
  },
] satisfies EvalScenario[];

export default scenarios;
