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
- Code adds `??`, `||`, schema defaults, fallback objects, implicit modes, or sample values for behavior tuning (retry count, timeout, page size, cache TTL, display limit).
- The same default appears in more than one module, or a default changes behavior across multiple features.
- Requiredness differs by mode, provider, stage, or feature flag.
- A broad app config owns defaults for unrelated modules, making ownership unclear.

Out of scope (route to security) — see `../typescript-security/rules/secrets-lifecycle.md`:
- URL, host, IP, endpoint, DSN, connection string, token, password, API key, credential, or secret fallbacks.
- Anything pointing at localhost, sandbox, staging, dev, or test resources as a code default.

Do:
- Treat defaults as production behavior, not developer convenience; put each default in one place (parser, composition root, or contextual module config factory), close to the behavior policy it expresses.
- For behavior-tuning values, put one production-safe default beside the contextual module policy that owns the behavior; use module-local config factories until a value is truly shared.
- For environment-specific or security-bearing values, require them instead of defaulting them here.
- Promote to root config only for service-wide runtime facts.

Avoid:
- Duplicating defaults in schema and caller.
- Silent fallbacks for critical behavior values, or defaults that make test behavior look like production behavior.
- A global config object that owns unrelated module defaults by convenience, or moving feature defaults into root config just because raw env is parsed there.

Exceptions:
- Production-safe defaults are acceptable for behavior tuning (display limits, retry counts, timeouts, page sizes, cache TTLs) when documented and tested.
- Migration may preserve a legacy default temporarily; record owner, tests, and removal/revisit condition.
- Truly service-wide facts (stage, region, app name) may have root-owned defaults only when the default remains correct in production; local `.env`/framework-local config files are inputs, not code defaults.

Example:

```ts
// Good: production-safe behavior default owned once by contextual config.
type EmailConfig = { timeoutMs: number; retryCount: number };

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return {
    timeoutMs: Number(env.EMAIL_TIMEOUT_MS ?? "5000"),
    retryCount: Number(env.EMAIL_RETRY_COUNT ?? "3"),
  };
}

// Out of scope — security-bearing fallbacks belong in secrets-lifecycle.md, not here:
const config = {
  apiBaseUrl: env.API_BASE_URL ?? "http://localhost:3000", // → secrets-lifecycle
  serviceToken: env.SERVICE_TOKEN ?? "test-token",          // → secrets-lifecycle
};
```

Verify:
- Ask: if production forgot this config, would this behavior still be correct?
- Confirm each default has one owner and a test.
- Check whether missing critical or environment-specific config fails fast instead of guessing.
- Check root config owns only service-wide facts, not feature-specific policy.
