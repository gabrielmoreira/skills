# Cheatsheet

All rules in positive examples. Minimal text — only when code alone is ambiguous.

---

## Type Narrowing (hard-gate)

No `!`, `as`, `as unknown as`, `as any`, `@ts-ignore` in production. Prove the type.

```ts
// typeof / truthiness
const user = getUser(id);
if (!user) throw new NotFoundError("user", id);
if (!user.contact?.email) throw new IncompleteProfileError(user.id, "email");
const email = user.contact.email;
```

```ts
// reusable type guard — the narrowing primitive
function hasField<K extends string>(o: object, k: K): o is Record<K, unknown> {
  return k in o;
}
function isOrderResponse(raw: unknown): raw is OrderResponse {
  if (typeof raw !== "object" || raw === null) return false;
  return hasField(raw, "orderId") && typeof raw.orderId === "string"
    && hasField(raw, "status") && typeof raw.status === "string"
    && hasField(raw, "total") && typeof raw.total === "number";
}

// throwing parser composes on top
function parseOrderResponse(raw: unknown): OrderResponse {
  if (!isOrderResponse(raw)) throw new ParseError("invalid order response");
  return raw;
}
```

```ts
// schema validation at boundary
const OrderResponseSchema = z.object({
  orderId: z.string(),
  status: z.enum(["pending", "confirmed", "shipped"]),
  total: z.number(),
});
type OrderResponse = z.infer<typeof OrderResponseSchema>;

function parseOrderResponse(raw: unknown): OrderResponse {
  return OrderResponseSchema.parse(raw);
}
```

```ts
// satisfies — preserves literal, verifies contract
type Status = "pending" | "confirmed" | "shipped";

const status = "pending" satisfies Status;
//    ^? const status: "pending"  ← keeps literal

const status2: Status = "pending";
//    ^? const status2: Status    ← widens, literal lost
```

```ts
// satisfies on test fixtures
const testOrder = {
  orderId: "order-1",
  status: "pending",
  total: 42,
} satisfies OrderResponse;
// testOrder.status is "pending", not string
```

```ts
// test builder instead of `as`
function makeTestUser(overrides: Partial<User> = {}): User {
  return {
    id: "test-id",
    name: "Test",
    contact: { email: "test@example.com" },
    ...overrides,
  };
}
const user = makeTestUser({ name: "Custom" });
```

Exception — `// SAFETY:` when lib types are wrong or perf-critical path is proven by test.

---

## Raw Input to Internal Model (hard-gate)

Parse at the boundary. Behavior code receives owned types.

```ts
// boundary parser — handler/controller/edge
type CreateOrderInput = { productId: string; quantity: number };

function parseCreateOrderInput(body: unknown): CreateOrderInput {
  if (!isCreateOrderInput(body)) throw new ValidationError("invalid order input");
  return body;
}

// behavior code — no raw transport
async function createOrder(input: CreateOrderInput, deps: { db: DB }) { /* ... */ }
```

No `req.body`, raw JSON, or unparsed webhook payload in business logic.

---

## Provider Containment

Provider/SDK types stay at the edge. Internal code uses local models.

```ts
// edge adapter
type PaymentSettlement = {
  paymentId: string;
  isSettled: boolean;
  providerStatus: string; // traceability
};

function toPaymentSettlement(intent: Stripe.PaymentIntent): PaymentSettlement {
  return {
    paymentId: intent.id,
    isSettled: intent.status === "succeeded",
    providerStatus: intent.status,
  };
}

// behavior code — no Stripe import
function canShip(settlement: PaymentSettlement) {
  return settlement.isSettled;
}
```

---

## Earned Mapping

Inline when one callsite. Named mapper when semantic collapse repeats.

```ts
// earned — multiple provider states collapse into local meaning
type LocalUserStatus = "active" | "blocked";

function toLocalUserStatus(status: ProviderUser["status"]): LocalUserStatus {
  switch (status) {
    case "enabled":
    case "trialing":
      return "active";
    case "disabled":
    case "fraud_review":
      return "blocked";
  }
}
```

No mapper for renaming one field in one callsite.

---

## Local Naming

Name by local meaning, not provider vocabulary. Provider words stay in adapters.

`StripeCustomer` → `Customer` (internal)
`WebhookPayload` → `OrderEvent` (what the app sees)
`providerStatus` field → acceptable for traceability metadata

---

## Functions vs Classes

Function first. `makeXxx` when closure-private scope helps. Class when lifecycle/protocol earns it.

