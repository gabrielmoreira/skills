// Canonical local run layout helpers for the next eval harness.
// Keep paths deterministic and inside the gitignored workspace.

export const RUN_ARMS = ["baseline", "gold", "candidate"];
export const WORKSPACE_ROOT = "evals/workspace/runs";

export function makeRunLayout(runId) {
  if (!runId || typeof runId !== "string") {
    throw new Error("runId is required");
  }

  const root = `${WORKSPACE_ROOT}/${runId}`;
  const arms = Object.fromEntries(
    RUN_ARMS.map((arm) => [
      arm,
      {
        dir: `${root}/${arm}`,
        responses: `${root}/${arm}/responses.json`,
        grades: `${root}/${arm}/grades.json`,
      },
    ]),
  );

  return {
    root,
    promptsDir: `${root}/prompts`,
    summaryJson: `${root}/summary.json`,
    summaryMd: `${root}/summary.md`,
    arms,
  };
}
