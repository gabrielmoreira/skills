# Naming Config Fields

## Default rule

Name config fields for what they mean inside the app, not only for what the provider calls them.

## Examples

Prefer app-facing names like:
- `notificationsTopic`
- `uploadsBucket`
- `databaseCredentialsSource`

Keep raw provider names at the edge when needed:
- `NOTIFICATIONS_TOPIC_ARN`
- `UPLOADS_BUCKET_URL`
- `DB_SECRET_ARN`

## Why

A provider name may be useful at the edge, but the rest of the app should not have to think in provider vocabulary if the local meaning is broader or clearer.