```ts
// stateless — plain function
function formatReceipt(order: Order) {
  return `${order.id}:${order.total}`;
}
```

```ts
// deps + private state — makeXxx
function makeReceiptSender({ mailer, audit }: { mailer: Mailer; audit: AuditLog }) {
  let sentCount = 0;

  async function sendReceipt(order: Order) {
    await mailer.send(order.email, formatReceipt(order));
    sentCount += 1;
    await audit.record("receipt-sent", { orderId: order.id });
  }

  function stats() { return { sentCount }; }

  return { sendReceipt, stats };
}
```

```ts
// lifecycle/protocol/resource — class
class ReceiptStream {
  constructor(private readonly connection: Connection) {}
  async open() { /* acquire resource */ }
  async send(order: Order) { /* requires open connection */ }
  async close() { /* release resource */ }
}
```

---

## Abstraction and Local Reasoning

Add abstraction only when it makes the caller simpler and owns a real policy.

```ts
// direct is fine when policy does not repeat
await mailer.send({ to: user.email, template: "welcome" });
```

```ts
// extract when retry + audit policy repeats
async function sendAuditedWelcomeEmail(input: {
  mailer: Mailer; audit: AuditLog; user: User;
}) {
  await retry(() => input.mailer.send({ to: input.user.email, template: "welcome" }));
  await input.audit.record("welcome-email-sent", { userId: input.user.id });
}
```

No `BaseEmailService`, `EmailManager`, or `Helper` unless identity/lifecycle is real.

---

## Naming and Semantic Center

Name by what the reader needs at the callsite.
Specific > `handle`, `process`, `manage`, `data`.
Name stays true if implementation changes.

---

## Cutovers

Default: clean cutover in one change. Remove old exports, aliases, tests.
Staged migration only with owner + boundary + removal condition.

```ts
// staged migration label
// TEMPORARY: compatibility alias for billing-v1 callers
// Owner: @payments | Remove after: billing-v2 rollout complete
export { processPaymentV2 as processPayment };
```


---

## Vertical Discipline

Comment labels first, then extract by responsibility. Blank lines that group real things are fine.

```ts
// step 1 — blank-line groups
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrder(input);

  const saved = await deps.db.save(validated);

  await deps.mailer.send(saved.email, formatReceipt(saved));
  return saved;
}
```

```ts
// step 2 — comment labels make groups explicit (discovery)
async function processOrder(input: OrderInput, deps: OrderDeps) {
  // validate
  const validated = validateOrder(input);
  if (!validated.email) throw new MissingEmailError(input.id);
  // persist
  const saved = await deps.db.save(validated);
  // notify
  await deps.mailer.send(saved.email, formatReceipt(saved));
  return saved;
}
```

```ts
// step 3 — labels point to clear names; extract
async function processOrder(input: OrderInput, deps: OrderDeps) {
  const validated = validateOrderInput(input);
  const saved = await persistOrder(validated, deps.db);
  await notifyOrderProcessed(saved, deps);
  return saved;
}
```

Short functions with internal blank-line groups stay as-is. Helpers like `processStep1`, `doWork`, `handleIt` are signs the extraction is wrong.
---

## Composition Root

Runtime decisions at the root/edge. Behavior receives ready capabilities.

```ts
function makeSendReceipt({ mailer }: { mailer: Mailer }) {
  return async (order: Order) => {
    await mailer.send(order.email);
  };
}

function makeApp(config: RuntimeConfig) {
  const mailer = config.mailer === "ses" ? makeSesMailer(config.email) : makeSmtpMailer(config.email);
  return { sendReceipt: makeSendReceipt({ mailer }) };
}
```

```ts
// NestJS-style — framework edge builds, then passes inward
export const emailSenderProvider = {
  provide: EmailSenderToken,
  useFactory: (configService: ConfigService) => {
    const emailConfig = makeEmailConfig(configService);
    const mailer = makeSesMailer(emailConfig);
    return makeSendReceipt({ mailer });
  },
};
```

No `process.env` reads or provider selection inside behavior modules.

Advanced (lazy, tiered scope) — see `references/patterns/layered-resolve.md`:

```ts
export const resolveEnv = memoizeSingleton((): RuntimeEnv => getPlatformProcessEnv());
export const resolveNotesStorage = memoizeSingleton(
  (): NotesStorageCapability => notesStorageCapabilityFactory({ /* ... */ }),
);
export const resolveCreateNoteUsecase = memoizeByReference(
  (request: HostRequest) =>
    createNoteUsecaseFactory({ notesStorage: resolveNotesStorage(request) }),
);
```

