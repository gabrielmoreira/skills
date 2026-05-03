---
title: Keep the Semantic Center Visible
decision: Use this when support layers are becoming easier to explain than the behavior itself
tags: typescript, structure, clarity
---

## ✅ Prefer

Organize code so owned behavior stays more visible than support machinery.

### Use this when

- top-level folders are mostly framework or provider words
- readers can explain tooling better than the app behavior
- the repo map feels like a tutorial skeleton with domain code inside it

### Example

```text
notifications/
refunds/
identity/
```

### Why this helps

- the main story is what the app does
- support code becomes easier to place
- new readers can orient faster

## ⚠️ Avoid

Do not let support layers become the main story.

### This is a poor fit when

- the root map is `controllers/ services/ repositories/`
- provider folders dominate the top level
- the app's owned behavior is hard to find

### Example

```text
controllers/
services/
repositories/
validators/
```

### Why to avoid it

- the code tells a framework story before it tells your story
- responsibilities get blurrier as the app grows
- support structure starts to look more important than behavior
