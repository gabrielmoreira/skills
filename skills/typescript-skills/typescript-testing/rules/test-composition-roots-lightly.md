---
title: Test Composition Roots Lightly
decision: Use this when you want confidence that wiring still hangs together without freezing the whole graph in place
tags: typescript, testing, composition
---

## ✅ Prefer

Test composition roots lightly.

### Use this when

- you want to know the app still boots
- you want to check that the expected services are assembled
- you do not want every wiring detail locked into tests

### Example

```ts
it('boots the app and exposes sendReceipt', () => {
  const app = bootstrap({ USE_FAKE_MAILER: 'true' });
  expect(app.sendReceipt).toBeDefined();
});
```

### Why this helps

- you get confidence that the graph still assembles
- the test stays tolerant of harmless internal wiring changes
- composition remains verifiable without becoming frozen

## ⚠️ Avoid

Do not snapshot every dependency edge in the graph.

### This is a poor fit when

- the test encodes the whole internal assembly
- renaming or reordering harmless wiring breaks the test
- the test knows more about wiring internals than the public app surface

### Example

```ts
expect(app._internal.mailerFactoryName).toBe('makeSesMailer');
```

### Why to avoid it

- the test now protects internal spelling, not useful behavior
- local refactors become expensive
- the composition root becomes harder to evolve