Tiers: runtime (infra/framework) → application (adapters → ports) → request (use cases). One-way reference direction. Lambda variant uses `{ event, awsContext }` as the request reference.

---

## Ready Instance vs Factory

Pass ready dependency by default. Factory only when construction varies at call/request/tenant time.

```ts
// ready — all inputs known at assembly
function makeSendReceipt({ mailer }: { mailer: Mailer }) {
  return (order: Order) => mailer.send(order.email);
}
```

```ts
// factory — scope varies per tenant
function makeSendReceipt({ getMailerForTenant }: {
  getMailerForTenant: (tenantId: string) => Mailer;
}) {
  return (order: Order) => getMailerForTenant(order.tenantId).send(order.email);
}
```

---

## Dependency Scope

Scope follows captured data. Explicit at assembly boundaries.

```ts
// tenant state → tenant-scoped, not app-singleton
function makeTenantDependencies(tenantId: string) {
  return { client: makeClient({ tenantId }) };
}
```

```ts
// request-scoped — built per-request at handler edge
async function handleCreateOrder(req: ParsedRequest, appDeps: AppDeps) {
  const requestDeps = makeRequestDeps(appDeps, {
    correlationId: req.correlationId,
    userId: req.userId,
  });
  return createOrder(req.body, requestDeps);
}
function makeRequestDeps(app: AppDeps, ctx: RequestContext) {
  return {
    db: app.db,
    logger: app.logger.child({ correlationId: ctx.correlationId }),
    userId: ctx.userId,
  };
}
```

No hidden module-level singletons. No caches without invalidation owner.
Pure immutable constants may be module-level.

---

## Parse and Expose Config (hard-gate)

Parse once at boundary. Expose typed contextual config. No raw `process.env` in behavior.

```ts
type EmailConfig = { apiKey: string; timeoutMs: number };

function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  const apiKey = env.EMAIL_API_KEY;
  if (!apiKey) throw new Error("EMAIL_API_KEY is required");

  const timeoutMs = Number(env.EMAIL_TIMEOUT_MS ?? "5000");
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error("EMAIL_TIMEOUT_MS must be a positive integer");
  }

  return { apiKey, timeoutMs };
}
```

```ts
// medium/large — root parses, projects contextual slices
type RuntimeConfig = {
  stage: "dev" | "prod";
  email: EmailConfig;
  billing: BillingConfig;
};

function parseRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  return {
    stage: parseStage(env.APP_STAGE),
    email: parseEmailConfig(env),
    billing: parseBillingConfig(env),
  };
}
```

```ts
// schema when modes make fields conditional
const EmailConfigSchema = z.discriminatedUnion("provider", [
  z.object({ provider: z.literal("smtp"), smtpUrl: z.string().url() }),
  z.object({ provider: z.literal("ses"), region: z.string().min(1) }),
]);
```

Preferred flow: read stage → load env/config → build typed config → derive feature decisions → verify resources later → pass config + deps inward.

File layout when earned:

```txt
src/config/
  stage.ts
  featureFlags.ts
  serviceConfig.ts
```

Keep one file while small. Split at ~150-200 lines or 3+ concerns.

---

## Contextual Config

Feature modules accept their slice, not the whole app config.

```ts
// composition root projects slices
function makeApp(config: RuntimeConfig) {
  return {
    emailSender: makeEmailSender(config.email),    // EmailConfig
    billingClient: makeBillingClient(config.billing), // BillingConfig
  };
}
```

No `AppConfig` imported in feature modules. Tests build only the slice they need.

---

## Validation vs Verification (hard-gate)

Parser is pure — no I/O, no secret fetch, no network. Verify resources later.

```ts
// pure parser
function parseReportStorageConfig(env: NodeJS.ProcessEnv): ReportStorageConfig {
  const bucket = env.REPORT_BUCKET;
  if (!bucket) throw new Error("REPORT_BUCKET is required");
  return { bucket };
}

// separate verification
async function verifyReportStorage(config: ReportStorageConfig) {
  await s3.headBucket({ Bucket: config.bucket });
}
```

Pass explicit resource pointers (bucket name, ARN, URL, queue URL, secret name) through typed config. Do not reconstruct resource identity from stage strings in app code.

```ts
type QueueConfig = { queueUrl: string };

function parseQueueConfig(env: NodeJS.ProcessEnv): QueueConfig {
  const queueUrl = env.ORDER_QUEUE_URL;
  if (!queueUrl) throw new Error("ORDER_QUEUE_URL is required");
  return { queueUrl };
}
```

