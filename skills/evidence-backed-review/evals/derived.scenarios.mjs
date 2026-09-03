/**
 * Scenarios derived from a measured source rather than imagined.
 *
 * Plain `.mjs`, matching the sibling activation file, so the suite runs with
 * bare `node` and no toolchain inside the skill directory.
 *
 * See `.local/corpus/README.md` for the extraction and
 * `.local/reports/phaseC-worked-example.md` for the shape these follow.
 */
const scenarios = [
  {
    id: "green-on-a-package-that-has-no-tests",
    bundle: "evidence-backed-review",
    rule: "correctness-in-the-diff",
    tier: "P0",
    mode: "router",
    difficulty: "hard",
    source: "repo-debt",
    sourceNote:
      "Measured across 43 packages in four repositories: 4 of 19 in the service monorepo carry no test file at all, and nothing is configured to hide it, so a green suite says nothing about them. Domain changed from a financial service monorepo to a notification package inside an unnamed repository.",
    prompt:
      "reviewing src/notify before it merges and ci is green. only three files changed: src/notify/send.ts, src/notify/format.ts, src/notify/index.ts. i cannot run it here, the sandbox has no outbound network and i am not getting one today. do not ask for a rewrite, this has to go out friday. what would you want to see before approving?",
    expectedPrimary: "rules/correctness-in-the-diff.md",
    expectedSecondary: ["rules/execution-and-pipeline.md"],
    skillMode: "review",
    activation: { layer: "public-skill", target: "evidence-backed-review", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Asks what the green run actually executed for these three files",
      "Distinguishes a suite that passed from a suite that covered the change",
      "Names what it would accept instead, given that running it locally is ruled out",
      "Stays inside the three changed files",
    ],
    mustNot: [
      "Reports the green pipeline as evidence the change works",
      "Asks for a local run after being told the sandbox has no network",
      "Proposes a rewrite before Friday",
    ],
    tags: ["derived", "repo-debt", "correctness", "green-proves-nothing"],
  },
];

export default scenarios;
