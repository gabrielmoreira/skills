/**
 * Prompts no skill in this collection should claim.
 *
 * Each skill already carries near misses: prompts that look like its subject
 * and are not. Those test where a boundary sits. These test something else,
 * whether a description is greedy in general, and they are collection-level
 * rather than per-skill because the question is whether *anything* fires.
 *
 * A skill that opens here costs the reader a file and the run some turns, and
 * it does it on work it has nothing to say about. That is the failure mode a
 * near miss cannot catch, because a near miss is still in the neighbourhood.
 *
 * Every prompt is ordinary developer work: infrastructure, data wrangling, a
 * plain question. None of them is about designing code, a bug, a diff, a test,
 * documentation, recovering git work, reading an unfamiliar codebase, or
 * writing a skill.
 *
 * `whyItLooksClose` names the word that might pull a skill in, so a failure can
 * be read without guessing.
 */
const scenarios = [
  {
    id: "cron-expression",
    prompt: "write a cron expression for the second tuesday of every month at 3am",
    whyItLooksClose: "asks for something to be written, and nothing else",
  },
  {
    id: "dockerfile-node-bump",
    prompt: "bump the node version in the dockerfile from 20 to 22",
    whyItLooksClose: "edits a file in a repository, which is not the same as designing code",
  },
  // Withdrawn: "convert this csv of invoices into an xlsx with one sheet per
  // month". test-first-by-evidence opened it in one run of three, and that is
  // defensible rather than greedy: writing a converter is implementing a
  // feature, which its description claims out loud. The prompt was a bad far
  // miss, not a bad skill. Replaced with work that authors no code at all.
  {
    id: "stuck-staging-deploy",
    prompt: "the staging deploy has been stuck in pending for twenty minutes, who owns that pipeline",
    whyItLooksClose: "something is stuck and wrong, which reads like a defect to diagnose",
  },
  {
    id: "postgres-default-port",
    prompt: "what port does postgres listen on by default",
    whyItLooksClose: "a lookup with a single correct answer",
  },
  {
    id: "ssh-key-staging",
    prompt: "add a new ssh key to the deploy user on staging",
    whyItLooksClose: "starts with add, which several routers key on",
  },
  {
    id: "slow-npm-install",
    prompt: "the npm install is taking four minutes, is there a faster registry mirror",
    whyItLooksClose: "something is slow and wrong, which reads like a defect without being one",
  },
  {
    id: "mutex-vs-semaphore",
    prompt: "what is the difference between a mutex and a semaphore",
    whyItLooksClose: "a concept question with no repository and no task",
  },
];

export default scenarios;
