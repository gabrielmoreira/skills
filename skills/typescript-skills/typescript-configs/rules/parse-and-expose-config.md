---
id: typescript-configs.parse-and-expose-config
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Twelve-Factor III (Config)]
---

# Parse and Expose Config

Decision: **Parse unknown config once, at the boundary, into typed values.** This rule owns raw-to-typed parsing, requiredness, schema choice, and parser failure shape. Who receives which slice belongs to `skill://typescript-skills/typescript-configs/rules/contextual-config.md`.

Use when:
- **Code reads unknown runtime values.** `process.env`, CLI args, raw config files.
- **A value is claimed rather than checked.** A `!`, an `as`, a bare `Number(...)`, or string truthiness.
- **Feature modules read env directly.**
- **Config names mirror provider or env names** instead of module meaning.
- **A few fields turn into many**, or a mode makes fields conditionally required.
- **A framework config object passes through feature modules unchanged.**

Do:
- **Collect raw values in one boundary module.** Never let `process.env` reach behaviour code.
- **Parse deliberately into real types.** Booleans, numbers, URLs, enums, durations, arrays, and required fields.
- **Escalate only as the shape demands.**
  - A manual parser in one boundary.
  - The framework entrypoint, where the framework owns loading.
  - A schema parser, for typed shape and consistent failure reporting.
  - A discriminated union, once a mode makes fields conditionally required.
- **Expose config named by module or capability**, and pass it inward.
- **Split the config file once it mixes loading, building, and feature decisions** and has grown past roughly 150 lines.

Avoid:
- **Reading `process.env` from a behaviour module.**
- **Exporting a raw env map as application config.**
- **A non-null assertion or a cast standing in for validation.**
- **`||` where `0`, `false`, or an empty string are valid.** Use `??` for missingness.

Exceptions:
- **A config-boundary test MAY set env**, provided it restores it.
- **A migration MAY introduce a seam before full parsing.**
- **A framework provider MAY be the raw source boundary**, as long as feature modules do not consume its broad shape.

Example (one instance, not the set):

```ts
type EmailConfig = { apiKey: string; timeoutMs: number; retryCount: number };

export function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const apiKey = env.EMAIL_API_KEY;
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");
  return {
    apiKey,
    timeoutMs: parsePositiveInt(env.EMAIL_TIMEOUT_MS, 5000, "EMAIL_TIMEOUT_MS"),
    retryCount: parsePositiveInt(env.EMAIL_RETRY_COUNT, 3, "EMAIL_RETRY_COUNT"),
  };
}
```

- **Keep the parser pure**, per `skill://typescript-skills/typescript-configs/rules/validation-vs-verification.md`.

Verify:
- **Search for `process.env` outside the config boundary and its tests.**
- **Test parsed values, requiredness, defaults, and the failure shape.**
- **Check callers use the returned type**, not the raw env shape.
