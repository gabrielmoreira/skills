---
id: debugging-by-evidence.regression-seam
owner: debugging-by-evidence
canonical: true
severity: default
references: [regression testing, test seams, characterization tests]
---

# Regression Seam

Decision: **Test the real contract at the narrowest layer that can demonstrate
the defect.** Add adapter or integration checks for different obligations; a
unit test need not recreate the entire incident to protect faulty handling.
Where the repair itself is the open question → `rules/fix-at-the-source.md`.

Use when:
- **A handling defect is demonstrated and needs a lasting test.**
- **The original trigger is intermittent or requires an unavailable environment.**
- **A unit test leaves a boundary or consumer behaviour unverified.**

Do:
1. **Name the contract and the real code that violates it**, at `file:line`.
2. **Choose the seam by the claim.**
   - Unit: how real logic handles a controlled dependency outcome or schedule.
   - Adapter: whether real dependency results are translated as assumed.
   - Integration: whether the consumer actually exercises that handling and receives the required result.
3. **Assert a value, error or required effect visible to that layer's caller.** Do not substitute the handler or a handwritten copy of the implementation.
4. **Carry the relevant conditions into the regression test.** Injected failures are valid when compatible with the dependency contract; label them as injected.
5. **Observe failure without the repair and success with it.** Preserve existing work before any temporary reversion. A test may expose the faulty intermediate contract rather than print the final incident's exact error text.
6. **Check affected neighbours.** Preserve platform-specific contracts and relevant consumers; do not add identical assertions at every layer.

A helper's public contract can be the right seam. A test against a private
implementation detail or a shape the real caller cannot supply is not a
substitute for the bug. State which adapter or integration obligations remain
unverified instead of claiming the unit test covers them.

Avoid:
- **Rejecting a useful unit test because the incident surfaced elsewhere.**
- **Treating a mock's response or an internal call count as proof of correct handling.**
- **Claiming a forced condition identifies the historical trigger.**
- **Recreating production infrastructure solely to retest a local invariant.**

Exceptions:
- **Read-only review cannot revert a change.** Record the missing observation.
- **When a layer cannot be exercised safely**, retain the justified narrower test and report what it does not establish.

Example (one instance, not the set):
```txt
Unit contract: an uncertain metadata result must not corrupt the resolved path.
Control: inject the documented unknown outcome; execute the real resolver.
Before repair: returned path violates the contract.
After repair: the contract holds.
Adjacent checks: preserve valid literal paths and relevant consumer behaviour.
Still unknown: which metadata outcome occurred during the original incident.
```

Verify:
- **Check the red run fails because of the defect**, not because setup is broken.
- **Identify the distinct contract protected at each tested layer.**
- **Keep the regression and disclose untested boundaries.**
