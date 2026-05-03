---
title: Name by Reader Need
decision: Use this when names are hiding role, ownership, or meaning
tags: typescript, naming, clarity
---

## ✅ Prefer

Choose the name that helps the reader answer the important question fastest.

### Use this when

- names feel generic
- a suffix like `Service` or `Helper` is doing too much work
- the reader needs to know role or ownership quickly

### Example

```ts
// weaker
class UserService {}

// stronger
class UserProvisioning {}
```

```ts
// weaker
function createClient() {}

// stronger
function selectTenantClient() {}
```

### Why this helps

- names stop hiding responsibility
- the code map becomes easier to scan
- readers spend less time decoding intent

## ⚠️ Avoid

Do not name things by vague pattern or habit.

### This is a poor fit when

- the name could apply to ten unrelated modules
- the suffix says more than the responsibility does
- the reader still cannot tell why the thing exists

### Example

```ts
class ConfigManager {}
```

### Why to avoid it

- the name is broad but unhelpful
- ownership stays fuzzy
- later growth gets even harder to name honestly
