# Review Notes

This simplified tree is a clean-cut draft, not yet installed into `~/.agents/skills`.

## Intentional Choices

- No `README.md`: root `SKILL.md` is the canonical router for agents.
- No `manifest.yaml`: routing and ownership stay in Markdown.
- No duplicated long examples: canonical rules now prefer one small inline example when the rule affects code shape.
- Progressive design is explicit: start small, escalate on concrete pressure, and avoid jumping straight to maximum abstraction.
- Config guidance now distinguishes simple scripts, medium modular apps, large multi-team apps, and framework-shaped apps. Framework conventions are respected as entrypoints, not allowed to leak god config into feature logic.
- Defaults are treated as production behavior: a default is allowed only if forgetting config still yields correct production behavior. Dev URLs, localhost, IPs, credentials, tokens, and connection strings must be explicit inputs, not code defaults.
- Observability is now a focused bundle: meaningful structured logs, branch/outcome diagnostics, and OpenTelemetry/X-Ray behind adapters from the start.
- Testing guidance now includes local-style-first tests, behavior-first names, optional Given/When/Then sections, and coverage as guidance rather than a hard rule.
- Config guidance now includes named feature decisions, explicit resource pointers, file-layout escalation when earned, and stable runtime assumptions during ordinary changes.
- Hard language is reserved for safety/correctness gates. Design preferences use defaults plus exceptions and escalation criteria.


## Eval Status

- Current structural gate: 21/21 passing (`evals/check-invariants.ts`) after the error-handling, async, and type-system additions.
- Current behavioral suite: legacy `evals/evals.json` contains 25 adversarial prompts. It remains useful as a regression signal, but is being replaced by a phased per-bundle scenario harness for simplification safety.
- Latest recorded aggregate benchmark for the 25-prompt suite: with-skill 2.64/3, baseline 2.28/3, lift +0.36. Treat as historical context, not the sole promotion gate.
- Earlier 15-prompt iteration-2 result: with-skill 2.87/3, baseline 1.73/3. Kept as historical baseline only.
- Promotion gate is now explicit: every scenario scores at least 2/3, hard-gates score 3/3, and with-skill mean is at least 2.5/3.
- Workspace JSONs are not committed (regenerate via subagent runs or successor harness); see `evals/README.md`.

## Known Follow-ups

- Stabilize the legacy eval gate before promotion: keep thresholds, docs, and invariants aligned.
- Replace the monolithic behavioral suite with phased per-bundle scenario manifests focused on candidate-vs-gold regression and simplification safety.
- Add snippets only where evals show agents need more than the inline example.
- Re-check source coverage after any old file is reintroduced or removed.
- If `references/ownership.md` grows too large, split by bundle rather than adding a separate config format.
