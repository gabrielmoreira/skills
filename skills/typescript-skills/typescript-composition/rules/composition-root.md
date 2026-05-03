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
- A module constructs external clients while also doing domain behavior.
- Startup wiring, provider selection, and behavior are mixed.
- Tests need to control dependencies but code discovers them internally.
- Framework conventions dictate where modules/providers/hooks are registered.

Start here:
- For small apps, one explicit `makeApp` or entrypoint assembly function is enough.

Escalate when:
- Multiple entrypoints need the same dependencies.
- Request/tenant/provider scope changes construction.
- Tests require controlled fakes but behavior constructs real clients.
- Startup has multiple runtime decisions that need names.
- Framework entrypoints are becoming thin pass-throughs for app-wide config or global singletons.

Complexity ladder:
1. Inline assembly in one entrypoint.
2. `makeApp(config)` builds dependencies and returns public capabilities.
3. Module-local factories for feature-specific dependencies.
4. Request/tenant assembly for scoped dependencies.
5. Framework module/provider/hook composition when the framework owns registration.

Do:
- Build and select dependencies at startup, request assembly, worker bootstrap, or controller edge.
- Pass ready dependencies into behavior modules.
- Keep config reading before construction and behavior after construction.
- Name assembly functions clearly. Prefer `makeXxx` for in-process construction, such as `makeApp`, `makeWorker`, or `makeSendReceipt`; reserve `create` for domain/CRUD semantics when that distinction matters.
- Respect framework conventions for registration, routing, and lifecycle; apply module boundaries behind those conventions.

Avoid:
- Importing configured clients directly inside behavior modules.
- Reading env or config deep in behavior to choose dependencies.
- Reconstructing provider clients per call without scope reason.
- Hiding provider selection behind convenience singletons.

Exceptions:
- Very small scripts may assemble inline if no reusable behavior module exists.
- Framework-required composition can live in framework entrypoints, modules, providers, hooks, or plugins; keep framework details there and pass focused capabilities/config inward.

Example:

Bad: behavior chooses runtime dependency.

```ts
export async function sendReceipt(order: Order) {
  const mailer = process.env.MAILER === "ses" ? makeSesMailer() : makeSmtpMailer();
  await mailer.send(order.email);
}
```

Good: assembly chooses; behavior receives capability.

```ts
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

Framework-shaped app: use the framework entrypoint as the edge, not as a reason to leak globals.

```ts
// NestJS-style provider at the framework boundary.
export const emailSenderProvider = {
  provide: EmailSenderToken,
  useFactory: (configService: ConfigService) => {
    const emailConfig = makeEmailConfig(configService);
    const mailer = makeSesMailer(emailConfig);
    return makeSendReceipt({ mailer });
  },
};
```

For larger or framework-shaped apps that need lazy/tiered scope (Express request-scoped, Lambda per-invocation), see the layered-resolve pattern in `references/patterns/layered-resolve.md`. That pattern is reference material, not the canonical default — escalate to it only when `makeApp(config)` plus framework provider edges no longer fit.

Verify:
- Search for provider/client construction and env reads in behavior modules.
- Check behavior functions accept dependencies rather than discovering them.
- Check provider selection can be tested without mutating global state.
