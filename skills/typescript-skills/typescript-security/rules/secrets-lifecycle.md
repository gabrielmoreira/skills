---
id: typescript-security.secrets-lifecycle
owner: typescript-security
canonical: true
severity: hard-gate
references: [Twelve-Factor III, OWASP Secrets Management]
---

# Secrets Lifecycle

Decision: Secret values and environment-specific coordinates are explicit inputs: they are fetched or provided later, never defaulted from dev/test values, and never treated as ordinary config.

Use when:
- Code handles API keys, tokens, passwords, private keys, credentials, signing secrets, or connection strings.
- Config contains a secret value or a pointer to one.
- Config contains URLs, hosts, IPs, DSNs, endpoints, resource names, or other environment-specific coordinates.
- A test secret, sample credential, localhost URL, sandbox endpoint, private IP, or fallback credential is proposed.
- Secret fetching happens during config parsing.

Do:
- Parse secret source pointers as config when needed.
- Require secret values and environment-specific coordinates explicitly; fail fast when missing.
- Fetch secret values during startup/bootstrap or an explicit secret-loading phase.
- Keep test secrets in tests only and name them as test data.
- Treat connection strings, signed URLs, service endpoints, tokens, passwords, API keys, and private IP targets as sensitive or environment-specific unless proven otherwise.

Avoid:
- Test credentials, localhost URLs, sandbox endpoints, fake tokens, private IPs, or sample keys as production defaults.
- Fetching secret values in pure config parsers.
- Passing secret values through broad config objects.
- Logging or rethrowing secret values or sensitive coordinates.
- Assuming all pointers are safe to log.

Exceptions:
- Local development may use explicit `.env`, framework-local config, or secret-manager values, but those values are inputs, not code defaults.
- A pointer may be logged only if classified as non-sensitive metadata by policy; otherwise redact it.
- A public non-sensitive endpoint may be defaulted only when it is genuinely production-correct and safe if omitted; otherwise require it.


Common bypass attempts and rebuttals:

- "It's just for local dev, CI sets the real value": local dev provides the value through explicit `.env` or framework-local config. A code default puts the localhost URL into production binary; one missing CI variable and prod silently calls localhost. Required + fail-fast removes that whole class of incident.
- "It's not a secret, it's a public AWS/SQS/queue URL": environment-specific coordinates are still explicit inputs. Public ≠ shared between stages. Hard-coding `sqs://prod-queue` is one fat-finger away from staging-to-prod data crossover.
- "We've used this default for years, it's fine": defaults are production policy, not history. The day prod silently routes to the dev endpoint is the day the default's cost shows up. Required values pay nothing in production and prevent the failure entirely.

First-line: secret values do not enter the typed config object. Config carries the *pointer* (ARN, secret name, env var name); the secret value is fetched later in startup/bootstrap, redacted in any log path. See `rules/redaction.md`.
Verify:
- Search for default credentials, sample keys, localhost URLs, sandbox endpoints, private IPs, and secret-looking literals.
- Check parsers expose source pointers or explicit coordinates, not fetched secret values.
- Check missing secrets and environment-specific coordinates fail fast.
- Check secret loading errors are distinct from config parse errors.
- Check logs/errors redact secret values and sensitive pointers.
