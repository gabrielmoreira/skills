# Lifecycle and Scope

## Common scopes

- app-wide singleton
- request-scoped service
- per-job service

## Keep this separate

A factory is a construction choice, not a scope by itself.
Use a factory when late construction varies by call.
Use scope to describe how long the built dependency should live.
