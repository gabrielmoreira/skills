---
title: Separate Raw Input from the Internal Model
decision: Use this when the app needs more than the raw input shape can honestly express
tags: typescript, boundaries, models
---

## ✅ Prefer

Keep raw input and internal models separate when the app needs a narrower or clearer shape.

### Use this when

- raw input has optional fields that become required later
- transport input is wider than the app really accepts
- a smaller model would be easier for the app to reason about

### Example

```ts
type CreateNoteRequest = {
  title?: string;
  body?: string;
  source?: 'web' | 'import';
};

type CreateNoteInput = {
  title: string;
  body: string;
};

export function parseCreateNote(request: CreateNoteRequest): CreateNoteInput {
  if (!request.title || !request.body) {
    throw new Error('title and body are required');
  }

  return {
    title: request.title,
    body: request.body,
  };
}
```

### Why this helps

- the app can reason about one honest internal shape
- raw transport quirks stay at the edge
- later behavior code gets simpler

## ⚠️ Avoid

Do not let raw input types travel unchanged just because they are already available.

### This is a poor fit when

- inner code keeps checking for missing fields the parser should have handled
- domain logic accepts transport noise it does not really want
- the app never gains its own internal model

### Example

```ts
function createNote(request: CreateNoteRequest) {
  if (!request.title || !request.body) throw new Error('missing fields');
  // more behavior...
}
```

### Why to avoid it

- every caller must remember the transport quirks
- validation and behavior stay mixed together
- the internal contract remains unclear
