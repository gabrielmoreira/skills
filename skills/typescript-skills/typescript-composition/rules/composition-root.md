---
id: typescript-composition.composition-root
owner: typescript-composition
canonical: true
severity: default
references: [Composition Root (Mark Seemann), Clean Architecture, Ports and Adapters]
---

# Composition Root

Decision: Runtime decisions belong at the composition root or edge assembly layer, not inside behavior code.

Use when:
- Business logic chooses provider/client/adapter based on env, tenant, mode, region, or feature flag.
- A module constructs external clients while also doing domain behavior, or startup wiring, provider selection, and behavior are mixed.
- Tests need to control dependencies but code discovers them internally.
- Multiple entrypoints need the same dependencies, or request/tenant/provider scope changes construction.
- Framework conventions dictate where modules/providers/hooks are registered, and framework entrypoints are becoming thin pass-throughs for app-wide config or global singletons.

Do:
- Build and select dependencies at startup, request assembly, worker bootstrap, or controller edge; pass ready dependencies into behavior modules.
- Keep config reading before construction and behavior after construction.
- Name assembly functions clearly — prefer `makeXxx` for in-process construction (`makeApp`, `makeWorker`, `makeSendReceipt`); reserve `create` for domain/CRUD semantics when that distinction matters.
- Respect framework conventions for registration, routing, and lifecycle; apply module boundaries behind those conventions.

Avoid:
- Importing configured clients directly inside behavior modules, or reading env/config deep in behavior to choose dependencies.
- Reconstructing provider clients per call without scope reason.
- Hiding provider selection behind convenience singletons.

Exceptions:
- Very small scripts may assemble inline if no reusable behavior module exists.
- Framework-required composition can live in framework entrypoints, modules, providers, hooks, or plugins; keep framework details there and pass focused capabilities/config inward.

Example:

```ts
// Bad: behavior chooses runtime dependency.
export async function sendReceipt(order: Order) {
  const mailer = process.env.MAILER === "ses" ? makeSesMailer() : makeSmtpMailer();
  await mailer.send(order.email);
}

// Good: assembly chooses; behavior receives capability.
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

For larger or framework-shaped apps that need lazy/tiered scope (Express request-scoped, Lambda per-invocation), read `skill://typescript-skills/references/patterns/layered-resolve.md`. That pattern is reference material, not the canonical default — escalate to it only when `makeApp(config)` plus framework provider edges no longer fit.

Verify:
- Search for provider/client construction and env reads in behavior modules.
- Check behavior functions accept dependencies rather than discovering them.
- Check provider selection can be tested without mutating global state.
