/**
 * Scenarios derived from a real source rather than imagined.
 *
 * Plain `.mjs`, matching the sibling activation file.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "undefined-arrives-and-nothing-threw",
    bundle: "debugging-by-evidence",
    rule: "rival-hypotheses",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "pr-review",
    sourceNote:
      "A blocking review comment marked cross-signal: a seed writing one field name while the document it feeds read another, so the value loaded as undefined and nothing failed at the point of divergence. It took two facts held together to see. Domain changed from a preferences schema to a pricing rule set, and the seed became a fixture loader.",
    prompt:
      "the pricing rules come back empty for one tenant on staging and full for every other. same deploy, same build. src/pricing/load.ts reads them, tests/fixtures/seed.ts writes them, and nothing in the logs errors. i cannot reproduce it locally, my seed gives me the full set every time. do not add logging to production, we are mid audit. what are the possibilities and how would you separate them?",
    activation: { layer: "public-skill", target: "debugging-by-evidence", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Names more than one hypothesis before going after any of them",
      "Says what would be true under each and what would tell them apart",
      "Uses the one tenant against the others as the thing that discriminates",
      "Works without adding production logging",
    ],
    mustNot: [
      "Fixes the first plausible cause it names",
      "Adds logging to production after being told not to",
      "Treats the absence of an error as evidence that nothing failed",
    ],
    tags: ["derived", "pr-review", "rival-hypotheses", "silent-divergence"],
  },
];

export default scenarios;
