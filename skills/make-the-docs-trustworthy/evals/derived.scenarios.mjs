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
    id: "we-worked-this-out-once-before",
    bundle: "make-the-docs-trustworthy",
    rule: "record-what-code-cannot-show",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "session",
    sourceNote:
      "Shape borrowed from the session corpus, where the longest genuine openings are investigations into a third party integration that nobody on the team can read off the code. The same question recurring is the corpus fact: two of the surviving openings ask the same kind of question about the same vendor months apart. Domain changed from a mobile authentication SDK to a payments gateway signature.",
    prompt:
      "we finally worked out how the gateway builds its signature and i do not want to lose it again. somebody asked the same thing in march and we did all this then too. i cannot put it in the vendor's own docs, those are theirs, and we have four wiki spaces already and nobody has ever read three of them. where does this go, and what exactly should be in it?",
    skillMode: "make-the-docs-trustworthy",
    activation: { layer: "public-skill", target: "make-the-docs-trustworthy", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Looks for where the fact already lives before choosing somewhere to put it",
      "Separates what the code or the vendor already answers from what only this investigation established",
      "Names one location and says why that one",
      "Says what it chose not to write down",
    ],
    mustNot: [
      "Writes the whole investigation down because it was expensive to produce",
      "Proposes a fifth wiki space",
      "Restates what the vendor's own documentation already says",
    ],
    tags: ["derived", "session", "recurring-question", "where-it-goes"],
  },
];

export default scenarios;
