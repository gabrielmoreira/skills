import { CONTROL_VARIANTS, type EvalControlVariant } from "./evals.types.ts";

/**
 * Durable control coverage preserved from the legacy local workspace.
 *
 * Raw control prompts, responses, and grades stay generated-only inside
 * `evals/workspace/`. This matrix keeps the useful part under version control:
 * which scenarios already have curated control variants worth re-running.
 */
export const SCENARIO_CONTROL_VARIANTS = {
  "async-timeout-must-fit-caller-budget": ["gold"] as const,
  "boundaries-webhook-raw-plus-provider-cast": ["gold", "weak-plausible", "wrong-owner"] as const,
  "coding-standards-assertion-on-external-json": ["gold", "weak-plausible", "wrong-owner"] as const,
  "coding-standards-class-for-shared-deps-only": ["gold", "weak-plausible"] as const,
  "coding-standards-clean-cutover-vs-parallel-path": ["gold", "weak-plausible"] as const,
  "coding-standards-generic-role-name-hides-decision": ["gold", "weak-plausible"] as const,
  "coding-standards-missing-union-variant-handling": ["gold", "weak-plausible"] as const,
  "coding-standards-thin-wrapper-for-one-caller": ["gold"] as const,
  "composition-ready-instance-vs-factory-stable-mailer": ["gold", "weak-plausible"] as const,
  "composition-root-provider-selection-in-behavior": ["gold", "weak-plausible"] as const,
  "composition-singleton-captures-tenant-scope": ["gold", "weak-plausible"] as const,
  "configs-contextual-appconfig-slice": ["gold"] as const,
  "configs-default-owner-timeout": ["gold", "weak-plausible"] as const,
  "configs-env-non-null-bypass": ["gold", "weak-plausible", "wrong-owner"] as const,
  "configs-feature-decision-creep": ["weak-plausible"] as const,
  "configs-parse-vs-verify-s3": ["gold", "weak-plausible"] as const,
  "error-boundary-vendor-message-leak": ["gold", "weak-plausible", "wrong-owner"] as const,
  "observability-error-instance-without-context": ["gold", "weak-plausible"] as const,
  "observability-vendor-tracing-in-business-logic": ["gold", "weak-plausible"] as const,
  "testing-bootstrap-import-for-handler-behavior": ["gold", "weak-plausible"] as const,
  "testing-coverage-target-brittle-structure-assertion": ["gold", "weak-plausible", "wrong-owner"] as const,
  "testing-local-style-behavior-first-naming": ["gold", "weak-plausible"] as const,
  "throw-vs-result-parser-failure-modes": ["assertion-heavy"] as const,
} satisfies Record<string, readonly EvalControlVariant[]>;

export function listScenarioControlIds(): string[] {
  return Object.keys(SCENARIO_CONTROL_VARIANTS).sort((left, right) => left.localeCompare(right));
}

export function summarizeScenarioControls(scenarioIds?: readonly string[]) {
  const selectedIds = scenarioIds == null
    ? listScenarioControlIds()
    : [...new Set(scenarioIds.filter((id) => id in SCENARIO_CONTROL_VARIANTS))].sort((left, right) => left.localeCompare(right));
  const byVariant = Object.fromEntries(CONTROL_VARIANTS.map((variant) => [variant, 0])) as Record<EvalControlVariant, number>;

  for (const scenarioId of selectedIds) {
    for (const variant of SCENARIO_CONTROL_VARIANTS[scenarioId] ?? []) {
      byVariant[variant] += 1;
    }
  }

  return {
    scenarioCount: selectedIds.length,
    byVariant,
  };
}

export function validateScenarioControls(scenarioIds: readonly string[]): string[] {
  const errors: string[] = [];
  const knownScenarioIds = new Set(scenarioIds);

  for (const scenarioId of listScenarioControlIds()) {
    const variants = SCENARIO_CONTROL_VARIANTS[scenarioId] ?? [];
    if (!knownScenarioIds.has(scenarioId)) {
      errors.push(`unknown scenario id in control matrix: ${scenarioId}`);
    }
    if (variants.length === 0) {
      errors.push(`control matrix entry has no variants: ${scenarioId}`);
      continue;
    }

    const seen = new Set<EvalControlVariant>();
    for (const variant of variants) {
      if (!CONTROL_VARIANTS.includes(variant)) {
        errors.push(`invalid control variant for ${scenarioId}: ${String(variant)}`);
        continue;
      }
      if (seen.has(variant)) {
        errors.push(`duplicate control variant for ${scenarioId}: ${variant}`);
        continue;
      }
      seen.add(variant);
    }
  }

  return errors;
}
