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
 * the notation used by SKILL.md, not an absolute URI scheme.
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
    rule: "claims-and-proof",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "take a look at this PR before I ask for approval, it's around 12 files. the repo has a conventions doc at the root and I got the impression a second way of handling errors showed up somewhere along the way",
    expectedPrimary: "rules/claims-and-proof.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      // A whole-change standard review may open any applicable category.
      // The primary route is an entry point, not an exclusive scope.
      forbiddenRoutes: [],
    },
    must: [
      "Reads the repository's own written standard first and cites its file plus rule for any hard violation",
      "Separates an undocumented preference from a concrete maintenance defect",
      "Checks whether the second convention has a justified purpose and reports its actual consequence",
      "Keeps the convention verdict and the requirement verdict separate, neither ranked against the other",
      "Closes with a single run status and the assertion that nothing was mutated",
    ],
    mustNot: [
      "Cites 'best practice' where a repository file and rule should be",
      "Uses a formatting or lint result as a substitute for reviewing the change",
    ],
    tags: ["activation", "positive", "review-mode", "standards"],
  },
  {
    id: "review-branch-against-base-did-i-build-the-ask",
    bundle: "evidence-backed-review",
    rule: "claims-and-proof",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "review my branch against the release base please. the card describes three behaviours and I want to know if I delivered all three or if I ended up inventing extra stuff along the way",
    expectedPrimary: "rules/claims-and-proof.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Resolves the named release base and the head revision and inspects the merge-base diff",
      "Reads the linked card and any relevant parent criteria rather than deriving intent from the diff",
      "Separates missing delivery, extra scope and incorrect implementation without stopping the other review angles",
      "Cites the applicable requirement for each conformance finding",
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
    rule: "contracts-and-rollout",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "hard",
    prompt:
      "is this safe to merge? there's a migration that doesn't run backwards and the consuming service only deploys after. pipeline's green",
    expectedPrimary: "rules/contracts-and-rollout.md",
    expectedSecondary: ["rules/claims-and-proof.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Distinguishes source intent, check results, deployed state and observed consumer behavior",
      "Names which unavailable evidence prevents a readiness conclusion",
      "Checks rollout order between producer and consumer",
      "Judges recoverability separately and examines restore or roll-forward options for the irreversible migration",
      "Reports missing in-scope evidence as incomplete while preserving other findings",
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
    rule: "contracts-and-rollout",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "this merge request drops a field from the event payload and I know there are consumers outside our package. tell me what needs to happen before this ships",
    expectedPrimary: "rules/contracts-and-rollout.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Splits recipients into needs-to-act and needs-to-be-aware, with different content for each",
      "States when each external action is needed, distinguishing merge from release where relevant",
      "Resolves recipients from recorded ownership, or names the missing owner evidence",
      "Explains what changed, when, what breaks if ignored and the required action",
      "States the list is identified only and that nothing was sent",
    ],
    mustNot: [
      "Sends, posts, comments, opens a work item, or notifies anyone",
      "Names a plausible-sounding team the repository never records",
      "Drops the explicitly requested external actions while discussing only local correctness",
    ],
    tags: ["activation", "positive", "review-mode", "notification-scope"],
  },
  {
    id: "review-inherited-change-with-no-linked-requirement",
    bundle: "evidence-backed-review",
    rule: "claims-and-proof",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "hard",
    prompt:
      "I inherited this PR from someone who left the team. it adds a caching layer and there's no issue, no card, nothing linked. worth reviewing anyway or do I hand it back?",
    expectedPrimary: "rules/claims-and-proof.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Separates the stated implementation claim from its unverified motivation",
      "Looks for available scope decisions and records the missing requirement evidence",
      "Continues examining caching correctness, invalidation and operating cost",
      "Names the decision or evidence needed instead of inventing a reason for the change",
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
    rule: "defects-in-the-change",
    tier: "P1",
    mode: "router",
    skillMode: "standard",
    difficulty: "obvious",
    prompt:
      "this diff is around 900 lines: half of it is reshuffling the date helpers and the other half is a new scheduling endpoint. can I review this in one go?",
    expectedPrimary: "rules/defects-in-the-change.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Examines restructuring and new behavior as distinct concerns",
      "Checks moved code in its new context and the new endpoint's dependencies",
      "Reports reviewability or coupling costs when concrete, without requiring a split before continuing",
      "Keeps unrelated historical debt separate from change-related findings",
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
    rule: "claims-and-proof",
    tier: "P1",
    mode: "apply",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "the diff switches the client timeout default from 30s to 5s. onboarding docs and the setup guide say it defaults to 30 seconds. do we make them update the markdown in this pull request, or approve and let them fix the guide later?",
    expectedPrimary: "rules/claims-and-proof.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Checks the intended new default against requirements before deciding whether code or guidance is wrong",
      "Reports misleading guidance with the affected caller or reader consequence",
      "Cites the stale claim and the configuration or code establishing the actual default",
      "Searches affected identifiers, flags and defaults across relevant written guidance",
    ],
    mustNot: [
      "Approves materially misleading guidance merely because it is Markdown",
      "Assumes the new code is authoritative when requirements might make it the erroneous side",
    ],
    tags: ["activation", "positive", "review-mode", "docs-freshness"],
  },
  {
    id: "pre-commit-about-to-commit-look-first",
    bundle: "evidence-backed-review",
    rule: "defects-in-the-change",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "obvious",
    prompt:
      "before I commit, check whether everything is right. be thorough, I'd rather find it now than in review",
    expectedPrimary: "rules/defects-in-the-change.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Compares the working tree and index against the current commit rather than a pushed range",
      "Separates staged content from unstaged edits and states which candidate was reviewed",
      "Uses safe relevant check evidence and identifies what was actually exercised",
      "Reports material findings and missing evidence without changing the candidate",
    ],
    mustNot: [
      "Mutates the working tree, the index, the current commit, or any branch",
      "Treats absent command output as a reason to ignore a defect demonstrable from source",
    ],
    tags: ["activation", "positive", "uncommitted-work", "order"],
  },
  {
    id: "pre-commit-check-my-work-before-i-open-it",
    bundle: "evidence-backed-review",
    rule: "defects-in-the-change",
    tier: "P1",
    mode: "apply",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "before I open the PR, can you go over what I did? I'd like to walk away with the description ready to paste",
    expectedPrimary: "rules/defects-in-the-change.md",
    expectedSecondary: ["rules/contracts-and-rollout.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Produces a draft description carrying the claim, the source of the requirement, the alternative rejected, and what is deliberately out of scope",
      "Keeps the draft faithful to the observed change and its available requirement source",
      "Names who must be told once it is published and states they were identified, not contacted",
      "Orders the output as blocking-first actions for the author, who edits next",
    ],
    mustNot: [
      "Opens the change, comments on it, or notifies anyone",
      "Applies the fixes it found instead of reporting them",
    ],
    tags: ["activation", "positive", "uncommitted-work", "draft-description"],
  },
  {
    id: "pre-commit-opportunistic-tidying-mixed-into-dirty-tree",
    bundle: "evidence-backed-review",
    rule: "defects-in-the-change",
    tier: "P0",
    mode: "complexity",
    skillMode: "standard",
    difficulty: "hard",
    prompt:
      "I've got a bunch of uncommitted stuff: the fix I actually wanted, plus I tidied up imports in a few files I didn't really touch. can I send it all together?",
    expectedPrimary: "rules/defects-in-the-change.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Assesses whether the import tidying obscures the intended fix or changes behavior",
      "Recommends separating unrelated changes only with a concrete review or delivery reason",
      "Leaves the index and working tree untouched",
      "Continues reviewing the fix even if it recommends a smaller PR",
    ],
    mustNot: [
      "Removes or reshapes the user's edits during review",
      "Blocks all review until the user splits the change",
    ],
    tags: ["activation", "positive", "uncommitted-work", "opportunism"],
  },

  {
    id: "review-clean-cut-or-backward-compatible-on-existing-api",
    bundle: "evidence-backed-review",
    rule: "contracts-and-rollout",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "hard",
    prompt:
      "this renames two fields on an endpoint that's been on main for a while. I don't know if anything outside our stack calls it. can I just change it and fix the callers, or does it need to stay compatible?",
    expectedPrimary: "rules/contracts-and-rollout.md",
    expectedSecondary: [],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Settles clean cut versus backward compatible before judging whether the change is safe",
      "Checks whether the surface is already released or on the target branch and which consumers depend on it",
      "Searches available consumer evidence before asking about unresolved compatibility decisions",
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
    rule: "claims-and-proof",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "hard",
    prompt:
      "review this branch before I open it. it changes how our service calls the payments one, mutual auth, timeouts, retries. none of that is written down in this repo, but I keep a folder of clones with the platform standards and the two services that call us, so grep there",
    expectedPrimary: "rules/claims-and-proof.md",
    expectedSecondary: ["rules/contracts-and-rollout.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
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
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "look this over before it goes out. it adds an endpoint that returns a user's invoices by id, and there's a file upload in there too. login is already handled by the middleware so that part's fine",
    expectedPrimary: "rules/security-and-abuse-paths.md",
    expectedSecondary: ["rules/claims-and-proof.md", "rules/contracts-and-rollout.md"],
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: true,
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
    rule: "defects-in-the-change",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "take a look before I push. mostly small edits to the checkout handler, changed a couple of conditions, and I dropped some validation that wasn't doing anything",
    expectedPrimary: "rules/defects-in-the-change.md",
    expectedSecondary: ["rules/security-and-abuse-paths.md", "rules/claims-and-proof.md"],
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
      "Distinguishes a confirmed path from a plausible mechanism and names the trigger where execution evidence is unavailable",
    ],
    mustNot: [
      "Accepts 'it wasn't doing anything' without finding what the removed check covered",
      "Refutes a race or a rare-branch nil because it could not be reproduced from the diff",
      "Reports a defect with no path back to a line this diff changed",
    ],
    tags: ["activation", "positive", "correctness", "removed-behaviour"],
  },
  // Implementation requests remain implementation requests. These historical
  // prompts once activated a one-rule focused mode; they now check that review
  // guidance does not take over another task.
  {
    id: "focused-contract-change-surfaced-mid-implementation",
    bundle: "evidence-backed-review",
    rule: "contracts-and-rollout",
    tier: "P0",
    mode: "router",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "I'm implementing the shipping cost calculation and to do it I had to drop an optional field from the quote endpoint response. carry on from there",
    nearMiss: "An implementation change exposes a compatibility concern, but no review was requested.",
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "implementation", "contracts"],
  },
  {
    id: "focused-written-guidance-contradicted-while-editing",
    bundle: "evidence-backed-review",
    rule: "claims-and-proof",
    tier: "P1",
    mode: "router",
    skillMode: "none",
    difficulty: "mixed",
    prompt:
      "changed the retry to three attempts with backoff. keep going, I want to finish this today",
    nearMiss: "A changed retry may affect guidance, but the request is to continue implementation.",
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "implementation", "stale-guidance"],
  },
  {
    id: "focused-second-convention-noticed-while-adding-code",
    bundle: "evidence-backed-review",
    rule: "claims-and-proof",
    tier: "P1",
    mode: "router",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "add the new handler following what's already in the module. I noticed there are two different ways of building errors in that file, but go ahead",
    nearMiss: "A convention question occurs during implementation, not a requested change review.",
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "implementation", "standards"],
  },
  {
    id: "focused-multiple-risks-escalate-to-full-review",
    bundle: "evidence-backed-review",
    rule: "contracts-and-rollout",
    tier: "P0",
    mode: "complexity",
    skillMode: "none",
    difficulty: "hard",
    prompt:
      "finish this off: I dropped the field from the payload, changed the timeout default, and while I was in there I reorganised the error module. I'll open the PR after",
    nearMiss: "Several changed surfaces still do not turn a request to finish implementation into a review request.",
    activation: {
      layer: "internal-route",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "implementation", "scope"],
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
      "A review may use these results, but the user asked only for commands and their output.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
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
      "A document change can deserve review, but this request explicitly asks to edit its wording, not to judge a proposed change.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
      forbiddenRoutes: ["rules/claims-and-proof.md"],
    },
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
      forbiddenRoutes: ["rules/contracts-and-rollout.md"],
    },
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
      "This asks for critique of an argument, not the readiness or consequences of a proposed artifact change.",
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: false,
    },
    tags: ["activation", "negative", "argument-critique"],
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
    rule: "claims-and-proof",
    tier: "P0",
    mode: "router",
    skillMode: "complete",
    difficulty: "mixed",
    prompt:
      "do a full review of this pr, the description, the changes, the code, the tests, the execution and the pipelines",
    expectedPrimary: "rules/claims-and-proof.md",
    expectedAll: ["rules/claims-and-proof.md", "rules/defects-in-the-change.md", "rules/contracts-and-rollout.md", "rules/security-and-abuse-paths.md", "rules/runtime-and-resources.md"],
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
    id: "review-balance-read-then-written-two-lines-later",
    bundle: "evidence-backed-review",
    rule: "runtime-and-resources",
    tier: "P0",
    mode: "router",
    skillMode: "standard",
    difficulty: "mixed",
    prompt:
      "is this ok to merge? small change on the checkout path, it reads the balance and writes the new one a couple of lines later",
    expectedPrimary: "rules/runtime-and-resources.md",
    expectedSecondary: ["rules/defects-in-the-change.md"],
    activation: {
      layer: "public-skill",
      target: "evidence-backed-review",
      shouldActivate: true,
      forbiddenRoutes: [],
    },
    must: [
      "Names the window between the read and the write, and what a second caller entering it produces",
      "Says whether the write is atomic, or reports that nothing makes it so",
      "Cites both lines at file:line rather than describing the pattern",
      "Reports the established interleaving and distinguishes code-path evidence from an unverified hypothesis",
    ],
    mustNot: [
      "Accepts the code because it reads correctly in a single pass",
      "Recommends a lock without reading what an existing one covers",
      "Edits the file or applies the fix itself",
    ],
    tags: ["activation", "positive", "concurrency", "integrity"],
  },
  {
    id: "green-checks-nobody-opened",
    bundle: "evidence-backed-review",
    rule: "claims-and-proof",
    tier: "P1",
    mode: "apply",
    skillMode: "standard",
    difficulty: "mixed",
    prompt: "ci is green on this branch so it should be fine to merge right",
    expectedPrimary: "rules/claims-and-proof.md",
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
    tags: ["activation", "negative", "pipeline-work-not-review"],
  },
];

export default scenarios;
