---
id: typescript-configs.parse-and-expose-config
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Twelve-Factor III (Config)]
---

# Parse and Expose Config

Decision: Parse unknown config once at the boundary into typed values. This rule owns raw-to-typed parsing, requiredness, schema choice, and parser failure shape. For module slices and AppConfig avoidance, see `rules/contextual-config.md`.

Use when:
- Code reads `process.env`, CLI args, raw config files, or untyped runtime values.
- A config value is claimed with `!`, `as`, `Number(...)` without validation, or string truthiness.
- Feature modules read env directly.
- Config object names mirror provider/env names instead of module/app meaning.

Start here:
- Read raw values once at a parser boundary; do not let `process.env` reach behavior modules.
- Return typed config; never expose raw strings or untyped values to callers.
- Parse strings deliberately into booleans, numbers, URLs, durations, arrays, enums, and required fields.

Escalate when:
- A few fields turn into many.
- Modes make fields conditionally required.
- Failure shape must stay consistent across the app.
- Tests get noisy because modules require unrelated config.
- Framework-level config objects are passed through feature modules unchanged.
- Legacy env reads are scattered across behavior modules.

Complexity ladder:
1. Manual parser in one config boundary.
2. Framework entrypoint/parser when the framework owns config loading.
3. Schema parser for typed shape and consistent failure reporting.
4. Schema with discriminated unions when modes make fields conditionally required.
5. Migration seam for scattered legacy env reads.

Do:
- Collect raw values in one boundary module.
- Parse strings into booleans, numbers, URLs, enums, durations, arrays, and required fields deliberately.
- Expose typed config named by module or capability context.
- Pass contextual config into feature modules and composition roots.
- Start simple, but do not leave raw unknown values or broad god configs in behavior code.
- Respect framework entry conventions, then adapt to contextual configs before feature behavior.

Avoid:
- Reading `process.env` from behavior modules.
- Using non-null assertions or casts as validation.
- Using `||` when `0`, `false`, or empty string are valid values; use `??` for missingness.
- Exporting raw env maps as application config.
- Returning `Record<string, string>` or similar unparsed env shapes.

Exceptions:
- Tests for the config boundary may set env if they restore it.
- Legacy migration may introduce a seam before full parsing; see `migration.md`.
- Framework config providers may be the raw source boundary, but feature modules should not consume a broad framework config shape.

Preferred flow:
1. Read startup inputs.
2. Load env/config files if the package or framework already does that.
3. Build typed contextual config.
4. Derive named feature decisions.
5. Verify resources or load secrets later in bootstrap/composition.
6. Pass ready config and dependencies inward.

For parser purity (no I/O, no network, no secret fetch), see `rules/validation-vs-verification.md`. For secret-loading timing, see `../typescript-security/rules/secrets-lifecycle.md`.

File layout when earned:

```txt
src/config/
  stage.ts         // stage reading, env-file loading
  featureFlags.ts  // named feature decisions
  serviceConfig.ts // typed config creation and validation
```

Keep one file while the package is small. Split once the file stops being easy to scan, grows past roughly 150-200 lines, or mixes env loading, typed config building, and feature decisions.

Example:

Simple script: one local parser is enough.

```ts
type EmailConfig = { apiKey: string; timeoutMs: number };

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const apiKey = env.EMAIL_API_KEY;
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");

  const timeoutMs = Number(env.EMAIL_TIMEOUT_MS ?? "5000");
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("EMAIL_TIMEOUT_MS must be a positive integer");
  }

  return { apiKey, timeoutMs };
}
```

Multi-field parser with deliberate string-to-typed conversions:

```ts
type EmailConfig = {
  apiKey: string;
  timeoutMs: number;
  retryCount: number;
  enabledRegions: string[];
};

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const apiKey = env.EMAIL_API_KEY;
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");
  const timeoutMs = parsePositiveInt(env.EMAIL_TIMEOUT_MS, 5000, "EMAIL_TIMEOUT_MS");
  const retryCount = parsePositiveInt(env.EMAIL_RETRY_COUNT, 3, "EMAIL_RETRY_COUNT");
  const enabledRegions = (env.EMAIL_ENABLED_REGIONS ?? "us-east-1").split(",").filter(Boolean);
  return { apiKey, timeoutMs, retryCount, enabledRegions };
}
```

For root-level shape and module-slice projection, see `rules/contextual-config.md`.

Framework-shaped app: adapt at the framework boundary.

```ts
// Next.js / Expo / NestJS entrypoints may dictate where raw config is available.
// Keep that convention, then project the contextual config used by owned code.
export function makeEmailConfig(source: FrameworkConfigSource): EmailConfig {
  const apiKey = source.get("EMAIL_API_KEY");
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");

  return {
    apiKey,
    timeoutMs: Number(source.get("EMAIL_TIMEOUT_MS") ?? "5000"),
  };
}
```

Escalate to a schema when provider/mode switches make fields conditionally required:

```ts
const EmailConfigSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("smtp"), smtpUrl: z.string().url() }),
  z.object({ provider: z.literal("ses"), region: z.string().min(1) }),
]);
```

Verify:
- Search for `process.env` outside config boundary and tests.
- Test parsed values, requiredness, defaults, and failure shape.
- Check returned config type is what callers use, not raw env shape.
- Check feature modules accept contextual config, not unrelated app-wide or framework-wide config.
