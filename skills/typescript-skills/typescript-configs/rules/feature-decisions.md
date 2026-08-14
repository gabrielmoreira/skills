---
id: typescript-configs.feature-decisions
owner: typescript-configs
canonical: true
severity: default
references: [Feature Toggles (Fowler), Twelve-Factor III]
---

# Feature Decisions

Decision: **Parse a flag or a mode once into a named behaviour decision**, and never repeat a raw string check in application code.

Use when:
- **Code checks a raw flag outside config.** An env variable, a stage name, a flag string.
- **A flag changes which fields are required.**
- **A flag means more than a boolean.** Off, on, an allowlist, a percentage, a provider mode.
- **A stage name is standing in for behaviour.**
- **The same flag comparison repeats across modules.**
- **A rollout needs a stable behaviour name**, independent of how the variable is spelled.

Do:
- **Parse the raw flag at the config boundary**, and expose a decision named for the behaviour.
- **Name the behaviour, not the infrastructure variable.** `isPayloadEncryptionEnabled`, not `useNewFlagV2`.
- **Use a named union where a flag has several shapes or scopes.**
- **Validate the final config object** where a mode changes requiredness.
- **Pass named decisions inward as typed config**, keeping raw strings at the boundary.

Avoid:
- **A repeated raw env comparison** in handlers, resolvers, or domain logic.
- **A feature name describing infrastructure trivia** rather than behaviour.
- **Cross-field mode logic stuffed into a raw env schema**, when the real contract is the final config.
- **Using a stage comparison as a substitute for a named decision.**

Exceptions:
- **A tiny script MAY parse one boolean inline** until it grows a config boundary.
- **An existing stage convention MAY be preserved during migration**, with new behaviour getting a named decision.
- **Infrastructure code MAY select by stage** where stage genuinely is the contract.

Example (one instance, not the set):

```ts
// Bad: the raw flag leaks into behaviour.
if (process.env.USE_BANNER_BOX_API === "true") {
  return bannerBoxClient.search(input);
}

// Good: parsed once into a named decision that carries every shape it supports.
type BannerBoxDecision = false | true | { customerIds: string[] };

export function readUseBannerBoxApi(value: string | undefined): BannerBoxDecision {
  if (!value || value === "false") return false;
  if (value === "true") return true;
  return { customerIds: value.split(",").map((id) => id.trim()).filter(Boolean) };
}
```

Verify:
- **Search for raw flag checks outside config modules.**
- **Check the decision name describes behaviour.**
- **Check a multi-shape flag has an explicit type and a test per shape.**
- **Check mode-specific requiredness is validated on the final config object.**
