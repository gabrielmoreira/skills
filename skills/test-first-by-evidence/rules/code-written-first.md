---
id: test-first-by-evidence.code-written-first
owner: test-first-by-evidence
canonical: true
severity: hard-gate
references: [Working Effectively with Legacy Code (Feathers), Characterization tests]
---

# Code Written First

Decision: **Where implementation exists with no test behind it, delete it and start from red.** The normal path belongs to `rules/watch-it-fail.md`.

Use when:
- **Code was written before its test**, in this session.
- **A test is being written to cover code that already works.**
- **The argument is that deleting it wastes the time already spent.**
- **You inherited untested code** and are about to change it.

Do:
- **Delete code you wrote ahead of its test, and implement it again from the red.**
- **Delete means delete.** Not moved aside, not commented out, not kept in another window.
- **Treat the sunk time as already spent either way.** The real choice is between rewriting with confidence and keeping code nothing has ever proved.
- **Where the code is not yours, characterize before you change it.** Write a test that pins what it does today, watch it pass, and label it as a description rather than a decision.
- **Say which of the two you are doing.** Deleting your own untested code, or pinning someone else's.

Avoid:
- **Keeping it as reference while you write the test.** You will adapt it, which is testing after.
- **Writing the test and running it once against the finished code.** It passes immediately and proves nothing.
- **Calling a characterization test a specification.** It records behaviour, including the wrong parts.
- **Deleting inherited code you do not understand.** Pin it first.

Exceptions:
- **Inherited code is pinned, not deleted.** You did not choose it and nobody has proved what depends on it.
- **A throwaway spike is deleted whole**, not converted, and its findings are reported instead.
- **Generated code is exempt**, since nothing about it was authored.

Example (one instance, not the set):

```txt
Wrote retryOperation, then noticed there is no test.

Wrong:  write the test, run it, watch it pass, call it done.
        It passed because the code is already there. It has never
        demonstrated that it can fail.

Right:  delete retryOperation. Write the test. Run it, watch it fail.
        Write the implementation again from the red.
```

- **The second implementation is usually different**, because the test asked for behaviour rather than describing what you happened to write.

Verify:
- **Check nothing in the working tree is a copy of the deleted code.**
- **Check every test in this change has a red run behind it.**
- **Where a test was written against existing code, check it is labelled as characterization**, with what it pins and when it is revisited.
