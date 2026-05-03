# Composition Red Flags

- A use case reads `process.env` directly.
- A handler chooses the provider implementation inline.
- A feature module hides a singleton cache.
- A request-scoped dependency is created through a module-global helper.
- The same provider switch appears in more than one module.
- Tests have to patch runtime wiring instead of passing dependencies.
- Changing deployment policy means editing behavior files.
