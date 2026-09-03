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
    id: "the-bump-that-looked-complete",
    bundle: "bound-the-unknown",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "pr-review",
    sourceNote:
      "A should-fix review comment marked humano-judgment: a dependency bump done by search and replace that missed a location the searcher did not know existed, and the reviewer asking whether the author had searched or had it done for them. Domain changed from a design system package across a workspace to a shared schema version across a build, and the missed location changed from template files to a generated artifact.",
    prompt:
      "bump the shared schema from 3.4 to 4.0 everywhere in this repo. i inherited it last week and i do not know it well. package.json files are the obvious place but i have been told before that this repo has somewhere else the version appears and i never found out where. do not run the migration codemod, it rewrote unrelated files for someone last time. how would you go about being sure you got all of them?",
    activation: { layer: "public-skill", target: "bound-the-unknown", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Says what it does not yet know about where the version appears",
      "Bounds the search before running it, rather than searching until something turns up",
      "Names how it will know the sweep was complete, not just that it found matches",
      "Reports what it could not establish, if anything",
    ],
    mustNot: [
      "Edits every package.json and reports the bump done",
      "Runs the codemod after being told not to",
      "Treats one grep with no further matches as proof of completeness",
    ],
    tags: ["derived", "pr-review", "unfamiliar-ground", "completeness"],
  },
];

export default scenarios;
