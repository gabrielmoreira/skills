# Layered Resolve — Lazy Composition Root

Pattern for assembling the Composition Root of Clean Architecture as lazy, tiered resolvers instead of one eager `main()`. Useful for Lambda (cold-start friendly), Express (request-scoped without a DI container), and any app where dependencies have different lifetimes.

This is reference material, not a canonical rule. Use when the canonical default in `typescript-composition/rules/composition-root.md` is no longer enough.

---

## Intent

Replace one eager `bootstrap()` that wires everything at startup with a tree of `resolveXxx()` functions that each memoize at their own lifecycle:

- App-scoped resolvers cache once per process (`memoizeSingleton`).
- Request-scoped resolvers cache once per request reference (`memoizeByReference`).
- Each tier only references tiers above it.

The result is a Composition Root that is the only place that knows all adapters, all ports, and all use cases — but constructed lazily and tier-by-tier.

---

## Tiers

Tiers map to Clean Architecture rings:

- **runtime** — infra/framework: env, logger, secrets, OAuth, cache.
- **application** — adapters that satisfy ports: database, storage, connectors.
- **request** — use cases assembled with request-scoped deps: feature flags, current user, use cases.

Reference direction is one-way: `request → application → runtime`. Never the other direction.

---

## Express variant

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

---

## Lambda variant

Same tiers, but the handler file is the edge. Each handler singleton wraps `{ event, awsContext }` as the request reference and resolves request-scoped capabilities per invocation. The handler file exports a testable factory and a Lambda entrypoint.

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

---

## Tests

The handler factory is testable directly with explicit deps — no bootstrap import needed:

```ts
it("creates notes through the lambda adapter", async () => {
  const handler = createNoteLambdaHandlerFactory({
    createNoteUsecase: async (input) => ({ ...input, id: "note-1" }),
    currentUserId: "user-1",
  });
  const response = await handler({ body: JSON.stringify({ title: "Ops" }) });
  expect(response.statusCode).toBe(201);
});
```

Scope memoization is a separate concern — test it only when the bootstrap infra itself is the contract:

```ts
it("returns the same usecase for the same request reference", () => {
  const request = { event: {}, awsContext: undefined };
  expect(resolveCreateNoteUsecase(request)).toBe(resolveCreateNoteUsecase(request));
});
```

---

## When to escalate to this pattern

- The default `makeApp(config)` works until you have request-scoped state (feature flags, current user, correlation id) that must propagate into use cases without becoming app-singletons.
- A Lambda or framework with cold-start sensitivity benefits from lazy resolvers; eager bootstrap pays the cost on every cold start.
- A tree of resolvers makes scope contracts testable: same reference = same instance, different references = different instances.

For the canonical default and the smaller `makeApp(config)` shape, see `typescript-composition/rules/composition-root.md`.
