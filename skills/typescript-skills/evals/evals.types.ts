/**
 * Priority tier for successor-harness scenarios.
 *
 * - `P0`: must be very hard to get wrong; collisions and hard-gates live here.
 * - `P1`: important day-to-day guidance; should still calibrate clearly.
 * - `P2`: useful coverage, but lower leverage than P0/P1.
 */
export const TIERS = ["P0", "P1", "P2"] as const;

/**
 * Pressure type the scenario applies to the routed topic tree.
 *
 * - `router`: mainly tests which topic/rule should own the answer.
 * - `apply`: tests normal application of guidance to code/design review.
 * - `bypass`: tests resistance to plausible hard-gate bypass attempts.
 * - `exception`: tests when an exception is actually earned.
 * - `complexity`: tests choosing the smallest correct escalation level.
 * - `simplification`: tests whether a simplified rule still steers correctly.
 */
export const MODES = ["router", "apply", "bypass", "exception", "complexity", "simplification"] as const;

/**
 * Human-facing difficulty label for calibration.
 *
 * This is not scoring math by itself. It helps us keep a healthy mix of:
 * - `obvious`: clear canonical answer
 * - `mixed`: realistic grey area with one better owner/decision
 * - `hard`: collision-heavy or operationally subtle
 */
export const DIFFICULTIES = ["obvious", "mixed", "hard"] as const;

/**
 * Stable control labels for committed calibration cases.
 *
 * Raw control prompts and grades stay local in `evals/workspace/`; this union
 * only names the durable variant kinds we keep under source control.
 */
export const CONTROL_VARIANTS = ["gold", "weak-plausible", "wrong-owner", "assertion-heavy"] as const;

export type EvalControlVariant = (typeof CONTROL_VARIANTS)[number];

export type EvalTier = (typeof TIERS)[number];
export type EvalMode = (typeof MODES)[number];
export type EvalDifficulty = (typeof DIFFICULTIES)[number];

/**
 * Canonical successor-harness scenario definition.
 *
 * Scenarios are the durable source of truth for successor eval coverage.
 * Keep them small, explicit, and atomic enough that losing one behavior is obvious.
 */
export type EvalScenario = {
  /** Stable unique identifier used by responses, grades, controls, and reports. */
  id: string;
  /** Owning topic bundle, e.g. `typescript-configs`. */
  bundle: string;
  /** Canonical rule slug inside that topic, e.g. `parse-and-expose-config`. */
  rule: string;
  /** Relative priority for calibration and future gating. */
  tier: EvalTier;
  /** What kind of pressure this scenario applies to the tree. */
  mode: EvalMode;
  /** Optional calibration label for human review. */
  difficulty?: EvalDifficulty;
  /** User-facing prompt. Must not leak the expected topic/rule name. */
  prompt: string;
  /** Primary owner we expect a strong answer to route to. */
  expectedPrimary?: string;
  /** Optional secondary owners that may be relevant but not primary. */
  expectedSecondary?: string[];
  /** Positive requirements that a good answer must satisfy. */
  must: string[];
  /** Forbidden moves that should trigger a failing grade when violated. */
  mustNot: string[];
  /** Free-form labels for local filtering and review. */
  tags?: string[];
};

/**
 * Local grade artifact shape used by successor controls and scoring.
 */
export type EvalGrade = {
  scenarioId: string;
  routePrimary: boolean;
  routeSecondary: boolean | null;
  must: Array<{ text: string; passed: boolean; evidence: string }>;
  mustNot: Array<{ text: string; violated: boolean; evidence: string }>;
  fatal: boolean;
  score: number;
  notes: string;
};
