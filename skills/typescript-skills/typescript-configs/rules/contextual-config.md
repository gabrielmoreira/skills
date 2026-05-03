---
id: typescript-configs.contextual-config
owner: typescript-configs
canonical: true
severity: default
references: [Interface Segregation (SOLID), Twelve-Factor III]
---

# Contextual Config

Decision: Pass the smallest contextual config a module needs; avoid broad app config objects except at composition roots, framework entrypoints, or simple scripts.

Use when:
- A feature function accepts `AppConfig` but reads only a few fields.
- Tests must build large unrelated config objects.
- Multiple modules share one config type with unrelated fields.
- A config object is growing with feature-specific fields, provider-specific fields, and service-wide facts together.
- Framework conventions expose one config source, but feature modules need only a contextual slice.

Start here:
- Simple script or single-file app: one local config object is acceptable.
- Framework-shaped app: use the framework's config entrypoint as the source boundary, then adapt to contextual module config before owned feature logic.

Escalate when:
- The app has multiple feature modules.
- A module needs only a slice of the root config.
- Teams or modules own different config policies.
- Tests become noisy because unrelated config fields are required.
- Framework modules/controllers/providers are becoming pass-through carriers for a god config object.

Complexity ladder:
1. Simple script: one local parsed config object.
2. Framework-shaped app: read from the framework-sanctioned config source at the edge.
3. Medium app: contextual feature configs such as `EmailConfig`, `BillingConfig`, `StorageConfig`.
4. Composition root or framework module: parse raw values once, then derive contextual configs for modules.
5. Large app: module config factories own feature policy and defaults; root config keeps only service-wide facts.
6. Shared package/public API: expose explicit module config contracts, not a private app-wide config shape.

Do:
- Pass only the config fields the module owns or needs.
- Name config by module or capability context, not by the whole application.
- Keep service-wide facts at the composition root.
- Let module config factories derive feature configs from parsed raw/root values when needed.
- Respect framework placement conventions, but do not let framework-level config shape leak into every feature.
- Keep secrets and secret values out of broad config objects.

Avoid:
- `AppConfig` as a god object imported by every feature.
- Feature modules reaching into unrelated config sections.
- Tests constructing unrelated config just to exercise one module.
- Centralizing module-specific defaults only because the parser can see everything.

Exceptions:
- A small script or single-file tool may use one local config object until it grows real module boundaries.
- A composition root may hold a root config while assembling dependencies, but should pass contextual config inward.
- Truly service-wide facts such as stage, region, and app name may stay in a root config.
- Framework-required config modules/providers may hold the broad config while adapting it; owned feature code should still receive contextual config.

Example:

Bad: feature depends on the whole app config.

```ts
type AppConfig = {
  stage: "dev" | "prod";
  emailApiKey: string;
  emailTimeoutMs: number;
  billingApiKey: string;
};

export function makeEmailSender(config: AppConfig) {
  return {
    send(to: string) {
      return sendEmail({ apiKey: config.emailApiKey, timeoutMs: config.emailTimeoutMs, to });
    },
  };
}
```

Good: composition root projects contextual config.

```ts
type RuntimeConfig = {
  stage: "dev" | "prod";
  email: EmailConfig;
  billing: BillingConfig;
};

type EmailConfig = {
  apiKey: string;
  timeoutMs: number;
};

export function makeEmailSender(config: EmailConfig) {
  return {
    send(to: string) {
      return sendEmail({ apiKey: config.apiKey, timeoutMs: config.timeoutMs, to });
    },
  };
}

export function makeApp(config: RuntimeConfig) {
  return {
    emailSender: makeEmailSender(config.email),
    billingClient: makeBillingClient(config.billing),
  };
}
```

Framework-shaped app: keep framework convention at the edge, then adapt.

```ts
// NestJS-style provider/factory at framework boundary.
export function makeEmailConfig(configService: ConfigService): EmailConfig {
  const apiKey = configService.get<string>("EMAIL_API_KEY");
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");

  return {
    apiKey,
    timeoutMs: Number(configService.get("EMAIL_TIMEOUT_MS") ?? "5000"),
  };
}

// Owned feature code receives only its contextual config.
export function makeEmailSender(config: EmailConfig) {
  return { send: (to: string) => sendEmail({ apiKey: config.apiKey, to }) };
}
```

Verify:
- Check each module accepts only the config fields it uses.
- Check tests for a module can build its contextual config without unrelated fields.
- Search for `AppConfig` imports outside composition/root assembly.
- Confirm service-wide facts or framework-required config objects are adapted before entering feature logic.
