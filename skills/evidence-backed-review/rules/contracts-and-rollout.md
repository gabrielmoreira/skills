---
id: evidence-backed-review.contracts-and-rollout
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [consumer-driven contract testing, schema evolution compatibility, progressive delivery, artifact provenance]
---

# Contracts, Pipelines and Rollout

Decision: A change is ready only under a stated compatibility and delivery plan. Inspect who consumes the artifact and what happens between versions, not just its final shape. Local correctness belongs to `rules/defects-in-the-change.md`; authority and requirement evidence to `rules/claims-and-proof.md`; permissions to `rules/security-and-abuse-paths.md`; recovery behavior to `rules/runtime-and-resources.md`.

Use when:
- An API, event, schema, SDK export, configuration default or shared procedure changes.
- A migration, backfill, feature flag, version gate, dependency upgrade or generator appears.
- Pipeline YAML, path filters, build jobs, deployment manifests or infrastructure change.
- A consumer, installed client, external team or operator cannot move with the producer.

Do:
1. **Establish the real compatibility boundary.** Is this surface already available on the PR's target or in a released version? Who relies on it, inside and outside this repository? Can those consumers upgrade together? Search authorized consumer and ownership sources; an empty search is not proof that no external caller exists. Where coordinated replacement is justified, allow a clean cut. Otherwise state the old behavior that must keep working.
2. **Trace observable contracts beyond signatures.** Fields, nullability, enum values, defaults, errors, status codes, ordering, pagination, timing, event semantics and permissions can break consumers without changing a type name. Match runtime responses and generated types. Check supported package exports, install paths, mobile/native combinations and older installed clients where applicable.
3. **Separate new installs from upgrades.** A generator template update does not rewrite existing consumers. Compare new scaffolds, currently installed projects and the documented upgrade path. Check whether generated documentation or configuration is rebuilt and whether deployed artifacts actually contain the change.
4. **Read migrations as a sequence with interruptions.** Old readers and writers may coexist with new ones. Check expansion, backfill and contraction order, schema constraints, locking, restartability, validation and partially migrated data. State the release order and whether a failed step can be retried safely. A destructive migration needs a justified data-preservation or recovery strategy, not an assumed inverse script.
5. **Judge gradual activation by risk.** A feature flag is useful when deployment should precede exposure or a quick disable reduces harm; it is not mandatory for every feature. If used, inspect defaults by environment, eligible users, ownership, off-path behavior, interaction with persisted state and removal conditions. Absence or presence alone is not a finding. Explain the concrete exposure or maintenance risk.
6. **Follow the pipeline from trigger to delivered artifact.** Check branch and path filters, affected-package detection, required jobs, dependencies, conditions and failure propagation. Determine what a skipped or cancelled job means. Trace the build revision through immutable artifacts, caches, promotion and the selected environment. Can a green status refer to different code, omit a changed package, swallow an error or deploy an untested rebuild?
7. **Check configuration outside the file.** Templates, variable precedence, service connections, environment approvals, branch protection and resource locks may live in the hosting platform. Read available effective configuration and date it. A reference in YAML is not proof that the remote approval or lock exists. Missing access is a specific gap; do not trigger a deployment or grant permissions to resolve it.
8. **For infrastructure, inspect the change plan and dependency order.** Resource replacement, state ownership, shared resources, network reachability, encryption settings, secrets references, quotas and environment drift matter. Distinguish source declarations, a generated plan and effective deployed state. Name any required out-of-repository subscription, permission or configuration before rollout without assuming it is provisioned.
9. **Identify people who must act.** Separate consumers that must change from those who only need notice. State what changes, when it takes effect, the consequence of ignoring it, and required action. Distinguish before merge, before release and after release where timing matters. Find the owner in evidence; do not invent a team or send a notification.

Avoid:
- **Calling something backward compatible without naming a consumer version or behavior.**
- **Assuming every caller ships from this repository**, or that trunk is the target of every PR.
- **Treating a green pipeline, a role name or a declared environment as effective deployment proof.**
- **Demanding rollback for an irreversible operation without examining recovery alternatives.** Rollback, roll-forward and restore have different consequences.
- **Rejecting a valid delivery slice because later features are absent.** Check that the intermediate state is safe to merge and expose.

Example (one instance, not the set):
```
Important: event-schema:22 removes legacy_id while the released consumer
still decodes it. Publish both fields, migrate that consumer, then contract.
Important: release-job:18 rebuilds from a moving branch after validation.
Promote the validated immutable artifact instead.
Gap: deploy-config:31 names an environment approval. Its effective remote
configuration was unavailable; source alone does not establish that gate.
```

Verify:
- Each changed public surface has an explicit compatibility judgment and consumer evidence or a gap.
- Pipeline evidence corresponds to the reviewed revision and the artifact or environment being judged.
- Migration, activation and delivery order account for intermediate states, not just final success.
- External prerequisites and required recipients are identified without changing remote state.
