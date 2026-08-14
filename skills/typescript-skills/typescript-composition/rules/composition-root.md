---
id: typescript-composition.composition-root
owner: typescript-composition
canonical: true
severity: default
references: [Composition Root (Mark Seemann), Clean Architecture, Ports and Adapters]
---

# Composition Root

Decision: **Runtime decisions belong at the composition root or the edge assembly layer, never inside behaviour code.**

Use when:
- **Business logic picks a provider, client, or adapter** from env, tenant, mode, region, or a feature flag.
- **A module builds external clients and does domain work in the same file.**
- **Startup wiring, provider selection, and behaviour are mixed together.**
- **Tests need to control a dependency** that the code discovers internally.
- **Several entrypoints need the same dependencies**, or scope changes construction per request or tenant.
- **Framework entrypoints are turning into pass-throughs** for app-wide config or global singletons.

Do:
- **Build and select dependencies at one of these**, then pass ready ones inward.
  - Startup.
  - Request assembly.
  - Worker bootstrap.
  - The controller edge.
- **Read config before construction, and run behaviour after it.**
- **Name assembly functions for what they assemble.** Prefer `makeXxx` for in-process construction, such as `makeApp` or `makeSendReceipt`.
- **Reserve `create` for domain or CRUD meaning**, where that distinction matters.
- **Respect the framework's conventions** for registration, routing, and lifecycle, and put module boundaries behind them.

Avoid:
- **Importing a configured client inside a behaviour module.**
- **Reading env or config deep in behaviour to pick a dependency.**
- **Rebuilding a provider client per call** with no scope reason.
- **Hiding provider selection behind a convenience singleton.**

Exceptions:
- **A very small script MAY assemble inline** where no reusable behaviour module exists.
- **Framework-required composition MAY live in framework entrypoints**, modules, providers, hooks, or plugins. Keep the framework detail there and pass focused capabilities inward.

Example (one instance, not the set):

```ts
// Bad: behaviour chooses its own runtime dependency.
export async function sendReceipt(order: Order) {
  const mailer = process.env.MAILER === "ses" ? makeSesMailer() : makeSmtpMailer();
  await mailer.send(order.email);
}

// Good: assembly chooses, behaviour receives a capability.
export function makeSendReceipt({ mailer }: { mailer: Mailer }) {
  return async (order: Order) => {
    await mailer.send(order.email);
  };
}

export function makeApp(config: AppConfig) {
  const mailer = config.mailer === "ses" ? makeSesMailer(config) : makeSmtpMailer(config);
  return { sendReceipt: makeSendReceipt({ mailer }) };
}
```

- **Where lazy or tiered scope is genuinely needed**, read `skill://typescript-skills/references/patterns/layered-resolve.md`. That is reference material, not the default. Escalate to it only once `makeApp(config)` plus framework provider edges stop fitting.

Verify:
- **Search behaviour modules for client construction and env reads.**
- **Check behaviour functions accept dependencies** rather than discovering them.
- **Check provider selection is testable** without mutating global state.
