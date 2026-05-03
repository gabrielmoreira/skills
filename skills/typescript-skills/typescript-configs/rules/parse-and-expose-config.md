---
id: typescript-configs.parse-and-expose-config
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Twelve-Factor III (Config)]
---

# Parse and Expose Config

Decision: Parse unknown config once at the boundary, then expose typed contextual config objects rather than raw values or a god app config.

Use when:
- Code reads `process.env`, CLI args, raw config files, or untyped runtime values.
- A config value is claimed with `!`, `as`, `Number(...)` without validation, or string truthiness.
- Feature modules read env directly.
- Feature modules accept broad `AppConfig` but use only a small slice.
- Config object names mirror provider/env names instead of module/app meaning.

Start here:
- Simple script: one small manual parser and one local config object.
- Medium app: parse raw values once, then pass module/feature configs such as `EmailConfig` or `StorageConfig`.
- Large app: root parsing plus module config factories; pass only contextual config inward.
- Framework-shaped app: respect the framework's config entrypoint, then adapt raw/framework config into contextual module config before owned feature logic.

Escalate when:
- More than a few fields need typed parsing.
- Modes make fields conditionally required.
- Failure shape must be consistent across the app.
- Multiple modules need different config slices.
- Tests become noisy because modules require unrelated config fields.
- Framework-level config objects are being passed through feature modules unchanged.
- Legacy env reads are scattered across behavior modules.

Complexity ladder:
1. Manual parser in one config boundary.
2. Framework entrypoint/parser when the framework owns config loading.
3. Schema parser for typed shape and consistent failure reporting.
4. Contextual module config such as `EmailConfig`, `BillingConfig`, or `StorageConfig`.
5. Module-local config factory for feature-specific policy/defaults.
6. Composition-root runtime config for service-wide facts only.
7. Migration seam for scattered legacy env reads.

Do:
- Collect raw values in one boundary module.
- Parse strings into booleans, numbers, URLs, enums, durations, arrays, and required fields deliberately.
- Expose typed config named by the module or capability context.
- Pass contextual config into feature modules and composition roots.
- Start simple, but do not leave raw unknown values or broad god configs in behavior code.
- Respect framework conventions for where config enters, but adapt to contextual configs before feature behavior.

Avoid:
- Reading `process.env` from behavior modules.
- Using non-null assertions or casts as validation.
- Using `||` when `0`, `false`, or empty string are valid values; use `??` for missingness.
- Exporting raw env maps as application config.
- Passing a full `AppConfig` into modules that need only one contextual slice.

Exceptions:
- Tests for the config-reading boundary may set env if they restore it.
- A small script or single-file tool may use one local config object until real module boundaries appear.
- A composition root may hold root runtime config while assembling dependencies, but should pass contextual config inward.
- Legacy migration may introduce a seam before full parsing; see `migration.md`.
- Framework config providers/modules may be the raw source boundary; they should not force feature modules to consume a broad framework config shape.

Preferred flow:
1. Read stage or startup inputs.
2. Load env/config files if the package or framework does that today.
3. Build typed contextual config.
4. Derive named feature decisions.
5. Verify resources or load secrets later in bootstrap/composition.
6. Pass ready config and dependencies inward.

Do not hide env loading, secret loading, or remote verification inside a pure config builder.

File layout when earned:

```txt
src/config/
  stage.ts         // stage reading, stage parsing, env-file resolution/loading
  featureFlags.ts  // named feature decisions
  serviceConfig.ts // typed config creation and validation
```

Keep one file while the package is small. Split once the file becomes hard to scan, grows past roughly 150-200 lines, or mixes three or more concerns: env loading, stage parsing, typed config building, feature decisions, resource naming.

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

Medium/large app: parse once, project contextual config.

```ts
type RuntimeConfig = {
  stage: "dev" | "prod";
  email: EmailConfig;
  billing: BillingConfig;
};

type EmailConfig = { apiKey: string; timeoutMs: number };

type BillingConfig = { apiKey: string };

export function parseRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  return {
    stage: parseStage(env.APP_STAGE),
    email: parseEmailConfig(env),
    billing: parseBillingConfig(env),
  };
}
```

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

Escalate to a schema when modes and conditional fields appear:

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
- Check pure config builders do not hide env loading, secret loading, or remote verification.
