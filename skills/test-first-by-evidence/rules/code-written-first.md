---
id: test-first-by-evidence.code-written-first
owner: test-first-by-evidence
canonical: true
severity: default
references: [Characterization tests (Feathers), Test-Driven Development (Beck)]
---

# Code Written First

Decision: **Implementation written before its test is unproven, so re-derive it from a red rather than writing a test that passes on the first run.** The normal path belongs to `rules/watch-it-fail.md`.

Use when:
- **Code was written before its test**, in this session or an earlier one.
- **A test is being added behind code that already works.**
- **You inherited untested code** and are about to change it.

Do:
- **Say plainly what a test written against finished code proves.** It passes immediately, so it has never shown it can fail, and it may assert what the code does rather than what it should do.
- **Make the work recoverable before removing anything.** Commit it, or park it on a scratch branch. A deletion you can undo is a technique; one you cannot is a loss.
- **Re-derive from the red once it is safe.** Write the test, watch it fail, implement again. The second implementation is usually different, because the test asked for behaviour rather than describing what you happened to write.
- **Ask before discarding work that is more than trivial.** Minutes of code you still remember is yours to redo. Hours of it, with edge cases you found along the way, is the human's call.
- **Pin inherited code instead.** Write a test that captures what it does today, watch it pass, and label it as a description rather than a decision.
- **Say which of the two you are doing**, so a reader knows whether a test states intent or records history.

Avoid:
- **Deleting uncommitted work on your own authority.** That decision belongs to the human, per `keep-git-work-recoverable/rules/removing-work.md`.
- **Keeping the original open beside you while writing the test.** You will adapt it, which is testing after with extra steps.
- **Presenting a first-run pass as coverage.** Nothing was demonstrated.
- **Calling a characterization test a specification.** It records behaviour, including the parts that are wrong.
- **Rewriting inherited code to make it testable** before anything pins what it currently does.

Exceptions:
- **Inherited code is pinned, never discarded.** You did not choose it and nobody has established what depends on it.
- **A throwaway spike is dropped whole**, with its findings reported instead of its code kept.
- **Generated code is exempt**, since nothing about it was authored.

Example (one instance, not the set):

```txt
Wrote a parser this afternoon. No test behind it.

Weakest:  write a test now, watch it pass, call it covered.
          It passed because the code is already there.

Safe:     commit the parser first, so nothing is at risk.
          Then write the test, watch it fail, implement again.
          Compare the two. The difference is what the test found.

Inherited instead: pin the behaviour, label it characterization,
          and change the code only once the pin is green.
```

Verify:
- **Check every test in this change has a red run behind it**, or is labelled as characterization.
- **Check nothing was discarded that the human did not agree to discard.**
- **Check a characterization test says what it pins and when it is revisited.**
