---
id: typescript-configs.validation-vs-verification
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Fail Fast]
---

# Validation vs Verification

Decision: Config parsing validates shape and local policy. External dependency checks happen later in explicit verification or startup code.

Use when:
- Config parsing opens files, calls network, checks cloud resources, pings databases, or fetches secrets.
- A schema mixes raw value parsing with runtime availability checks, making startup failures hard to classify as parse errors vs dependency failures.
- Runtime code reconstructs bucket names, table names, ARNs, URLs, secret names, or SSM paths from stage strings instead of receiving explicit resource pointers.
- Verification is slow, flaky, permissioned, or retryable, and operators need dependency failures reported separately from invalid config.

Do:
- Keep the parser pure: validate syntax, type, enum membership, requiredness, local invariants, and parseable URLs/paths; parse explicit resource pointers (bucket name, table name, ARN, URL, secret name, SSM path, certificate path) as typed config without verifying live resources.
- Verify existence, permissions, connectivity, credentials, and remote resources after parsing, in explicitly named functions such as `verifyDependencies` or `verifyConfigResources`.
- Keep invalid config distinct from unavailable dependency; health/readiness checks can report dependency availability separately from parse success.

Avoid:
- Network, filesystem, database, or cloud calls inside pure config parsing, including fetching secret values.
- Retrying or fallback behavior inside schema parsing, or hiding dependency failures as config defaults.
- Reconstructing important resource identifiers from stage strings in application code, unless an already-entrenched convention is only being maintained, not deepened.

Exceptions:
- Synchronous local parsing of a literal string path/URL is validation; checking that the target exists is verification.
- A tiny script may parse and verify in one file, but keep them as separate functions.
- Entrenched resource-name conventions may be maintained during migration; do not deepen them in new paths.

Example:

```ts
// Bad: parser does I/O.
export async function parseConfig(env: NodeJS.ProcessEnv) {
  const bucket = env.REPORT_BUCKET;
  if (!bucket) throw new Error("REPORT_BUCKET is required");
  await s3.headBucket({ Bucket: bucket });
  return { bucket };
}

// Good: parse first, verify later, as separate named functions.
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

When stage-conditional logic appears (`stage === "prod" ? ... : ...` selecting resources), stop — stage is not a behavior decision; read `skill://typescript-skills/typescript-configs/rules/feature-decisions.md`. Use one explicit env input per environment-specific resource instead, and parse a named decision once when behavior really differs.

Verify:
- Parser tests run without external resources.
- Startup/integration tests cover dependency verification separately.
- Error types or messages make parse failure distinct from verification failure.
- Resource pointers are explicit inputs; runtime code is not reconstructing resource identity from stage unless explicitly preserving an existing convention.
