# Structural Red Flags

- A `Service`, `Manager`, or `Helper` name is carrying the whole meaning.
- A wrapper mostly forwards calls.
- One behavior now takes many files to understand.
- The top-level map reads like framework machinery before it reads like app behavior.
- A class exists only to store dependencies.
- Old and new designs both remain live.
- A naming choice explains the pattern but not the responsibility.
- A new layer was added before the second real use.
- Tests protect helper names or file layout instead of behavior.
- Runtime policy leaks into behavior code.
- Provider vocabulary dominates local models.
- File count rises without improving local clarity.
