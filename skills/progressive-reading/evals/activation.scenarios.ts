import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

const scenarios = [
  {
    id: "progressive-activation-dense-with-caveats",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "This explanation is too dense. Rewrite it so I can scan it quickly, but keep the caveats, risks, and edge cases.",
    activation: {
      layer: "public-skill",
      target: "progressive-reading",
      shouldActivate: true,
    },
    must: ["Selects readability guidance because the user explicitly asks for scannability without lost nuance"],
    mustNot: ["Treats the request as a terseness-only constraint"],
    tags: ["activation", "positive", "dense-text"],
  },
  {
    id: "progressive-activation-dyslexia-technical-preservation",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "I have dyslexia. Break the answer into short, plain-language sections while preserving every command, path, and technical warning exactly.",
    activation: {
      layer: "public-skill",
      target: "progressive-reading",
      shouldActivate: true,
    },
    must: ["Selects readability guidance for the explicit accessibility and structure request"],
    mustNot: ["Drops technical precision because simpler wording was requested"],
    tags: ["activation", "positive", "accessibility"],
  },
  {
    id: "progressive-activation-stepwise-architecture",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "router",
    difficulty: "mixed",
    prompt:
      "Explain this architecture step by step. Put the decision first, then context and exceptions, and keep the tradeoffs intact.",
    activation: {
      layer: "public-skill",
      target: "progressive-reading",
      shouldActivate: true,
    },
    must: ["Selects progressive structure because the user requests layered explanation and preserved tradeoffs"],
    mustNot: ["Reduces the request to generic summarization"],
    tags: ["activation", "positive", "step-by-step"],
  },
  {
    id: "progressive-skip-one-sentence-only",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "exception",
    difficulty: "mixed",
    prompt: "Give only the final answer in one sentence. No headings, bullets, context, or explanation.",
    activation: {
      layer: "public-skill",
      target: "progressive-reading",
      shouldActivate: false,
    },
    must: ["Leaves readability guidance unloaded because the binding request is terseness only"],
    mustNot: ["Adds progressive structure that violates the explicit output contract"],
    tags: ["activation", "negative", "terse-contract"],
  },
  {
    id: "progressive-skip-exact-json-contract",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "exception",
    difficulty: "hard",
    prompt:
      "Return exactly one JSON object matching the schema below. No Markdown, prose, headings, comments, or additional keys.",
    activation: {
      layer: "public-skill",
      target: "progressive-reading",
      shouldActivate: false,
    },
    must: ["Leaves readability guidance unloaded because the machine-readable output contract controls the response"],
    mustNot: ["Introduces prose or formatting around the JSON object"],
    tags: ["activation", "negative", "exact-output"],
  },
  {
    id: "progressive-skip-verbatim-stack-trace",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt: "Copy the stack trace verbatim. Do not explain, summarize, reflow, or reformat any line.",
    activation: {
      layer: "public-skill",
      target: "progressive-reading",
      shouldActivate: false,
    },
    must: ["Leaves readability guidance unloaded because verbatim preservation forbids rewriting"],
    mustNot: ["Reformats the quoted diagnostic for readability"],
    tags: ["activation", "negative", "verbatim"],
  },
] satisfies EvalScenario[];

export default scenarios;
