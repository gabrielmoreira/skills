# 0001 Synchronous gateway calls

## Status

Accepted.

## Context

The gateway caps us at one request a second and rejects bursts outright.

## Decision

Call it synchronously and let the caller wait, rather than queueing.

## Consequences

A slow gateway is a slow checkout. Revisit if they raise the cap.
