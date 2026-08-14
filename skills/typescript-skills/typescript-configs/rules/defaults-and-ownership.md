---
id: typescript-configs.defaults-and-ownership
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Twelve-Factor III, Secure by Default (OWASP)]
---

# Defaults and Ownership

Decision: **A default is allowed only where it is production-safe and correct by nature, and each default has exactly one owner.** Environment-specific and security-bearing values are out of scope here, and belong to `skill://typescript-skills/typescript-security/rules/secrets-lifecycle.md`.

Use when:
- **A fallback is being added for a behaviour-tuning value.** A retry count, timeout, page size, cache TTL, display limit.
- **The same default appears in more than one module.**
- **Requiredness differs by mode, provider, stage, or flag.**
- **A broad config owns defaults for unrelated modules**, so nobody owns any of them.

Do:
- **Treat a default as production behaviour, not developer convenience.** It is what runs when nobody set the value.
- **Put each default in exactly one place**, next to the policy it expresses.
- **Keep a behaviour-tuning default beside the contextual module config** that owns that behaviour.
- **Require an environment-specific or security-bearing value** rather than defaulting it.
- **Promote to root config only for service-wide runtime facts.**

Avoid:
- **Duplicating a default in the schema and again in the caller.** They will disagree.
- **A silent fallback for a critical behaviour value.**
- **A default that makes test behaviour look like production behaviour.**
- **Moving feature defaults into root config** just because raw values are parsed there.

Exceptions:
- **A production-safe behaviour default is fine**, documented and tested. Display limits, retry counts, timeouts, page sizes, cache TTLs.
- **A migration MAY keep a legacy default temporarily**, with an owner, tests, and a removal condition.
- **A service-wide fact MAY have a root-owned default** only where that default stays correct in production.

Example (one instance, not the set):

```ts
// Good: a production-safe behaviour default, owned once.
type EmailConfig = { timeoutMs: number; retryCount: number };

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return {
    timeoutMs: Number(env.EMAIL_TIMEOUT_MS ?? "5000"),
    retryCount: Number(env.EMAIL_RETRY_COUNT ?? "3"),
  };
}

// Out of scope here: these are security-bearing and must be required.
const wrong = {
  apiBaseUrl: env.API_BASE_URL ?? "http://localhost:3000",
  serviceToken: env.SERVICE_TOKEN ?? "test-token",
};
```

Verify:
- **Ask whether the behaviour is still correct if production forgot this value.** That is the whole test.
- **Confirm each default has one owner and one test.**
- **Check a missing critical value fails fast** rather than guessing.
- **Check root config owns only service-wide facts.**
