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


Advanced: layered resolve — the Composition Root of Clean Architecture, lazy and tiered by scope.

This is the outermost ring: the only place that knows all adapters, all ports, and all use cases. Tiers map to rings: runtime (infra/framework) → application (adapters satisfy ports) → request (use cases assembled with scoped deps). Each tier memoizes at its own lifecycle. Request-scoped resolvers use the request reference as cache key.

```ts
// runtime.ts — app-scoped singletons
export const resolveEnv = memoizeSingleton((): RuntimeEnv => getPlatformProcessEnv());
export const resolveBaseLogger = memoizeSingleton(
  (): Logger => loggerFactory({ serviceName: resolveEnv().SERVICE_NAME ?? "my-app" }),
);
export const resolveSecretRuntime = memoizeSingleton(() =>
  secretRuntimeFactory({
    env: selectSecretsEnv(resolveEnv()),
    logger: resolveBaseLogger(),
  }),
);
```

```ts
// application.ts — app-scoped infra capabilities
const resolveDatabase = memoizeSingleton(() =>
  databaseFactory({ connectionString: resolveDatabaseConfig().connectionString }),
);
export const resolveNotesStorage = memoizeSingleton(
  (): NotesStorageCapability =>
    notesStorageCapabilityFactory({
      driver: mongoNotesProviderFactory({
        resolveCollection: async () => resolveDatabase().collection("notes"),
      }),
    }),
);
```

```ts
// request.ts — request-scoped, memoized by request reference
export const resolveRequestFeatureFlags = memoizeByReference(
  (request: HostRequest): RequestFeatureFlags =>
    requestFeatureFlagsFactory({
      logger: resolveBaseLogger(),
      request,
      systemFeatureFlags: resolveSystemFeatureFlags(),
    }),
);
export const resolveCreateNoteUsecase = memoizeByReference(
  (request: HostRequest) =>
    createNoteUsecaseFactory({ notesStorage: resolveNotesStorage(request) }),
);
```

```ts
// server.ts — middleware projects request-scoped capabilities
export const resolveContextMiddleware = memoizeSingleton(() =>
  function contextMiddleware(req: Request, _res: Response, next: NextFunction) {
    req.appContext = {
      createNote: resolveCreateNoteUsecase(req),
      listNotes: resolveListNotesUsecase(req),
    };
    next();
  },
);
```

Scope tiers: runtime (env, logger, secrets) → application (database, storage, connectors) → request (feature flags, use cases). Each tier only references tiers above it.

Lambda variant: same tiers, but the handler file is the edge. Each handler singleton wraps `{ event, awsContext }` as the request reference and resolves request-scoped capabilities per invocation. The handler file exports a testable factory and a Lambda entrypoint.

```ts
// handlers.ts — handler singletons resolve per-invocation
export const resolveCreateNoteLambdaHandler = memoizeSingleton(() => {
  return async function(event: LambdaEventLike, awsContext?: LambdaAwsContextLike) {
    const request = { event, awsContext };
    const handler = createNoteLambdaHandlerFactory({
      createNoteUsecase: resolveCreateNoteUsecase(request),
      currentUserId: resolveCurrentUserId(request),
    });
    return handler(event, awsContext);
  };
});
```

```ts
// create-note.handler.ts — testable factory + Lambda export
export function createNoteLambdaHandlerFactory({
  createNoteUsecase,
  currentUserId,
}: CreateNoteLambdaHandlerDeps) {
  return async function handleCreateNote(event: CreateNoteEvent) {
    const input = parseCreateNoteBody(event.body);
    const result = await createNoteUsecase({ ...input, createdByUserId: currentUserId });
    return { statusCode: 201, body: JSON.stringify(result) };
  };
}

// Lambda entrypoint — one line, delegates to bootstrap
export const handler = async (event: any, context?: any) =>
  resolveCreateNoteLambdaHandler()(event, context);
```
Verify:
- Search for provider/client construction and env reads in behavior modules.
- Check behavior functions accept dependencies rather than discovering them.
- Check provider selection can be tested without mutating global state.
