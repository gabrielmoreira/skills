---
id: debugging-by-evidence.runnable-signal
owner: debugging-by-evidence
canonical: true
severity: hard-gate
references: [minimal reproducible example, deterministic replay, flake rate measurement]
---

# Runnable Signal

Decision: A loop counts when it is one command, already run, that goes red on
the current code, finishes in seconds, and needs nobody at the keyboard.
Admissibility is a property of the command, not of your confidence in it. It is
settled before any explanation exists.

- **You should see a recorded command and the one output line that is the symptom.** You should not see a loop described but never run.
- **Owns whether a signal counts and how to tighten a shaky one.** A loop that reproduces but drags in far more than the bug → `rules/minimising.md`. The permanent test that outlives the loop → `rules/regression-seam.md`.

Use when:

- **Nothing you have run yet prints the reported symptom.**
- **The command reproduces, but takes minutes, needs a click, or buries the symptom.**
- **The failure appears on some runs and not others.**

Do:

1. **Write the loop as one invocation of the project's declared test or run command**, scoped to the failing surface. Two commands joined by a human step is not a loop.
2. **Run it.** Record the exact command and the one output line that is the symptom.
3. **Tighten it as work separate from having it.**
   - Pin the clock to a fixed instant.
   - Set the random seed.
   - Give the run its own directory, port, store, and process.
4. **Run an intermittent failure 20 times and state the rate as a fraction.** Raise it past 1 in 2 before using it, by narrowing to the suspected ordering, timing, or shared state.
5. **Hold each run under 10 seconds.** Cut fixtures to get there, never assertions.

Avoid:

- **Calling a command a loop** when you have written it out but not run it.
- **Reporting "fails sometimes"** with no fraction attached.
- **Chasing a rate of 1 on a race.** 1 in 2 is enough to test against.

Exceptions:

- **A loop whose slow external step is itself the symptom may exceed 10 seconds.** State the duration.

Example (one instance, not the set):

```
Loop:    <project's declared test command> --filter cart-total
Rate:    11 of 20 red. Seed pinned, clock pinned, own temp directory.
Cost:    3.1s per run
Symptom: expected 1200, got 0
```

Verify:

- **Re-run the recorded command twice from a clean checkout.** The symptom line appears at the stated rate.
- **Read the command** for an interactive prompt, a wall-clock read, or an unseeded generator.
- **Confirm the stated rate came from counted runs**, not an impression.
