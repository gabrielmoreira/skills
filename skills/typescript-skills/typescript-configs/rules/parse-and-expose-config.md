---
id: typescript-configs.parse-and-expose-config
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Twelve-Factor III (Config)]
---

# Parse and Expose Config

Decision: Parse unknown config once at the boundary into typed values. This rule owns raw-to-typed parsing, requiredness, schema choice, and parser failure shape. For module slices and AppConfig avoidance, read `skill://typescript-skills/typescript-configs/rules/contextual-config.md`.

Use when:
- Code reads `process.env`, CLI args, raw config files, or untyped runtime values.
- A config value is claimed with `!`, `as`, `Number(...)` without validation, or string truthiness.
- Feature modules read env directly, or config object names mirror provider/env names instead of module/app meaning.
- A few fields turn into many, or modes make fields conditionally required.
- Framework-level config objects pass through feature modules unchanged, or legacy env reads are scattered across behavior modules.

Complexity ladder:
1. Manual parser in one config boundary.
2. Framework entrypoint/parser when the framework owns config loading.
3. Schema parser for typed shape and consistent failure reporting.
4. Schema with discriminated unions when modes make fields conditionally required.
5. Migration seam for scattered legacy env reads (see `migration.md`).

Do:
- Collect raw values in one boundary module; never let `process.env` reach behavior modules.
- Parse strings into booleans, numbers, URLs, enums, durations, arrays, and required fields deliberately.
- Expose typed config named by module or capability context; pass it into feature modules and composition roots.
- Respect framework entry conventions, then adapt to contextual configs before feature behavior.
- Start simple, but do not leave raw unknown values or broad god configs in behavior code.
- Split one config file into `stage.ts` / `featureFlags.ts` / `serviceConfig.ts` once it mixes env loading, typed config building, and feature decisions and grows past ~150-200 lines.

Avoid:
- Reading `process.env` from behavior modules, or exporting raw env maps / `Record<string, string>` as application config.
- Using non-null assertions or casts as validation.
- Using `||` when `0`, `false`, or empty string are valid values; use `??` for missingness.

Exceptions:
- Tests for the config boundary may set env if they restore it.
- Legacy migration may introduce a seam before full parsing; see `migration.md`.
- Framework config providers may be the raw source boundary, but feature modules should not consume a broad framework config shape.

For parser purity (no I/O, no network, no secret fetch), read `skill://typescript-skills/typescript-configs/rules/validation-vs-verification.md`. For secret-loading timing, read `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md`.

Example:

```ts
type EmailConfig = { apiKey: string; timeoutMs: number; retryCount: number };

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const apiKey = env.EMAIL_API_KEY;
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");
  return {
    apiKey,
    timeoutMs: parsePositiveInt(env.EMAIL_TIMEOUT_MS, 5000, "EMAIL_TIMEOUT_MS"),
    retryCount: parsePositiveInt(env.EMAIL_RETRY_COUNT, 3, "EMAIL_RETRY_COUNT"),
  };
}

// Escalate to a schema when provider/mode switches make fields conditionally required:
const EmailConfigSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("smtp"), smtpUrl: z.string().url() }),
  z.object({ provider: z.literal("ses"), region: z.string().min(1) }),
]);
```

For root-level shape and module-slice projection, read `skill://typescript-skills/typescript-configs/rules/contextual-config.md`.

Verify:
- Search for `process.env` outside config boundary and tests.
- Test parsed values, requiredness, defaults, and failure shape.
- Check returned config type is what callers use, not raw env shape.
- Check feature modules accept contextual config, not unrelated app-wide or framework-wide config.
