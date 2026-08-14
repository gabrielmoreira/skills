---
id: evidence-backed-review.contracts-and-consumers
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [consumer-driven contract testing, schema evolution compatibility, rollout ordering]
---

# Contracts and Consumers

Decision: Settle whether the boundary may break before asking whether the change is safe.
Then label every claim with the evidence layer it reached. A good call names its facts and
claims no layer from the one below. Owns whether a boundary change is allowed and sound.
Who outside must be told → `rules/dependent-teams.md`.

Use when:

- The diff changes an API, a schema, an event, a shared configuration, a route, or infrastructure.
- An enum value, a field, or a default changes on a shape a consumer decodes.
- Producer and consumer ship separately.

Do:

1. Answer three questions.
   - **Is the surface on trunk?**
   - **Can a caller live outside this repository?**
   - **Can every caller redeploy alongside you?**
2. Call clean cut or backward compatible from those answers.
   - **Backward compatible** when one caller cannot redeploy with you. A shipped client forces it. So does a device.
   - **Clean cut** when the surface is new and every caller can be listed. They change together.
   - **Cannot tell** → ask. Mirrored callers make "enumerable" answerable (`rules/external-sources.md`).
3. Read whether the provider takes the real payload and returns the errors the caller handles.
   - An additive change breaks a consumer that decodes exhaustively with no unknown-value fallback.
4. Name which side ships first. Name what the other side sees in the gap.
5. Label each availability claim with its layer.
   - **L1** the intended shape in source.
   - **L2** an indirect signal. A name match. A search hit.
   - **L3** deployed state from the build or resource record.
   - **L4** proof on the real consumer route.
   - Each layer proves less than the next. An unreached layer is a Gap.
6. Give recoverability its own verdict, never a fifth rung. A change can be reachable and unrecoverable.

Avoid:

- **Promoting a fact one layer up.** Configuration is not deployment. A mirrored caller's source is intent, not what runs.
- **A Gap reading "presumably deployed"** instead of the next observation.
- **Reading an empty consumer search as proof there is none.** What cannot be listed is not empty.

Exceptions:

- A boundary with no consumer has no L4. That is not-applicable, not a Gap.

Example (one instance, not the set):
```
BACKWARD COMPATIBLE: field pre-exists on trunk, one caller ships on its own
release train and cannot redeploy with us.
L4 GAP: nothing observed on the consumer route. Next: one read-only read
through the real route.
RECOVERABILITY GAP: reverting leaves rows in the new shape.
```

Verify:

- **Search changed paths for boundary artifacts.** Each one carries a layer label.
- **Read the report.** Every claim states its layer. Every Gap states its next observation.
- **Confirm the call names its facts**, or that the question was asked.
