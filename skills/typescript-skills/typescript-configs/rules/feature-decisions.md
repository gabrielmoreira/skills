---
id: typescript-configs.feature-decisions
owner: typescript-configs
canonical: true
severity: default
references: [Feature Toggles (Fowler), Twelve-Factor III]
---

# Feature Decisions

Decision: Parse feature flags and modes once into named behavior decisions. Do not repeat raw env/string checks in application code.

Use when:
- Code checks `process.env.FEATURE_X`, `USE_X`, stage names, or raw flag strings outside config.
- A flag or mode changes which fields are required.
- A flag can represent more than a boolean, such as false, true, allowlist, percentage, or provider mode.
- A stage/environment name is used as a proxy for behavior.
- Business logic repeats the same feature-flag comparison in multiple places.

Start here:
- Parse the raw flag at the config boundary and expose a named decision such as `isPayloadEncryptionEnabled` or `useBannerBoxApi`.

Escalate when:
- The flag supports multiple shapes or scopes.
- Required config fields change by mode/flag.
- Several modules need the same decision.
- Operational rollout needs a stable behavior name independent from env variable spelling.

Complexity ladder:
1. Boolean decision helper for one flag.
2. Named union decision for multi-shape flags.
3. Config-first validation when the flag changes requiredness.
4. Contextual module config that carries the named decision inward.
5. Feature-decision module only when several related flags must be understood together.

Do:
- Name the behavior decision, not the infrastructure variable.
- Validate the final config object when mode/stage/flag decisions change requiredness.
- Keep raw env flag strings at the config boundary.
- Pass named decisions inward as typed config.
- Keep stage/environment names out of application logic unless stage itself is the behavior being tested.

Avoid:
- Repeated `process.env.USE_X === "true"` checks in handlers, resolvers, datasources, or domain logic.
- Feature names that describe infrastructure trivia instead of user/system behavior.
- Stuffing cross-field mode logic into a raw env schema when the real contract is the final config object.
- Using `stage === "prod"` as a substitute for a named decision like `isPublicIntrospectionEnabled`.

Exceptions:
- A tiny script may parse one boolean inline until it grows a config boundary.
- Existing stage conventions may be preserved during migration, but new behavior should get a named decision.
- Infrastructure/deployment code may select by stage when stage is actually the infrastructure contract.

Example:

Bad: raw flag leaks into behavior.

```ts
if (process.env.USE_BANNER_BOX_API === "true") {
  return bannerBoxClient.search(input);
}
```

Good: parse once and name the behavior.

```ts
type BannerBoxDecision = false | true | { customerIds: string[] };

export function readUseBannerBoxApi(value: string | undefined): BannerBoxDecision {
  if (!value || value === "false") return false;
  if (value === "true") return true;
  return { customerIds: value.split(",").map((id) => id.trim()).filter(Boolean) };
}
```

Good: application code consumes the decision.

```ts
export function makeSearchProducts(config: { useBannerBoxApi: BannerBoxDecision }) {
  return async (input: SearchInput) => {
    if (config.useBannerBoxApi === false) return legacySearch(input);
    return bannerBoxSearch(input, config.useBannerBoxApi);
  };
}
```

Verify:
- Search for raw env flag checks outside config modules.
- Check the decision name describes behavior.
- Check multi-shape flags have explicit types and tests for every supported shape.
- Check mode-specific requiredness is validated on the final config object.
- Check application code consumes typed decisions, not raw strings.
