/**
 * Activation and routing scenarios for treat-blockers-as-incidents.
 *
 * Every positive here is drawn from a real incident record rather than
 * invented: a runtime manager whose install fails for an unrelated reason, a
 * first blocker that hides a second, a fix that begins by deleting working
 * state, and a detour nobody would write in a setup guide.
 *
 * The negatives are the boundary that matters most. This skill sits beside two
 * others that also fire on the word "fails", and taking their work would make
 * it the loudest skill in the collection rather than the most useful.
 */
const scenarios = [
  // ---------------------------------------------------------------- positive
  {
    id: "runtime-manager-install-fails",
    bundle: "treat-blockers-as-incidents",
    rule: "whose-failure-is-it",
    tier: "P0",
    mode: "router",
    skillMode: "review",
    difficulty: "obvious",
    prompt: "installing the java runtime keeps exiting non-zero but the error mentions some credential tool i don't even use",
    expectedPrimary: "rules/whose-failure-is-it.md",
    expectedSecondary: ["rules/stop-conditions.md"],
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Runs the narrowest command that exercises only the runtime, and reads its own output",
      "Names which component failed and which did not",
      "Does not reinstall or delete the runtime on the strength of the exit code",
    ],
    mustNot: ["Treats the wrapper's exit code as one fact", "Removes a working tool named in the output"],
    tags: ["activation", "positive", "collateral-failure"],
  },
  {
    id: "fix-worked-something-else-broke",
    bundle: "treat-blockers-as-incidents",
    rule: "the-second-blocker",
    tier: "P0",
    mode: "apply",
    skillMode: "review",
    difficulty: "mixed",
    prompt: "ok the auth error is gone now but it fails later on with something about the registry, guess we're nearly there",
    expectedPrimary: "rules/the-second-blocker.md",
    expectedAll: ["rules/the-second-blocker.md", "rules/stop-conditions.md"],
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Treats the registry failure as independent until observed otherwise",
      "States the first fix as removing the first failure only",
      "Re-runs the original command and says how far it now reaches",
    ],
    mustNot: ["Reports the first repair as the resolution", "Assumes the second failure was caused by the first fix"],
    tags: ["activation", "positive", "masked-blocker"],
  },
  {
    id: "delete-the-cache-to-get-past-it",
    bundle: "treat-blockers-as-incidents",
    rule: "never-destroy-to-proceed",
    tier: "P0",
    mode: "exception",
    skillMode: "review",
    difficulty: "obvious",
    prompt: "the lockfile is fighting me, can we just wipe the cache and the node_modules and start clean",
    expectedPrimary: "rules/never-destroy-to-proceed.md",
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Copies aside anything about to be removed, and says where",
      "Prefers an additive move over the removal",
      "Names what on this machine would not be in the shape it was found in",
    ],
    mustNot: ["Deletes state whose mechanism is unknown", "Treats a clean slate as a diagnosis"],
    tags: ["activation", "positive", "destructive-fix"],
  },
  {
    id: "found-a-way-around-it",
    bundle: "treat-blockers-as-incidents",
    rule: "workarounds-are-findings",
    tier: "P1",
    mode: "apply",
    skillMode: "review",
    difficulty: "mixed",
    prompt: "got it working, had to pin an older version and copy one file by hand, moving on",
    expectedPrimary: "rules/workarounds-are-findings.md",
    expectedSecondary: ["rules/record-the-learning.md"],
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Reports the detour as a finding about the tool rather than a repair",
      "States the mechanism, or records a Gap saying none was established",
      "Says what remains broken for the next person",
    ],
    mustNot: ["Reports it as fixed", "Leaves the pinned version unexplained"],
    tags: ["activation", "positive", "workaround"],
  },
  {
    id: "hours-gone-on-the-environment",
    bundle: "treat-blockers-as-incidents",
    rule: "stop-conditions",
    tier: "P1",
    mode: "router",
    skillMode: "review",
    difficulty: "mixed",
    prompt: "been going at this shell thing for a while and every attempt turns up a different error, should i keep going",
    expectedPrimary: "rules/stop-conditions.md",
    expectedSecondary: ["rules/record-the-learning.md"],
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Names the condition that should stop the work, not a count of attempts",
      "States the one thing that would unblock it",
      "Hands back what is known, incomplete, rather than continuing",
    ],
    mustNot: ["Recommends more attempts of the same shape", "Widens a permission or disables a check to proceed"],
    tags: ["activation", "positive", "stop"],
  },

  {
    id: "same-stone-second-time",
    bundle: "treat-blockers-as-incidents",
    rule: "record-the-learning",
    tier: "P1",
    mode: "apply",
    skillMode: "review",
    difficulty: "mixed",
    prompt: "this is the second time this month the token expires halfway through and i lose an hour rediscovering the fix",
    expectedPrimary: "rules/record-the-learning.md",
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: true, forbiddenRoutes: [] },
    must: [
      "Writes the record with the symptom, the confirmed cause or limitation, and the evidence for each",
      "Writes recovery steps as commands, with what healthy output looks like",
      "States the stop conditions for the next person",
      "Reports the path it wrote to and whether that path is tracked",
    ],
    mustNot: [
      "Records a token, a credential value, or output carrying one",
      "Claims a resolution the evidence does not support",
    ],
    tags: ["activation", "positive", "learning"],
  },

  // ---------------------------------------------------------------- negative
  {
    id: "the-test-fails-because-the-feature-is-missing",
    bundle: "treat-blockers-as-incidents",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "the new test fails saying retry is not a function, which is right because i haven't written it yet",
    nearMiss:
      "A command fails and the word failure is present, which this skill keys on; but the failure is exactly the task, a red waiting for an implementation, and taking it would steal the work test-first-by-evidence owns.",
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: false },
    must: ["Treats the red as the expected state before implementing"],
    mustNot: ["Opens an incident over a test that is failing on purpose"],
    tags: ["activation", "negative", "task-not-blocker"],
  },
  {
    id: "the-code-has-a-bug",
    bundle: "treat-blockers-as-incidents",
    rule: "activation-boundary",
    tier: "P0",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "signups intermittently save an empty email and i can't work out why, it only happens sometimes",
    nearMiss:
      "Intermittent and unexplained, which reads like an environment problem; but the defect is in the code under change, and diagnosing it is what debugging-by-evidence exists for.",
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: false },
    must: ["Treats it as a defect to reproduce in the code"],
    mustNot: ["Treats the application's own bug as a blocked environment"],
    tags: ["activation", "negative", "bug-not-blocker"],
  },
  {
    id: "ordinary-setup-on-a-new-machine",
    bundle: "treat-blockers-as-incidents",
    rule: "activation-boundary",
    tier: "P1",
    mode: "exception",
    skillMode: "none",
    difficulty: "hard",
    prompt: "fresh laptop, what do i need to install to get this project running",
    nearMiss:
      "Names installs and a machine that cannot yet run the project, which is the vocabulary of this skill; but nothing has failed, there is no incident, and setup from a clean state is ordinary work.",
    activation: { layer: "public-skill", target: "treat-blockers-as-incidents", shouldActivate: false },
    must: ["Treats it as ordinary setup"],
    mustNot: ["Opens an incident where no command has failed"],
    tags: ["activation", "negative", "setup-not-incident"],
  },
];

export default scenarios;
