---
name: typescript-boundaries
description: Use when TypeScript code moves provider, SDK, API, request, response, generated, or raw input shapes across owned application boundaries.
---

# TypeScript Boundaries

Use this skill when external shapes meet owned code. The goal is to keep foreign semantics at the edge and expose smaller local models inward.

## Agent Quick Path

| If you see... | Read |
| --- | --- |
| provider/SDK/generated type imported by business logic | `rules/provider-containment.md` |
| request/body/query/env-like raw shape passed inward | `rules/raw-input-to-internal-model.md` |
| proposal to add a mapper/adapter | `rules/earned-mapping.md` |
| local model named after provider vocabulary | `rules/local-naming.md` |

## Owns

- Provider, SDK, API, generated, request, response, and raw input containment.
- Mapping external semantics into local meanings.
- Local names for provider-derived concepts.

## Demarcation

`provider-containment.md` owns vendor SDK / generated / external API client types. `raw-input-to-internal-model.md` owns HTTP request/response/transport shapes, env-like input, webhook payloads, CLI args, untyped JSON. When in doubt: is the type defined by us or by an external runtime contract?

A payload can violate both at once: a webhook body cast to a vendor SDK type (e.g. `req.body as Stripe.Event`) is raw transport input that needs parsing/verification AND a vendor type that should not flow past the handler — parse the input at the edge, then translate the vendor shape to a local event model before business logic sees it.

## Does Not Own

- Choosing which provider/client to instantiate: use `../typescript-composition/SKILL.md`.
- General naming unrelated to boundaries: use `../typescript-coding-standards/SKILL.md`.
- Config values and env parsing: use `../typescript-configs/SKILL.md`.

## Default

Translate at the edge when meaning differs. Do not create a mapper that only adds ceremony.
