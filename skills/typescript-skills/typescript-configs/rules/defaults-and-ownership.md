---
id: typescript-configs.defaults-and-ownership
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Twelve-Factor III, Secure by Default (OWASP)]
---

# Defaults and Ownership

Decision: A default is allowed only when it is production-safe and correct by nature; if missing config would not produce correct production behavior, require the value explicitly.

Use when:
- Code adds `??`, `||`, schema default, fallback object, implicit mode, or sample value.
- A fallback points at localhost, dev/staging services, test credentials, sample tokens, private IPs, or provider URLs.
- The same default appears in more than one module.
- A value is shared by multiple features or composition roots.
- Requiredness differs by mode, provider, stage, or feature flag.
- A broad app config owns defaults for unrelated modules.

Start here:
- Make environment-specific, security-sensitive, network, credential, billing, data, URL, host, IP, token, password, key, DSN, and connection-string values required.
- Put harmless production-safe defaults beside the contextual module policy they serve.

Escalate when:
- The default would silently select dev/test behavior.
- The same default appears in two modules.
- A default changes behavior across multiple features.
- Requiredness depends on mode/provider/stage.
- The value is a service-wide runtime fact.
- Ownership is unclear because a god config object owns too many defaults.

Complexity ladder:
1. Required config, no default.
2. Contextual module default only for production-safe behavior tuning.
3. Parser-owned default when it is part of that config contract.
4. Module config factory when feature policy derives defaults from root/runtime facts.
5. Composition-root default only for service-wide policy that remains correct in production.
6. Migration fallback with owner, tests, and removal/revisit condition.

Do:
- Treat defaults as production behavior, not developer convenience.
- Prefer required config for environment-specific values and anything that affects security, data, network targets, credentials, billing, or provider identity.
- Put each default in one place: parser, composition root, or contextual module config factory.
- Keep defaults close to the behavior policy they express.
- Use module-local config factories until a value is truly shared across the service.
- Promote to root config only for service-wide runtime facts.

Avoid:
- Dev/test defaults such as localhost URLs, sandbox endpoints, sample passwords, test tokens, private IPs, fake keys, or staging resource names.
- Defaults for URLs, hosts, IPs, DSNs, tokens, passwords, API keys, credentials, or connection strings unless the value is a genuinely public, non-sensitive, production-correct endpoint.
- Duplicating defaults in schema and caller.
- Silent fallbacks for critical values.
- Defaults that make test behavior look like production behavior.
- A global config object that owns unrelated module defaults by convenience.
- Moving feature defaults into root config just because raw env is parsed there.

Exceptions:
- Harmless production-safe defaults are acceptable for behavior tuning such as display limits, retry counts, timeouts, page sizes, or cache TTLs when documented and tested.
- Local development may use explicit `.env` or framework-local config files, but those values are inputs, not code defaults.
- Migration may preserve a legacy default temporarily; record owner, tests, and removal/revisit condition.
- Truly service-wide facts such as stage, region, and app name may have root-owned defaults only when the default remains correct for production.
- A public, non-sensitive endpoint may be defaulted only when it is genuinely production-correct, safe if omitted, and not a secret or credential. This exception aligns with `typescript-security/rules/secrets-lifecycle.md`.

Example:

Bad: missing config silently routes to development behavior.

```ts
const config = {
  apiBaseUrl: env.API_BASE_URL ?? "http://localhost:3000",
  serviceToken: env.SERVICE_TOKEN ?? "test-token",
};
```

Good: environment-specific coordinates and secrets are required.

```ts
type BillingConfig = {
  apiBaseUrl: string;
  serviceToken: string;
};

export function parseBillingConfig(env: NodeJS.ProcessEnv): BillingConfig {
  const apiBaseUrl = env.BILLING_API_BASE_URL;
  if (!apiBaseUrl) throw new Error("BILLING_API_BASE_URL is required");

  const serviceToken = env.BILLING_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("BILLING_SERVICE_TOKEN is required");

  return { apiBaseUrl, serviceToken };
}
```

Good: production-safe behavior default owned once by contextual config.

```ts
type EmailConfig = { timeoutMs: number; retryCount: number };

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return {
    timeoutMs: Number(env.EMAIL_TIMEOUT_MS ?? "5000"),
    retryCount: Number(env.EMAIL_RETRY_COUNT ?? "3"),
  };
}
```

Good: module policy derives a decision from a named flag, not from stage.

```ts
export function makeEmailConfig(flags: { isHighThroughputMode: boolean }): EmailConfig {
  return {
    timeoutMs: flags.isHighThroughputMode ? 3000 : 5000,
    retryCount: 3,
  };
}
```

Verify:
- For each default, ask: if production forgot this config, would this behavior still be correct?
- Search for localhost, sandbox, staging, sample, fake, test, token, password, key, URL, host, IP, DSN, and connection-string fallbacks.
- Confirm each default has one owner and a test.
- Check whether missing critical or environment-specific config fails fast instead of guessing.
- Check root config owns only service-wide facts, not feature-specific policy.
