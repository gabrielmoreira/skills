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
    id: "we-agreed-the-order-of-this",
    bundle: "keep-the-thread-across-boundaries",
    rule: "trigger-boundary",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "pr-review",
    sourceNote:
      "A should-fix review comment marked humano-judgment: a reviewer citing a plan agreed before the work started, that the two implementations would run duplicated until it was clear what was genuinely common, and only then be generalised. The pull request had generalised first. Domain changed from two backend services to two import adapters, and the agreement moved from a meeting to a paragraph in a design note.",
    prompt:
      "before you start on the csv and the fixed-width importers, read the second half of docs/design/import-notes.md. we settled the order there in june and i do not want to relitigate it. build both of them out, and do not pull anything shared out until we have both working end to end. i cannot get the team back together this month if we get this wrong. where do you want to start?",
    skillMode: "thread",
    activation: { layer: "public-skill", target: "keep-the-thread-across-boundaries", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Reads the named section and says back what was settled, in its own words",
      "Names the constraint it is now working under before writing anything",
      "Says what it would do if the two importers turn out to share more than expected",
      "Keeps the agreement available for the rest of the work rather than answering once",
    ],
    mustNot: [
      "Proposes a shared abstraction in its first answer",
      "Treats the design note as background and starts from the code",
      "Reopens the ordering because it can see a tidier structure",
    ],
    tags: ["derived", "pr-review", "recorded-decision", "premature-abstraction"],
  },
];

export default scenarios;
