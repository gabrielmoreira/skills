---
id: test-first-by-evidence.watch-it-fail
owner: test-first-by-evidence
canonical: true
severity: hard-gate
references: [Test-Driven Development (Beck), Red-Green-Refactor]
---

# Watch It Fail

Decision: **Run the test and watch it fail, for the reason you expect, before writing any implementation.** Recovering when code already exists belongs to `rules/code-written-first.md`.

Use when:
- **A test is about to be written**, for anything.
- **A test passed the first time it ran.**
- **A test errored** rather than failed.
- **You are about to write implementation** and cannot name the run that went red.

Do:
- **Write one test for one behaviour**, named for what should happen.
- **Run it, and read the output.** Predicting the failure is not observing it.
- **Confirm all three before continuing.**
  - It failed rather than errored.
  - The message is the one you expected.
  - It failed because the behaviour is missing, not because of a typo or a bad import.
- **Say the phase out loud**, so a reader knows what you are allowed to do next.
- **Where it passed, treat the test as describing existing behaviour.** Change the test, not the code.
- **Where it errored, fix the test and run again** until it fails properly.

Avoid:
- **Writing implementation from a test you did not run.**
- **Accepting an error as a red.** A broken test proves nothing about the code.
- **A test whose failure message you cannot explain.** You do not yet know what it checks.
- **Several behaviours in one test.** An "and" in the name means two tests.
- **Moving on because the failure "obviously" would happen.**

Exceptions:
- **A generated or scaffolded file MAY skip the cycle**, where nothing about it was authored.
- **A spike MAY run without tests**, provided its output is a finding and the code is thrown away.

Example (one instance, not the set):

```txt
$ npm test -- retry
FAIL  retries a failed operation three times
      expected 3, received 1

Failed, not errored.        yes
Message as expected.        yes, the retry count is wrong
Failing for the right reason. yes, retryOperation does not retry yet
```

- **That third line is the one people skip.** A test that fails because the import path is wrong is red for a reason that has nothing to do with the feature.

Verify:
- **Name the run that went red**, and quote the line that showed it.
- **Check the failure names the missing behaviour**, not a mistake in the test.
- **Check the test asserts one behaviour**, and its name says which.
- **Where you cannot produce a red run, you have no licence to implement.**
