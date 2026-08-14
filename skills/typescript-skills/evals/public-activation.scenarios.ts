import type { EvalScenario } from "./evals.types.ts";

const scenarios = [
  {
    id: "typescript-activation-unknown-webhook",
    bundle: "typescript-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "In a TypeScript API, parse an unknown webhook payload into a trusted internal event without unsafe assertions, and keep the vendor shape at the boundary.",
    activation: {
      layer: "public-skill",
      target: "typescript-skills",
      shouldActivate: true,
    },
    must: ["Selects TypeScript guidance because boundary parsing and type safety drive the implementation"],
    mustNot: ["Treats this as a language-agnostic prose request"],
    tags: ["activation", "positive", "boundary"],
  },
  {
    id: "typescript-activation-worker-lifecycle",
    bundle: "typescript-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "Our Node.js worker is written in TypeScript. Design graceful SIGTERM handling, abort propagation, and cleanup when in-flight work fails.",
    activation: {
      layer: "public-skill",
      target: "typescript-skills",
      shouldActivate: true,
    },
    must: ["Selects TypeScript guidance because async lifecycle and cancellation are the requested code design"],
    mustNot: ["Routes only to generic process advice"],
    tags: ["activation", "positive", "lifecycle"],
  },
  {
    id: "typescript-activation-config-boundary",
    bundle: "typescript-skills",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "Review a TypeScript configuration loader that parses environment values, exposes typed feature settings, handles secret pointers, and preserves a staged migration.",
    activation: {
      layer: "public-skill",
      target: "typescript-skills",
      shouldActivate: true,
    },
    must: ["Selects TypeScript guidance because typed configuration boundaries and migration semantics are central"],
    mustNot: ["Treats the request as generic documentation review"],
    tags: ["activation", "positive", "config"],
  },
  {
    id: "typescript-skip-error-message-rewrite",
    bundle: "typescript-skills",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Rewrite this TypeScript compiler error in plain English for a beginner. Do not suggest or change any code.",
        nearMiss:
      "A compiler error is TypeScript, and explaining one clearly overlaps with good writing. But no code is being designed, reviewed, or changed, so no rule in this tree has a decision to make.",
    activation: {
      layer: "public-skill",
      target: "typescript-skills",
      shouldActivate: false,
    },
    must: ["Leaves the coding rules unloaded because the task is a bounded prose rewrite with code advice forbidden"],
    mustNot: ["Turns the explanation into an implementation review"],
    tags: ["activation", "negative", "prose-only"],
  },
  {
    id: "typescript-skip-release-history",
    bundle: "typescript-skills",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt: "What year was TypeScript 5.0 released? Cite the official announcement; no coding guidance is needed.",
        nearMiss:
      "The prompt names TypeScript directly, which is the strongest surface trigger there is. It asks for a historical fact with a citation, and this tree routes design decisions rather than release dates.",
    activation: {
      layer: "public-skill",
      target: "typescript-skills",
      shouldActivate: false,
    },
    must: ["Leaves coding guidance unloaded because this is historical source lookup rather than TypeScript work"],
    mustNot: ["Adds unrelated implementation recommendations"],
    tags: ["activation", "negative", "research"],
  },
  {
    id: "typescript-skip-line-ending-conversion",
    bundle: "typescript-skills",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt:
      "Convert this `.ts` file from CRLF to LF without inspecting or changing its code. Preserve every byte except line endings.",
        nearMiss:
      "It is a TypeScript file and it is being modified, so both the language and the edit are present. The change is explicitly byte-level and forbids reading the code, so there is no design decision inside it.",
    activation: {
      layer: "public-skill",
      target: "typescript-skills",
      shouldActivate: false,
    },
    must: ["Leaves TypeScript design guidance unloaded for a format-only byte transformation"],
    mustNot: ["Reviews or rewrites the source code"],
    tags: ["activation", "negative", "format-only"],
  },
] satisfies EvalScenario[];

export default scenarios;
