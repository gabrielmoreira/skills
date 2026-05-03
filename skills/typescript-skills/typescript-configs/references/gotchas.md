# Config Gotchas

## 1. `||` is not the same as `??`

Use `??` when you mean "missing".
`||` will also replace valid falsy values like `0`, `false`, and `''`.

## 2. Env values are strings

`process.env` does not know booleans or numbers.
Treat every env value as string input until parsed.

## 3. One flag can make another field irrelevant

If a mode or feature flag changes what matters, raw env may no longer be the right validation boundary.

## 4. Parsing shape is not the same as verifying reality

A path can be a valid string and still point to a missing file.
An ARN can be well-formed and still fail later at runtime.

## 5. Defaults are policy

A default value is not just convenience.
It is a behavior choice and should have one clear owner.

## 6. Secret source and secret value are different

`DB_SECRET_ARN` and the loaded password are not the same thing.
Treat them as different stages.

## 7. Giant config bags become fear zones

If every team edits one central config type for small local changes, ownership is already drifting.
