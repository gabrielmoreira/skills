---
id: typescript-configs.validation-vs-verification
owner: typescript-configs
canonical: true
severity: hard-gate
references: [Parse don't validate, Fail Fast]
---

# Validation vs Verification

Decision: **Config parsing validates shape and local policy. Checking that an external dependency exists happens later, in explicitly named verification code.**

Use when:
- **Parsing does I/O.** Opening files, calling the network, checking cloud resources, fetching secrets.
- **A schema mixes value parsing with availability checks**, so a startup failure cannot be classified.
- **Runtime code rebuilds resource identity from a stage string** instead of receiving an explicit pointer.
- **Verification is slow, flaky, or permissioned**, and operators need it reported separately.

Do:
- **Keep the parser pure.** Syntax, type, enum membership, requiredness, local invariants, parseable URLs.
- **Parse a resource pointer as typed config** without checking the live resource behind it. A bucket name, a table name, a URL, a secret name.
- **Verify after parsing, in a named function.** Existence, permissions, connectivity, credentials.
- **Keep invalid config distinct from an unavailable dependency.** They have different owners and different fixes.

Avoid:
- **Network, filesystem, database, or cloud calls inside parsing**, including fetching a secret value.
- **Retry or fallback behaviour inside schema parsing.**
- **Hiding a dependency failure as a config default.**
- **Rebuilding an important resource identifier from a stage string** in application code.

Exceptions:
- **Parsing a literal path or URL is validation.** Checking that the target exists is verification.
- **A tiny script MAY do both in one file**, as two separate functions.
- **An entrenched naming convention MAY be maintained during migration**, without being deepened in new paths.

Example (one instance, not the set):

```ts
// Bad: the parser does I/O, so a missing bucket looks like a config error.
export async function parseConfig(env: NodeJS.ProcessEnv) {
  const bucket = env.REPORT_BUCKET;
  if (!bucket) throw new Error("REPORT_BUCKET is required");
  await s3.headBucket({ Bucket: bucket });
  return { bucket };
}

// Good: parse first, verify later, as two named functions.
export function parseReportStorageConfig(env: NodeJS.ProcessEnv): ReportStorageConfig {
  const bucket = env.REPORT_BUCKET;
  if (!bucket) throw new Error("REPORT_BUCKET is required");
  return { bucket };
}

export async function verifyReportStorage(config: ReportStorageConfig) {
  await s3.headBucket({ Bucket: config.bucket });
}
```

- **Where stage-conditional logic appears, stop.** Stage is not a behaviour decision. Read `skill://typescript-skills/typescript-configs/rules/feature-decisions.md` and parse a named decision instead.

Verify:
- **Check parser tests run with no external resources.**
- **Check dependency verification is covered separately.**
- **Check the error makes parse failure distinct from verification failure.**
- **Check resource pointers are explicit inputs.**
