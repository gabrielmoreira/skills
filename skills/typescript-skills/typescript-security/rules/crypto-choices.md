---
id: typescript-security.crypto-choices
owner: typescript-security
canonical: true
severity: hard-gate
references: [OWASP Cryptographic Failures]
---

# Crypto Choices

Decision: **Model crypto and security behaviour as an explicit mode or a named algorithm, never as an ambiguous boolean or a hidden default.**

Use when:
- **Code adds a security-shaped boolean.** `secure`, `encrypted`, `useTls`, `verify`, `legacy`.
- **Security behaviour changes by environment or mode**, or local differs from production.
- **Something security-relevant is implicit.**
  - The algorithm.
  - The key type.
  - The signing strategy.
  - The token format or verification policy.
- **Several valid algorithms, protocols, or key sources exist.**
- **Flags can combine into unclear or impossible states.**

Do:
- **Where one production behaviour is safe, make it explicit** and reject anything missing or unknown.
- **Use a discriminated union for a meaningful security choice**, so the mode names the behaviour.
- **Name the algorithm, the verification policy, and any legacy compatibility deliberately.**
- **Scale up only as the need appears.**
  - One explicit production mode.
  - A discriminated union of supported modes.
  - A documented compatibility mode, once legacy data or a rollout genuinely needs it.
- **Reject an invalid combination during parsing or construction**, before behaviour runs.
- **Keep an insecure or test mode visibly named and bounded.**

Avoid:
- **A boolean that hides which security behaviour is active.**
- **A default that silently picks the weaker option.**
- **Several optional fields that together allow an impossible state.**
- **Environment-specific security branches scattered through behaviour code.**

Exceptions:
- **A boolean is fine with exactly two obvious states** and no security nuance hidden behind it.
- **A compatibility mode MAY exist temporarily**, with an owner, tests, a warning, and a stated removal condition.

Example (one instance, not the set):

Bad: the boolean hides the policy.

```ts
type TokenConfig = { secure: boolean; secret: string };
```

Good: the mode names the behaviour.

```ts
type TokenConfig =
  | { mode: "hmac-sha256"; secret: string }
  | { mode: "jwks-rs256"; jwksUrl: string };
```

Verify:
- **List every mode that can be reached and confirm each one is deliberate.**
- **Check an invalid combination fails before behaviour runs.**
- **Check tests cover each supported mode**, plus at least one rejected combination.
