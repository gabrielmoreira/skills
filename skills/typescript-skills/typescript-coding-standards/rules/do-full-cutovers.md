---
title: Do Full Cutovers
decision: Use this when replacing one design or ownership path with another
tags: typescript, refactor, cutover
---

## ✅ Prefer

Move callers, update names, and remove the old owner in the same change when the replacement is ready.

### Use this when

- a boundary has changed hands
- an old abstraction is being replaced
- the new path is ready for real use

### Example

```text
old owner removed
new owner active
callers moved
```

### Why this helps

- there is only one live representation of the concept
- docs and names stay aligned
- the next maintainer does not have to guess which path is real

## ⚠️ Avoid

Do not leave old and new representations live side by side without a clear reason.

### This is a poor fit when

- `Legacy*` and `New*` both remain reachable
- temporary adapters stay around indefinitely
- comments promise later cleanup instead of doing the cutover now

### Example

```text
legacy-api/
new-api/
```

### Why to avoid it

- the design now lies about what the system really is
- drift and confusion grow immediately
- cleanup becomes someone else's unpaid work
