---
id: typescript-security.secrets-lifecycle
owner: typescript-security
canonical: true
severity: hard-gate
references: [Twelve-Factor III, OWASP Secrets Management]
---

# Secrets Lifecycle

Decision: **A secret value and an environment-specific coordinate are explicit inputs.** They are fetched or provided later, never defaulted from a development value, and never treated as ordinary config.

Use when:
- **Code handles a credential.**
  - An API key, a token, or a password.
  - A private key or a signing secret.
  - A connection string.
- **Config holds a secret value, or a pointer to one.**
- **Config holds an environment-specific coordinate.** A URL, host, IP, DSN, endpoint, or resource name.
- **A development value is proposed as a default.**
  - A test secret or a sample credential.
  - A localhost URL or a sandbox endpoint.
  - A private IP or a fallback credential.
- **Secret fetching is happening during config parsing.**

Do:
- **Parse the pointer as config**, not the value behind it.
- **Require the value explicitly and fail fast when it is missing.**
- **Fetch during startup or an explicit secret-loading phase**, separate from parsing.
- **Keep a test secret in tests, named as test data.**
- **Treat these as sensitive unless proven otherwise.**
  - Connection strings and signed URLs.
  - Service endpoints and private IP targets.
  - Tokens, passwords, and API keys.

Avoid:
- **A development value as a production default.**
- **Fetching a secret inside a pure config parser.**
- **Passing a secret value through a broad config object.**
- **Logging or rethrowing a secret value or a sensitive coordinate.**
- **Assuming every pointer is safe to log.**

Exceptions:
- **Local development MAY supply values through an explicit local config.** Those are inputs, never code defaults.
- **A pointer MAY be logged once policy calls it non-sensitive.** Otherwise redact it.
- **A public endpoint MAY be defaulted** only where it is production-correct and harmless if omitted.

Example (one instance, not the set):

Three arguments that come up, and what answers them:

- **"It is just for local dev, CI sets the real value."** The default ships in the production binary. One missing variable and production quietly calls localhost.
- **"It is not a secret, it is a public queue URL."** Public does not mean shared between stages. A hard-coded production queue is one fat-finger from staging writing into production.
- **"We have used this default for years."** A default is production policy, not history. Requiring the value costs nothing and prevents the failure outright.

Verify:
- **Search for a development value used as a default.** Sample keys, localhost URLs, sandbox endpoints, private IPs.
- **Check parsers expose pointers**, never fetched values.
- **Check a missing secret fails fast**, with loading errors distinct from parse errors.
- **Check logs redact values and sensitive pointers**, per `skill://typescript-skills/typescript-security/rules/redaction.md`.