---

## Defaults and Ownership (hard-gate)

Default must be production-correct. Environment-specific values are required.

```ts
// required — no fallback
function parseBillingConfig(env: NodeJS.ProcessEnv): BillingConfig {
  const apiBaseUrl = env.BILLING_API_BASE_URL;
  if (!apiBaseUrl) throw new Error("BILLING_API_BASE_URL is required");
  const serviceToken = env.BILLING_SERVICE_TOKEN;
  if (!serviceToken) throw new Error("BILLING_SERVICE_TOKEN is required");
  return { apiBaseUrl, serviceToken };
}
```

```ts
// production-safe default — acceptable
function parseEmailConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return {
    timeoutMs: Number(env.EMAIL_TIMEOUT_MS ?? "5000"),
    retryCount: Number(env.EMAIL_RETRY_COUNT ?? "3"),
  };
}
```

```ts
// named flag decision, not stage proxy
function makeEmailConfig(flags: { isHighThroughputMode: boolean }): EmailConfig {
  return {
    timeoutMs: flags.isHighThroughputMode ? 3000 : 5000,
    retryCount: 3,
  };
}
```

Never: `?? "http://localhost:3000"`, `?? "test-token"`, `?? "sandbox.example.com"`.

---

## Feature Decisions

Parse flag once at boundary → named typed decision → pass inward.

```ts
type BannerBoxDecision = false | true | { customerIds: string[] };

function readUseBannerBoxApi(value: string | undefined): BannerBoxDecision {
  if (!value || value === "false") return false;
  if (value === "true") return true;
  return { customerIds: value.split(",").map((id) => id.trim()).filter(Boolean) };
}

function makeSearchProducts(config: { useBannerBoxApi: BannerBoxDecision }) {
  return async (input: SearchInput) => {
    if (config.useBannerBoxApi === false) return legacySearch(input);
    return bannerBoxSearch(input, config.useBannerBoxApi);
  };
}
```

No `process.env.USE_X === "true"` in handlers/services.
No `stage === "prod"` as proxy for behavior — use named decisions.

---

## Config Migration

Characterize → seam → parse → cut over → remove old reads.

```ts
// characterize before changing semantics
test("characterization: preserves legacy empty timeout fallback during config migration", () => {
  expect(readLegacyTimeout({ EMAIL_TIMEOUT_MS: "" })).toBe(5000);
});

// seam that centralizes without changing behavior
function readEmailRuntimeConfig(env: NodeJS.ProcessEnv): EmailConfig {
  return parseEmailConfig(env);
}
```

Keep current runtime assumptions stable. Do not introduce a new stage model speculatively.

---

## Secrets Lifecycle (hard-gate)

Secrets and environment-specific coordinates are explicit inputs. Never defaulted.

```ts
// config parser exposes pointer, not the secret value
type SecretConfig = { secretSource: string };

// secret fetched later in bootstrap
async function loadSecrets(config: SecretConfig) {
  return secretsManager.getSecretValue({ SecretId: config.secretSource });
}
```

No `?? "test-key-123"`. No `?? "http://localhost"`.
Test secrets live in test code only, named as test data.

---

## Crypto Choices (hard-gate)

Explicit discriminated modes, not booleans.

```ts
type TokenConfig =
  | { mode: "hmac-sha256"; secret: string }
  | { mode: "jwks-rs256"; jwksUrl: string };
```

No `{ secure: boolean; secret: string }`. Reject unknown modes at parse time.

---

## Redaction (hard-gate)

Allowlist safe fields. Redact before logging/rethrowing.

```ts
logger.error("secret loading failed", {
  source: config.secretSource.type,
  region: config.region,
  secret: "[REDACTED]",
});
```

No `JSON.stringify(config)`. No `logger.error("failed", { config })`.

---

## Meaningful Logging

Actionable structured logs with branch decisions and safe context.

```ts
logger.warn("receipt_delivery_skipped", {
  reason: "missing_email",
  orderId: order.id,
  tenantId: order.tenantId,
});

logger.error("receipt_delivery_failed", {
  orderId: order.id,
  tenantId: order.tenantId,
  provider: "ses",
  err: error,
});

logger.info("receipt_delivery_provider_selected", {
  provider: config.provider,
  reason: "tenant_config",
  tenantId,
});
```

No `logger.info("here")`. No broad object dumps. Passing real `Error` as `err` is good when logger serializes errors.

