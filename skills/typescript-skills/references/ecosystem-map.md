# Ecosystem Map

## Purpose

This file explains what each `typescript-skills` bundle owns and where overlap should stop.

## Bundles

### `typescript-configs`
Owns:
- env vs config boundary
- defaults
- config ownership
- config exposure
- parse now vs verify later
- config type safety

Must not absorb:
- the full dependency graph
- full secret lifecycle
- generic DTO translation

### `typescript-composition`
Owns:
- composition roots
- dependency assembly
- lifecycle and scope
- provider selection
- ready dependencies vs hidden resolution

Must not absorb:
- config modeling in general
- generic transport mapping
- broader security policy

### `typescript-boundaries`
Owns:
- raw input vs internal model
- local naming vs provider naming
- translating external semantics at the edge
- keeping foreign types out of owned logic

Must not absorb:
- config defaults
- composition root behavior
- generic testing philosophy

### `typescript-testing`
Owns:
- characterization tests
- contract tests
- testing config boundaries
- testing composition roots lightly
- avoiding brittle structure assertions

Must not absorb:
- the full coding-standards bundle
- security review in general

### `typescript-security`
Owns:
- secret sources
- redaction
- crypto-adjacent decisions
- safe runtime checks
- avoiding risky defaults for sensitive values

Must not absorb:
- all config parsing
- general composition guidance
- generic app security beyond the config/runtime edge

### `typescript-coding-standards`
Owns:
- naming
- earned abstractions
- function vs class guidance
- semantic center visibility
- local reasoning

Must not absorb:
- frontend/backend framework standards in general
- testing strategy in full
- security policy in full

## Overlap rule

When two bundles touch the same topic:
- one bundle is the owner
- the other may mention it briefly
- the main index should point to the owner bundle

## Overlap examples

### Allowed overlap

`typescript-configs` may say that config parsing belongs near the edge.
`typescript-composition` owns the fuller explanation of edge assembly and composition roots.

### Forbidden overlap

`typescript-security` may mention that secret sources appear in config.
It must not re-teach the whole config boundary model that belongs in `typescript-configs`.
