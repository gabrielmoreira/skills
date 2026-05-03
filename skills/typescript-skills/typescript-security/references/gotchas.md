# Security Gotchas

## 1. Secret pointers are still sensitive

A secret ARN or parameter name is not the secret value, but it still should not be logged carelessly.

## 2. Config parsing is not secret loading

Parsing the shape of `DB_SECRET_ARN` is one step.
Fetching the secret is a later step.

## 3. Test defaults are dangerous for security settings

A convenient local default for a key, ARN, or credential can leak into production if the boundary is weak.

## 4. Redaction must happen before logging

Do not stringify config objects first and hope to scrub them later.

## 5. Crypto booleans hide too much

`SECURE_MODE=true` often compresses several meaningful choices into one vague switch.
