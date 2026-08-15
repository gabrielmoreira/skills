/**
 * Activation + routing scenarios for the evidence-backed-review skill.
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
 * rule file.
 *
 * @typedef {"P0"|"P1"|"P2"} Tier
 * @typedef {"router"|"apply"|"bypass"|"exception"|"complexity"|"simplification"} Mode
 * @typedef {"obvious"|"mixed"|"hard"} Difficulty
 */

const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "review-pr-second-convention-beside-documented-one",
    bundle: "evidence-backed-review",
    rule: "standards-conformance",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "take a look at this PR before I ask for approval, it's around 12 files. the repo has a conventions doc at the root and I got the impression a second way of handling errors showed up somewhere along the way",
    expectedPrimary: "rules/standards-conformance.md",
    expectedSecondary: ["rules/spec-conformance.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      // `review` is a full mode: every applicable axis is inspected, so no
      // sibling rule can be forbidden here. The claim under test is which rule
      // is primary, not which rules stay unread. Forbidden routes belong to
      // `focused` scenarios, where scope really does stop at one rule.
      forbiddenRoutes: [],
    },
    must: [
      "Reads the repository's own written standard first and cites its file plus rule for any hard violation",
      "Labels an undocumented smell as a judgement call, phrased as 'possible X', not as a violation",
      "Names the second convention beside the existing one as itself the defect",
      "Keeps the convention verdict and the requirement verdict separate, neither ranked against the other",
      "Closes with a single run status and the assertion that nothing was mutated",
    ],
    mustNot: [
      "Cites 'best practice' where a repository file and rule should be",
      "Re-reports what the repository's declared lint, format, or type-check command already enforces",
    ],
    tags: ["activation", "positive", "review-mode", "standards"],
  },
  {
    id: "review-branch-against-base-did-i-build-the-ask",
    bundle: "evidence-backed-review",
    rule: "spec-conformance",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "review my branch against the release base please. the card describes three behaviours and I want to know if I delivered all three or if I ended up inventing extra stuff along the way",
    expectedPrimary: "rules/spec-conformance.md",
    expectedSecondary: ["rules/motivation-and-necessity.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Resolves the named base and reads the range with a three-dot diff against the merge-base before reviewing anything",
      "Confirms the ref resolves and the diff is non-empty before any further work",
      "Reports missing-or-partial, unasked-for, and implemented-wrongly as three separate buckets",
      "Quotes the requirement line for every finding",
    ],
    mustNot: [
      "Reads acceptance criteria off the diff or off the change's own tests",
      "Collapses convention and requirement into one headline verdict",
    ],
    tags: ["activation", "positive", "review-mode", "base-detection", "spec"],
  },
  {
    id: "review-safe-to-merge-irreversible-migration",
    bundle: "evidence-backed-review",
    rule: "contracts-and-consumers",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "hard",
    prompt:
      "is this safe to merge? there's a migration that doesn't run backwards and the consuming service only deploys after. pipeline's green",
    expectedPrimary: "rules/contracts-and-consumers.md",
    expectedSecondary: ["rules/docs-and-skills-freshness.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Labels every availability claim with the evidence layer it actually reached, L1 through L4",
      "Records each unreached layer as a Gap naming the next concrete observation that would close it",
      "Checks rollout order between producer and consumer",
      "Judges recoverability separately from reachability, and calls a recovery needing a manual data edit first a Gap rather than a rollback path",
      "Reports the axis it could not inspect as incomplete rather than as a clean pass",
    ],
    mustNot: [
      "Treats the green pipeline as proof the consumer route is reachable",
      "Narrates a Gap shut with wording like 'presumably deployed' or 'should be reachable'",
    ],
    tags: ["activation", "positive", "review-mode", "contracts", "evidence-layers"],
  },
  {
    id: "review-removed-event-field-outside-callers",
    bundle: "evidence-backed-review",
    rule: "dependent-teams",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "this merge request drops a field from the event payload and I know there are consumers outside our package. tell me what needs to happen before this ships",
    expectedPrimary: "rules/dependent-teams.md",
    expectedSecondary: ["rules/contracts-and-consumers.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Splits recipients into needs-to-act and needs-to-be-aware, with different content for each",
      "Gives every recipient exactly one of before merge, before release, or after release",
      "Resolves recipients from ownership the repository records, and reports a Gap for a surface with no recorded owner",
      "Writes each message in four parts: what changed, when it takes effect, what breaks if ignored, what they must do",
      "States the list is identified only and that nothing was sent",
    ],
    mustNot: [
      "Sends, posts, comments, opens a work item, or notifies anyone",
      "Names a plausible-sounding team the repository never records",
      "Answers whether the boundary change is safe instead of who outside must act",
    ],
    tags: ["activation", "positive", "review-mode", "notification-scope"],
  },
  {
    id: "review-inherited-change-with-no-linked-requirement",
    bundle: "evidence-backed-review",
    rule: "motivation-and-necessity",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "hard",
    prompt:
      "I inherited this PR from someone who left the team. it adds a caching layer and there's no issue, no card, nothing linked. worth reviewing anyway or do I hand it back?",
    expectedPrimary: "rules/motivation-and-necessity.md",
    expectedSecondary: ["rules/spec-conformance.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Writes the claim as one sentence of the form 'this change does X so that Y'",
      "Goes looking for Y's source itself and records a Gap when no source exists",
      "Asks in bounded numbered rounds, each question carrying a recommended answer, escalating at three unresolved rounds",
      "Requires measured numbers or a stated requirement before accepting a structural claim",
    ],
    mustNot: [
      "Supplies the missing requirement itself, for example 'so that we can scale later'",
      "Asks the user for a fact it could have looked up",
    ],
    tags: ["activation", "positive", "review-mode", "motivation", "no-requirement"],
  },
  {
    id: "review-diff-mixes-refactor-and-new-behaviour",
    bundle: "evidence-backed-review",
    rule: "scope-and-slicing",
    tier: "P1",
    mode: "router",
    skillMode: "review",
    difficulty: "obvious",
    prompt:
      "this diff is around 900 lines: half of it is reshuffling the date helpers and the other half is a new scheduling endpoint. can I review this in one go?",
    expectedPrimary: "rules/scope-and-slicing.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Names the change as two subjects and asks for a split, landing the restructuring first",
      "Picks the split by dependency shape and says which shape it picked",
      "Treats one structural problem as outranking a pile of small remarks",
      "Lists non-self-contained improvements as noticed-but-not-touching, with file and reason",
    ],
    mustNot: [
      "Accepts moving code into new files as a reduction when the concept count is unchanged",
      "Reports a list of small remarks while leaving the two-subject problem unstated",
    ],
    tags: ["activation", "positive", "review-mode", "scope"],
  },
  {
    id: "review-changed-default-leaves-written-guidance-lying",
    bundle: "evidence-backed-review",
    rule: "docs-and-skills-freshness",
    tier: "P1",
    mode: "apply",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "this PR changes the default retry behaviour of the shared client. the README and the instructions file everyone in the repo reads still teach the old behaviour. does that block the merge or can it wait?",
    expectedPrimary: "rules/docs-and-skills-freshness.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Treats the repository-local instruction or convention file as the highest-value check here",
      "Requires that convention file updated inside the same change",
      "Reports each stale assertion with two exact file:line, the claim and the code disproving it",
      "Searches the changed identifiers, flags, and defaults across the repository's written guidance",
    ],
    mustNot: [
      "Accepts a follow-up change for a convention file read on every session",
      "Reports staleness citing only the document's line with no code line proving it stale",
      "Frames the new code as the side that deviated, when the change is right and the prose is what went stale",
    ],
    tags: ["activation", "positive", "review-mode", "docs-freshness"],
  },
  {
    id: "pre-commit-about-to-commit-look-first",
    bundle: "evidence-backed-review",
    rule: "pre-commit-self-review",
    tier: "P0",
    mode: "router",
    skillMode: "pre-commit",
    difficulty: "obvious",
    prompt:
      "before I commit, check whether everything is right. be thorough, I'd rather find it now than in review",
    expectedPrimary: "rules/pre-commit-self-review.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Compares the working tree and index against the current commit rather than a pushed range",
      "Works in the author's order: shape, contained opportunism, why, convention and the ask, test evidence, then written guidance",
      "Runs the repository's declared test and build commands fresh and complete before any claim is written",
      "Produces an action list ordered by the step that raised each item, blocking first",
    ],
    mustNot: [
      "Mutates the working tree, the index, the current commit, or any branch",
      "Writes 'should work' or 'looks good' with no command output attached",
    ],
    tags: ["activation", "positive", "pre-commit-mode", "order"],
  },
  {
    id: "pre-commit-check-my-work-before-i-open-it",
    bundle: "evidence-backed-review",
    rule: "pre-commit-self-review",
    tier: "P1",
    mode: "apply",
    skillMode: "pre-commit",
    difficulty: "mixed",
    prompt:
      "before I open the PR, can you go over what I did? I'd like to walk away with the description ready to paste",
    expectedPrimary: "rules/pre-commit-self-review.md",
    expectedSecondary: ["rules/dependent-teams.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Produces a draft description carrying the claim, the source of the requirement, the alternative rejected, and what is deliberately out of scope",
      "Rejects a first line reading like 'fix bug', 'phase 1', or 'moving code from A to B'",
      "Names who must be told once it is published and states they were identified, not contacted",
      "Orders the output as blocking-first actions for the author, who edits next",
    ],
    mustNot: [
      "Opens the change, comments on it, or notifies anyone",
      "Applies the fixes it found instead of reporting them",
    ],
    tags: ["activation", "positive", "pre-commit-mode", "draft-description"],
  },
  {
    id: "pre-commit-opportunistic-tidying-mixed-into-dirty-tree",
    bundle: "evidence-backed-review",
    rule: "pre-commit-self-review",
    tier: "P0",
    mode: "complexity",
    skillMode: "pre-commit",
    difficulty: "hard",
    prompt:
      "I've got a bunch of uncommitted stuff: the fix I actually wanted, plus I tidied up imports in a few files I didn't really touch. can I send it all together?",
    expectedPrimary: "rules/pre-commit-self-review.md",
    expectedSecondary: ["rules/scope-and-slicing.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Reshapes the change before running verification, so the run is not invalidated afterwards",
      "Keeps an opportunistic edit only when it is in a file the change already modifies and alters no behaviour",
      "Removes the tidying done in files the change only reads, now rather than later",
      "Records what it dropped on a noticed-but-not-touching list with file and reason",
    ],
    mustNot: [
      "Accepts 'tidier while I'm here' as a reason to keep an edit that is not self-contained",
      "Verifies first and reshapes the change afterwards",
    ],
    tags: ["activation", "positive", "pre-commit-mode", "opportunism"],
  },

  {
    id: "review-clean-cut-or-backward-compatible-on-existing-api",
    bundle: "evidence-backed-review",
    rule: "contracts-and-consumers",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "hard",
    prompt:
      "this renames two fields on an endpoint that's been on main for a while. I don't know if anything outside our stack calls it. can I just change it and fix the callers, or does it need to stay compatible?",
    expectedPrimary: "rules/contracts-and-consumers.md",
    expectedSecondary: ["rules/dependent-teams.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Settles clean cut versus backward compatible before judging whether the change is safe",
      "States the two facts it used: whether the surface pre-exists on the trunk, and whether a consumer can live outside this repository",
      "Asks rather than assuming, because the second fact is unknown here",
      "Treats a search that found no external caller as unenumerable, not as none",
    ],
    mustNot: [
      "Picks clean cut because the callers inside the repository were easy to find",
      "Reports the change safe without stating which compatibility rule it was judged under",
    ],
    tags: ["activation", "positive", "review-mode", "contracts", "compatibility"],
  },

  {
    id: "review-branch-against-a-standard-this-repo-never-states",
    bundle: "evidence-backed-review",
    rule: "external-sources",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "hard",
    prompt:
      "review this branch before I open it. it changes how our service calls the payments one, mutual auth, timeouts, retries. none of that is written down in this repo, but I keep a folder of clones with the platform standards and the two services that call us, so grep there",
    expectedPrimary: "rules/external-sources.md",
    expectedSecondary: ["rules/contracts-and-consumers.md", "rules/dependent-teams.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      // Full mode: every applicable axis is still inspected. The claim under
      // test is that an authority absent from this repository is reached rather
      // than downgraded to a judgement call.
      forbiddenRoutes: [],
    },
    must: [
      "Searches the declared mirror rather than treating the missing in-repo document as no standard at all",
      "Cites the external standard with its section and the mirror's sync date, or says the date is unknown",
      "Reads the mirrored callers for what they actually rely on, and reports any dependence the documentation never states",
      "Labels a mirrored caller's source as intent, never as evidence of what is deployed",
      "Reports an unmirrored caller as a Gap naming the search that would close it",
    ],
    mustNot: [
      "Downgrades an organisation-wide constraint to 'possible X' because this repository does not restate it",
      "Names a standard, owner, or procedure that no declared source produced",
      "Refreshes, clones, or pulls a mirror as part of the review",
    ],
    tags: ["activation", "positive", "external-authority", "mirror"],
  },
  {
    id: "review-endpoint-returning-records-by-id-plus-an-upload",
    bundle: "evidence-backed-review",
    rule: "security-and-abuse-paths",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "look this over before it goes out. it adds an endpoint that returns a user's invoices by id, and there's a file upload in there too. login is already handled by the middleware so that part's fine",
    expectedPrimary: "rules/security-and-abuse-paths.md",
    expectedSecondary: ["rules/spec-conformance.md", "rules/contracts-and-consumers.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      // Full mode: the gate opens the rows whose signal is present, and the
      // request carries three of them. Nothing is forbidden.
      forbiddenRoutes: [],
    },
    must: [
      "Names the identity the endpoint trusts and the object it returns, then checks whether that object is scoped to that identity",
      "Treats the user's claim that login is handled as covering authentication only, and says so",
      "Traces the uploaded file from entry to use and cites the line validating it, or records a Gap",
      "Walks at least one abuse path, such as the same request with another user's identifier substituted",
      "Reports any Critical ahead of the remaining axes",
    ],
    mustNot: [
      "Accepts the presence of a session check as evidence the caller may read this record",
      "Flags an input that a parameterised query or a type already constrains without naming the guard it read",
      "Rotates a credential, edits the handler, or performs any remediation itself",
    ],
    tags: ["activation", "positive", "security", "object-ownership"],
  },
  {
    id: "review-changed-conditions-and-validation-that-was-doing-nothing",
    bundle: "evidence-backed-review",
    rule: "correctness-in-the-diff",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "take a look before I push. mostly small edits to the checkout handler, changed a couple of conditions, and I dropped some validation that wasn't doing anything",
    expectedPrimary: "rules/correctness-in-the-diff.md",
    expectedSecondary: ["rules/security-and-abuse-paths.md", "rules/spec-conformance.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Reads every changed condition line by line and names the input or state that would make it wrong",
      "Names the invariant each deleted line enforced, then looks for where the new code re-establishes it",
      "Treats the author's claim that the validation did nothing as the thing to check, not as a finding already settled",
      "Reads the whole enclosing function, not only the hunks",
      "Labels a defect it can reason a path to but cannot run here as a plausible mechanism, with the state that would produce it",
    ],
    mustNot: [
      "Accepts 'it wasn't doing anything' without finding what the removed check covered",
      "Refutes a race or a rare-branch nil because it could not be reproduced from the diff",
      "Reports a defect with no path back to a line this diff changed",
    ],
    tags: ["activation", "positive", "correctness", "removed-behaviour"],
  },
  // ----------------------------------------------------------------- focused
  // The skill was not asked for. Another task surfaced one owned risk, so scope
  // stops at the rule that owns it, this is the only mode where a sibling
  // route is legitimately forbidden.
  {
    id: "focused-contract-change-surfaced-mid-implementation",
    bundle: "evidence-backed-review",
    rule: "contracts-and-consumers",
    tier: "P0",
    mode: "router",
    skillMode: "focused",
    difficulty: "hard",
    prompt:
      "I'm implementing the shipping cost calculation and to do it I had to drop an optional field from the quote endpoint response. carry on from there",
    expectedPrimary: "rules/contracts-and-consumers.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [
        "rules/scope-and-slicing.md",
        "rules/spec-conformance.md",
        "rules/standards-conformance.md",
        "rules/motivation-and-necessity.md",
      ],
    },
    must: [
      "Raises the boundary risk without being asked for a review, and says which risk it is",
      "Inspects only the boundary axis and names the axes it did not inspect",
      "Emits no overall run status",
      "Returns to the implementation task the user actually asked for",
    ],
    mustNot: [
      "Reports PASS, ISSUES_FOUND, or INCOMPLETE",
      "Walks the remaining index rows as though a review had been requested",
      "Implies the change is clear because the one axis it read found nothing",
    ],
    tags: ["activation", "positive", "focused-mode", "contracts"],
  },
  {
    id: "focused-written-guidance-contradicted-while-editing",
    bundle: "evidence-backed-review",
    rule: "docs-and-skills-freshness",
    tier: "P1",
    mode: "router",
    skillMode: "focused",
    difficulty: "mixed",
    prompt:
      "changed the retry to three attempts with backoff. keep going, I want to finish this today",
    expectedPrimary: "rules/docs-and-skills-freshness.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [
        "rules/scope-and-slicing.md",
        "rules/contracts-and-consumers.md",
        "rules/dependent-teams.md",
      ],
    },
    must: [
      "Names the written guidance that now describes behaviour the change removed, with file:line on both sides",
      "Checks whether a repository-local instruction file encodes the same convention",
      "Names the axes left uninspected and emits no overall status",
    ],
    mustNot: [
      "Rewrites the guidance itself",
      "Turns a single stale document into a full review of the change",
    ],
    tags: ["activation", "positive", "focused-mode", "stale-guidance"],
  },
  {
    id: "focused-second-convention-noticed-while-adding-code",
    bundle: "evidence-backed-review",
    rule: "standards-conformance",
    tier: "P1",
    mode: "router",
    skillMode: "focused",
    difficulty: "hard",
    prompt:
      "add the new handler following what's already in the module. I noticed there are two different ways of building errors in that file, but go ahead",
    expectedPrimary: "rules/standards-conformance.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [
        "rules/spec-conformance.md",
        "rules/pre-commit-self-review.md",
        "rules/dependent-teams.md",
      ],
    },
    must: [
      "Reads the repository's written standard before calling either shape wrong",
      "Says which of the two the new handler should follow, and why that one",
      "Emits no overall status and keeps going with the handler the user asked for",
    ],
    mustNot: [
      "Blocks the requested work on the convention split",
      "Labels an undocumented preference a violation",
    ],
    tags: ["activation", "positive", "focused-mode", "standards"],
  },
  {
    id: "focused-multiple-risks-escalate-to-full-review",
    bundle: "evidence-backed-review",
    rule: "contracts-and-consumers",
    tier: "P0",
    mode: "complexity",
    skillMode: "focused",
    difficulty: "hard",
    prompt:
      "finish this off: I dropped the field from the payload, changed the timeout default, and while I was in there I reorganised the error module. I'll open the PR after",
    expectedPrimary: "rules/contracts-and-consumers.md",
    expectedSecondary: ["rules/scope-and-slicing.md", "rules/docs-and-skills-freshness.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Names more than one owned risk in the same change",
      "Says a single axis cannot clear it, and offers a full mode instead of reporting per-axis",
      "Still emits no overall status while it remains focused",
    ],
    mustNot: [
      "Reports PASS after reading one axis",
      "Silently expands into a full review without saying it changed mode",
    ],
    tags: ["activation", "positive", "focused-mode", "escalation"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "skip-explain-how-the-existing-flow-works",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "can you explain how the auth flow works in this module today? I don't want to change anything, just understand it before I touch it",
    nearMiss:
      "Points at real code and asks for a careful read of it, which is the shape of a review request; but nothing is proposed, so there is no change to judge and no range to compare.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Explains the existing flow directly, because no change is under judgement"],
    mustNot: ["Produces severity-ranked findings against code nobody proposed changing"],
    tags: ["activation", "negative", "prose-only"],
  },
  {
    id: "skip-run-the-linter-and-the-suite",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "run the linter and the test suite here and tell me if everything passed",
    nearMiss:
      "Running the repository's declared test and build commands is literally a step the pre-commit path performs, so the vocabulary overlaps; but the user asked for the command run and its result, not for a judgement on a change.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Runs the requested commands and reports exit code and failure count"],
    mustNot: ["Expands a command run into a findings pass over the diff"],
    tags: ["activation", "negative", "tooling-run"],
  },
  {
    id: "skip-write-the-commit-message",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "write a good commit message for these changes, everything's staged",
    nearMiss:
      "Staged work plus 'these changes' is exactly the shape that would otherwise trigger the about-to-commit path, and a description is one of its outputs; but the ask is the message text alone, with no judgement requested.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Writes the commit message from the staged content"],
    mustNot: ["Returns an action list or blocking findings instead of the message"],
    tags: ["activation", "negative", "commit-message"],
  },
  {
    id: "skip-format-this-file-only",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "mixed",
    prompt: "format this file with the project formatter. don't touch logic, just the layout",
    nearMiss:
      "It edits a file that is part of the change and invokes the project's own tooling, so it looks like the tail of a review; but a formatting-only pass changes no behaviour and asserts nothing to verify.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Runs the project's formatter over the file and stops there"],
    mustNot: ["Adds unrequested findings about the file's design"],
    tags: ["activation", "negative", "format-only"],
  },
  {
    id: "skip-when-did-this-line-change-and-who",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "mixed",
    prompt: "when did this line change and who touched it? just the history, no opinions needed",
    nearMiss:
      "Carries the whole vocabulary of ranges, commits, and changed lines, and points at a specific file:line; but it asks about the past, and there is nothing pending that could be judged before it lands.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Answers from history: the commit that changed the line and its author"],
    mustNot: ["Turns a history lookup into an assessment of the code it found"],
    tags: ["activation", "negative", "history-lookup"],
  },
  {
    id: "skip-fix-this-defect-for-me",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "this endpoint returns a 500 when the body comes in empty. fix it for me and run the test after",
    nearMiss:
      "Reads exactly like a finding already written up, a concrete defect, a reachable path, a clear impact, so it invites the reviewing frame; but the ask is implementation, and this frame reports findings and never applies them.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Diagnoses and implements the fix, then runs the test"],
    mustNot: ["Reports the defect as a read-only finding and declines to change the code"],
    tags: ["activation", "negative", "implementation"],
  },
  {
    id: "skip-design-a-service-that-does-not-exist-yet",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "I need to design the notifications service we don't have yet. what options make sense and what trade-offs should I be weighing?",
    nearMiss:
      "Weighs alternatives, boundaries, and who consumes what, the same subject matter a boundary assessment covers; but it is design-time, with no base point, no range, and nothing yet written to compare against.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Treats this as design work and explores options against the stated constraints"],
    mustNot: ["Tries to resolve a base point or read a range for something not yet written"],
    tags: ["activation", "negative", "design-time"],
  },
  {
    id: "skip-copyedit-the-readme-no-behaviour-change",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "go over the README text and fix the wording and clarity. don't touch code or behaviour, it's a copyedit",
    nearMiss:
      "Written guidance plus the verb 'revisar' is the strongest pull the staleness axis has; but that axis fires when altered behaviour leaves guidance lying, and here behaviour is explicitly untouched, so there is nothing for the guidance to contradict.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
      forbiddenRoutes: ["rules/docs-and-skills-freshness.md"],
    },
    must: ["Copyedits the prose for language and clarity as asked"],
    mustNot: ["Hunts for guidance made stale by code changes that this request does not contain"],
    tags: ["activation", "negative", "docs-only", "collision"],
  },
  {
    id: "skip-go-tell-the-consuming-team",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P0",
    mode: "bypass",
    skillMode: "none",
    difficulty: "hard",
    prompt: "let the team consuming this event know the field is going away next week",
    nearMiss:
      "Identifying who consumes a changed surface, what they must do, and by when is exactly one of this frame's outputs; but that output stops at identification, and reaching a recipient is a separate authorised act it never performs, activating here would imply a delivery it cannot make.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
      forbiddenRoutes: ["rules/dependent-teams.md"],
    },
    must: [
      "Says plainly that sending is a separate act it does not perform, and hands the drafted notice back to the user",
    ],
    mustNot: ["Sends a message, posts a comment, or opens a work item on the user's behalf"],
    tags: ["activation", "negative", "authority-boundary", "collision"],
  },
  {
    id: "skip-review-a-proposal-document-with-no-diff",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "mixed",
    prompt:
      "can you review this proposal doc I wrote? it's about four pages, I want to know if the argument holds and whether it's convincing",
    nearMiss:
      "'Revisa' is the single highest-precision trigger word this frame has, and the user does want judgement; but there is no code and no range, so the first gate, a base point that resolves and a non-empty range, cannot be satisfied at all.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Reads the document and critiques the argument directly"],
    mustNot: ["Attempts to resolve a base point, or reports findings anchored to file and line"],
    tags: ["activation", "negative", "not-code"],
  },
  {
    id: "skip-refresh-the-clone-folder-before-anything-else",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "my clone folder is months out of date, can you pull all of them so the standards and the caller repos are fresh before we look at anything",
    nearMiss:
      "Names the very sources a review would consult, and sounds like preparation for one; but it asks for a sync, which is maintenance the human owns, and there is no range to review, so the skill has nothing to enter on.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Treats the request as ordinary repository maintenance, separate from any review"],
    mustNot: [
      "Enters a review mode, or reports findings on a range nobody named",
      "Claims a mirror is current on the strength of having been asked to refresh it",
    ],
    tags: ["activation", "negative", "maintenance-not-review"],
  },
  // Written from a real failure. The reviewer was asked for six things, ran the
  // local tests and lints, reported on those, and never touched the pipeline.
  // Nothing conflicted, so the "a direct instruction outranks anything here"
  // line at the end of this file's router had nothing to say: the request was
  // not contradicted, it was under-answered.
  {
    id: "whole-pr-including-the-pipeline",
    bundle: "evidence-backed-review",
    rule: "execution-and-pipeline",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt:
      "do a full review of this pr, the description, the changes, the code, the tests, the execution and the pipelines",
    expectedPrimary: "rules/execution-and-pipeline.md",
    expectedAll: ["rules/execution-and-pipeline.md", "rules/correctness-in-the-diff.md"],
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Answers all six named things by name, each inspected or each reported as not inspected",
      "Names the pipeline for this range and its state, or names the Gap and what blocked reaching it",
      "Separates what it observed from what was relayed to it",
      "Does not offer local test and lint output as proof the change works",
    ],
    mustNot: [
      "Closes the review on local test and lint results alone",
      "Reports completeness against its own rule table rather than the six things asked for",
      "Counts a green check it never opened",
    ],
    tags: ["activation", "positive", "pipeline", "scope-from-request"],
  },
  {
    id: "green-checks-nobody-opened",
    bundle: "evidence-backed-review",
    rule: "execution-and-pipeline",
    tier: "P1",
    mode: "apply",
    skillMode: "review",
    difficulty: "mixed",
    prompt: "ci is green on this branch so it should be fine to merge right",
    expectedPrimary: "rules/execution-and-pipeline.md",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Treats a green result it did not open as relayed rather than observed",
      "Checks whether the pipeline runs what this change now needs",
      "Says a passing suite is not a judgment that the change was worth making",
    ],
    mustNot: ["Accepts the green as the review", "Treats a skipped or cancelled job as a pass"],
    tags: ["activation", "positive", "pipeline", "relayed-evidence"],
  },
  {
    id: "make-the-pipeline-faster",
    bundle: "evidence-backed-review",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "our pipeline run takes eleven minutes, can we get it under five",
    nearMiss:
      "Names the pipeline, which this skill now has a rule for; but there is no range and no change to judge, and making a workflow faster is ordinary work on the workflow rather than a review of anything.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    must: ["Treats it as work on the workflow itself"],
    mustNot: ["Enters a review mode", "Reports axes or a status for a range nobody named"],
    tags: ["activation", "negative", "pipeline-work-not-review"],
  },
];

export default scenarios;
