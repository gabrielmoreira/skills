---
id: typescript-configs.validation-vs-verification
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Fail Fast]
---

# Validation vs Verification

Decision: Config parsing validates shape and local policy; external dependency checks happen later in explicit verification or startup code.

Use when:
- Config parsing opens files, calls network, checks cloud resources, pings databases, or fetches secrets.
- A schema mixes raw value parsing with runtime availability checks.
- Startup failures are hard to classify as parse errors vs dependency failures.
- Runtime code reconstructs bucket names, table names, ARNs, URLs, secret names, or SSM paths from stage strings.

Start here:
- Keep the parser pure: turn raw values into typed config and reject invalid local shape.
- Parse explicit resource pointers, names, paths, and URLs as typed config; do not verify the live resource in the parser.

Escalate when:
- Startup must prove files, credentials, network resources, queues, buckets, databases, or secret permissions exist.
- Operators need dependency failures reported separately from invalid config.
- Verification is slow, flaky, permissioned, or retryable.
- Application code reconstructs important resource identity from environment/stage strings instead of receiving explicit pointers.

Complexity ladder:
1. Pure parser validates shape and local invariants.
2. Explicit resource pointers pass through typed config: bucket name, table name, ARN, URL, secret name, SSM path, certificate path.
3. Startup calls `verifyConfigResources(config)` after parsing.
4. Integration test covers verification against controlled resources.
5. Health/readiness checks report dependency availability separately from parse success.

Do:
- Validate syntax, type, enum membership, requiredness, local invariants, and parseable URLs/paths.
- Verify existence, permissions, connectivity, credentials, and remote resources after parsing.
- Name verification functions explicitly, such as `verifyDependencies` or `verifyConfigResources`.
- Keep errors distinguishable: invalid config vs unavailable dependency.
- Prefer passing explicit resource pointers through env/typed config over reconstructing important resource identity deep in runtime code.

Avoid:
- Network, filesystem, database, or cloud calls inside pure config parsing.
- Fetching secret values in the config parser.
- Retrying or fallback behavior inside schema parsing.
- Hiding dependency failures as config defaults.
- Reconstructing important resource identifiers from stage strings in application code unless that convention is already entrenched and the task is only maintaining it.

Exceptions:
- Synchronous local parsing of a literal string path/URL is validation; checking that the target exists is verification.
- A tiny script may perform parse and verification in sequence in one file, but keep them separate functions.
- Entrenched resource-name conventions may be maintained during migration; do not deepen them in new paths.

Example:

Bad: parser does I/O.

```ts
export async function parseConfig(env: NodeJS.ProcessEnv) {
  const bucket = env.REPORT_BUCKET;
  if (!bucket) throw new Error("REPORT_BUCKET is required");
  await s3.headBucket({ Bucket: bucket });
  return { bucket };
}
```

Good: parse first, verify later.

```ts
type ReportStorageConfig = { bucket: string };

export function parseReportStorageConfig(env: NodeJS.ProcessEnv): ReportStorageConfig {
  const bucket = env.REPORT_BUCKET;
  if (!bucket) throw new Error("REPORT_BUCKET is required");
  return { bucket };
}

export async function verifyReportStorage(config: ReportStorageConfig) {
  await s3.headBucket({ Bucket: config.bucket });
}
```

Good: pass explicit resource pointers instead of rebuilding them later.

```ts
type QueueConfig = { queueUrl: string };

export function parseQueueConfig(env: NodeJS.ProcessEnv): QueueConfig {
  const queueUrl = env.ORDER_QUEUE_URL;
  if (!queueUrl) throw new Error("ORDER_QUEUE_URL is required");
  return { queueUrl };
}
```

Verify:
- Parser tests run without external resources.
- Startup/integration tests cover dependency verification separately.
- Error types or messages make parse failure distinct from verification failure.
- Resource pointers are explicit inputs; runtime code is not reconstructing resource identity from stage unless explicitly preserving an existing convention.
