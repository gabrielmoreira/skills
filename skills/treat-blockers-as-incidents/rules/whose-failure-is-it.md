---
id: treat-blockers-as-incidents.whose-failure-is-it
owner: treat-blockers-as-incidents
canonical: true
severity: hard-gate
references: [incident postmortem practice]
---

# Whose Failure Is It

Decision: **A non-zero exit names the command that ran, not the thing you asked for.** Verify the piece you wanted before treating it as broken. What to do once the ground keeps moving belongs to `rules/stop-conditions.md`.

Use when:
- **One command does several things**: a dependency install running a postinstall build, a task runner resolving plugins first, a script that shells out to another.
- **The output names a tool you were not using**: a native-addon compiler, an interpreter, a linter, in a command that was about none of them.
- **A runtime manager, package manager, or wrapper sits between you and the thing that failed**: a version shim, a container entrypoint, a pipeline step.
- **You are about to reinstall, delete, or downgrade** something on the strength of an exit code alone.

Do:
- **Use the narrowest available evidence for the component you care about.** A targeted command, preserved incident record or controlled dependency test can answer different questions; state which one you used.
- **Read the failing line, not the summary.** An exit code is the worst line of a transcript to reason from.
- **Name which component failed** before naming a cause.
- **Where an unrelated tool caused the exit, say so and continue with the original goal.** That tool is a separate finding, at most.
- **Check the expected artifact exists.** A warning beside a produced file is not a failure.

Avoid:
- **Deleting or reinstalling a working tool** because something else in the same command failed.
- **Reading a cached, skipped, or deprecated warning as an error.** Deprecation notices and skipped optional dependencies print loudly and exit zero.
- **Attributing the failure to the last change without discriminating evidence.**
- **Treating a non-zero exit as one fact.** It summarises several, and the interesting one is further up.

The exit code is the last line and the least informative one:

```
$ pnpm run build
> node-gyp rebuild
gyp ERR! find Python: Python is not set from command line
gyp ERR! stack Error: Could not find any Python installation
npm ERR! code 1
ELIFECYCLE  Command failed with exit code 1.
```

Four lines name four different components. The build tool did not fail; a
native addon's toolchain could not find an interpreter. Reinstalling the
package manager here removes a working tool and leaves the cause in place.

Verify:
- **Quote the evidence for the component-level claim**, distinguishing observed and injected conditions.
- **Name which component is shown to fail and which remains unverified.**
- **Confirm nothing was removed or reinstalled merely to force progress.**
