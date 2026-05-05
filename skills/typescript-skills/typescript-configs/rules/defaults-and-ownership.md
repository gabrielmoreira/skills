---
id: typescript-configs.defaults-and-ownership
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Twelve-Factor III, Secure by Default (OWASP)]
---

# Defaults and Ownership

Decision: A default is allowed only when it is production-safe and correct by nature. Each default has one owner. Environment-specific or security-bearing values are out of scope here — see `../typescript-security/rules/secrets-lifecycle.md`.

Use when:
- Code adds `??`, `||`, schema defaults, fallback objects, implicit modes, or sample values for behavior tuning.
- A retry count, timeout, page size, cache TTL, or display limit needs a value.
- The same default appears in more than one module.
- Requiredness differs by mode, provider, stage, or feature flag.
- A broad app config owns defaults for unrelated modules.

Out of scope (route to security):
- URL, host, IP, endpoint, DSN, connection string, token, password, API key, credential, or secret fallbacks.
- Anything pointing at localhost, sandbox, staging, dev, or test resources as a code default.

Start here:
- For behavior tuning values (timeouts, retries, limits), put one production-safe default beside the contextual module policy that owns the behavior.
- For environment-specific or security-bearing values, require them; do not default them here. See `../typescript-security/rules/secrets-lifecycle.md`.

Escalate when:
- The same default appears in two modules.
- A default changes behavior across multiple features.
- Requiredness depends on mode/provider/stage.
- The value is a service-wide runtime fact.
- Ownership is unclear because a god config object owns too many defaults.

Complexity ladder:
1. Required config, no default.
2. Contextual module default for production-safe behavior tuning.
3. Parser-owned default when it is part of that config contract.
4. Module config factory when feature policy derives defaults from root/runtime facts.
5. Composition-root default only for service-wide policy that remains correct in production.
6. Migration fallback with owner, tests, and removal/revisit condition.

Do:
- Treat defaults as production behavior, not developer convenience.
- Put each default in one place: parser, composition root, or contextual module config factory.
- Keep defaults close to the behavior policy they express.
- Use module-local config factories until a value is truly shared across the service.
- Promote to root config only for service-wide runtime facts.

Avoid:
- Duplicating defaults in schema and caller.
- Silent fallbacks for critical behavior values.
- Defaults that make test behavior look like production behavior.
- A global config object that owns unrelated module defaults by convenience.
- Moving feature defaults into root config just because raw env is parsed there.

Exceptions:
- Production-safe defaults are acceptable for behavior tuning such as display limits, retry counts, timeouts, page sizes, or cache TTLs when documented and tested.
- Local development may use explicit `.env` or framework-local config files, but those values are inputs, not code defaults.
- Migration may preserve a legacy default temporarily; record owner, tests, and removal/revisit condition.
- Truly service-wide facts such as stage, region, and app name may have root-owned defaults only when the default remains correct in production.

Example:

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

Good: module policy derives a decision from a named flag (`isHighThroughputMode`), not from env stage (`ENV === 'prod'`).

```ts
export function makeEmailConfig(flags: { isHighThroughputMode: boolean }): EmailConfig {
  return {
    timeoutMs: flags.isHighThroughputMode ? 3000 : 5000,
    retryCount: 3,
  };
}
```

Out of scope — security-bearing fallbacks belong in `../typescript-security/rules/secrets-lifecycle.md`:

```ts
// Wrong file for this concern. Route URL/token/credential fallback questions to security.
const config = {
  apiBaseUrl: env.API_BASE_URL ?? "http://localhost:3000", // → secrets-lifecycle
  serviceToken: env.SERVICE_TOKEN ?? "test-token",          // → secrets-lifecycle
};
```

Verify:
- For each default, ask: if production forgot this config, would this behavior still be correct?
- Confirm each default has one owner and a test.
- Check whether missing critical or environment-specific config fails fast instead of guessing.
- Check root config owns only service-wide facts, not feature-specific policy.
- Check security-bearing fallbacks (URL/host/IP/token/credential) are not defined here; they belong to `../typescript-security/rules/secrets-lifecycle.md`.
