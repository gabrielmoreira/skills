# Env-Only vs Source Pointer

## Simple baseline

Putting secrets in env is a common baseline.
It is simple and often acceptable in small or flat setups.

## Where it gets weak

It gets weaker when the app needs:
- rotation
- clearer separation between config and secret loading
- narrower blast radius for secret values
- more explicit runtime control over fetch and retry behavior

## Ecosystem stance

This ecosystem prefers:
- config carries the secret source
- runtime loads the secret value later

This keeps parsing, secret resolution, and secret usage as separate concerns.