---

## Tracing Boundary

OpenTelemetry/X-Ray behind an observability adapter. Vendor SDK stays at the edge.

```ts
type Observability = {
  logger: Logger;
  tracer: {
    span<T>(name: string, fn: () => Promise<T>): Promise<T>;
    event(name: string, attributes?: Record<string, string | number | boolean>): void;
  };
};

function makeSendReceipt({ mailer, obs }: { mailer: Mailer; obs: Observability }) {
  return (order: Order) =>
    obs.tracer.span("receipt.send", async () => {
      if (!order.email) {
        obs.tracer.event("receipt.skipped", { reason: "missing_email" });
        obs.logger.warn("receipt_delivery_skipped", { reason: "missing_email", orderId: order.id });
        return;
      }
      await mailer.send(order.email);
      obs.tracer.event("receipt.sent", { provider: "ses" });
    });
}

// vendor setup — edge only
function makeObservability(config: ObservabilityConfig): Observability {
  const tracer = makeOpenTelemetryTracer({ exporter: config.exporter });
  const logger = makeStructuredLogger({ redact: redactTelemetryFields });
  return { tracer, logger };
}
```

Span names: stable operations. Attributes: low-cardinality, safe.
No X-Ray SDK imports in business logic.

---

## Testing: Local Style

Match the package's existing test seam. Behavior-first names. `// Given / When / Then` only when it helps.

```ts
it("returns empty array when no markets match query", async () => {
  // Given
  const query = "missing";
  // When
  const result = await search(query);
  // Then
  expect(result).toEqual([]);
});
```

```ts
// shorter when trivial
test("throws error when API key is missing", () => {
  expect(() => parseConfig({})).toThrow("API_KEY is required");
});
```

No `test("works")`. No `test("test search")`.
Coverage targets are guidance, not a reason for brittle assertions.

---

## Testing: Contracts and Characterization (hard-gate)

Test caller-visible behavior, not helper names or private wiring.

```ts
// contract — what callers see
expect(() => parseEmailConfig({})).toThrow("EMAIL_API_KEY is required");
expect(parseEmailConfig({ EMAIL_API_KEY: "test-key" })).toEqual({ apiKey: "test-key" });

// characterization — temporary, labeled, before refactor
test("characterization: preserves legacy empty timeout fallback until config migration", () => {
  expect(parseLegacyTimeout({ EMAIL_TIMEOUT_MS: "" })).toBe(5000);
});
```

No `expect(parseConfig.toString()).toContain("readEmailApiKey")`.
Remove characterization tests after the new contract is clear.

---

## Testing: Config in Tests

Inject typed config. Mutate `process.env` only for config-boundary tests.

```ts
// preferred — inject directly
const sender = makeEmailSender({ apiKey: "test-key", timeoutMs: 100 });
await sender.send("user@example.com");
```

```ts
// env mutation only for config boundary — snapshot and restore
const originalEnv = process.env;
beforeEach(() => { process.env = { ...originalEnv }; });
afterEach(() => { process.env = originalEnv; });
```

---

## Testing: Composition Root

Boot with test config. Assert public capabilities or smoke behavior. Do not snapshot dependency graph.

```ts
const app = makeApp(testConfig);
expect(app.sendReceipt).toBeDefined();
await app.sendReceipt(testOrder); // smoke
```


Scope contract test — handler tests use the factory directly, no bootstrap import:

```ts
it("creates notes through the lambda adapter", async () => {
  // Given
  const handler = createNoteLambdaHandlerFactory({
    createNoteUsecase: async (input) => ({ ...input, id: "note-1" }),
    currentUserId: "user-1",
  });
  // When
  const response = await handler({ body: JSON.stringify({ title: "Ops", content: "Runbook" }) });
  // Then
  expect(response.statusCode).toBe(201);
  expect(JSON.parse(response.body)).toMatchObject({ id: "note-1" });
});
```

Scope memoization test — only for bootstrap infra, not for handler behavior:

```ts
it("returns the same usecase for the same request reference", () => {
  const request = { event: {}, awsContext: undefined };
  const first = resolveCreateNoteUsecase(request);
  const second = resolveCreateNoteUsecase(request);
  expect(first).toBe(second);
});
it("returns different usecases for different request references", () => {
  const a = { event: {}, awsContext: undefined };
  const b = { event: {}, awsContext: undefined };
  expect(resolveCreateNoteUsecase(a)).not.toBe(resolveCreateNoteUsecase(b));
});
```
No `expect(container.registrations).toMatchSnapshot()`.

