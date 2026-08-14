/**
 * Activation + routing scenarios for the make-the-docs-trustworthy skill.
 *
 * Schema matches the `EvalScenario` shape used by the sibling routing packages:
 *   id, bundle, rule, tier, mode, difficulty, prompt,
 *   expectedPrimary, expectedSecondary, activation, must, mustNot, tags
 *
 * Deviations from that shape, both additive and documented here:
 *   - plain `.mjs` instead of `.ts`, so the suite runs with bare `node` and no
 *     toolchain inside the skill directory;
 *   - `nearMiss` on negative scenarios: one sentence naming the word or shape
 *     that makes the prompt look like a match, plus the correct behaviour.
 *
 * Pointers use the skill's own relative notation (`rules/<rule>.md`), which is
 * the notation SKILL.md and INDEX.md already use, not an absolute URI scheme.
 *
 * Prompts are written in English, the way a developer actually types one:
 * lowercase, contracted, sometimes unfinished, and naming no skill, topic, or
 * rule file. Several are deliberately underspecified, because that is the shape
 * a request about written material usually arrives in.
 *
 * Coverage requirement: each of the eight rules appears as `expectedPrimary` in
 * at least one positive scenario. The suite fails if that stops being true.
 *
 * @typedef {"P0"|"P1"|"P2"} Tier
 * @typedef {"router"|"apply"|"bypass"|"exception"|"complexity"|"simplification"} Mode
 * @typedef {"obvious"|"mixed"|"hard"} Difficulty
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "where-does-this-fact-go-two-candidate-pages",
    bundle: "make-the-docs-trustworthy",
    rule: "one-place-for-a-fact",
    tier: "P0",
    mode: "router",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "obvious",
    prompt:
      "where do I put the note about the export job having to finish before the nightly rollup starts? there's an onboarding guide and a troubleshooting page and I keep going back and forth",
    expectedPrimary: "rules/one-place-for-a-fact.md",
    expectedSecondary: ["rules/match-the-existing-shape.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Searches the existing written material for the fact's distinctive tokens before writing it anywhere",
      "Picks the destination by who reads it first at the moment the fact matters, and names that page",
      "Leaves at most one orienting sentence in the second page and a link to the first for the rest",
      "Labels the change it made and gives the path it touched",
    ],
    mustNot: [
      "Writes the fact into both pages so each one reads standalone",
      "Creates a third page to answer a question one search would have answered",
    ],
    tags: ["activation", "positive", "placement", "duplication"],
  },
  {
    id: "two-pages-disagree-about-the-same-number",
    bundle: "make-the-docs-trustworthy",
    rule: "one-place-for-a-fact",
    tier: "P0",
    mode: "apply",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "hard",
    prompt:
      "two of our pages give different session timeouts, one says thirty minutes and the other says an hour. can you just make them agree",
    expectedPrimary: "rules/one-place-for-a-fact.md",
    expectedSecondary: ["rules/staleness-without-a-diff.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Resolves both numbers against the running system before writing either one down",
      "Names the artifact that settled which number is right",
      "Removes the losing copy in the same change and points that location at the surviving one",
      "Re-runs the search on the distinctive token afterwards and reports how many statements remain",
    ],
    mustNot: [
      "Merges the two wordings into a third sentence without checking either against the system",
      "Keeps both pages as they are and adds a cross-reference between them",
      "Leaves a second copy of the number standing anywhere in the material",
    ],
    tags: ["activation", "positive", "duplication", "conflict"],
  },
  {
    id: "config-table-copied-out-of-the-config-file",
    bundle: "make-the-docs-trustworthy",
    rule: "restatement-is-drift",
    tier: "P0",
    mode: "router",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "mixed",
    prompt:
      "the setup page has this huge table of every setting and its default. we forget to update it every single time someone adds one. what should we actually do with it",
    expectedPrimary: "rules/restatement-is-drift.md",
    expectedSecondary: ["rules/one-place-for-a-fact.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Replaces the copied table with the exact path or command that produces the same values",
      "Keeps only the sentences the table carried that the settings file itself cannot show, such as an ordering or a trap",
      "Compares each retained value against the file it came from and drops the ones that match exactly",
      "Checks whether adding one more setting would force another edit to the page, and says so",
    ],
    mustNot: [
      "Rewrites the table with today's values so it is correct again",
      "Adds a note asking future authors to remember to keep the table in sync",
    ],
    tags: ["activation", "positive", "artifact-duplication"],
  },
  {
    id: "help-output-pasted-under-a-usage-heading",
    bundle: "make-the-docs-trustworthy",
    rule: "restatement-is-drift",
    tier: "P1",
    mode: "apply",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "hard",
    prompt:
      "someone pasted the tool's help text under a usage heading in the guide and half the flags don't exist anymore. fix the guide please",
    expectedPrimary: "rules/restatement-is-drift.md",
    expectedSecondary: ["rules/staleness-without-a-diff.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Replaces the pasted block with the command that prints it, rather than correcting the block",
      "Adds at most one sentence naming what the reader should look for in that output",
      "Runs the named command to confirm it yields what the pointer promises",
      "Says plainly if the help text is too poor to stand alone, instead of compensating for it in prose",
    ],
    mustNot: [
      "Pastes the current help output back in so the guide matches again",
      "Hand-edits the flag list inside the block instead of pointing at the source",
    ],
    tags: ["activation", "positive", "artifact-duplication", "generated-block"],
  },
  {
    id: "readme-describes-a-signup-flow-that-changed",
    bundle: "make-the-docs-trustworthy",
    rule: "staleness-without-a-diff",
    tier: "P0",
    mode: "router",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "obvious",
    prompt:
      "readme still describes the old two-step signup, nobody's touched it in ages",
    expectedPrimary: "rules/staleness-without-a-diff.md",
    expectedSecondary: ["rules/one-place-for-a-fact.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Checks the described flow against the system as it stands now, one sentence at a time, before editing anything",
      "Reports each sentence as confirmed or refuted and names the file, line, or command output that settled it",
      "States explicitly which parts were checked and found sound",
      "Searches the old wording across the rest of the written material, not only the file that was named",
    ],
    mustNot: [
      "Rewrites the page because it reads old, naming nothing that disproves it",
      "Treats how long the file has gone untouched as evidence about what it says",
    ],
    tags: ["activation", "positive", "staleness", "underspecified"],
  },
  {
    id: "someone-said-half-the-setup-guide-is-wrong",
    bundle: "make-the-docs-trustworthy",
    rule: "staleness-without-a-diff",
    tier: "P0",
    mode: "apply",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "hard",
    prompt:
      "someone mentioned in passing that half the setup guide is wrong now. no idea which half. can you go through it",
    expectedPrimary: "rules/staleness-without-a-diff.md",
    expectedSecondary: ["rules/restatement-is-drift.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Breaks the vague report into individual checkable sentences before touching the file",
      "Runs each command the page names and opens each path it cites, recording what came back",
      "Reports refutations as explicitly as confirmations, so the same doubt does not return next month",
      "Counts claims received against claims resolved and shows both numbers",
    ],
    mustNot: [
      "Edits paragraphs on suspicion without naming what disproves them",
      "Returns a single verdict for the whole page instead of per-sentence results",
    ],
    tags: ["activation", "positive", "staleness", "no-anchor"],
  },
  {
    id: "contributing-file-turned-into-a-dumping-ground",
    bundle: "make-the-docs-trustworthy",
    rule: "one-artifact-one-job",
    tier: "P1",
    mode: "complexity",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "mixed",
    prompt:
      "the contributing file has become a dumping ground, env setup, release steps, a glossary, some notes from a meeting two years ago. it's enormous and nobody reads it",
    expectedPrimary: "rules/one-artifact-one-job.md",
    expectedSecondary: ["rules/match-the-existing-shape.md", "rules/one-place-for-a-fact.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Writes the file's job as one line first and shows where it needs an 'and'",
      "Names the destination for each displaced section before cutting anything out",
      "Moves inbound links along with the content and leaves no copy at the origin",
      "Deletes content that has no audience anywhere instead of finding it a new home",
      "Says the one line for every file it touched, with no 'misc' and no trailing 'etc'",
    ],
    mustNot: [
      "Splits the file by length into a part one and a part two",
      "Leaves a stub at the origin that repeats the opening of what moved",
    ],
    tags: ["activation", "positive", "cohesion", "bloat"],
  },
  {
    id: "convention-justified-only-by-a-machine-written-page",
    bundle: "make-the-docs-trustworthy",
    rule: "unreviewed-prose",
    tier: "P0",
    mode: "router",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "hard",
    prompt:
      "someone told me we always retry writes twice and pointed me at a page in the docs folder. that page looks like it was churned out by a tool and nobody signed off on it. do I follow it or not",
    expectedPrimary: "rules/unreviewed-prose.md",
    expectedSecondary: ["rules/staleness-without-a-diff.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Establishes who wrote or approved the page before letting it justify anything",
      "Re-derives the retry claim from the running code, or labels the citation unreviewed in the answer",
      "Traces the page back toward its origin and reports where the chain terminates",
      "Marks generated material as generated on the page itself if it is not already marked",
    ],
    mustNot: [
      "Treats the page as settled convention because it is written down and reads confidently",
      "Counts other pages descending from the same generated original as corroboration",
    ],
    tags: ["activation", "positive", "provenance", "trust"],
  },
  {
    id: "just-decided-to-stay-synchronous-write-it-down",
    bundle: "make-the-docs-trustworthy",
    rule: "record-what-code-cannot-show",
    tier: "P0",
    mode: "router",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "mixed",
    prompt:
      "we just settled on keeping this call synchronous instead of queueing it, because the system on the other end caps us at one request a second. want to get that down somewhere before I forget why",
    expectedPrimary: "rules/record-what-code-cannot-show.md",
    expectedSecondary: ["rules/match-the-existing-shape.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Writes the record now, alongside the code it explains, rather than deferring it to a later pass",
      "Names the rejected alternative and the condition that would reopen it",
      "States what was not decided, so open ground is not read as closed",
      "Keeps the external limit concrete: the number and the system that imposes it",
    ],
    mustNot: [
      "Produces a record that lists the benefits of the chosen path and names nothing rejected",
      "Leaves the reasoning in the change description where no later reader looks for it",
      "Writes down a constraint the code already makes visible at the call site",
    ],
    tags: ["activation", "positive", "rationale", "first-record"],
  },
  {
    id: "retry-ownership-flipped-old-record-says-otherwise",
    bundle: "make-the-docs-trustworthy",
    rule: "supersede-or-delete",
    tier: "P0",
    mode: "apply",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "hard",
    prompt:
      "we flipped who owns retries, used to be the caller, now it's the gateway doing it. there's a write-up from last year saying the opposite. go update it",
    expectedPrimary: "rules/supersede-or-delete.md",
    expectedSecondary: ["rules/record-what-code-cannot-show.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Writes a new record that names the one it replaces, and leaves the original where it was",
      "Adds a forward pointer and a status to the older record without changing what it says",
      "States what changed since, the constraint that lifted or the measurement that arrived, not only the new answer",
      "Walks the chain afterwards and confirms only one record claims to be current",
    ],
    mustNot: [
      "Edits the old record's conclusion in place and keeps its original date",
      "Deletes the old record because its answer is no longer the answer",
    ],
    tags: ["activation", "positive", "decision-history", "supersede"],
  },
  {
    id: "new-page-dropped-into-a-numbered-folder",
    bundle: "make-the-docs-trustworthy",
    rule: "match-the-existing-shape",
    tier: "P1",
    mode: "apply",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "mixed",
    prompt:
      "need to add a page for the new queue thing. there's already a folder with a bunch of numbered files in it, just drop it in there",
    expectedPrimary: "rules/match-the-existing-shape.md",
    expectedSecondary: ["rules/one-place-for-a-fact.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Opens two or three neighbouring files first and states the scheme they follow",
      "Continues the numbering, zero padding, separators, frontmatter keys and heading depth already in use",
      "Reports both paths when existing files contradict each other about their own scheme, and picks nothing silently",
      "Lists the directory afterwards and shows the new entry sorting and reading like its neighbours",
    ],
    mustNot: [
      "Starts a second numbering series because the existing one looked untidy",
      "Introduces a new file extension or a new frontmatter shape for the set",
    ],
    tags: ["activation", "positive", "local-consistency", "new-file"],
  },
  {
    id: "legacy-importer-removed-pages-still-describe-it",
    bundle: "make-the-docs-trustworthy",
    rule: "supersede-or-delete",
    tier: "P1",
    mode: "simplification",
    skillMode: "make-the-docs-trustworthy",
    difficulty: "hard",
    prompt:
      "we ripped the old importer out last week. there's a whole how-to page for it, a few other pages that mention it in passing, and I think an old write-up about why we built it that way. clean it up",
    expectedPrimary: "rules/supersede-or-delete.md",
    expectedSecondary: ["rules/staleness-without-a-diff.md", "rules/one-artifact-one-job.md"],
    activation: {
      layer: "internal-route",
      target: "make-the-docs-trustworthy",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Removes the how-to whose subject no longer exists, together with the passing mentions",
      "Searches the removed name across all written material rather than only the pages the user listed",
      "Keeps the write-up explaining why it was built that way, marked as replaced and still findable where it was",
      "States explicitly what was left alone and why it was left",
    ],
    mustNot: [
      "Deletes the record of why the thing was built, destroying the evidence that it was once the right call",
      "Leaves instructions anywhere that still tell a reader to use the removed thing",
    ],
    tags: ["activation", "positive", "removal", "decision-history"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "skip-review-my-branch-and-flag-stale-docs",
    bundle: "make-the-docs-trustworthy",
    rule: "activation-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "go over my branch before I put it up. mainly I want to know whether anything I changed leaves the written stuff saying something that isn't true anymore. just tell me, don't touch it",
    nearMiss:
      "Every noun matches, written material, out of date, judgement about prose, and it is the single collision this frame will hit most often; but a diff supplies the anchor, the ask is read-only judgement on a change, and the result is reported as a finding rather than applied, which is a change review's job.",
    activation: {
      layer: "public-skill",
      target: "make-the-docs-trustworthy",
      shouldActivate: false,
      forbiddenRoutes: ["rules/staleness-without-a-diff.md"],
    },
    must: [
      "Resolves a base point, reads the range, and reports the contradicted prose as a finding against the change",
      "Leaves every file on disk exactly as it found it",
      "Cites both sides of each finding: the line of prose and the changed line that disproves it",
    ],
    mustNot: [
      "Edits the written material instead of reporting it",
      "Resolves the claim against the current system as though there were no change to anchor to",
    ],
    tags: ["activation", "negative", "collision", "change-review"],
  },
  {
    id: "skip-explain-what-this-design-note-means",
    bundle: "make-the-docs-trustworthy",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "what does this design note actually mean where it says the writes are eventual? I'm not changing anything, I just want to understand what they were getting at",
    nearMiss:
      "Points straight at a written record and asks for a careful reading of it, which is the shape of every request this frame handles; but nothing is asserted wrong, nothing is being written, and there is no change of any class to make.",
    activation: {
      layer: "public-skill",
      target: "make-the-docs-trustworthy",
      shouldActivate: false,
    },
    must: [
      "Explains the passage from its own text and the surrounding context",
      "Says plainly when the note is ambiguous, rather than resolving the ambiguity by editing",
      "Distinguishes what the note states from what the system does today, if the two differ",
    ],
    mustNot: [
      "Opens a resolution pass over the note's claims",
      "Rewrites the wording to make it clearer",
    ],
    tags: ["activation", "negative", "reading-not-changing"],
  },
  {
    id: "skip-look-up-third-party-configuration",
    bundle: "make-the-docs-trustworthy",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "mixed",
    prompt:
      "how do I turn on connection pooling in this database driver? their docs cover it somewhere, I just can't find the right page",
    nearMiss:
      "It is a documentation question, phrased as one, and about configuration values, the exact vocabulary of the pointer-versus-copy axis; but the prose belongs to somebody else, nothing here is being created, corrected or moved, and none of it is this repository's to maintain.",
    activation: {
      layer: "public-skill",
      target: "make-the-docs-trustworthy",
      shouldActivate: false,
    },
    must: [
      "Answers from the third party's current documentation and names the section it came from",
      "Gives the configuration answer directly rather than a plan for recording it",
      "Says which version the answer applies to, or that the version is unknown",
    ],
    mustNot: [
      "Writes the answer into this repository's written material as a side effect",
      "Treats the external page as a record that needs correcting",
    ],
    tags: ["activation", "negative", "external-docs"],
  },
  {
    id: "skip-write-the-customer-announcement",
    bundle: "make-the-docs-trustworthy",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "write the announcement for the new billing screen, goes out to customers next week. keep it short and warm, nothing technical",
    nearMiss:
      "Brand-new prose is being written from nothing, and it will restate facts that already live in the internal material, which is exactly the situation the placement machinery exists for; but outbound copy for an outside audience is not a record of anything, has no home in the repository, and is meant to be a full standalone copy.",
    activation: {
      layer: "public-skill",
      target: "make-the-docs-trustworthy",
      shouldActivate: false,
      forbiddenRoutes: ["rules/one-place-for-a-fact.md"],
    },
    must: [
      "Drafts the announcement copy at the stated length and tone for the stated audience",
      "Keeps the copy self-contained, since its readers cannot open the internal material",
      "Hands the draft back for the user to send rather than publishing it anywhere",
    ],
    mustNot: [
      "Searches the repository for an existing home to file the announcement under",
      "Refuses to restate an internal fact in the copy on the grounds that it is already written somewhere",
    ],
    tags: ["activation", "negative", "new-prose", "collision"],
  },
  {
    id: "skip-split-a-module-that-does-too-much",
    bundle: "make-the-docs-trustworthy",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "this module is doing way too much, parsing, validation and the retry loop all crammed into one file. can you break it apart",
    nearMiss:
      "Word for word the cohesion complaint, one file carrying several jobs, too big, nobody can say what it is for, so it pulls hard on the artifact axis; but the file is source code, and this frame governs written material only, where the risks are drift and lost provenance rather than behaviour.",
    activation: {
      layer: "public-skill",
      target: "make-the-docs-trustworthy",
      shouldActivate: false,
      forbiddenRoutes: ["rules/one-artifact-one-job.md"],
    },
    must: [
      "Treats the request as a code refactor and preserves the module's behaviour",
      "Verifies the split with the repository's own tests before calling it done",
      "Names each new file and what moved into it, in code terms rather than as documents",
    ],
    mustNot: [
      "Applies a written-material placement pass to source files",
      "Reports on the repository's prose instead of splitting the module",
    ],
    tags: ["activation", "negative", "code-not-prose", "collision"],
  },
];

export default scenarios;
