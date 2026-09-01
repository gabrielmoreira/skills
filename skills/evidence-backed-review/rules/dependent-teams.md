---
id: evidence-backed-review.dependent-teams
owner: evidence-backed-review
canonical: true
severity: hard-gate
references: [Consumer-driven contracts, Semantic versioning]
---

# Dependent Teams

Decision: Identify who outside this change must act or be told, what they must do, and by
when. Then stop. Identifying a recipient is review work. Reaching one is not. Owns
notification scope. Whether the boundary change is sound → `rules/contracts-and-consumers.md`.

Use when:

- A published contract, schema, event, shared package, route, or default changed.
- The change requires action by someone who does not own this repository.

Do:

1. **Split the recipients into two lists.**
   - **Needs to act.** Their code, config, or data breaks.
   - **Needs to be aware.** Observed behaviour changes. No work is required.
2. **Give each recipient one of three timings.**
   - **Before merge.** They act first, or merging breaks them.
   - **Before release.** They are ready when it ships.
   - **After release.** Informational.
3. **Write each message in four parts.**
   - What changed.
   - When it takes effect.
   - What breaks if it is ignored.
   - What to do.
4. **Resolve each recipient from recorded ownership.**
   - Read the code owners, the manifests, and the ownership docs.
   - Read the service pages a declared source reaches (`rules/external-sources.md`).
5. **Report the list as identified**, and name where the author takes it.
6. **Report a Gap** for a changed surface that has callers but records no owner.

Avoid:

- **Naming a plausible-sounding team the repository never records**, so the notice goes to nobody and the record shows it was sent.
- **One undifferentiated recipient list**, which trains every recipient to skim, so the one team that had to act reads it like the ones that did not.
- **Timing given as "soon"** instead of one of the three, which leaves each reader to guess whether this blocks their next release.

Exceptions:

- A surface reachable only behind an off-by-default flag records its recipient against flag
  enablement, not against merge.

Example (one instance, not the set):
```text
POST /orders now rejects requests without idempotencyKey (was optional).
checkout client owner | act   | before merge  | calls fail with 400 on landing;
    send a stable key per order attempt.
reporting job owner   | aware | after release | duplicate orders stop appearing.
Gap: an external sandbox calls this route, no owner recorded.
```

Verify:

- **Search ownership records for every changed public surface.** Each one resolves to a recipient or a Gap.
- **Read the produced rows.** Each carries act-or-aware. Each carries one timing and all four parts.
- **Read the session's own actions.** No message, comment, work item, or notification was created.
