import type { EvalScenario } from "../../typescript-skills/evals/evals.types.ts";

const scenarios = [
  {
    id: "progressive-reading-dense-explanation-preserves-nuance",
    bundle: "progressive-reading",
    rule: "core-rules",
    tier: "P0",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "Rewrite this explanation to make it much easier to read, but do not make it shallow: 'We use a write-behind cache because direct synchronous writes would push tail latency above our SLO during burst traffic, but that choice also means reads can observe stale state briefly, so the API must document read-after-write limitations and the worker needs bounded retries plus dead-letter handling.'",
    expectedPrimary: "progressive-reading",
    must: [
      "Keeps the main explanation easier to enter and scan instead of replying with one dense paragraph",
      "Preserves the key tradeoff that write-behind improves latency but can expose stale reads",
      "Preserves important operational nuance such as bounded retries or dead-letter handling instead of flattening them away",
      "Uses simple structure such as short paragraphs or clear headings without turning the answer into empty bullet spam"
    ],
    mustNot: [
      "Reduces the answer to a much shorter but materially less accurate summary",
      "Drops the stale-read tradeoff or the reliability constraints on the worker",
      "Turns the answer into a wall of bullets with no connective explanation"
    ],
    tags: ["readability", "rewrite", "nuance", "p0"]
  },
  {
    id: "progressive-reading-clearer-not-shorter",
    bundle: "progressive-reading",
    rule: "detail-handling",
    tier: "P1",
    mode: "router",
    difficulty: "obvious",
    prompt:
      "The answer is technically right, but it feels too dense and hard to get into. Please explain it more clearly without removing the important details or caveats.",
    expectedPrimary: "progressive-reading",
    must: [
      "Recognizes the request as a readability and structure request rather than a brevity-only request",
      "Keeps room for important caveats or nuance instead of defaulting to a very short answer",
      "Improves scanability with chunking, headings, or short paragraphs"
    ],
    mustNot: [
      "Collapses the request into only 'be brief' or 'summarize more'",
      "Treats detail preservation as optional when the user explicitly asked to keep it"
    ],
    tags: ["trigger", "clearer", "not-shorter"]
  },
  {
    id: "progressive-reading-ascii-diagram-only-when-helpful",
    bundle: "progressive-reading",
    rule: "ascii-diagrams",
    tier: "P1",
    mode: "apply",
    difficulty: "mixed",
    prompt:
      "I'm trying to understand how a request flows through API gateway, auth middleware, handler, queue, and worker. Please make the explanation easier to follow. If a small diagram helps, use one.",
    expectedPrimary: "progressive-reading",
    must: [
      "Makes the flow easier to follow with progressive structure",
      "Uses a small ASCII diagram only if it materially clarifies the flow, or explicitly chooses not to if plain structure is enough",
      "Keeps the diagram simple rather than decorative"
    ],
    mustNot: [
      "Uses an oversized decorative diagram that adds noise instead of clarity",
      "Ignores the flow-clarification request and leaves the explanation dense"
    ],
    tags: ["ascii", "flow", "diagram"]
  },
  {
    id: "progressive-reading-does-not-steal-terse-only-requests",
    bundle: "progressive-reading",
    rule: "trigger-boundary",
    tier: "P1",
    mode: "exception",
    difficulty: "mixed",
    prompt:
      "Give me the shortest possible answer. I only need the quick version.",
    expectedPrimary: "progressive-reading",
    must: [
      "If it mentions the skill at all, it distinguishes progressive readability from pure terseness",
      "Does not reinterpret a terse-only request as permission to add extra structure or detail-heavy explanation"
    ],
    mustNot: [
      "Claims progressive reading is primarily about making answers longer",
      "Treats terse-only requests as the main trigger for this skill"
    ],
    tags: ["negative-trigger", "brevity-boundary"]
  }
] satisfies EvalScenario[];

export default scenarios;
