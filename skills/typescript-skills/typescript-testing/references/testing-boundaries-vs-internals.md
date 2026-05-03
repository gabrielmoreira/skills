# Testing Boundaries vs Internals

Good tests protect:
- parsed config contracts
- visible behavior
- public boundary promises

Weak tests protect:
- helper names
- file layout
- private wiring details

If a harmless refactor breaks the test, the test may be protecting the wrong thing.
