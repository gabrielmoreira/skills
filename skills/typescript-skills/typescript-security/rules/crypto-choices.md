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
- Security behavior changes by environment or mode.
- Algorithm, key type, signing strategy, token format, or verification policy is implicit.
- Multiple flags can combine into unclear states.

Start here:
- If there is one safe production behavior, make it explicit and reject missing/unknown choices.

Escalate when:
- There are multiple valid algorithms, protocols, key sources, or verification modes.
- Compatibility mode exists for legacy data or rollout.
- Test/local mode differs from production mode.
- More than one boolean would be needed to describe security behavior.

Complexity ladder:
1. Single explicit production mode.
2. Discriminated union for supported modes.
3. Compatibility mode with owner, tests, warning, and removal condition.
4. Policy object only when several security choices must be versioned together.

Do:
- Use explicit discriminated modes for meaningful security choices.
- Name algorithms, verification policy, and legacy compatibility deliberately.
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
