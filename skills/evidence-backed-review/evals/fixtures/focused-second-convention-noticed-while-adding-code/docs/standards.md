# Written standards

## Errors

Every handler failure is raised as an `AppError` carrying a stable `code` and
an HTTP `status`. The message is for humans and is never matched on.

```js
throw new AppError("ORDER_NOT_FOUND", 404, "no order with that id");
```

Plain `Error` with a formatted string is the shape this replaced. It is still
present in older handlers and has not been migrated.
