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

## Known Follow-ups

- Run eval scenarios before promotion.
- Add snippets only where evals show agents need more than the inline example.
- Re-check source coverage after any old file is reintroduced or removed.
- If `references/ownership.md` grows too large, split by bundle rather than adding a separate config format.
