# TypeScript Boundaries Topic Index

Use this topic when external shapes meet owned code. The goal is to keep foreign semantics at the edge and expose smaller local models inward.

## Rule Routing

| If you see... | Read |
| --- | --- |
| provider/SDK/generated type imported by business logic | `skill://typescript-skills/typescript-boundaries/rules/provider-containment.md` |
| request/body/query/env-like raw shape passed inward | `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md` |
| proposal to add a mapper/adapter | `skill://typescript-skills/typescript-boundaries/rules/earned-mapping.md` |
| local model named after provider vocabulary | `skill://typescript-skills/typescript-boundaries/rules/local-naming.md` |

## Owns

- Provider, SDK, API, generated, request, response, and raw input containment.
- Mapping external semantics into local meanings.
- Local names for provider-derived concepts.

## Demarcation

`skill://typescript-skills/typescript-boundaries/rules/provider-containment.md` owns vendor SDK / generated / external API client types. `skill://typescript-skills/typescript-boundaries/rules/raw-input-to-internal-model.md` owns HTTP request/response/transport shapes, env-like input, webhook payloads, CLI args, untyped JSON. When in doubt: is the type defined by us or by an external runtime contract?

A payload can violate both at once: a webhook body cast to a vendor SDK type (e.g. `req.body as Stripe.Event`) is raw transport input that needs parsing/verification AND a vendor type that should not flow past the handler — parse the input at the edge, then translate the vendor shape to a local event model before business logic sees it.

## Does Not Own

- Choosing which provider/client to instantiate: read `skill://typescript-skills/typescript-composition/INDEX.md`.
- General naming unrelated to boundaries: read `skill://typescript-skills/typescript-coding-standards/INDEX.md`.
- Config values and env parsing: read `skill://typescript-skills/typescript-configs/INDEX.md`.

## Default

Translate at the edge when meaning differs. Do not create a mapper that only adds ceremony.
