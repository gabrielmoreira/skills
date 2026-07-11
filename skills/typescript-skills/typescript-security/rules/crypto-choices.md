---
id: typescript-security.crypto-choices
owner: typescript-security
canonical: true
severity: hard-gate
references: [OWASP Cryptographic Failures]
---

# Crypto Choices

Decision: Model crypto and security behavior as explicit modes or algorithms, not ambiguous booleans or hidden defaults.

Use when:
- Code adds `secure`, `encrypted`, `useTls`, `verify`, `legacy`, or similar boolean flags.
- Security behavior changes by environment or mode, or test/local mode differs from production mode.
- Algorithm, key type, signing strategy, token format, or verification policy is implicit, or multiple valid algorithms/protocols/key sources exist.
- Multiple flags can combine into unclear or impossible states.

Do:
- If there is one safe production behavior, make it explicit and reject missing/unknown choices.
- Use explicit discriminated modes for meaningful security choices; name algorithms, verification policy, and legacy compatibility deliberately.
- Scale from a single explicit production mode, to a discriminated union of supported modes, to a documented compatibility mode (owner, tests, warning, removal condition) only when legacy data or rollout needs it.
- Reject invalid combinations during parsing or construction.
- Keep insecure/test modes visibly named and bounded.

Avoid:
- Boolean flags that hide which security behavior is active.
- Defaults that silently choose weaker behavior.
- Multiple optional fields that allow impossible security states.
- Environment-specific security branches scattered across behavior code.

Exceptions:
- A boolean is acceptable only when there are exactly two obvious states and no security nuance is hidden.
- Compatibility modes may exist temporarily with owner, tests, warning, and removal condition.

Example:

Bad: boolean hides policy.

```ts
type TokenConfig = { secure: boolean; secret: string };
```

Good: mode names the behavior.

```ts
type TokenConfig =
  | { mode: "hmac-sha256"; secret: string }
  | { mode: "jwks-rs256"; jwksUrl: string };
```

Verify:
- List every possible mode and confirm each is deliberate.
- Check invalid combinations fail before behavior runs.
- Check tests cover each supported mode and at least one rejected invalid combination.
