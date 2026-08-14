---
id: typescript-configs.contextual-config
owner: typescript-configs
canonical: true
severity: default
references: [Interface Segregation (SOLID), Twelve-Factor III]
---

# Contextual Config

Decision: **Pass the smallest config a module actually needs.** A broad app config belongs at composition roots, framework entrypoints, or simple scripts, and nowhere else. Turning unknown values into typed ones belongs to `skill://typescript-skills/typescript-configs/rules/parse-and-expose-config.md`.

Use when:
- **A feature function accepts the whole app config** and reads three fields of it.
- **Tests must build large unrelated config objects** to exercise one module.
- **Several modules share one config type** carrying unrelated fields.
- **A config object grows feature fields, provider fields, and service-wide facts together.**
- **Framework modules are becoming pass-through carriers** for a god config object.

Do:
- **Pass only the fields the module owns or needs.**
- **Name config by module or capability**, never by the whole application.
- **Escalate only as the app grows.**
  - One local parsed config, in a script.
  - The framework-sanctioned source, at the edge.
  - Contextual feature configs, in a medium app.
  - Module config factories owning feature policy, in a large one.
  - Explicit module config contracts, in a shared package.
- **Keep service-wide facts at the composition root.** Stage, region, app name.
- **Respect framework placement conventions**, without letting framework shape reach every feature.
- **Keep secrets out of broad config objects.**

Avoid:
- **A god config imported by every feature.**
- **A feature module reaching into an unrelated config section.**
- **Tests constructing unrelated config** to reach one module.
- **Centralizing module-specific defaults** only because the parser can see everything.

Exceptions:
- **A small script MAY use one local config object** until it grows real module boundaries.
- **A composition root MAY hold a root config while assembling**, passing contextual config inward.
- **A framework-required config module MAY hold the broad shape while adapting it.**

Example (one instance, not the set):

```ts
// Bad: the feature depends on the whole application.
export function makeEmailSender(config: AppConfig) {
  return { send: (to: string) => sendEmail({ apiKey: config.emailApiKey, to }) };
}

// Good: the root projects a contextual slice.
type EmailConfig = { apiKey: string; timeoutMs: number };

export function makeEmailSender(config: EmailConfig) {
  return { send: (to: string) => sendEmail({ apiKey: config.apiKey, timeoutMs: config.timeoutMs, to }) };
}

export function makeApp(config: RuntimeConfig) {
  return { emailSender: makeEmailSender(config.email) };
}
```

Verify:
- **Check each module accepts only fields it uses.**
- **Check a module's test builds its config without unrelated fields.**
- **Search for the broad config type outside root assembly.**
- **Check framework-required config is adapted** before it reaches feature logic.
