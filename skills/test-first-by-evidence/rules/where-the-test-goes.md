---
id: test-first-by-evidence.where-the-test-goes
owner: test-first-by-evidence
canonical: true
severity: default
references: [Test Pyramid (Cohn), Test Sizes (Google Testing Blog), Seams (Feathers)]
---

# Where the Test Goes

Decision: **Put the test at the narrowest seam that can observe the behaviour you are adding.** What it asserts once it is there belongs to `rules/tests-that-cannot-lie.md`.

Use when:
- **There is no obvious place** for the new test.
- **A choice is open** between a unit, an integration, and an end-to-end test.
- **The behaviour crosses a boundary**, so more than one seam could see it.
- **A test needs a database, a browser, or the network** to run at all.
- **The existing suite has no test at the level you need.**

Do:
- **Find the seam closest to the change**, and start there.
- **Choose by what the test needs to run, not by a label.**
  - Nothing outside the process: keep it in memory, and run it always.
  - One local dependency, such as a database or the filesystem: expect it to be slower and rarer.
  - A browser or several services: reserve it for a journey nobody else covers.
- **Follow the shape the repository already has.** A neighbouring test shows the seam its authors chose.
- **Test through the public surface of the unit**, so a refactor behind it does not break the test.
- **Move up a level only when the behaviour is invisible from below.** Coordination between parts is a reason. Convenience is not.
- **Where a shared library changes, test one representative consumer.**

Avoid:
- **Reaching for the widest seam because it is easiest.** A slow suite gets skipped, and a skipped suite tests nothing.
- **A unit test that needs six mocks to stand up.** That is a design report, not a placement problem.
- **Duplicating the same assertion at three levels.** Pick the one that owns it.
- **A new seam introduced in a drive-by change**, where the local style already had one.

Exceptions:
- **A new seam is right where the current style cannot observe the change.** Say why.
- **A boundary contract MAY be tested twice**, once by each side, where both own part of it.

Example (one instance, not the set):

| The behaviour | Seam that can see it |
| --- | --- |
| a retry count | the function, in memory |
| a row actually written | the repository, against a real local database |
| a checkout that spans three services | one end-to-end journey |

Verify:
- **Name what the test needs to run**, and check it is the least that could observe the behaviour.
- **Check a neighbouring test uses the same seam**, or say why this one differs.
- **Check the assertion survives an internal refactor** of the thing under test.