---

## Throw vs Result

Pick one package default. Reuse the same canonical error data either way.

```ts
type AppErrorData = {
  kind: "business" | "infra" | "security" | "validation";
  code: string;
  message: string;
  details?: unknown;
};

type AppResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AppErrorData };

function orderNotFound(orderId: string): AppErrorData {
  return {
    kind: "business",
    code: "order.not_found",
    message: "order not found",
    details: { orderId },
  };
}

function fail(error: AppErrorData): AppResult<never> {
  return { ok: false, error };
}

function throwError(error: AppErrorData): never {
  throw new AppError(error);
}
```

No `return null` for multiple distinct failures.

---

## Error Classification

Classify by semantic family and explicit retry semantics. Boundary and retry read family-level meaning, not concrete subclasses.

```ts
abstract class BusinessError extends AppError<AppErrorData> {}

abstract class InfraError extends AppError<AppErrorData> {}

if (e instanceof InfraError && e.data.retry?.allowed) return retryLater();
if (e instanceof BusinessError) return badRequest(e.data.message);
```

Downstream origin alone does not decide classification.

---

## Error Boundary Contract

Translate once per boundary. Project your own outward shape. Keep `context` and `cause` internal by default.

```ts
function translate(e: unknown) {
  if (e instanceof ValidationError) {
    return {
      status: e.data.http?.status ?? 400,
      body: {
        code: e.data.code,
        errorId: e.data.telemetry?.errorId ?? ulid(),
        message: e.data.message,
        details: e.data.details,
      },
    };
  }

  if (e instanceof InfraError) {
    return {
      status: e.data.http?.status ?? (e.data.retry?.allowed ? 503 : 500),
      body: {
        code: e.data.code,
        errorId: e.data.telemetry?.errorId ?? ulid(),
        message: "internal error",
      },
    };
  }

  return {
    status: 500,
    body: { code: "internal_error", errorId: ulid(), message: "internal error" },
  };
}
```

Response shape is yours: stable `code`, `errorId`, sanitized `message`.

---

## Error Shape and Metadata

Root = semantic contract. `context` and `cause` = internal attachments. `telemetry` carries correlation.

```ts
type AppErrorData = {
  kind: "business" | "infra" | "security" | "validation";
  code: string;
  message: string;
  details?: unknown;
  context?: {
    service?: string;
    operation?: string;
    metadata?: Record<string, unknown>;
  };
  cause?: {
    name?: string;
    code?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  };
  telemetry?: {
    errorId?: string;
    traceId?: string;
    occurredAt?: string;
  };
};
```

Keep root `details` distinct from `context.metadata` and `cause.metadata`.

---

## Retry and Backoff

Retry only explicitly retryable failures. Use bounded attempts, backoff, jitter, and `Retry-After`.

```ts
async function withRetry<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    signal?.throwIfAborted();
    try { return await fn(); }
    catch (e) {
      if (!(e instanceof InfraError) || !e.data.retry?.allowed) throw e;
      if (attempt === 3) throw e;
      await sleep(Math.random() * 200 * 2 ** (attempt - 1), signal);
    }
  }
  throw new Error("unreachable");
}
```

For writes, pair retries with idempotency keys.

---

## Branded and Opaque Types

Use brands for same-shape primitives with different meaning.

```ts
type Brand<K, T> = K & { readonly __brand: T };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

// SAFETY: purely nominal identity brand.
function asUserId(value: string): UserId { return value as UserId; }

function archiveOrder(orderId: OrderId) {}
archiveOrder(asUserId("u_123")); // ts error
```

One constructor per brand. No downstream `as UserId` casts.

---

## Exhaustive Narrowing

Discriminated unions should fail to compile when a new variant is added.

```ts
function assertNever(x: never): never {
  throw new Error(`unreachable: ${JSON.stringify(x)}`);
}

function statusLabel(status: Status): string {
  switch (status.kind) {
    case "loading": return "Loading";
    case "error":   return status.message;
    case "ready":   return "Ready";
    default:         return assertNever(status);
  }
}
```

No `default: return null` and never `as never` to silence the compiler.

---

## Generics and Conditional Types

Concrete first. Generic when the second caller appears or the API is truly shared.

```ts
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find((item) => item.id === id);
}

type AwaitedValue<T> = T extends Promise<infer U> ? U : T;
```

Use the smallest honest constraint. Prefer built-ins (`Pick`, `Omit`, `Partial`, `Awaited`) before inventing your own.
